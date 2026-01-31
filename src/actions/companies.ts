'use server';

import { revalidatePath } from 'next/cache';
import prisma from '@/lib/db';
import {
  createCompanySchema,
  updateCompanySchema,
  type CreateCompanyInput,
  type UpdateCompanyInput,
} from '@/validations';

export async function getCompanies(options?: {
  search?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}) {
  const { search, isActive, page = 1, limit = 10 } = options || {};

  const where: Record<string, unknown> = {};

  if (typeof isActive === 'boolean') where.isActive = isActive;
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { code: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [companies, total] = await Promise.all([
    prisma.company.findMany({
      where,
      include: {
        parent: {
          select: { id: true, name: true, code: true },
        },
        subsidiaries: {
          select: { id: true, name: true, code: true },
        },
        _count: {
          select: {
            departments: true,
            users: true,
            projects: true,
            subsidiaries: true,
          },
        },
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { name: 'asc' },
    }),
    prisma.company.count({ where }),
  ]);

  return {
    companies,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

// Get companies in hierarchical structure (parent with children nested)
export async function getCompanyHierarchy() {
  // Get all parent companies (no parentId) with their subsidiaries
  const parentCompanies = await prisma.company.findMany({
    where: {
      parentId: null,
      isActive: true,
    },
    include: {
      subsidiaries: {
        where: { isActive: true },
        include: {
          _count: {
            select: {
              departments: true,
              users: true,
              projects: true,
            },
          },
        },
        orderBy: { name: 'asc' },
      },
      _count: {
        select: {
          departments: true,
          users: true,
          projects: true,
          subsidiaries: true,
        },
      },
    },
    orderBy: { name: 'asc' },
  });

  return parentCompanies;
}

// Get all companies for dropdown (flat list)
export async function getAllCompaniesFlat() {
  return prisma.company.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      code: true,
      parentId: true,
    },
    orderBy: { name: 'asc' },
  });
}

export async function getCompanyById(id: string) {
  return prisma.company.findUnique({
    where: { id },
    include: {
      parent: {
        select: { id: true, name: true, code: true },
      },
      subsidiaries: {
        where: { isActive: true },
        include: {
          _count: { select: { users: true, departments: true } },
        },
        orderBy: { name: 'asc' },
      },
      departments: {
        include: {
          head: { select: { id: true, firstName: true, lastName: true } },
          _count: { select: { users: true } },
        },
      },
      _count: {
        select: {
          users: true,
          projects: true,
          systemAssets: true,
          softwareAssets: true,
          subsidiaries: true,
        },
      },
    },
  });
}

export async function createCompany(data: CreateCompanyInput & { parentId?: string }) {
  const validated = createCompanySchema.parse(data);

  const company = await prisma.company.create({
    data: {
      ...validated,
      parentId: data.parentId || null,
    },
  });

  revalidatePath('/companies');
  return { success: true, company };
}

export async function updateCompany(id: string, data: UpdateCompanyInput & { parentId?: string | null }) {
  const validated = updateCompanySchema.parse(data);

  const company = await prisma.company.update({
    where: { id },
    data: {
      ...validated,
      parentId: data.parentId !== undefined ? data.parentId : undefined,
    },
  });

  revalidatePath('/companies');
  revalidatePath(`/companies/${id}`);
  return { success: true, company };
}

// Set parent company for a subsidiary
export async function setParentCompany(companyId: string, parentId: string | null) {
  const company = await prisma.company.update({
    where: { id: companyId },
    data: { parentId },
  });

  revalidatePath('/companies');
  return { success: true, company };
}

export async function deleteCompany(id: string) {
  await prisma.company.delete({ where: { id } });
  revalidatePath('/companies');
  return { success: true };
}
