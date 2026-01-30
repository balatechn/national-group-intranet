import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  ChevronRight,
  User,
  Mail,
  Phone,
  Building2,
  Briefcase,
  Calendar,
  UserCircle,
  Users,
  ChevronDown,
  MapPin,
  Shield,
  Clock,
  ArrowLeft,
} from 'lucide-react';

export const revalidate = 60;

async function getEmployee(id: string) {
  const employee = await prisma.user.findUnique({
    where: { id },
    include: {
      company: true,
      department: {
        include: {
          head: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              jobTitle: true,
            },
          },
        },
      },
      manager: {
        include: {
          company: true,
          department: true,
          manager: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              jobTitle: true,
            },
          },
        },
      },
      subordinates: {
        include: {
          company: true,
          department: true,
          _count: {
            select: { subordinates: true },
          },
        },
        orderBy: { firstName: 'asc' },
      },
      assignedSystems: {
        take: 5,
        orderBy: { createdAt: 'desc' },
      },
      assignedTasks: {
        where: {
          status: { in: ['TODO', 'IN_PROGRESS'] },
        },
        take: 5,
        orderBy: { dueDate: 'asc' },
      },
    },
  });

  return employee;
}

async function getReportingChain(managerId: string | null, chain: any[] = []): Promise<any[]> {
  if (!managerId) return chain;
  
  const manager = await prisma.user.findUnique({
    where: { id: managerId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      jobTitle: true,
      managerId: true,
      company: {
        select: {
          name: true,
          shortName: true,
        },
      },
    },
  });

  if (!manager) return chain;
  
  chain.unshift(manager);
  
  if (manager.managerId) {
    return getReportingChain(manager.managerId, chain);
  }
  
  return chain;
}

