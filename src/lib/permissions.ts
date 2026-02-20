import { prisma } from '@/lib/db';

// Must match the AppModule enum in Prisma
export const APP_MODULES = [
  'DASHBOARD',
  'COMPANIES',
  'DEPARTMENTS',
  'EMPLOYEES',
  'IT',
  'PROJECTS',
  'TASKS',
  'ATTENDANCE',
  'CALENDAR',
  'DRIVES',
  'POLICIES',
  'SETTINGS',
] as const;

export type AppModule = (typeof APP_MODULES)[number];

export const MODULE_LABELS: Record<AppModule, string> = {
  DASHBOARD: 'Dashboard',
  COMPANIES: 'Companies',
  DEPARTMENTS: 'Departments',
  EMPLOYEES: 'Employees',
  IT: 'IT & Systems',
  PROJECTS: 'Projects',
  TASKS: 'Tasks',
  ATTENDANCE: 'Attendance',
  CALENDAR: 'Calendar',
  DRIVES: 'Shared Drives',
  POLICIES: 'Policies',
  SETTINGS: 'Settings',
};

// Map URL paths to modules
export const PATH_TO_MODULE: Record<string, AppModule> = {
  '/dashboard': 'DASHBOARD',
  '/companies': 'COMPANIES',
  '/departments': 'DEPARTMENTS',
  '/employees': 'EMPLOYEES',
  '/it': 'IT',
  '/projects': 'PROJECTS',
  '/tasks': 'TASKS',
  '/attendance': 'ATTENDANCE',
  '/calendar': 'CALENDAR',
  '/drives': 'DRIVES',
  '/policies': 'POLICIES',
  '/settings': 'SETTINGS',
};

export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'IT_ADMIN' | 'HR_ADMIN' | 'MANAGER' | 'EMPLOYEE';

export const ALL_ROLES: UserRole[] = [
  'SUPER_ADMIN',
  'ADMIN',
  'IT_ADMIN',
  'HR_ADMIN',
  'MANAGER',
  'EMPLOYEE',
];

export const ROLE_LABELS: Record<UserRole, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Admin',
  IT_ADMIN: 'IT Admin',
  HR_ADMIN: 'HR Admin',
  MANAGER: 'Manager',
  EMPLOYEE: 'Employee',
};

export interface Permission {
  module: AppModule;
  canView: boolean;
  canEdit: boolean;
  companyIds: string[];
  departmentIds: string[];
}

export interface RolePermissionRow {
  id?: string;
  role: UserRole;
  module: AppModule;
  canView: boolean;
  canEdit: boolean;
  companyIds: string[];
  departmentIds: string[];
}

// Default permissions per role
export const DEFAULT_PERMISSIONS: Record<UserRole, Record<AppModule, { canView: boolean; canEdit: boolean }>> = {
  SUPER_ADMIN: {
    DASHBOARD: { canView: true, canEdit: true },
    COMPANIES: { canView: true, canEdit: true },
    DEPARTMENTS: { canView: true, canEdit: true },
    EMPLOYEES: { canView: true, canEdit: true },
    IT: { canView: true, canEdit: true },
    PROJECTS: { canView: true, canEdit: true },
    TASKS: { canView: true, canEdit: true },
    ATTENDANCE: { canView: true, canEdit: true },
    CALENDAR: { canView: true, canEdit: true },
    DRIVES: { canView: true, canEdit: true },
    POLICIES: { canView: true, canEdit: true },
    SETTINGS: { canView: true, canEdit: true },
  },
  ADMIN: {
    DASHBOARD: { canView: true, canEdit: true },
    COMPANIES: { canView: true, canEdit: true },
    DEPARTMENTS: { canView: true, canEdit: true },
    EMPLOYEES: { canView: true, canEdit: true },
    IT: { canView: true, canEdit: true },
    PROJECTS: { canView: true, canEdit: true },
    TASKS: { canView: true, canEdit: true },
    ATTENDANCE: { canView: true, canEdit: true },
    CALENDAR: { canView: true, canEdit: true },
    DRIVES: { canView: true, canEdit: true },
    POLICIES: { canView: true, canEdit: true },
    SETTINGS: { canView: true, canEdit: true },
  },
  IT_ADMIN: {
    DASHBOARD: { canView: true, canEdit: false },
    COMPANIES: { canView: true, canEdit: false },
    DEPARTMENTS: { canView: true, canEdit: false },
    EMPLOYEES: { canView: true, canEdit: false },
    IT: { canView: true, canEdit: true },
    PROJECTS: { canView: true, canEdit: false },
    TASKS: { canView: true, canEdit: true },
    ATTENDANCE: { canView: true, canEdit: true },
    CALENDAR: { canView: true, canEdit: true },
    DRIVES: { canView: true, canEdit: false },
    POLICIES: { canView: true, canEdit: false },
    SETTINGS: { canView: false, canEdit: false },
  },
  HR_ADMIN: {
    DASHBOARD: { canView: true, canEdit: false },
    COMPANIES: { canView: true, canEdit: true },
    DEPARTMENTS: { canView: true, canEdit: true },
    EMPLOYEES: { canView: true, canEdit: true },
    IT: { canView: true, canEdit: false },
    PROJECTS: { canView: true, canEdit: false },
    TASKS: { canView: true, canEdit: true },
    ATTENDANCE: { canView: true, canEdit: true },
    CALENDAR: { canView: true, canEdit: true },
    DRIVES: { canView: true, canEdit: false },
    POLICIES: { canView: true, canEdit: true },
    SETTINGS: { canView: false, canEdit: false },
  },
  MANAGER: {
    DASHBOARD: { canView: true, canEdit: false },
    COMPANIES: { canView: true, canEdit: false },
    DEPARTMENTS: { canView: true, canEdit: false },
    EMPLOYEES: { canView: true, canEdit: true },
    IT: { canView: true, canEdit: false },
    PROJECTS: { canView: true, canEdit: true },
    TASKS: { canView: true, canEdit: true },
    ATTENDANCE: { canView: true, canEdit: true },
    CALENDAR: { canView: true, canEdit: true },
    DRIVES: { canView: true, canEdit: false },
    POLICIES: { canView: true, canEdit: false },
    SETTINGS: { canView: false, canEdit: false },
  },
  EMPLOYEE: {
    DASHBOARD: { canView: true, canEdit: false },
    COMPANIES: { canView: true, canEdit: false },
    DEPARTMENTS: { canView: true, canEdit: false },
    EMPLOYEES: { canView: true, canEdit: false },
    IT: { canView: true, canEdit: false },
    PROJECTS: { canView: true, canEdit: false },
    TASKS: { canView: true, canEdit: false },
    ATTENDANCE: { canView: true, canEdit: true },
    CALENDAR: { canView: true, canEdit: false },
    DRIVES: { canView: true, canEdit: false },
    POLICIES: { canView: true, canEdit: false },
    SETTINGS: { canView: false, canEdit: false },
  },
};

