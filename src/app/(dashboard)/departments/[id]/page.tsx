import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Users, Mail, Phone, Building2, Briefcase, Edit, UserPlus, Calendar } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
} from '@/components/ui';
import { prisma } from '@/lib/db';
import { getInitials, formatDate } from '@/lib/utils';

// Revalidate every 60 seconds
export const revalidate = 60;

async function getDepartment(id: string) {
  const department = await prisma.department.findUnique({
    where: { id },
    include: {
      company: true,
      head: true,
      parent: true,
      children: {
        include: {
          _count: { select: { users: true } },
        },
      },
      users: {
        take: 6,
        orderBy: { firstName: 'asc' },
      },
      _count: {
        select: { users: true },
      },
    },
  });

  return department;
}

export default async function DepartmentDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const department = await getDepartment(params.id);

  if (!department) {
    notFound();
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="page-header">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/departments">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="page-title">{department.name}</h1>
            <p className="page-description">{department.code} • {department.company.name}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" asChild>
            <Link href={`/departments/${department.id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </Button>
          <Button asChild>
            <Link href={`/departments/${department.id}/members`}>
              <Users className="mr-2 h-4 w-4" />
              View Team
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Department Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                Department Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-text-muted">Department Name</p>
                  <p className="font-medium">{department.name}</p>
                </div>
                <div>
                  <p className="text-sm text-text-muted">Department Code</p>
                  <p className="font-medium">{department.code}</p>
                </div>
                <div>
                  <p className="text-sm text-text-muted">Company</p>
                  <p className="font-medium">{department.company.name}</p>
                </div>
                <div>
                  <p className="text-sm text-text-muted">Total Members</p>
                  <p className="font-medium">{department._count.users} employees</p>
                </div>
                {department.parent && (
                  <div>
                    <p className="text-sm text-text-muted">Parent Department</p>
                    <Link href={`/departments/${department.parent.id}`} className="font-medium text-primary hover:underline">
                      {department.parent.name}
                    </Link>
                  </div>
                )}
                <div>
                  <p className="text-sm text-text-muted">Created</p>
                  <p className="font-medium">{formatDate(department.createdAt)}</p>
                </div>
              </div>

              {department.description && (
                <div className="pt-4 border-t">
                  <p className="text-sm text-text-muted mb-2">Description</p>
                  <p className="text-text-secondary">{department.description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Team Members Preview */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Team Members
              </CardTitle>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/departments/${department.id}/members`}>
                  View All ({department._count.users})
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {department.users.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {department.users.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center gap-3 p-3 rounded-lg border hover:bg-surface-100 transition-colors"
                    >
                      <Avatar>
                        <AvatarImage src={member.avatar || ''} />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {getInitials(`${member.firstName} ${member.lastName}`)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {member.firstName} {member.lastName}
                        </p>
                        <p className="text-xs text-text-muted truncate">{member.jobTitle || member.email}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="h-10 w-10 text-text-muted mx-auto" />
                  <p className="mt-2 text-text-secondary">No members in this department</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Sub-departments */}
          {department.children.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  Sub-departments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-2">
                  {department.children.map((child) => (
                    <Link
                      key={child.id}
                      href={`/departments/${child.id}`}
                      className="flex items-center justify-between p-4 rounded-lg border hover:border-primary/30 hover:bg-surface-100 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Users className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{child.name}</p>
                          <p className="text-sm text-text-muted">{child.code}</p>
                        </div>
                      </div>
                      <Badge variant="secondary">{child._count.users} members</Badge>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Department Head */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Department Head</CardTitle>
            </CardHeader>
            <CardContent>
              {department.head ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16 ring-2 ring-primary/20">
                      <AvatarImage src={department.head.avatar || ''} />
                      <AvatarFallback className="bg-primary text-white text-xl">
                        {getInitials(`${department.head.firstName} ${department.head.lastName}`)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-lg">
                        {department.head.firstName} {department.head.lastName}
                      </p>
                      <p className="text-sm text-primary">{department.head.jobTitle || 'Department Head'}</p>
                    </div>
                  </div>
                  <div className="space-y-2 pt-4 border-t">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-text-muted" />
                      <span className="text-sm">{department.head.email}</span>
                    </div>
                    {department.head.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-text-muted" />
                        <span className="text-sm">{department.head.phone}</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <UserPlus className="h-10 w-10 text-text-muted mx-auto" />
                  <p className="mt-2 text-text-secondary">No head assigned</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-text-secondary">Total Members</span>
                <span className="font-semibold text-primary">{department._count.users}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-secondary">Sub-departments</span>
                <span className="font-semibold">{department.children.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-secondary">Company</span>
                <span className="font-semibold">{department.company.shortName}</span>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href={`/departments/${department.id}/members`}>
                  <Users className="mr-2 h-4 w-4" />
                  View All Members
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href={`/departments/${department.id}/edit`}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Department
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
