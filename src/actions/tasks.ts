'use server';

import { revalidatePath } from 'next/cache';
import prisma from '@/lib/db';
import { sendEmail, getTaskAssignedEmail, getTaskReminderEmail, getTaskMentionEmail } from '@/lib/mailgun';
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
        _count: { select: { subtasks: true, comments: true, attachments: true, timeEntries: true } },
        dependsOn: {
          include: {
            blockingTask: { select: { id: true, title: true, status: true } },
          },
        },
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
      template: { select: { id: true, name: true } },
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
          mentions: {
            include: {
              user: { select: { id: true, firstName: true, lastName: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
      attachments: {
        include: {
          uploadedBy: { select: { id: true, firstName: true, lastName: true } },
        },
        orderBy: { createdAt: 'desc' },
      },
      timeEntries: {
        include: {
          user: { select: { id: true, firstName: true, lastName: true, avatar: true } },
        },
        orderBy: { date: 'desc' },
      },
      dependsOn: {
        include: {
          blockingTask: { select: { id: true, title: true, status: true } },
        },
      },
      blockedTasks: {
        include: {
          dependentTask: { select: { id: true, title: true, status: true } },
        },
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

  const task = await prisma.task.update({
    where: { id },
    data: updateData,
  });

  revalidatePath('/tasks');
  revalidatePath('/tasks/board');
  revalidatePath(`/tasks/${id}`);
  return { success: true, task };
}

export async function deleteTask(id: string) {
  await prisma.task.delete({ where: { id } });
  revalidatePath('/tasks');
  return { success: true };
}

// ==========================================
// BULK OPERATIONS
// ==========================================

export async function bulkUpdateTaskStatus(taskIds: string[], status: string) {
  const updateData: Record<string, unknown> = { status };
  if (status === 'COMPLETED') {
    updateData.completedAt = new Date();
  }

  await prisma.task.updateMany({
    where: { id: { in: taskIds } },
    data: updateData,
  });

  revalidatePath('/tasks');
  revalidatePath('/tasks/board');
  return { success: true };
}

export async function bulkAssignTasks(taskIds: string[], assigneeId: string | null) {
  const tasks = await prisma.task.updateMany({
    where: { id: { in: taskIds } },
    data: { assigneeId },
  });

  // Send email notifications if assigning
  if (assigneeId) {
    const assignee = await prisma.user.findUnique({
      where: { id: assigneeId },
      select: { firstName: true, lastName: true, email: true },
    });

    if (assignee) {
      const taskList = await prisma.task.findMany({
        where: { id: { in: taskIds } },
        select: { id: true, title: true },
      });

      for (const task of taskList) {
        const taskUrl = `${process.env.APP_URL}/tasks/${task.id}`;
        const emailContent = getTaskAssignedEmail(
          `${assignee.firstName} ${assignee.lastName}`,
          task.title,
          taskUrl
        );
        await sendEmail({
          to: assignee.email,
          subject: emailContent.subject,
          html: emailContent.html,
        });
      }
    }
  }

  revalidatePath('/tasks');
  return { success: true, count: tasks.count };
}

export async function bulkDeleteTasks(taskIds: string[]) {
  await prisma.task.deleteMany({
    where: { id: { in: taskIds } },
  });

  revalidatePath('/tasks');
  return { success: true };
}

// ==========================================
// TASK COMMENTS WITH @MENTIONS
// ==========================================

export async function addTaskComment(taskId: string, content: string, authorId: string) {
  // Parse mentions from content (format: @[Name](userId))
  const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g;
  const mentions: { userId: string; name: string }[] = [];
  let match;
  while ((match = mentionRegex.exec(content)) !== null) {
    mentions.push({ name: match[1], userId: match[2] });
  }

  const comment = await prisma.taskComment.create({
    data: {
      content,
      taskId,
      authorId,
      mentions: {
        create: mentions.map((m) => ({ userId: m.userId })),
      },
    },
    include: {
      author: { select: { id: true, firstName: true, lastName: true, avatar: true } },
      mentions: {
        include: {
          user: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
      },
    },
  });

  // Get task details for email
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: { id: true, title: true },
  });

  // Send email notifications to mentioned users
  if (task && comment.mentions.length > 0) {
    const taskUrl = `${process.env.APP_URL}/tasks/${taskId}`;
    for (const mention of comment.mentions) {
      if (mention.user.email) {
        const emailContent = getTaskMentionEmail(
          `${mention.user.firstName} ${mention.user.lastName}`,
          `${comment.author.firstName} ${comment.author.lastName}`,
          task.title,
          content,
          taskUrl
        );
        await sendEmail({
          to: mention.user.email,
          subject: emailContent.subject,
          html: emailContent.html,
        });

        // Mark as notified
        await prisma.taskMention.update({
          where: { id: mention.id },
          data: { notified: true },
        });
      }
    }
  }

  revalidatePath(`/tasks/${taskId}`);
  return { success: true, comment };
}

export async function deleteTaskComment(commentId: string, taskId: string) {
  await prisma.taskComment.delete({ where: { id: commentId } });
  revalidatePath(`/tasks/${taskId}`);
  return { success: true };
}

// ==========================================
// TASK ATTACHMENTS
// ==========================================

export async function addTaskAttachment(
  taskId: string,
  uploadedById: string,
  fileName: string,
  fileUrl: string,
  fileSize: number,
  fileType: string
) {
  const attachment = await prisma.taskAttachment.create({
    data: {
      taskId,
      uploadedById,
      fileName,
      fileUrl,
      fileSize,
      fileType,
    },
    include: {
      uploadedBy: { select: { id: true, firstName: true, lastName: true } },
    },
  });

  revalidatePath(`/tasks/${taskId}`);
  return { success: true, attachment };
}

export async function deleteTaskAttachment(attachmentId: string, taskId: string) {
  await prisma.taskAttachment.delete({ where: { id: attachmentId } });
  revalidatePath(`/tasks/${taskId}`);
  return { success: true };
}

// ==========================================
// TIME TRACKING
// ==========================================

export async function logTaskTime(
  taskId: string,
  userId: string,
  hours: number,
  description?: string,
  date?: Date
) {
  const timeEntry = await prisma.taskTimeEntry.create({
    data: {
      taskId,
      userId,
      hours,
      description,
      date: date || new Date(),
    },
    include: {
      user: { select: { id: true, firstName: true, lastName: true, avatar: true } },
    },
  });

  // Update task actual hours
  const totalHours = await prisma.taskTimeEntry.aggregate({
    where: { taskId },
    _sum: { hours: true },
  });

  await prisma.task.update({
    where: { id: taskId },
    data: { actualHours: totalHours._sum.hours || 0 },
  });

  revalidatePath(`/tasks/${taskId}`);
  return { success: true, timeEntry };
}

export async function updateTaskTimeEntry(
  entryId: string,
  taskId: string,
  data: { hours?: number; description?: string; date?: Date }
) {
  const entry = await prisma.taskTimeEntry.update({
    where: { id: entryId },
    data,
  });

  // Update task actual hours
  const totalHours = await prisma.taskTimeEntry.aggregate({
    where: { taskId },
    _sum: { hours: true },
  });

  await prisma.task.update({
    where: { id: taskId },
    data: { actualHours: totalHours._sum.hours || 0 },
  });

  revalidatePath(`/tasks/${taskId}`);
  return { success: true, entry };
}

export async function deleteTaskTimeEntry(entryId: string, taskId: string) {
  await prisma.taskTimeEntry.delete({ where: { id: entryId } });

  // Update task actual hours
  const totalHours = await prisma.taskTimeEntry.aggregate({
    where: { taskId },
    _sum: { hours: true },
  });

  await prisma.task.update({
    where: { id: taskId },
    data: { actualHours: totalHours._sum.hours || 0 },
  });

  revalidatePath(`/tasks/${taskId}`);
  return { success: true };
}

// ==========================================
// TASK DEPENDENCIES
// ==========================================

export async function addTaskDependency(dependentTaskId: string, blockingTaskId: string) {
  // Check for circular dependency
  const wouldCreateCycle = await checkCircularDependency(blockingTaskId, dependentTaskId);
  if (wouldCreateCycle) {
    return { success: false, error: 'This would create a circular dependency' };
  }

  const dependency = await prisma.taskDependency.create({
    data: {
      dependentTaskId,
      blockingTaskId,
    },
  });

  revalidatePath(`/tasks/${dependentTaskId}`);
  return { success: true, dependency };
}

export async function removeTaskDependency(dependentTaskId: string, blockingTaskId: string) {
  await prisma.taskDependency.delete({
    where: {
      dependentTaskId_blockingTaskId: {
        dependentTaskId,
        blockingTaskId,
      },
    },
  });

  revalidatePath(`/tasks/${dependentTaskId}`);
  return { success: true };
}

async function checkCircularDependency(
  taskId: string,
  potentialBlockerId: string,
  visited = new Set<string>()
): Promise<boolean> {
  if (taskId === potentialBlockerId) return true;
  if (visited.has(taskId)) return false;
  visited.add(taskId);

  const dependencies = await prisma.taskDependency.findMany({
    where: { dependentTaskId: taskId },
    select: { blockingTaskId: true },
  });

  for (const dep of dependencies) {
    if (await checkCircularDependency(dep.blockingTaskId, potentialBlockerId, visited)) {
      return true;
    }
  }

  return false;
}

// ==========================================
// TASK TEMPLATES
// ==========================================

export async function getTaskTemplates(options?: {
  departmentId?: string;
  search?: string;
  isActive?: boolean;
}) {
  const where: Record<string, unknown> = {};

  if (options?.departmentId) where.departmentId = options.departmentId;
  if (options?.search) {
    where.OR = [
      { name: { contains: options.search, mode: 'insensitive' } },
      { description: { contains: options.search, mode: 'insensitive' } },
    ];
  }
  if (typeof options?.isActive === 'boolean') where.isActive = options.isActive;

  return prisma.taskTemplate.findMany({
    where,
    include: {
      creator: { select: { id: true, firstName: true, lastName: true } },
      department: { select: { id: true, name: true } },
      _count: { select: { tasks: true } },
    },
    orderBy: { name: 'asc' },
  });
}

export async function createTaskTemplate(
  data: {
    name: string;
    description?: string;
    title: string;
    taskDescription?: string;
    priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    estimatedHours?: number;
    departmentId?: string;
  },
  creatorId: string
) {
  const template = await prisma.taskTemplate.create({
    data: {
      ...data,
      creatorId,
    },
  });

  revalidatePath('/tasks/templates');
  return { success: true, template };
}

export async function updateTaskTemplate(
  id: string,
  data: {
    name?: string;
    description?: string;
    title?: string;
    taskDescription?: string;
    priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    estimatedHours?: number;
    departmentId?: string;
    isActive?: boolean;
  }
) {
  const template = await prisma.taskTemplate.update({
    where: { id },
    data,
  });

  revalidatePath('/tasks/templates');
  return { success: true, template };
}

export async function deleteTaskTemplate(id: string) {
  await prisma.taskTemplate.delete({ where: { id } });
  revalidatePath('/tasks/templates');
  return { success: true };
}

export async function createTaskFromTemplate(templateId: string, creatorId: string, overrides?: Partial<CreateTaskInput>) {
  const template = await prisma.taskTemplate.findUnique({
    where: { id: templateId },
  });

  if (!template) {
    return { success: false, error: 'Template not found' };
  }

  const taskData = {
    title: overrides?.title || template.title,
    description: overrides?.description || template.taskDescription,
    priority: overrides?.priority || template.priority,
    estimatedHours: overrides?.estimatedHours || template.estimatedHours,
    departmentId: overrides?.departmentId || template.departmentId,
    assigneeId: overrides?.assigneeId,
    dueDate: overrides?.dueDate,
    projectId: overrides?.projectId,
    templateId: template.id,
  };

  return createTask(taskData as CreateTaskInput, creatorId);
}

// ==========================================
// RECURRING TASKS
// ==========================================

export async function createRecurringTask(
  data: CreateTaskInput & {
    recurrenceType: 'DAILY' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
    recurrenceEnd?: Date;
  },
  creatorId: string
) {
  const nextOccurrence = calculateNextOccurrence(data.recurrenceType, new Date());

  const task = await prisma.task.create({
    data: {
      ...data,
      creatorId,
      isRecurring: true,
      nextOccurrence,
    },
    include: {
      assignee: { select: { id: true, firstName: true, lastName: true, email: true } },
    },
  });

  // Send email notification
  if (task.assignee) {
    const taskUrl = `${process.env.APP_URL}/tasks/${task.id}`;
    const emailContent = getTaskAssignedEmail(
      `${task.assignee.firstName} ${task.assignee.lastName}`,
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

function calculateNextOccurrence(recurrenceType: string, fromDate: Date): Date {
  const next = new Date(fromDate);
  switch (recurrenceType) {
    case 'DAILY':
      next.setDate(next.getDate() + 1);
      break;
    case 'WEEKLY':
      next.setDate(next.getDate() + 7);
      break;
    case 'BIWEEKLY':
      next.setDate(next.getDate() + 14);
      break;
    case 'MONTHLY':
      next.setMonth(next.getMonth() + 1);
      break;
    case 'QUARTERLY':
      next.setMonth(next.getMonth() + 3);
      break;
    case 'YEARLY':
      next.setFullYear(next.getFullYear() + 1);
      break;
  }
  return next;
}

// Process recurring tasks (call this from a cron job)
export async function processRecurringTasks() {
  const now = new Date();

  const recurringTasks = await prisma.task.findMany({
    where: {
      isRecurring: true,
      nextOccurrence: { lte: now },
      OR: [
        { recurrenceEnd: null },
        { recurrenceEnd: { gte: now } },
      ],
    },
    include: {
      assignee: { select: { id: true, firstName: true, lastName: true, email: true } },
    },
  });

  for (const task of recurringTasks) {
    // Create new task instance
    const newTask = await prisma.task.create({
      data: {
        title: task.title,
        description: task.description,
        priority: task.priority,
        status: 'TODO',
        estimatedHours: task.estimatedHours,
        creatorId: task.creatorId,
        assigneeId: task.assigneeId,
        departmentId: task.departmentId,
        projectId: task.projectId,
        dueDate: task.dueDate ? calculateNextOccurrence(task.recurrenceType!, task.dueDate) : null,
        parentId: task.id,
      },
    });

    // Update next occurrence on parent task
    const nextOccurrence = calculateNextOccurrence(task.recurrenceType!, now);
    await prisma.task.update({
      where: { id: task.id },
      data: { nextOccurrence },
    });

    // Send notification
    if (task.assignee) {
      const taskUrl = `${process.env.APP_URL}/tasks/${newTask.id}`;
      const emailContent = getTaskAssignedEmail(
        `${task.assignee.firstName} ${task.assignee.lastName}`,
        newTask.title,
        taskUrl,
        newTask.dueDate?.toLocaleDateString()
      );
      await sendEmail({
        to: task.assignee.email,
        subject: emailContent.subject,
        html: emailContent.html,
      });
    }
  }

  return { success: true, processed: recurringTasks.length };
}

// ==========================================
// TASK REMINDERS
// ==========================================

export async function setTaskReminder(taskId: string, reminderDate: Date) {
  const task = await prisma.task.update({
    where: { id: taskId },
    data: { reminderDate, reminderSent: false },
  });

  revalidatePath(`/tasks/${taskId}`);
  return { success: true, task };
}

// Process reminders (call this from a cron job)
export async function processTaskReminders() {
  const now = new Date();

  const tasksToRemind = await prisma.task.findMany({
    where: {
      reminderDate: { lte: now },
      reminderSent: false,
      status: { notIn: ['COMPLETED', 'CANCELLED'] },
    },
    include: {
      assignee: { select: { id: true, firstName: true, lastName: true, email: true } },
      creator: { select: { id: true, firstName: true, lastName: true, email: true } },
    },
  });

  for (const task of tasksToRemind) {
    const recipient = task.assignee || task.creator;
    if (recipient.email) {
      const taskUrl = `${process.env.APP_URL}/tasks/${task.id}`;
      const emailContent = getTaskReminderEmail(
        `${recipient.firstName} ${recipient.lastName}`,
        task.title,
        taskUrl,
        task.dueDate?.toLocaleDateString()
      );
      await sendEmail({
        to: recipient.email,
        subject: emailContent.subject,
        html: emailContent.html,
      });
    }

    await prisma.task.update({
      where: { id: task.id },
      data: { reminderSent: true },
    });
  }

  return { success: true, reminded: tasksToRemind.length };
}

// ==========================================
// TASK REPORTS / ANALYTICS
// ==========================================

export async function getTaskStats(options?: {
  assigneeId?: string;
  departmentId?: string;
  projectId?: string;
  startDate?: Date;
  endDate?: Date;
}) {
  const where: Record<string, unknown> = {};
  if (options?.assigneeId) where.assigneeId = options.assigneeId;
  if (options?.departmentId) where.departmentId = options.departmentId;
  if (options?.projectId) where.projectId = options.projectId;
  if (options?.startDate || options?.endDate) {
    where.createdAt = {};
    if (options?.startDate) (where.createdAt as any).gte = options.startDate;
    if (options?.endDate) (where.createdAt as any).lte = options.endDate;
  }

  const [total, byStatus, byPriority, overdue, avgCompletionTime] = await Promise.all([
    prisma.task.count({ where }),
    prisma.task.groupBy({
      by: ['status'],
      where,
      _count: true,
    }),
    prisma.task.groupBy({
      by: ['priority'],
      where,
      _count: true,
    }),
    prisma.task.count({
      where: {
        ...where,
        status: { notIn: ['COMPLETED', 'CANCELLED'] },
        dueDate: { lt: new Date() },
      },
    }),
    prisma.task.aggregate({
      where: {
        ...where,
        status: 'COMPLETED',
        completedAt: { not: null },
      },
      _avg: { actualHours: true },
    }),
  ]);

  // Calculate completion rate
  const completed = byStatus.find((s) => s.status === 'COMPLETED')?._count || 0;
  const completionRate = total > 0 ? (completed / total) * 100 : 0;

  // Get recent activity
  const recentActivity = await prisma.task.findMany({
    where,
    select: {
      id: true,
      title: true,
      status: true,
      updatedAt: true,
      assignee: { select: { firstName: true, lastName: true } },
    },
    orderBy: { updatedAt: 'desc' },
    take: 10,
  });

  return {
    total,
    byStatus: byStatus.reduce((acc, s) => ({ ...acc, [s.status]: s._count }), {}),
    byPriority: byPriority.reduce((acc, p) => ({ ...acc, [p.priority]: p._count }), {}),
    overdue,
    completionRate: Math.round(completionRate * 10) / 10,
    avgCompletionTime: avgCompletionTime._avg.actualHours || 0,
    recentActivity,
  };
}

export async function getTaskTrends(options?: {
  departmentId?: string;
  projectId?: string;
  days?: number;
}) {
  const days = options?.days || 30;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const where: Record<string, unknown> = {
    createdAt: { gte: startDate },
  };
  if (options?.departmentId) where.departmentId = options.departmentId;
  if (options?.projectId) where.projectId = options.projectId;

  const tasks = await prisma.task.findMany({
    where,
    select: {
      id: true,
      status: true,
      createdAt: true,
      completedAt: true,
    },
  });

  // Group by date
  const dailyStats: Record<string, { created: number; completed: number }> = {};
  
  for (let i = 0; i < days; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    const dateKey = date.toISOString().split('T')[0];
    dailyStats[dateKey] = { created: 0, completed: 0 };
  }

  for (const task of tasks) {
    const createdDate = task.createdAt.toISOString().split('T')[0];
    if (dailyStats[createdDate]) {
      dailyStats[createdDate].created++;
    }

    if (task.completedAt) {
      const completedDate = task.completedAt.toISOString().split('T')[0];
      if (dailyStats[completedDate]) {
        dailyStats[completedDate].completed++;
      }
    }
  }

  return Object.entries(dailyStats).map(([date, stats]) => ({
    date,
    ...stats,
  }));
}