/**
 * Get permissions for a specific role from DB, falling back to defaults.
 */
export async function getRolePermissions(role: UserRole): Promise<Permission[]> {
  const dbPerms = await prisma.rolePermission.findMany({
    where: { role },
  });

  const permMap = new Map<AppModule, Permission>();
  for (const p of dbPerms) {
    permMap.set(p.module as AppModule, {
      module: p.module as AppModule,
      canView: p.canView,
      canEdit: p.canEdit,
      companyIds: p.companyIds,
      departmentIds: p.departmentIds,
    });
  }

  // Fill missing modules with defaults
  const defaults = DEFAULT_PERMISSIONS[role];
  return APP_MODULES.map((mod) => {
    if (permMap.has(mod)) return permMap.get(mod)!;
    return {
      module: mod,
      canView: defaults[mod].canView,
      canEdit: defaults[mod].canEdit,
      companyIds: [],
      departmentIds: [],
    };
  });
}

/**
 * Check if a role can view a specific module.
 */
export async function canViewModule(role: UserRole, module: AppModule): Promise<boolean> {
  // SUPER_ADMIN always has full access
  if (role === 'SUPER_ADMIN') return true;

  const perm = await prisma.rolePermission.findUnique({
    where: { role_module: { role, module } },
  });

  if (!perm) {
    // Fall back to defaults
    return DEFAULT_PERMISSIONS[role]?.[module]?.canView ?? false;
  }
  return perm.canView;
}

/**
 * Check if a role can edit in a specific module.
 */
export async function canEditModule(role: UserRole, module: AppModule): Promise<boolean> {
  if (role === 'SUPER_ADMIN') return true;

  const perm = await prisma.rolePermission.findUnique({
    where: { role_module: { role, module } },
  });

  if (!perm) {
    return DEFAULT_PERMISSIONS[role]?.[module]?.canEdit ?? false;
  }
  return perm.canEdit;
}

/**
 * Get the module for a given URL path.
 */
export function getModuleFromPath(path: string): AppModule | null {
  // Check exact match first
  if (PATH_TO_MODULE[path]) return PATH_TO_MODULE[path];
  // Check prefix match
  for (const [prefix, mod] of Object.entries(PATH_TO_MODULE)) {
    if (path.startsWith(prefix)) return mod;
  }
  return null;
}

/**
 * Get all permissions for all roles (for the admin UI).
 */
export async function getAllRolePermissions(): Promise<RolePermissionRow[]> {
  const dbPerms = await prisma.rolePermission.findMany({
    orderBy: [{ role: 'asc' }, { module: 'asc' }],
  });

  const result: RolePermissionRow[] = [];

  for (const role of ALL_ROLES) {
    const defaults = DEFAULT_PERMISSIONS[role];
    for (const mod of APP_MODULES) {
      const existing = dbPerms.find((p) => p.role === role && p.module === mod);
      if (existing) {
        result.push({
          id: existing.id,
          role: existing.role as UserRole,
          module: existing.module as AppModule,
          canView: existing.canView,
          canEdit: existing.canEdit,
          companyIds: existing.companyIds,
          departmentIds: existing.departmentIds,
        });
      } else {
        result.push({
          role,
          module: mod,
          canView: defaults[mod].canView,
          canEdit: defaults[mod].canEdit,
          companyIds: [],
          departmentIds: [],
        });
      }
    }
  }

  return result;
}
