'use server';

import { revalidatePath } from 'next/cache';
import prisma from '@/lib/db';
import {
  sendEmail,
  getTicketCreatedEmail,
  getTicketUpdatedEmail,
} from '@/lib/mailgun';
import { generateTicketNumber } from '@/lib/utils';
import {
  createTicketSchema,
  updateTicketSchema,
  ticketCommentSchema,
  type CreateTicketInput,
  type UpdateTicketInput,
} from '@/validations';

export async function getTickets(options?: {
  status?: string;
  priority?: string;
  category?: string;
  assigneeId?: string;
  creatorId?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  const {
    status,
    priority,
    category,
    assigneeId,
    creatorId,
    search,
    page = 1,
    limit = 10,
  } = options || {};

  const where: Record<string, unknown> = {};

  if (status) where.status = status;
  if (priority) where.priority = priority;
  if (category) where.category = category;
  if (assigneeId) where.assigneeId = assigneeId;
  if (creatorId) where.creatorId = creatorId;
  if (search) {
    where.OR = [
      { ticketNumber: { contains: search, mode: 'insensitive' } },
      { subject: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [tickets, total] = await Promise.all([
    prisma.iTTicket.findMany({
      where,
      include: {
        creator: { select: { id: true, firstName: true, lastName: true, avatar: true } },
        assignee: { select: { id: true, firstName: true, lastName: true, avatar: true } },
        systemAsset: { select: { id: true, name: true, assetTag: true } },
        software: { select: { id: true, name: true } },
        _count: { select: { comments: true, tasks: true } },
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    }),
    prisma.iTTicket.count({ where }),
  ]);

  return {
    tickets,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getTicketById(id: string) {
  return prisma.iTTicket.findUnique({
    where: { id },
    include: {
      creator: true,
      assignee: true,
      systemAsset: true,
      software: true,
      comments: {
        include: {
          author: { select: { id: true, firstName: true, lastName: true, avatar: true } },
        },
        orderBy: { createdAt: 'desc' },
      },
      tasks: {
        include: {
          assignee: { select: { id: true, firstName: true, lastName: true } },
        },
      },
    },
  });
}

export async function createTicket(data: CreateTicketInput, creatorId: string) {
  const validated = createTicketSchema.parse(data);

  // Calculate SLA deadline based on priority
  const slaHours: Record<string, number> = {
    CRITICAL: 4,
    HIGH: 8,
    MEDIUM: 24,
    LOW: 48,
  };
  const slaDeadline = new Date();
  slaDeadline.setHours(slaDeadline.getHours() + slaHours[validated.priority]);

  const ticket = await prisma.iTTicket.create({
    data: {
      ...validated,
      ticketNumber: generateTicketNumber(),
      creatorId,
      slaDeadline,
    },
    include: {
      creator: { select: { id: true, firstName: true, lastName: true, email: true } },
    },
  });

  // Send confirmation email to creator
  const creatorName = `${ticket.creator.firstName} ${ticket.creator.lastName}`;
  const ticketUrl = `${process.env.APP_URL}/it/tickets/${ticket.id}`;
  const emailContent = getTicketCreatedEmail(
    creatorName,
    ticket.ticketNumber,
    ticket.subject,
    ticketUrl
  );

  await sendEmail({
    to: ticket.creator.email,
    subject: emailContent.subject,
    html: emailContent.html,
  });

  revalidatePath('/it/tickets');
  return { success: true, ticket };
}

export async function updateTicket(id: string, data: UpdateTicketInput) {
  const validated = updateTicketSchema.parse(data);

  // Handle status changes
  const updateData: Record<string, unknown> = { ...validated };
  if (validated.status === 'RESOLVED' && !updateData.resolvedAt) {
    updateData.resolvedAt = new Date();
  }
  if (validated.status === 'CLOSED' && !updateData.closedAt) {
    updateData.closedAt = new Date();
  }

  const ticket = await prisma.iTTicket.update({
    where: { id },
    data: updateData,
    include: {
      creator: { select: { id: true, firstName: true, lastName: true, email: true } },
    },
  });

  // Notify creator of status change
  if (validated.status) {
    const creatorName = `${ticket.creator.firstName} ${ticket.creator.lastName}`;
    const ticketUrl = `${process.env.APP_URL}/it/tickets/${ticket.id}`;
    const emailContent = getTicketUpdatedEmail(
      creatorName,
      ticket.ticketNumber,
      validated.status,
      ticketUrl
    );

    await sendEmail({
      to: ticket.creator.email,
      subject: emailContent.subject,
      html: emailContent.html,
    });
  }

  revalidatePath('/it/tickets');
  revalidatePath(`/it/tickets/${id}`);
  return { success: true, ticket };
}

export async function addTicketComment(
  ticketId: string,
  content: string,
  authorId: string,
  isInternal: boolean = false
) {
  const validated = ticketCommentSchema.parse({ content, isInternal });

  const comment = await prisma.ticketComment.create({
    data: {
      ...validated,
      ticketId,
      authorId,
    },
    include: {
      author: { select: { id: true, firstName: true, lastName: true, avatar: true } },
    },
  });

  revalidatePath(`/it/tickets/${ticketId}`);
  return { success: true, comment };
}

export async function assignTicket(ticketId: string, assigneeId: string) {
  const ticket = await prisma.iTTicket.update({
    where: { id: ticketId },
    data: {
      assigneeId,
      status: 'IN_PROGRESS',
    },
  });

  revalidatePath('/it/tickets');
  revalidatePath(`/it/tickets/${ticketId}`);
  return { success: true, ticket };
}
