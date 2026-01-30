'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { createProjectSchema, type CreateProjectInput } from '@/validations';

export async function getProjects(params?: {
  status?: string;
  companyId?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  const page = params?.page || 1;
  const limit = params?.limit || 20;
  const skip = (page - 1) * limit;

  const where: any = {};

  if (params?.status) {
    where.status = params.status;
  }

  if (params?.companyId) {
    where.companyId = params.companyId;
  }

  if (params?.search) {
    where.OR = [
      { name: { contains: params.search, mode: 'insensitive' } },
      { code: { contains: params.search, mode: 'insensitive' } },
      { description: { contains: params.search, mode: 'insensitive' } },
    ];
  }

  const [projects, total] = await Promise.all([
    prisma.project.findMany({
      where,
      include: {
        company: { select: { id: true, name: true, shortName: true } },
        department: { select: { id: true, name: true } },
        owner: { select: { id: true, firstName: true, lastName: true, avatar: true } },
        _count: { select: { tasks: true, members: true, milestones: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.project.count({ where }),
  ]);

  return {
    projects,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
}

export async function getProjectById(id: string) {
  return prisma.project.findUnique({
    where: { id },
    include: {
      company: true,
      department: true,
      owner: { select: { id: true, firstName: true, lastName: true, email: true, avatar: true } },
      members: {
        include: {
          user: { select: { id: true, firstName: true, lastName: true, email: true, avatar: true } },
        },
      },
      milestones: { orderBy: { dueDate: 'asc' } },
      tasks: {
        include: {
          assignee: { select: { id: true, firstName: true, lastName: true, avatar: true } },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  });
}

export async function createProject(data: CreateProjectInput) {
  const validated = createProjectSchema.parse(data);

  const project = await prisma.project.create({
    data: validated,
    include: {
      company: true,
      owner: { select: { id: true, firstName: true, lastName: true } },
    },
  });

  revalidatePath('/projects');
  return project;
}

export async function updateProject(id: string, data: Partial<CreateProjectInput>) {
  const project = await prisma.project.update({
    where: { id },
    data,
    include: {
      company: true,
      owner: { select: { id: true, firstName: true, lastName: true } },
    },
  });

  revalidatePath('/projects');
  revalidatePath(`/projects/${id}`);
  return project;
}

export async function deleteProject(id: string) {
  await prisma.project.delete({ where: { id } });
  revalidatePath('/projects');
}

export async function addProjectMember(projectId: string, userId: string, role?: string) {
  const member = await prisma.projectMember.create({
    data: {
      projectId,
      userId,
      role,
    },
    include: {
      user: { select: { id: true, firstName: true, lastName: true, email: true } },
    },
  });

  revalidatePath(`/projects/${projectId}`);
  return member;
}

export async function removeProjectMember(projectId: string, userId: string) {
  await prisma.projectMember.deleteMany({
    where: { projectId, userId },
  });

  revalidatePath(`/projects/${projectId}`);
}

export async function createMilestone(projectId: string, data: { name: string; description?: string; dueDate?: Date }) {
  const milestone = await prisma.projectMilestone.create({
    data: {
      ...data,
      projectId,
    },
  });

  revalidatePath(`/projects/${projectId}`);
  return milestone;
}

export async function updateMilestone(id: string, data: { name?: string; description?: string; dueDate?: Date; completedAt?: Date }) {
  const milestone = await prisma.projectMilestone.update({
    where: { id },
    data,
  });

  revalidatePath(`/projects`);
  return milestone;
}

export async function deleteMilestone(id: string, projectId: string) {
  await prisma.projectMilestone.delete({ where: { id } });
  revalidatePath(`/projects/${projectId}`);
}

export async function getCompaniesForSelect() {
  return prisma.company.findMany({
    where: { isActive: true },
    select: { id: true, name: true, shortName: true },
    orderBy: { name: 'asc' },
  });
}

export async function getDepartmentsForSelect(companyId?: string) {
  const where: any = { isActive: true };
  if (companyId) {
    where.companyId = companyId;
  }

  return prisma.department.findMany({
    where,
    select: { id: true, name: true, code: true },
    orderBy: { name: 'asc' },
  });
}

export async function getUsersForSelect() {
  return prisma.user.findMany({
    where: { status: 'ACTIVE' },
    select: { id: true, firstName: true, lastName: true, email: true },
    orderBy: { firstName: 'asc' },
  });
}