export default async function EmployeeDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const employee = await getEmployee(params.id);

  if (!employee) {
    notFound();
  }

  const reportingChain = await getReportingChain(employee.managerId);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'INACTIVE':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'SUSPENDED':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'ADMIN':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'IT_ADMIN':
        return 'bg-cyan-100 text-cyan-700 border-cyan-200';
      case 'HR_ADMIN':
        return 'bg-pink-100 text-pink-700 border-pink-200';
      case 'MANAGER':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const formatRole = (role: string) => {
    return role.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Breadcrumb */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm text-text-secondary mb-4">
          <Link href="/dashboard" className="hover:text-primary">
            Home
          </Link>
          <ChevronRight className="w-4 h-4" />
          <Link href="/employees" className="hover:text-primary">
            Employee Master
          </Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-text-primary">
            {employee.displayName || `${employee.firstName} ${employee.lastName}`}
          </span>
        </div>
        <Link
          href="/employees"
          className="inline-flex items-center gap-2 text-primary hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Employee Master
        </Link>
      </div>

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Employee Profile Card */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-surface-200 overflow-hidden">
            {/* Header Banner */}
            <div className="h-24 bg-gradient-to-r from-primary to-primary/70" />
            
            {/* Profile Info */}
            <div className="px-6 pb-6">
              <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-12">
                <div className="w-24 h-24 rounded-full bg-white border-4 border-white shadow-lg flex items-center justify-center text-primary text-3xl font-bold">
                  {employee.firstName[0]}{employee.lastName[0]}
                </div>
                <div className="flex-1">
                  <h1 className="text-2xl font-bold text-text-primary">
                    {employee.displayName || `${employee.firstName} ${employee.lastName}`}
                  </h1>
                  <p className="text-text-secondary">
                    {employee.jobTitle || 'No Job Title'}
                  </p>
                  <p className="text-sm text-text-secondary mt-1">
                    Employee ID: {employee.employeeId}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(employee.status)}`}>
                    {employee.status}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getRoleColor(employee.role)}`}>
                    {formatRole(employee.role)}
                  </span>
                </div>
              </div>

              {/* Details Grid */}
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 bg-surface-50 rounded-lg">
                  <Mail className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-xs text-text-secondary">Email</p>
                    <a href={`mailto:${employee.email}`} className="text-sm text-primary hover:underline">
                      {employee.email}
                    </a>
                  </div>
                </div>

                {employee.phone && (
                  <div className="flex items-center gap-3 p-3 bg-surface-50 rounded-lg">
                    <Phone className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-xs text-text-secondary">Phone</p>
                      <a href={`tel:${employee.phone}`} className="text-sm text-text-primary hover:text-primary">
                        {employee.phone}
                      </a>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3 p-3 bg-surface-50 rounded-lg">
                  <Building2 className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-xs text-text-secondary">Company</p>
                    <Link href={`/companies/${employee.company?.id}`} className="text-sm text-primary hover:underline">
                      {employee.company?.shortName || employee.company?.name || 'Not Assigned'}
                    </Link>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-surface-50 rounded-lg">
                  <Briefcase className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-xs text-text-secondary">Department</p>
                    <Link href={`/departments/${employee.department?.id}`} className="text-sm text-primary hover:underline">
                      {employee.department?.name || 'Not Assigned'}
                    </Link>
                  </div>
                </div>

                {employee.lastLoginAt && (
                  <div className="flex items-center gap-3 p-3 bg-surface-50 rounded-lg">
                    <Clock className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-xs text-text-secondary">Last Login</p>
                      <p className="text-sm text-text-primary">
                        {new Date(employee.lastLoginAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3 p-3 bg-surface-50 rounded-lg">
                  <Calendar className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-xs text-text-secondary">Joined</p>
                    <p className="text-sm text-text-primary">
                      {new Date(employee.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Direct Reports */}
          {employee.subordinates.length > 0 && (
            <div className="bg-white rounded-xl border border-surface-200 mt-6">
              <div className="p-4 border-b border-surface-200">
                <h2 className="font-semibold text-text-primary flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  Direct Reports ({employee.subordinates.length})
                </h2>
              </div>
              <div className="divide-y divide-surface-100">
                {employee.subordinates.map((sub: any) => (
                  <Link
                    key={sub.id}
                    href={`/employees/${sub.id}`}
                    className="flex items-center gap-4 p-4 hover:bg-surface-50 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                      {sub.firstName[0]}{sub.lastName[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-text-primary">
                        {sub.displayName || `${sub.firstName} ${sub.lastName}`}
                      </p>
                      <p className="text-sm text-text-secondary truncate">
                        {sub.jobTitle || 'No Title'} • {sub.department?.name || 'No Department'}
                      </p>
                    </div>
                    {sub._count?.subordinates > 0 && (
                      <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                        {sub._count.subordinates} reports
                      </span>
                    )}
                    <ChevronRight className="w-5 h-5 text-text-secondary" />
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Reporting Chain */}
          <div className="bg-white rounded-xl border border-surface-200">
            <div className="p-4 border-b border-surface-200">
              <h2 className="font-semibold text-text-primary flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                Reporting Chain
              </h2>
            </div>
            <div className="p-4">
              {reportingChain.length > 0 ? (
                <div className="space-y-0">
                  {reportingChain.map((manager, index) => (
                    <div key={manager.id} className="relative">
                      {index > 0 && (
                        <div className="absolute left-5 -top-4 w-0.5 h-4 bg-surface-300" />
                      )}
                      <Link
                        href={`/employees/${manager.id}`}
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-surface-50 transition-colors"
                      >
                        <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-semibold text-sm z-10">
                          {manager.firstName[0]}{manager.lastName[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-text-primary text-sm">
                            {manager.firstName} {manager.lastName}
                          </p>
                          <p className="text-xs text-text-secondary truncate">
                            {manager.jobTitle || 'No Title'}
                          </p>
                        </div>
                      </Link>
                      {index < reportingChain.length - 1 && (
                        <div className="absolute left-5 -bottom-0 w-0.5 h-4 bg-surface-300" />
                      )}
                    </div>
                  ))}
                  
                  {/* Line connecting to current user */}
                  <div className="relative">
                    <div className="absolute left-5 -top-4 w-0.5 h-4 bg-surface-300" />
                    <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-lg border-2 border-primary">
                      <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-semibold text-sm z-10">
                        {employee.firstName[0]}{employee.lastName[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-primary text-sm">
                          {employee.displayName || `${employee.firstName} ${employee.lastName}`}
                        </p>
                        <p className="text-xs text-text-secondary truncate">
                          {employee.jobTitle || 'No Title'} (Current)
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-lg border-2 border-primary">
                    <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-semibold text-sm">
                      {employee.firstName[0]}{employee.lastName[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-primary text-sm">
                        {employee.displayName || `${employee.firstName} ${employee.lastName}`}
                      </p>
                      <p className="text-xs text-text-secondary truncate">
                        {employee.jobTitle || 'No Title'} (Top Level)
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Manager Card */}
          {employee.manager && (
            <div className="bg-white rounded-xl border border-surface-200">
              <div className="p-4 border-b border-surface-200">
                <h2 className="font-semibold text-text-primary flex items-center gap-2">
                  <User className="w-5 h-5 text-primary" />
                  Reports To
                </h2>
              </div>
              <div className="p-4">
                <Link
                  href={`/employees/${employee.manager.id}`}
                  className="flex items-center gap-4 p-3 rounded-lg hover:bg-surface-50 transition-colors border border-surface-200"
                >
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                    {employee.manager.firstName[0]}{employee.manager.lastName[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-text-primary">
                      {employee.manager.displayName || `${employee.manager.firstName} ${employee.manager.lastName}`}
                    </p>
                    <p className="text-sm text-text-secondary truncate">
                      {employee.manager.jobTitle || 'No Title'}
                    </p>
                    <p className="text-xs text-text-secondary">
                      {employee.manager.company?.shortName || employee.manager.company?.name}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-text-secondary" />
                </Link>
              </div>
            </div>
          )}

          {/* Quick Stats */}
          <div className="bg-white rounded-xl border border-surface-200 p-4">
            <h2 className="font-semibold text-text-primary mb-4">Quick Stats</h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center p-3 bg-surface-50 rounded-lg">
                <p className="text-2xl font-bold text-primary">
                  {employee.subordinates.length}
                </p>
                <p className="text-xs text-text-secondary">Direct Reports</p>
              </div>
              <div className="text-center p-3 bg-surface-50 rounded-lg">
                <p className="text-2xl font-bold text-primary">
                  {employee.assignedTasks?.length || 0}
                </p>
                <p className="text-xs text-text-secondary">Active Tasks</p>
              </div>
              <div className="text-center p-3 bg-surface-50 rounded-lg">
                <p className="text-2xl font-bold text-primary">
                  {employee.assignedSystems?.length || 0}
                </p>
                <p className="text-xs text-text-secondary">Systems</p>
              </div>
              <div className="text-center p-3 bg-surface-50 rounded-lg">
                <p className="text-2xl font-bold text-primary">
                  {reportingChain.length}
                </p>
                <p className="text-xs text-text-secondary">Levels Above</p>
              </div>
            </div>
          </div>

          {/* Department Info */}
          {employee.department && (
            <div className="bg-white rounded-xl border border-surface-200">
              <div className="p-4 border-b border-surface-200">
                <h2 className="font-semibold text-text-primary flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-primary" />
                  Department
                </h2>
              </div>
              <div className="p-4">
                <Link
                  href={`/departments/${employee.department.id}`}
                  className="block p-3 rounded-lg hover:bg-surface-50 transition-colors border border-surface-200"
                >
                  <p className="font-medium text-text-primary">
                    {employee.department.name}
                  </p>
                  <p className="text-sm text-text-secondary">
                    Code: {employee.department.code}
                  </p>
                  {employee.department.head && (
                    <p className="text-sm text-text-secondary mt-2">
                      Head: {employee.department.head.firstName} {employee.department.head.lastName}
                    </p>
                  )}
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
