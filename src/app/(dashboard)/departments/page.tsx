import Link from 'next/link';
import { Search, Users, Building2, MoreHorizontal, Mail, Phone, Plus } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Badge,
  Avatar,
  AvatarFallback,
  AvatarImage,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui';
import { prisma } from '@/lib/db';
import { getInitials } from '@/lib/utils';
import { DepartmentActions } from '@/components/masters';

// Revalidate every 60 seconds
export const revalidate = 60;

async function getDepartments(params: {
  companyId?: string;
  search?: string;
}) {
  const where: any = {};
  
  if (params.companyId && params.companyId !== 'all') {
    where.companyId = params.companyId;
  }
  
  if (params.search) {
    where.OR = [
      { name: { contains: params.search, mode: 'insensitive' } },
      { code: { contains: params.search, mode: 'insensitive' } },
    ];
  }

  const departments = await prisma.department.findMany({
    where,
    include: {
      company: true,
      head: true,
      _count: {
        select: {
          users: true,
        },
      },
    },
    orderBy: { name: 'asc' },
  });

  return departments;
}

async function getCompanies() {
  return prisma.company.findMany({
    where: { isActive: true },
    select: { id: true, name: true, shortName: true },
    orderBy: { name: 'asc' },
  });
}

export default async function DepartmentsPage({
  searchParams,
}: {
  searchParams: { company?: string; search?: string };
}) {
  const [departments, companies] = await Promise.all([
    getDepartments({
      companyId: searchParams.company,
      search: searchParams.search,
    }),
    getCompanies(),
  ]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Departments</h1>
          <p className="page-description">Manage organizational departments and teams</p>
        </div>
        <DepartmentActions />
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text-secondary">Total Departments</p>
                <p className="mt-1 text-2xl font-bold">{departments.length}</p>
              </div>
              <div className="rounded-lg bg-primary-100 p-3">
                <Users className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text-secondary">Total Employees</p>
                <p className="mt-1 text-2xl font-bold">
                  {departments.reduce((sum, d) => sum + d._count.users, 0)}
                </p>
              </div>
              <div className="rounded-lg bg-success-light p-3">
                <Users className="h-6 w-6 text-success-dark" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text-secondary">Companies</p>
                <p className="mt-1 text-2xl font-bold">{companies.length}</p>
              </div>
              <div className="rounded-lg bg-secondary-100 p-3">
                <Building2 className="h-6 w-6 text-secondary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text-secondary">Avg Team Size</p>
                <p className="mt-1 text-2xl font-bold">
                  {departments.length > 0
                    ? Math.round(
                        departments.reduce((sum, d) => sum + d._count.users, 0) / departments.length
                      )
                    : 0}
                </p>
              </div>
              <div className="rounded-lg bg-info-light p-3">
                <Users className="h-6 w-6 text-info-dark" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
              <Input placeholder="Search departments..." className="pl-9" />
            </div>
            <Select defaultValue={searchParams.company || 'all'}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Company" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Companies</SelectItem>
                {companies.map((company) => (
                  <SelectItem key={company.id} value={company.id}>
                    {company.shortName || company.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Departments Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {departments.map((department) => (
          <Card key={department.id} className="card-hover">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-primary-100 p-3 text-primary">
                    <Users className="h-6 w-6" />
                  </div>
                  <div>
                    <Link
                      href={`/departments/${department.id}`}
                      className="font-semibold text-text-primary hover:text-primary"
                    >
                      {department.name}
                    </Link>
                    <p className="text-sm text-text-muted">{department.code}</p>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/departments/${department.id}`}>View Details</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`/departments/${department.id}/edit`}>Edit</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`/departments/${department.id}/members`}>View Members</Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-text-muted" />
                <span className="text-sm text-text-secondary">
                  {department.company.shortName || department.company.name}
                </span>
              </div>

              {department.head && (
                <div className="flex items-center gap-3 rounded-lg bg-surface-secondary p-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={department.head.avatar || ''} />
                    <AvatarFallback>
                      {getInitials(`${department.head.firstName} ${department.head.lastName}`)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">
                      {department.head.firstName} {department.head.lastName}
                    </p>
                    <p className="text-xs text-text-muted">Department Head</p>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between border-t pt-4">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-text-muted" />
                  <span className="text-sm font-medium">{department._count.users} members</span>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/departments/${department.id}/members`}>View Team</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {departments.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-text-muted" />
            <h3 className="mt-4 text-lg font-semibold">No departments found</h3>
            <p className="mt-2 text-text-secondary">Create your first department to get started.</p>
            <Button className="mt-4" asChild>
              <Link href="/departments/new">
                <Plus className="mr-2 h-4 w-4" />
                Add Department
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
