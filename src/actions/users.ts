'use server';

import { revalidatePath } from 'next/cache';
import { hash } from 'bcryptjs';
import prisma from '@/lib/db';
import {
  createUserSchema,
  updateUserSchema,
  type CreateUserInput,
  type UpdateUserInput,
} from '@/validations';

export async function getUsers(options?: {
  companyId?: string;
  departmentId?: string;
  role?: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  const {
    companyId,
    departmentId,
    role,
    status,
    search,
    page = 1,
    limit = 10,
  } = options || {};

  const where: Record<string, unknown> = {};

  if (companyId) where.companyId = companyId;
  if (departmentId) where.departmentId = departmentId;
  if (role) where.role = role;
  if (status) where.status = status;
  if (search) {
    where.OR = [
      { firstName: { contains: search, mode: 'insensitive' } },
      { lastName: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { employeeId: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      include: {
        company: { select: { id: true, name: true } },
        department: { select: { id: true, name: true } },
        manager: { select: { id: true, firstName: true, lastName: true } },
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.count({ where }),
  ]);

  return {
    users,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getUserById(id: string) {
  return prisma.user.findUnique({
    where: { id },
    include: {
      company: true,
      department: true,
      manager: true,
      subordinates: true,
    },
  });
}

export async function createUser(data: CreateUserInput) {
  const validated = createUserSchema.parse(data);

  // Hash password
  const hashedPassword = await hash(validated.password, 12);

  const user = await prisma.user.create({
    data: {
      ...validated,
      password: hashedPassword,
      displayName: validated.displayName || `${validated.firstName} ${validated.lastName}`,
    },
  });

  revalidatePath('/users');
  return { success: true, user };
}

export async function updateUser(id: string, data: UpdateUserInput) {
  const validated = updateUserSchema.parse(data);

  const user = await prisma.user.update({
    where: { id },
    data: {
      ...validated,
      displayName: validated.displayName || 
        (validated.firstName && validated.lastName 
          ? `${validated.firstName} ${validated.lastName}` 
          : undefined),
    },
  });

  revalidatePath('/users');
  revalidatePath(`/users/${id}`);
  return { success: true, user };
}

export async function deleteUser(id: string) {
  await prisma.user.delete({ where: { id } });
  revalidatePath('/users');
  return { success: true };
}
