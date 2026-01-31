'use server';

import { revalidatePath } from 'next/cache';
import prisma from '@/lib/db';
import { sendEmail, getTaskAssignedEmail } from '@/lib/mailgun';
import {
  createTaskSchema,
  updateTaskSchema,
  type CreateTaskInput,
  type UpdateTaskInput,
} from '@/validations';

// ==========================================
// TASK CRUD OPERATIONS
// ==========================================

export async function getTasks(options?: {
  status?: string;
  priority?: string;
  assigneeId?: string;
  creatorId?: string;
  departmentId?: string;
  projectId?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  const {
    status,
    priority,
    assigneeId,
    creatorId,
    departmentId,
    projectId,
    search,
    page = 1,
    limit = 10,
  } = options || {};

  const where: Record<string, unknown> = {};

  if (status) where.status = status;
  if (priority) where.priority = priority;
  if (assigneeId) where.assigneeId = assigneeId;
  if (creatorId) where.creatorId = creatorId;
  if (departmentId) where.departmentId = departmentId;
  if (projectId) where.projectId = projectId;
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [tasks, total] = await Promise.all([
    prisma.task.findMany({
      where,
      include: {
        creator: { select: { id: true, firstName: true, lastName: true, avatar: true } },
        assignee: { select: { id: true, firstName: true, lastName: true, avatar: true, email: true } },
        department: { select: { id: true, name: true } },
        project: { select: { id: true, name: true } },
        _count: { select: { subtasks: true, comments: true } },
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: [{ priority: 'desc' }, { dueDate: 'asc' }],
    }),
    prisma.task.count({ where }),
  ]);

  return {
    tasks,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getTaskById(id: string) {
  return prisma.task.findUnique({
    where: { id },
    include: {
      creator: { select: { id: true, firstName: true, lastName: true, email: true, avatar: true } },
      assignee: { select: { id: true, firstName: true, lastName: true, email: true, avatar: true } },
      department: { select: { id: true, name: true } },
      project: { select: { id: true, name: true } },
      ticket: true,
      parent: { select: { id: true, title: true } },
      subtasks: {
        include: {
          assignee: { select: { id: true, firstName: true, lastName: true, avatar: true } },
          _count: { select: { subtasks: true } },
        },
        orderBy: { createdAt: 'asc' },
      },
      comments: {
        include: {
          author: { select: { id: true, firstName: true, lastName: true, avatar: true } },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  });
}

export async function createTask(data: CreateTaskInput, creatorId: string) {
  const validated = createTaskSchema.parse(data);

  const task = await prisma.task.create({
    data: {
      ...validated,
      creatorId,
    },
    include: {
      assignee: { select: { id: true, firstName: true, lastName: true, email: true } },
    },
  });

  // Send email notification to assignee
  if (task.assignee) {
    const assigneeName = `${task.assignee.firstName} ${task.assignee.lastName}`;
    const taskUrl = `${process.env.APP_URL}/tasks/${task.id}`;
    const emailContent = getTaskAssignedEmail(
      assigneeName,
      task.title,
      taskUrl,
      task.dueDate?.toLocaleDateString()
    );

    await sendEmail({
      to: task.assignee.email,
      subject: emailContent.subject,
      html: emailContent.html,
    });
  }

  revalidatePath('/tasks');
  return { success: true, task };
}

export async function updateTask(id: string, data: UpdateTaskInput) {
  const validated = updateTaskSchema.parse(data);

  // If status is changing to COMPLETED, set completedAt
  const updateData: Record<string, unknown> = { ...validated };
  if (validated.status === 'COMPLETED' && !validated.completedAt) {
    updateData.completedAt = new Date();
  }

  const task = await prisma.task.update({
    where: { id },
    data: updateData,
    include: {
      assignee: { select: { id: true, firstName: true, lastName: true, email: true } },
    },
  });

  revalidatePath('/tasks');
  revalidatePath(`/tasks/${id}`);
  return { success: true, task };
}

export async function updateTaskStatus(id: string, status: string) {
  const updateData: Record<string, unknown> = { status };

  if (status === 'COMPLETED') {
    updateData.completedAt = new Date();
  }

  await prisma.task.update({
    where: { id },
    data: updateData,
  });

  revalidatePath('/tasks');
  revalidatePath(`/tasks/${id}`);
  revalidatePath('/tasks/board');
  return { success: true };
}

export async function deleteTask(id: string) {
  await prisma.task.delete({ where: { id } });
  revalidatePath('/tasks');
  return { success: true };
}

// ==========================================
// BULK OPERATIONS
// ==========================================

export async function bulkUpdateTaskStatus(ids: string[], status: string) {
  const updateData: Record<string, unknown> = { status };
  if (status === 'COMPLETED') {
    updateData.completedAt = new Date();
  }

  await prisma.task.updateMany({
    where: { id: { in: ids } },
    data: updateData,
  });

  revalidatePath('/tasks');
  revalidatePath('/tasks/board');
  return { success: true };
}

export async function bulkAssignTasks(ids: string[], assigneeId: string | null) {
  await prisma.task.updateMany({
    where: { id: { in: ids } },
    data: { assigneeId },
  });

  revalidatePath('/tasks');
  return { success: true };
}

export async function bulkDeleteTasks(ids: string[]) {
  await prisma.task.deleteMany({
    where: { id: { in: ids } },
  });

  revalidatePath('/tasks');
  return { success: true };
}

// ==========================================
// COMMENTS
// ==========================================

export async function addTaskComment(taskId: string, content: string, authorId: string) {
  const comment = await prisma.taskComment.create({
    data: {
      content,
      taskId,
      authorId,
    },
    include: {
      author: { select: { id: true, firstName: true, lastName: true, avatar: true } },
    },
  });

  revalidatePath(`/tasks/${taskId}`);
  return { success: true, comment };
}

export async function deleteTaskComment(commentId: string, taskId: string) {
  await prisma.taskComment.delete({ where: { id: commentId } });
  revalidatePath(`/tasks/${taskId}`);
  return { success: true };
}

// Alias for cleaner imports
export const addComment = addTaskComment;

export async function getComments(taskId: string) {
  return prisma.taskComment.findMany({
    where: { taskId },
    include: {
      author: { select: { id: true, firstName: true, lastName: true, avatar: true } },
    },
    orderBy: { createdAt: 'asc' },
  });
}

// ==========================================
// TASK TEMPLATES (Simplified)
// ==========================================

export async function getTaskTemplates() {
  try {
    // Return empty array for now - templates feature will be added later
    return [];
  } catch {
    return [];
  }
}

export async function createTaskTemplate(data: {
  name: string;
  description?: string;
  defaultTitle?: string;
  defaultDescription?: string;
  defaultPriority?: string;
  estimatedHours?: number;
}) {
  // Placeholder - will be implemented when models are ready
  revalidatePath('/tasks/templates');
  return { success: true, template: { id: 'temp', ...data } };
}

// ==========================================
// RECURRING TASKS (Simplified)
// ==========================================

export async function createRecurringTask(
  data: CreateTaskInput & {
    recurrenceType: 'DAILY' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
    recurrenceEnd?: Date;
  },
  creatorId: string
) {
  // For now, just create a regular task
  return createTask(data, creatorId);
}

// ==========================================
// ANALYTICS
// ==========================================

export async function getTaskStats() {
  const [total, completed, inProgress, overdue, byStatus, byPriority, recentActivity] = await Promise.all([
    prisma.task.count(),
    prisma.task.count({ where: { status: 'COMPLETED' } }),
    prisma.task.count({ where: { status: 'IN_PROGRESS' } }),
    prisma.task.count({
      where: {
        status: { notIn: ['COMPLETED', 'CANCELLED'] },
        dueDate: { lt: new Date() },
      },
    }),
    prisma.task.groupBy({
      by: ['status'],
      _count: { status: true },
    }),
    prisma.task.groupBy({
      by: ['priority'],
      _count: { priority: true },
    }),
    prisma.task.findMany({
      take: 10,
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        title: true,
        status: true,
        updatedAt: true,
        assignee: { select: { firstName: true, lastName: true } },
      },
    }),
  ]);

  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  return {
    total,
    completed,
    inProgress,
    overdue,
    completionRate,
    avgCompletionTime: 0,
    byStatus: byStatus.reduce((acc, item) => {
      acc[item.status] = item._count.status;
      return acc;
    }, {} as Record<string, number>),
    byPriority: byPriority.reduce((acc, item) => {
      acc[item.priority] = item._count.priority;
      return acc;
    }, {} as Record<string, number>),
    recentActivity,
  };
}

export async function getTaskTrends(options?: { days?: number }) {
  const days = options?.days || 30;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const tasks = await prisma.task.findMany({
    where: {
      OR: [
        { createdAt: { gte: startDate } },
        { completedAt: { gte: startDate } },
      ],
    },
    select: {
      createdAt: true,
      completedAt: true,
    },
  });

  // Group by date
  const trends: Record<string, { created: number; completed: number }> = {};
  
  for (let i = 0; i < days; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];
    trends[dateStr] = { created: 0, completed: 0 };
  }

  tasks.forEach((task) => {
    const createdDate = task.createdAt.toISOString().split('T')[0];
    if (trends[createdDate]) {
      trends[createdDate].created++;
    }
    if (task.completedAt) {
      const completedDate = task.completedAt.toISOString().split('T')[0];
      if (trends[completedDate]) {
        trends[completedDate].completed++;
      }
    }
  });

  return Object.entries(trends).map(([date, data]) => ({
    date,
    ...data,
  }));
}
