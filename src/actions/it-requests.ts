'use server';

import { revalidatePath } from 'next/cache';
import prisma from '@/lib/db';
import type { Prisma } from '@prisma/client';
import {
  sendEmail,
  getRequestApprovalEmail,
  getRequestStatusEmail,
} from '@/lib/mailgun';
import { generateRequestNumber } from '@/lib/utils';
import {
  createITRequestSchema,
  updateITRequestSchema,
  itRequestApprovalSchema,
  type CreateITRequestInput,
  type UpdateITRequestInput,
} from '@/validations';

export async function getITRequests(options?: {
  status?: string;
  type?: string;
  requestorId?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  const {
    status,
    type,
    requestorId,
    search,
    page = 1,
    limit = 10,
  } = options || {};

  const where: Record<string, unknown> = {};

  if (status) where.status = status;
  if (type) where.type = type;
  if (requestorId) where.requestorId = requestorId;
  if (search) {
    where.OR = [
      { requestNumber: { contains: search, mode: 'insensitive' } },
      { subject: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [requests, total] = await Promise.all([
    prisma.iTRequest.findMany({
      where,
      include: {
        requestor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
            department: { select: { name: true } },
          },
        },
        approvals: {
          include: {
            approver: { select: { id: true, firstName: true, lastName: true } },
          },
          orderBy: { level: 'asc' },
        },
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.iTRequest.count({ where }),
  ]);

  return {
    requests,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getITRequestById(id: string) {
  return prisma.iTRequest.findUnique({
    where: { id },
    include: {
      requestor: {
        include: {
          department: true,
          company: true,
        },
      },
      approvals: {
        include: {
          approver: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
        orderBy: { level: 'asc' },
      },
    },
  });
}

export async function createITRequest(data: CreateITRequestInput, requestorId: string) {
  const validated = createITRequestSchema.parse(data);

  const requestData: Prisma.ITRequestCreateInput = {
    requestNumber: generateRequestNumber(),
    type: validated.type,
    subject: validated.subject,
    description: validated.description,
    justification: validated.justification,
    status: 'PENDING_APPROVAL',
    details: validated.details as Prisma.InputJsonValue | undefined,
    requestor: { connect: { id: requestorId } },
  };

  const request = await prisma.iTRequest.create({
    data: requestData,
    include: {
      requestor: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          managerId: true,
          manager: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
      },
    },
  });

  // Create approval record for manager
  if (request.requestor.managerId && request.requestor.manager) {
    await prisma.iTRequestApproval.create({
      data: {
        requestId: request.id,
        approverId: request.requestor.managerId,
        level: 1,
      },
    });

    // Send email to manager
    const managerName = `${request.requestor.manager.firstName} ${request.requestor.manager.lastName}`;
    const requestorName = `${request.requestor.firstName} ${request.requestor.lastName}`;
    const requestUrl = `${process.env.APP_URL}/it/requests/${request.id}`;
    const emailContent = getRequestApprovalEmail(
      managerName,
      request.requestNumber,
      request.type,
      requestorName,
      requestUrl
    );

    await sendEmail({
      to: request.requestor.manager.email,
      subject: emailContent.subject,
      html: emailContent.html,
    });
  }

  revalidatePath('/it/requests');
  return { success: true, request };
}

export async function updateITRequest(id: string, data: UpdateITRequestInput) {
  const validated = updateITRequestSchema.parse(data);

  const updateData: Prisma.ITRequestUpdateInput = {
    status: validated.status,
    details: validated.details as Prisma.InputJsonValue | undefined,
  };

  const request = await prisma.iTRequest.update({
    where: { id },
    data: updateData,
  });

  revalidatePath('/it/requests');
  revalidatePath(`/it/requests/${id}`);
  return { success: true, request };
}

export async function approveITRequest(
  requestId: string,
  approverId: string,
  decision: 'APPROVED' | 'REJECTED',
  comments?: string
) {
  const validated = itRequestApprovalSchema.parse({ status: decision, comments });

  // Update the approval record
  const approval = await prisma.iTRequestApproval.updateMany({
    where: {
      requestId,
      approverId,
      status: 'PENDING',
    },
    data: {
      status: validated.status,
      comments: validated.comments,
      approvedAt: new Date(),
    },
  });

  // Get the request with requestor info
  const request = await prisma.iTRequest.findUnique({
    where: { id: requestId },
    include: {
      requestor: { select: { id: true, firstName: true, lastName: true, email: true } },
      approvals: true,
    },
  });

  if (!request) {
    throw new Error('Request not found');
  }

  // Update request status based on approval
  let newStatus = request.status;
  if (decision === 'REJECTED') {
    newStatus = 'REJECTED';
  } else {
    // Check if all approvals are complete
    const allApproved = request.approvals.every(
      (a) => a.status === 'APPROVED' || (a.approverId === approverId && decision === 'APPROVED')
    );
    if (allApproved) {
      newStatus = 'APPROVED';
    }
  }

  await prisma.iTRequest.update({
    where: { id: requestId },
    data: { status: newStatus },
  });

  // Notify requestor
  const requestorName = `${request.requestor.firstName} ${request.requestor.lastName}`;
  const emailContent = getRequestStatusEmail(
    requestorName,
    request.requestNumber,
    decision,
    comments
  );

  await sendEmail({
    to: request.requestor.email,
    subject: emailContent.subject,
    html: emailContent.html,
  });

  revalidatePath('/it/requests');
  revalidatePath(`/it/requests/${requestId}`);
  return { success: true };
}
