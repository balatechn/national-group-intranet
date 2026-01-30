'use server';

import { revalidatePath } from 'next/cache';
import prisma from '@/lib/db';
import { generateAssetTag } from '@/lib/utils';
import {
  createSystemAssetSchema,
  updateSystemAssetSchema,
  createSoftwareSchema,
  updateSoftwareSchema,
  createMobileDeviceSchema,
  updateMobileDeviceSchema,
  createVendorSchema,
  updateVendorSchema,
  type CreateSystemAssetInput,
  type UpdateSystemAssetInput,
  type CreateSoftwareInput,
  type UpdateSoftwareInput,
  type CreateMobileDeviceInput,
  type UpdateMobileDeviceInput,
  type CreateVendorInput,
  type UpdateVendorInput,
} from '@/validations';

// ==========================================
// SYSTEM ASSETS
// ==========================================

export async function getSystemAssets(options?: {
  status?: string;
  type?: string;
  companyId?: string;
  departmentId?: string;
  assignedToId?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  const {
    status,
    type,
    companyId,
    departmentId,
    assignedToId,
    search,
    page = 1,
    limit = 10,
  } = options || {};

  const where: Record<string, unknown> = {};

  if (status) where.status = status;
  if (type) where.type = type;
  if (companyId) where.companyId = companyId;
  if (departmentId) where.departmentId = departmentId;
  if (assignedToId) where.assignedToId = assignedToId;
  if (search) {
    where.OR = [
      { assetTag: { contains: search, mode: 'insensitive' } },
      { name: { contains: search, mode: 'insensitive' } },
      { serialNumber: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [assets, total] = await Promise.all([
    prisma.systemAsset.findMany({
      where,
      include: {
        company: { select: { id: true, name: true } },
        department: { select: { id: true, name: true } },
        assignedTo: { select: { id: true, firstName: true, lastName: true } },
        vendor: { select: { id: true, name: true } },
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.systemAsset.count({ where }),
  ]);

  return {
    assets,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getSystemAssetById(id: string) {
  return prisma.systemAsset.findUnique({
    where: { id },
    include: {
      company: true,
      department: true,
      assignedTo: true,
      vendor: true,
      tickets: {
        take: 5,
        orderBy: { createdAt: 'desc' },
      },
      installedSoftware: {
        include: {
          software: true,
        },
      },
    },
  });
}

export async function createSystemAsset(data: CreateSystemAssetInput) {
  const validated = createSystemAssetSchema.parse(data);

  // Generate asset tag if not provided
  const assetTag = validated.assetTag || generateAssetTag(validated.type);

  // Set assignedAt if assignedToId is provided
  const assetData = {
    ...validated,
    assetTag,
    assignedAt: validated.assignedToId ? new Date() : null,
    status: validated.assignedToId ? 'ASSIGNED' : validated.status,
  };

  const asset = await prisma.systemAsset.create({
    data: assetData as Record<string, unknown>,
  });

  revalidatePath('/it/masters/systems');
  return { success: true, asset };
}

export async function updateSystemAsset(id: string, data: UpdateSystemAssetInput) {
  const validated = updateSystemAssetSchema.parse(data);

  // Get current asset to check assignment changes
  const currentAsset = await prisma.systemAsset.findUnique({ where: { id } });

  const updateData: Record<string, unknown> = { ...validated };

  // Handle assignment changes
  if (validated.assignedToId !== undefined) {
    if (validated.assignedToId && !currentAsset?.assignedToId) {
      // New assignment
      updateData.assignedAt = new Date();
      updateData.status = 'ASSIGNED';
    } else if (!validated.assignedToId && currentAsset?.assignedToId) {
      // Removing assignment
      updateData.assignedAt = null;
      updateData.status = 'AVAILABLE';
    }
  }

  const asset = await prisma.systemAsset.update({
    where: { id },
    data: updateData,
  });

  revalidatePath('/it/masters/systems');
  revalidatePath(`/it/masters/systems/${id}`);
  return { success: true, asset };
}

export async function deleteSystemAsset(id: string) {
  await prisma.systemAsset.delete({ where: { id } });
  revalidatePath('/it/masters/systems');
  return { success: true };
}

// ==========================================
// SOFTWARE
// ==========================================

export async function getSoftware(options?: {
  licenseType?: string;
  companyId?: string;
  departmentId?: string;
  isActive?: boolean;
  expiringWithinDays?: number;
  search?: string;
  page?: number;
  limit?: number;
}) {
  const {
    licenseType,
    companyId,
    departmentId,
    isActive,
    expiringWithinDays,
    search,
    page = 1,
    limit = 10,
  } = options || {};

  const where: Record<string, unknown> = {};

  if (licenseType) where.licenseType = licenseType;
  if (companyId) where.companyId = companyId;
  if (departmentId) where.departmentId = departmentId;
  if (typeof isActive === 'boolean') where.isActive = isActive;
  if (expiringWithinDays) {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + expiringWithinDays);
    where.expiryDate = { lte: expiryDate, gte: new Date() };
  }
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { publisher: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [software, total] = await Promise.all([
    prisma.software.findMany({
      where,
      include: {
        company: { select: { id: true, name: true } },
        department: { select: { id: true, name: true } },
        vendor: { select: { id: true, name: true } },
        _count: { select: { installations: true } },
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { name: 'asc' },
    }),
    prisma.software.count({ where }),
  ]);

  return {
    software,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getSoftwareById(id: string) {
  return prisma.software.findUnique({
    where: { id },
    include: {
      company: true,
      department: true,
      vendor: true,
      installations: {
        include: {
          asset: {
            include: {
              assignedTo: { select: { id: true, firstName: true, lastName: true } },
            },
          },
        },
      },
      tickets: {
        take: 5,
        orderBy: { createdAt: 'desc' },
      },
    },
  });
}

export async function createSoftware(data: CreateSoftwareInput) {
  const validated = createSoftwareSchema.parse(data);

  const software = await prisma.software.create({
    data: validated as Record<string, unknown>,
  });

  revalidatePath('/it/masters/software');
  return { success: true, software };
}

export async function updateSoftware(id: string, data: UpdateSoftwareInput) {
  const validated = updateSoftwareSchema.parse(data);

  const software = await prisma.software.update({
    where: { id },
    data: validated as Record<string, unknown>,
  });

  revalidatePath('/it/masters/software');
  revalidatePath(`/it/masters/software/${id}`);
  return { success: true, software };
}

export async function deleteSoftware(id: string) {
  await prisma.software.delete({ where: { id } });
  revalidatePath('/it/masters/software');
  return { success: true };
}

// ==========================================
// MOBILE DEVICES
// ==========================================

export async function getMobileDevices(options?: {
  status?: string;
  companyId?: string;
  assignedToId?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  const {
    status,
    companyId,
    assignedToId,
    search,
    page = 1,
    limit = 10,
  } = options || {};

  const where: Record<string, unknown> = {};

  if (status) where.status = status;
  if (companyId) where.companyId = companyId;
  if (assignedToId) where.assignedToId = assignedToId;
  if (search) {
    where.OR = [
      { assetTag: { contains: search, mode: 'insensitive' } },
      { imei: { contains: search, mode: 'insensitive' } },
      { mobileNumber: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [devices, total] = await Promise.all([
    prisma.mobileDevice.findMany({
      where,
      include: {
        company: { select: { id: true, name: true } },
        assignedTo: { select: { id: true, firstName: true, lastName: true } },
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.mobileDevice.count({ where }),
  ]);

  return {
    devices,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getMobileDeviceById(id: string) {
  return prisma.mobileDevice.findUnique({
    where: { id },
    include: {
      company: true,
      assignedTo: true,
    },
  });
}

export async function createMobileDevice(data: CreateMobileDeviceInput) {
  const validated = createMobileDeviceSchema.parse(data);

  const assetTag = validated.assetTag || generateAssetTag('MOB');

  const device = await prisma.mobileDevice.create({
    data: {
      ...validated,
      assetTag,
      assignedAt: validated.assignedToId ? new Date() : null,
      status: validated.assignedToId ? 'ASSIGNED' : validated.status,
    } as Record<string, unknown>,
  });

  revalidatePath('/it/masters/mobiles');
  return { success: true, device };
}

export async function updateMobileDevice(id: string, data: UpdateMobileDeviceInput) {
  const validated = updateMobileDeviceSchema.parse(data);

  const device = await prisma.mobileDevice.update({
    where: { id },
    data: validated as Record<string, unknown>,
  });

  revalidatePath('/it/masters/mobiles');
  revalidatePath(`/it/masters/mobiles/${id}`);
  return { success: true, device };
}

export async function deleteMobileDevice(id: string) {
  await prisma.mobileDevice.delete({ where: { id } });
  revalidatePath('/it/masters/mobiles');
  return { success: true };
}

// ==========================================
// VENDORS
// ==========================================

export async function getVendors(options?: {
  type?: string;
  companyId?: string;
  isActive?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}) {
  const {
    type,
    companyId,
    isActive,
    search,
    page = 1,
    limit = 10,
  } = options || {};

  const where: Record<string, unknown> = {};

  if (type) where.type = type;
  if (companyId) where.companyId = companyId;
  if (typeof isActive === 'boolean') where.isActive = isActive;
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { code: { contains: search, mode: 'insensitive' } },
      { contactPerson: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [vendors, total] = await Promise.all([
    prisma.vendor.findMany({
      where,
      include: {
        company: { select: { id: true, name: true } },
        _count: { select: { systemAssets: true, software: true } },
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { name: 'asc' },
    }),
    prisma.vendor.count({ where }),
  ]);

  return {
    vendors,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getVendorById(id: string) {
  return prisma.vendor.findUnique({
    where: { id },
    include: {
      company: true,
      systemAssets: { take: 10 },
      software: { take: 10 },
    },
  });
}

export async function createVendor(data: CreateVendorInput) {
  const validated = createVendorSchema.parse(data);

  const vendor = await prisma.vendor.create({
    data: validated as Record<string, unknown>,
  });

  revalidatePath('/it/masters/vendors');
  return { success: true, vendor };
}

export async function updateVendor(id: string, data: UpdateVendorInput) {
  const validated = updateVendorSchema.parse(data);

  const vendor = await prisma.vendor.update({
    where: { id },
    data: validated as Record<string, unknown>,
  });

  revalidatePath('/it/masters/vendors');
  revalidatePath(`/it/masters/vendors/${id}`);
  return { success: true, vendor };
}

export async function deleteVendor(id: string) {
  await prisma.vendor.delete({ where: { id } });
  revalidatePath('/it/masters/vendors');
  return { success: true };
}
