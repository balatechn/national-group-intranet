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
        assignee: { select: { id: true, firstName: true, lastName: true, avatar: true } },
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
      creator: true,
      assignee: true,
      department: true,
      project: true,
      ticket: true,
      parent: true,
      subtasks: {
        include: {
          assignee: { select: { id: true, firstName: true, lastName: true } },
        },
      },
      comments: {
        include: {
          // We need to manually fetch author since Prisma doesn't have direct relation
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
  });

  revalidatePath('/tasks');
  revalidatePath(`/tasks/${id}`);
  return { success: true, task };
}

export async function deleteTask(id: string) {
  await prisma.task.delete({ where: { id } });
  revalidatePath('/tasks');
  return { success: true };
}

export async function addTaskComment(taskId: string, content: string, authorId: string) {
  const comment = await prisma.taskComment.create({
    data: {
      content,
      taskId,
      authorId,
    },
  });

  revalidatePath(`/tasks/${taskId}`);
  return { success: true, comment };
}
