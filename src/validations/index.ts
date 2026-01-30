import { z } from 'zod';

// ==========================================
// COMMON VALIDATIONS
// ==========================================

export const idSchema = z.string().cuid();

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
});

export const dateRangeSchema = z.object({
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

// ==========================================
// USER VALIDATIONS
// ==========================================

export const userRoleEnum = z.enum([
  'SUPER_ADMIN',
  'ADMIN',
  'IT_ADMIN',
  'HR_ADMIN',
  'MANAGER',
  'EMPLOYEE',
]);

export const userStatusEnum = z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']);

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const createUserSchema = z.object({
  employeeId: z.string().min(1, 'Employee ID is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  displayName: z.string().optional(),
  phone: z.string().optional(),
  role: userRoleEnum.default('EMPLOYEE'),
  jobTitle: z.string().optional(),
  companyId: z.string().cuid().optional(),
  departmentId: z.string().cuid().optional(),
  managerId: z.string().cuid().optional(),
});

export const updateUserSchema = createUserSchema.partial().omit({ password: true });

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
  confirmPassword: z.string().min(1, 'Confirm password is required'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

// ==========================================
// COMPANY VALIDATIONS
// ==========================================

export const createCompanySchema = z.object({
  code: z.string().min(1, 'Company code is required').max(10),
  name: z.string().min(1, 'Company name is required'),
  shortName: z.string().optional(),
  description: z.string().optional(),
  logo: z.string().url().optional().or(z.literal('')),
  website: z.string().url().optional().or(z.literal('')),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  postalCode: z.string().optional(),
  taxId: z.string().optional(),
  isActive: z.boolean().default(true),
});

export const updateCompanySchema = createCompanySchema.partial();

// ==========================================
// DEPARTMENT VALIDATIONS
// ==========================================

export const createDepartmentSchema = z.object({
  code: z.string().min(1, 'Department code is required').max(10),
  name: z.string().min(1, 'Department name is required'),
  description: z.string().optional(),
  companyId: z.string().cuid('Invalid company'),
  headId: z.string().cuid().optional().nullable(),
  parentId: z.string().cuid().optional().nullable(),
  isActive: z.boolean().default(true),
});

export const updateDepartmentSchema = createDepartmentSchema.partial().omit({ companyId: true });

// ==========================================
// TASK VALIDATIONS
// ==========================================

export const taskPriorityEnum = z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);
export const taskStatusEnum = z.enum(['TODO', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED']);

export const createTaskSchema = z.object({
  title: z.string().min(1, 'Task title is required'),
  description: z.string().optional(),
  priority: taskPriorityEnum.default('MEDIUM'),
  status: taskStatusEnum.default('TODO'),
  dueDate: z.coerce.date().optional().nullable(),
  estimatedHours: z.coerce.number().positive().optional().nullable(),
  assigneeId: z.string().cuid().optional().nullable(),
  departmentId: z.string().cuid().optional().nullable(),
  projectId: z.string().cuid().optional().nullable(),
  ticketId: z.string().cuid().optional().nullable(),
  parentId: z.string().cuid().optional().nullable(),
});

export const updateTaskSchema = createTaskSchema.partial().extend({
  actualHours: z.coerce.number().positive().optional().nullable(),
  completedAt: z.coerce.date().optional().nullable(),
});

export const taskFilterSchema = paginationSchema.extend({
  status: taskStatusEnum.optional(),
  priority: taskPriorityEnum.optional(),
  assigneeId: z.string().cuid().optional(),
  departmentId: z.string().cuid().optional(),
  projectId: z.string().cuid().optional(),
  ...dateRangeSchema.shape,
});

// ==========================================
// PROJECT VALIDATIONS
// ==========================================

export const projectStatusEnum = z.enum(['PLANNED', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED']);

export const createProjectSchema = z.object({
  code: z.string().min(1, 'Project code is required').max(20),
  name: z.string().min(1, 'Project name is required'),
  description: z.string().optional(),
  status: projectStatusEnum.default('PLANNED'),
  startDate: z.coerce.date().optional().nullable(),
  endDate: z.coerce.date().optional().nullable(),
  budget: z.coerce.number().positive().optional().nullable(),
  companyId: z.string().cuid('Invalid company'),
  departmentId: z.string().cuid().optional().nullable(),
  ownerId: z.string().cuid('Project owner is required'),
});

export const updateProjectSchema = createProjectSchema.partial().omit({ companyId: true }).extend({
  actualEndDate: z.coerce.date().optional().nullable(),
});

export const projectMemberSchema = z.object({
  userId: z.string().cuid('Invalid user'),
  role: z.string().optional(),
});

export const projectMilestoneSchema = z.object({
  name: z.string().min(1, 'Milestone name is required'),
  description: z.string().optional(),
  dueDate: z.coerce.date().optional().nullable(),
});

// ==========================================
// EVENT VALIDATIONS
// ==========================================

export const eventTypeEnum = z.enum([
  'MEETING',
  'HOLIDAY',
  'MAINTENANCE',
  'TRAINING',
  'COMPANY_EVENT',
  'DEPARTMENT_EVENT',
  'OTHER',
]);

export const createEventSchema = z.object({
  title: z.string().min(1, 'Event title is required'),
  description: z.string().optional(),
  type: eventTypeEnum.default('OTHER'),
  location: z.string().optional(),
  isAllDay: z.boolean().default(false),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  recurrence: z.string().optional().nullable(),
  isPublic: z.boolean().default(true),
  companyId: z.string().cuid().optional().nullable(),
  departmentId: z.string().cuid().optional().nullable(),
  attendeeIds: z.array(z.string().cuid()).optional(),
}).refine((data) => data.endDate >= data.startDate, {
  message: 'End date must be after start date',
  path: ['endDate'],
});

export const updateEventSchema = createEventSchema.partial();

// ==========================================
// POLICY VALIDATIONS
// ==========================================

export const policyCategoryEnum = z.enum([
  'HR',
  'IT_SECURITY',
  'COMPLIANCE',
  'OPERATIONAL',
  'GENERAL',
]);

export const policyStatusEnum = z.enum(['DRAFT', 'UNDER_REVIEW', 'PUBLISHED', 'ARCHIVED']);

export const createPolicySchema = z.object({
  code: z.string().min(1, 'Policy code is required').max(20),
  title: z.string().min(1, 'Policy title is required'),
  description: z.string().optional(),
  content: z.string().optional(),
  category: policyCategoryEnum,
  status: policyStatusEnum.default('DRAFT'),
  effectiveDate: z.coerce.date().optional().nullable(),
  expiryDate: z.coerce.date().optional().nullable(),
  fileUrl: z.string().url().optional().or(z.literal('')),
  companyId: z.string().cuid().optional().nullable(),
  departmentId: z.string().cuid().optional().nullable(),
});

export const updatePolicySchema = createPolicySchema.partial();

// ==========================================
// IT TICKET VALIDATIONS
// ==========================================

export const ticketCategoryEnum = z.enum([
  'HARDWARE',
  'SOFTWARE',
  'NETWORK',
  'ACCESS',
  'EMAIL',
  'OTHER',
]);

export const ticketPriorityEnum = z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);

export const ticketStatusEnum = z.enum([
  'OPEN',
  'IN_PROGRESS',
  'WAITING_FOR_USER',
  'RESOLVED',
  'CLOSED',
]);

export const createTicketSchema = z.object({
  subject: z.string().min(1, 'Subject is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  category: ticketCategoryEnum,
  priority: ticketPriorityEnum.default('MEDIUM'),
  systemAssetId: z.string().cuid().optional().nullable(),
  softwareId: z.string().cuid().optional().nullable(),
});

export const updateTicketSchema = z.object({
  status: ticketStatusEnum.optional(),
  priority: ticketPriorityEnum.optional(),
  assigneeId: z.string().cuid().optional().nullable(),
  slaDeadline: z.coerce.date().optional().nullable(),
});

export const ticketCommentSchema = z.object({
  content: z.string().min(1, 'Comment is required'),
  isInternal: z.boolean().default(false),
});

export const ticketFilterSchema = paginationSchema.extend({
  status: ticketStatusEnum.optional(),
  priority: ticketPriorityEnum.optional(),
  category: ticketCategoryEnum.optional(),
  assigneeId: z.string().cuid().optional(),
  creatorId: z.string().cuid().optional(),
  ...dateRangeSchema.shape,
});

// ==========================================
// IT REQUEST VALIDATIONS
// ==========================================

export const itRequestTypeEnum = z.enum([
  'NEW_HARDWARE',
  'NEW_SOFTWARE',
  'ACCESS_REQUEST',
  'MODIFICATION',
  'REMOVAL',
]);

export const itRequestStatusEnum = z.enum([
  'DRAFT',
  'PENDING_APPROVAL',
  'APPROVED',
  'REJECTED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
]);

export const createITRequestSchema = z.object({
  type: itRequestTypeEnum,
  subject: z.string().min(1, 'Subject is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  justification: z.string().optional(),
  details: z.record(z.unknown()).optional(),
});

export const updateITRequestSchema = z.object({
  status: itRequestStatusEnum.optional(),
  details: z.record(z.unknown()).optional(),
});

export const itRequestApprovalSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
  comments: z.string().optional(),
});

// ==========================================
// ASSET VALIDATIONS
// ==========================================

export const assetStatusEnum = z.enum([
  'AVAILABLE',
  'ASSIGNED',
  'UNDER_MAINTENANCE',
  'RETIRED',
  'DISPOSED',
]);

export const assetTypeEnum = z.enum([
  'DESKTOP',
  'LAPTOP',
  'MACBOOK',
  'SERVER',
  'PRINTER',
  'MONITOR',
  'OTHER',
]);

export const createSystemAssetSchema = z.object({
  assetTag: z.string().min(1, 'Asset tag is required'),
  serialNumber: z.string().optional(),
  name: z.string().min(1, 'Asset name is required'),
  type: assetTypeEnum,
  manufacturer: z.string().optional(),
  model: z.string().optional(),
  status: assetStatusEnum.default('AVAILABLE'),
  processor: z.string().optional(),
  ram: z.string().optional(),
  storage: z.string().optional(),
  operatingSystem: z.string().optional(),
  osVersion: z.string().optional(),
  companyId: z.string().cuid().optional().nullable(),
  departmentId: z.string().cuid().optional().nullable(),
  assignedToId: z.string().cuid().optional().nullable(),
  purchaseDate: z.coerce.date().optional().nullable(),
  warrantyExpiry: z.coerce.date().optional().nullable(),
  purchasePrice: z.coerce.number().positive().optional().nullable(),
  vendorId: z.string().cuid().optional().nullable(),
  amcStartDate: z.coerce.date().optional().nullable(),
  amcEndDate: z.coerce.date().optional().nullable(),
  location: z.string().optional(),
  notes: z.string().optional(),
});

export const updateSystemAssetSchema = createSystemAssetSchema.partial();

// ==========================================
// SOFTWARE VALIDATIONS
// ==========================================

export const licenseTypeEnum = z.enum(['PERPETUAL', 'SUBSCRIPTION', 'FREE', 'TRIAL']);

export const createSoftwareSchema = z.object({
  name: z.string().min(1, 'Software name is required'),
  version: z.string().optional(),
  publisher: z.string().optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  licenseType: licenseTypeEnum.default('PERPETUAL'),
  licenseKey: z.string().optional(),
  totalLicenses: z.coerce.number().int().positive().default(1),
  companyId: z.string().cuid().optional().nullable(),
  departmentId: z.string().cuid().optional().nullable(),
  purchasePrice: z.coerce.number().positive().optional().nullable(),
  renewalPrice: z.coerce.number().positive().optional().nullable(),
  purchaseDate: z.coerce.date().optional().nullable(),
  expiryDate: z.coerce.date().optional().nullable(),
  renewalDate: z.coerce.date().optional().nullable(),
  vendorId: z.string().cuid().optional().nullable(),
  notes: z.string().optional(),
});

export const updateSoftwareSchema = createSoftwareSchema.partial();

// ==========================================
// MOBILE DEVICE VALIDATIONS
// ==========================================

export const createMobileDeviceSchema = z.object({
  assetTag: z.string().min(1, 'Asset tag is required'),
  imei: z.string().optional(),
  serialNumber: z.string().optional(),
  deviceType: z.string().min(1, 'Device type is required'),
  manufacturer: z.string().optional(),
  model: z.string().optional(),
  status: assetStatusEnum.default('AVAILABLE'),
  simNumber: z.string().optional(),
  operator: z.string().optional(),
  mobileNumber: z.string().optional(),
  planType: z.string().optional(),
  planDetails: z.string().optional(),
  companyId: z.string().cuid().optional().nullable(),
  assignedToId: z.string().cuid().optional().nullable(),
  purchaseDate: z.coerce.date().optional().nullable(),
  warrantyExpiry: z.coerce.date().optional().nullable(),
  purchasePrice: z.coerce.number().positive().optional().nullable(),
  monthlyPlanCost: z.coerce.number().positive().optional().nullable(),
  notes: z.string().optional(),
});

export const updateMobileDeviceSchema = createMobileDeviceSchema.partial();

// ==========================================
// VENDOR VALIDATIONS
// ==========================================

export const createVendorSchema = z.object({
  code: z.string().min(1, 'Vendor code is required').max(20),
  name: z.string().min(1, 'Vendor name is required'),
  type: z.string().optional(),
  description: z.string().optional(),
  contactPerson: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  postalCode: z.string().optional(),
  taxId: z.string().optional(),
  panNumber: z.string().optional(),
  gstNumber: z.string().optional(),
  contractStart: z.coerce.date().optional().nullable(),
  contractEnd: z.coerce.date().optional().nullable(),
  notes: z.string().optional(),
  companyId: z.string().cuid().optional().nullable(),
  isActive: z.boolean().default(true),
});

export const updateVendorSchema = createVendorSchema.partial();

// ==========================================
// SHARED FOLDER VALIDATIONS
// ==========================================

export const createSharedFolderSchema = z.object({
  name: z.string().min(1, 'Folder name is required'),
  description: z.string().optional(),
  driveId: z.string().min(1, 'Drive ID is required'),
  folderId: z.string().min(1, 'Folder ID is required'),
  webUrl: z.string().url().optional(),
  isCompanyWide: z.boolean().default(false),
  departmentId: z.string().cuid().optional().nullable(),
});

export const folderPermissionSchema = z.object({
  role: z.enum(['read', 'write', 'owner']),
  userId: z.string().cuid().optional().nullable(),
  userRole: userRoleEnum.optional().nullable(),
});

// ==========================================
// ANNOUNCEMENT VALIDATIONS
// ==========================================

export const createAnnouncementSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(1, 'Content is required'),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
  isPinned: z.boolean().default(false),
  publishedAt: z.coerce.date().optional().nullable(),
  expiresAt: z.coerce.date().optional().nullable(),
  isActive: z.boolean().default(true),
});

export const updateAnnouncementSchema = createAnnouncementSchema.partial();

// ==========================================
// TYPE EXPORTS
// ==========================================

export type LoginInput = z.infer<typeof loginSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type CreateCompanyInput = z.infer<typeof createCompanySchema>;
export type UpdateCompanyInput = z.infer<typeof updateCompanySchema>;
export type CreateDepartmentInput = z.infer<typeof createDepartmentSchema>;
export type UpdateDepartmentInput = z.infer<typeof updateDepartmentSchema>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;
export type CreatePolicyInput = z.infer<typeof createPolicySchema>;
export type UpdatePolicyInput = z.infer<typeof updatePolicySchema>;
export type CreateTicketInput = z.infer<typeof createTicketSchema>;
export type UpdateTicketInput = z.infer<typeof updateTicketSchema>;
export type CreateITRequestInput = z.infer<typeof createITRequestSchema>;
export type UpdateITRequestInput = z.infer<typeof updateITRequestSchema>;
export type CreateSystemAssetInput = z.infer<typeof createSystemAssetSchema>;
export type UpdateSystemAssetInput = z.infer<typeof updateSystemAssetSchema>;
export type CreateSoftwareInput = z.infer<typeof createSoftwareSchema>;
export type UpdateSoftwareInput = z.infer<typeof updateSoftwareSchema>;
export type CreateMobileDeviceInput = z.infer<typeof createMobileDeviceSchema>;
export type UpdateMobileDeviceInput = z.infer<typeof updateMobileDeviceSchema>;
export type CreateVendorInput = z.infer<typeof createVendorSchema>;
export type UpdateVendorInput = z.infer<typeof updateVendorSchema>;
export type CreateAnnouncementInput = z.infer<typeof createAnnouncementSchema>;
export type UpdateAnnouncementInput = z.infer<typeof updateAnnouncementSchema>;
