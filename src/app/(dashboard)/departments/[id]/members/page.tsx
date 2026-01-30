import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Users, Mail, Phone, Building2, Briefcase, UserCircle } from 'lucide-react';
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
  Input,
} from '@/components/ui';
import { prisma } from '@/lib/db';
import { getInitials } from '@/lib/utils';

// Revalidate every 60 seconds
export const revalidate = 60;

async function getDepartmentWithMembers(id: string) {
  const department = await prisma.department.findUnique({
    where: { id },
    include: {
      company: true,
      head: true,
      users: {
        include: {
          manager: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
        orderBy: [
          { role: 'asc' },
          { firstName: 'asc' },
        ],
      },
    },
  });

  return department;
}

export default async function DepartmentMembersPage({
  params,
}: {
  params: { id: string };
}) {
  const department = await getDepartmentWithMembers(params.id);

  if (!department) {
    notFound();
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'bg-purple-100 text-purple-700';
      case 'ADMIN':
        return 'bg-red-100 text-red-700';
      case 'IT_ADMIN':
        return 'bg-blue-100 text-blue-700';
      case 'HR':
        return 'bg-pink-100 text-pink-700';
      case 'MANAGER':
        return 'bg-orange-100 text-orange-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-700';
      case 'INACTIVE':
        return 'bg-gray-100 text-gray-700';
      case 'SUSPENDED':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

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
            <h1 className="page-title">{department.name} Team</h1>
            <p className="page-description">
              {department.users.length} team members • {department.company.shortName || department.company.name}
            </p>
          </div>
        </div>
      </div>

      {/* Department Info Card */}
      <Card className="border-l-4 border-l-primary">
        <CardContent className="pt-6">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="rounded-xl bg-primary/10 p-4">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">{department.name}</h2>
                <p className="text-sm text-text-muted">{department.code}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Building2 className="h-4 w-4 text-text-muted" />
                  <span className="text-sm text-text-secondary">{department.company.name}</span>
                </div>
              </div>
            </div>
            
            {department.head && (
              <div className="flex items-center gap-3 rounded-lg bg-surface-secondary p-4">
                <Avatar className="h-12 w-12 ring-2 ring-primary/20">
                  <AvatarImage src={department.head.avatar || ''} />
                  <AvatarFallback className="bg-primary text-white">
                    {getInitials(`${department.head.firstName} ${department.head.lastName}`)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">
                    {department.head.firstName} {department.head.lastName}
                  </p>
                  <p className="text-sm text-primary">Department Head</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Team Members */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Team Members ({department.users.length})
          </h2>
        </div>

        {department.users.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {department.users.map((member) => (
              <Card key={member.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-14 w-14">
                      <AvatarImage src={member.avatar || ''} />
                      <AvatarFallback className="bg-primary/10 text-primary text-lg">
                        {getInitials(`${member.firstName} ${member.lastName}`)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-semibold text-text-primary">
                            {member.firstName} {member.lastName}
                          </h3>
                          <p className="text-sm text-text-muted">{member.employeeId}</p>
                        </div>
                        <Badge className={getStatusBadgeColor(member.status)}>
                          {member.status}
                        </Badge>
                      </div>
                      
                      {member.jobTitle && (
                        <div className="flex items-center gap-1.5 mt-2">
                          <Briefcase className="h-3.5 w-3.5 text-text-muted" />
                          <span className="text-sm text-text-secondary">{member.jobTitle}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-1.5 mt-1">
                        <Mail className="h-3.5 w-3.5 text-text-muted" />
                        <span className="text-sm text-text-secondary truncate">{member.email}</span>
                      </div>
                      
                      {member.phone && (
                        <div className="flex items-center gap-1.5 mt-1">
                          <Phone className="h-3.5 w-3.5 text-text-muted" />
                          <span className="text-sm text-text-secondary">{member.phone}</span>
                        </div>
                      )}

                      <div className="flex items-center justify-between mt-3 pt-3 border-t">
                        <Badge className={getRoleBadgeColor(member.role)}>
                          {member.role.replace('_', ' ')}
                        </Badge>
                        {member.manager && (
                          <span className="text-xs text-text-muted">
                            Reports to: {member.manager.firstName} {member.manager.lastName}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="h-12 w-12 text-text-muted" />
              <h3 className="mt-4 text-lg font-semibold">No team members</h3>
              <p className="mt-2 text-text-secondary text-center">
                This department doesn't have any members assigned yet.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold text-primary">{department.users.length}</p>
            <p className="text-sm text-text-muted">Total Members</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold text-green-600">
              {department.users.filter(u => u.status === 'ACTIVE').length}
            </p>
            <p className="text-sm text-text-muted">Active</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold text-orange-600">
              {department.users.filter(u => u.role === 'MANAGER').length}
            </p>
            <p className="text-sm text-text-muted">Managers</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold text-yellow-600">
              {department.users.filter(u => u.status === 'SUSPENDED').length}
            </p>
            <p className="text-sm text-text-muted">Suspended</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
