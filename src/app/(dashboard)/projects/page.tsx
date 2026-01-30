import Link from 'next/link';
import { Plus, Search, Briefcase, Calendar, Users, BarChart3, Clock } from 'lucide-react';
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
} from '@/components/ui';
import { prisma } from '@/lib/db';
import { formatDate, getInitials, getStatusColor } from '@/lib/utils';

async function getProjects(params: {
  status?: string;
  company?: string;
  search?: string;
}) {
  const where: any = {};
  
  if (params.status && params.status !== 'all') {
    where.status = params.status;
  }
  
  if (params.company && params.company !== 'all') {
    where.companyId = params.company;
  }
  
  if (params.search) {
    where.OR = [
      { name: { contains: params.search, mode: 'insensitive' } },
      { description: { contains: params.search, mode: 'insensitive' } },
    ];
  }

  const projects = await prisma.project.findMany({
    where,
    include: {
      company: true,
      department: true,
      manager: {
        select: {
          firstName: true,
          lastName: true,
          avatar: true,
        },
      },
      _count: {
        select: {
          members: true,
          tasks: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return projects;
}

async function getCompanies() {
  return prisma.company.findMany({
    where: { isActive: true },
    select: { id: true, name: true, shortName: true },
    orderBy: { name: 'asc' },
  });
}

const projectStatusColors: Record<string, string> = {
  PLANNING: 'bg-blue-100 text-blue-800',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
  ON_HOLD: 'bg-orange-100 text-orange-800',
  COMPLETED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: { status?: string; company?: string; search?: string };
}) {
  const [projects, companies] = await Promise.all([
    getProjects({
      status: searchParams.status,
      company: searchParams.company,
      search: searchParams.search,
    }),
    getCompanies(),
  ]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Projects</h1>
          <p className="page-description">Manage and track organizational projects</p>
        </div>
        <Button asChild>
          <Link href="/projects/new">
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text-secondary">Total Projects</p>
                <p className="mt-1 text-2xl font-bold">{projects.length}</p>
              </div>
              <div className="rounded-lg bg-primary-100 p-3">
                <Briefcase className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text-secondary">In Progress</p>
                <p className="mt-1 text-2xl font-bold">
                  {projects.filter((p) => p.status === 'IN_PROGRESS').length}
                </p>
              </div>
              <div className="rounded-lg bg-warning-light p-3">
                <Clock className="h-6 w-6 text-warning-dark" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text-secondary">Completed</p>
                <p className="mt-1 text-2xl font-bold">
                  {projects.filter((p) => p.status === 'COMPLETED').length}
                </p>
              </div>
              <div className="rounded-lg bg-success-light p-3">
                <Briefcase className="h-6 w-6 text-success-dark" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text-secondary">On Hold</p>
                <p className="mt-1 text-2xl font-bold">
                  {projects.filter((p) => p.status === 'ON_HOLD').length}
                </p>
              </div>
              <div className="rounded-lg bg-danger-light p-3">
                <Briefcase className="h-6 w-6 text-danger-dark" />
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
              <Input placeholder="Search projects..." className="pl-9" />
            </div>
            <Select defaultValue={searchParams.status || 'all'}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="PLANNING">Planning</SelectItem>
                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                <SelectItem value="ON_HOLD">On Hold</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select defaultValue={searchParams.company || 'all'}>
              <SelectTrigger className="w-[180px]">
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

      {/* Projects Grid */}
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {projects.map((project) => {
          const progress = project.progress || 0;
          const isOverdue = project.endDate && new Date(project.endDate) < new Date() && project.status !== 'COMPLETED';

          return (
            <Card key={project.id} className="card-hover">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={projectStatusColors[project.status] || 'bg-gray-100'}>
                        {project.status.replace(/_/g, ' ')}
                      </Badge>
                      {isOverdue && (
                        <Badge variant="danger">Overdue</Badge>
                      )}
                    </div>
                    <Link
                      href={`/projects/${project.id}`}
                      className="text-lg font-semibold text-text-primary hover:text-primary line-clamp-1"
                    >
                      {project.name}
                    </Link>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-text-secondary line-clamp-2">
                  {project.description || 'No description provided'}
                </p>

                {/* Progress Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-text-muted">Progress</span>
                    <span className="font-medium">{progress}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-gray-200">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        progress >= 100
                          ? 'bg-success'
                          : progress >= 70
                          ? 'bg-primary'
                          : progress >= 30
                          ? 'bg-warning'
                          : 'bg-gray-400'
                      }`}
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Project Info */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-text-muted">Company</span>
                    <p className="font-medium truncate">
                      {project.company.shortName || project.company.name}
                    </p>
                  </div>
                  <div>
                    <span className="text-text-muted">Department</span>
                    <p className="font-medium truncate">
                      {project.department?.name || '—'}
                    </p>
                  </div>
                </div>

                {/* Dates */}
                <div className="flex items-center gap-4 text-sm text-text-secondary">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>{formatDate(project.startDate)}</span>
                  </div>
                  {project.endDate && (
                    <>
                      <span>→</span>
                      <span className={isOverdue ? 'text-danger-dark font-medium' : ''}>
                        {formatDate(project.endDate)}
                      </span>
                    </>
                  )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between border-t pt-4">
                  <div className="flex items-center gap-2">
                    {project.manager && (
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={project.manager.avatar || ''} />
                        <AvatarFallback>
                          {getInitials(`${project.manager.firstName} ${project.manager.lastName}`)}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div className="text-sm">
                      <p className="font-medium">
                        {project.manager
                          ? `${project.manager.firstName} ${project.manager.lastName}`
                          : 'No Manager'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-text-muted">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>{project._count.members}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <BarChart3 className="h-4 w-4" />
                      <span>{project._count.tasks}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {projects.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Briefcase className="h-12 w-12 text-text-muted" />
            <h3 className="mt-4 text-lg font-semibold">No projects found</h3>
            <p className="mt-2 text-text-secondary">Create a project to start tracking your work.</p>
            <Button className="mt-4" asChild>
              <Link href="/projects/new">
                <Plus className="mr-2 h-4 w-4" />
                New Project
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
