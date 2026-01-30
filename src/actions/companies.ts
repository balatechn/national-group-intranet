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
        _count: {
          select: {
            departments: true,
            users: true,
            projects: true,
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

export async function getCompanyById(id: string) {
  return prisma.company.findUnique({
    where: { id },
    include: {
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
        },
      },
    },
  });
}

export async function createCompany(data: CreateCompanyInput) {
  const validated = createCompanySchema.parse(data);

  const company = await prisma.company.create({
    data: validated,
  });

  revalidatePath('/companies');
  return { success: true, company };
}

export async function updateCompany(id: string, data: UpdateCompanyInput) {
  const validated = updateCompanySchema.parse(data);

  const company = await prisma.company.update({
    where: { id },
    data: validated,
  });

  revalidatePath('/companies');
  revalidatePath(`/companies/${id}`);
  return { success: true, company };
}

export async function deleteCompany(id: string) {
  await prisma.company.delete({ where: { id } });
  revalidatePath('/companies');
  return { success: true };
}
