import Link from 'next/link';
import { Plus, Search, FolderOpen, HardDrive, Users, Lock, Upload } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Badge,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui';
import { prisma } from '@/lib/db';
import { formatFileSize, formatDate } from '@/lib/utils';

export const dynamic = 'force-dynamic';

async function getSharedFolders(params: {
  department?: string;
  search?: string;
}) {
  const where: Record<string, unknown> = {};
  
  if (params.department && params.department !== 'all') {
    where.departmentId = params.department;
  }
  
  if (params.search) {
    where.name = { contains: params.search, mode: 'insensitive' };
  }

  const folders = await prisma.sharedFolder.findMany({
    where,
    include: {
      department: true,
      _count: {
        select: {
          permissions: true,
        },
      },
    },
    orderBy: { name: 'asc' },
  });

  return folders;
}

async function getDepartments() {
  return prisma.department.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  });
}

export default async function SharedDrivesPage({
  searchParams,
}: {
  searchParams: { department?: string; search?: string };
}) {
  const [folders, departments] = await Promise.all([
    getSharedFolders({
      department: searchParams.department,
      search: searchParams.search,
    }),
    getDepartments(),
  ]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Shared Drives</h1>
          <p className="page-description">Access shared folders and documents via OneDrive</p>
        </div>
        <Button asChild>
          <Link href="/drives/new">
            <Plus className="mr-2 h-4 w-4" />
            Create Folder
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text-secondary">Total Folders</p>
                <p className="mt-1 text-2xl font-bold">{folders.length}</p>
              </div>
              <div className="rounded-lg bg-primary-100 p-3">
                <FolderOpen className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text-secondary">Company Drives</p>
                <p className="mt-1 text-2xl font-bold">
                  {folders.filter((f) => !f.departmentId).length}
                </p>
              </div>
              <div className="rounded-lg bg-success-light p-3">
                <HardDrive className="h-6 w-6 text-success-dark" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text-secondary">Department Drives</p>
                <p className="mt-1 text-2xl font-bold">
                  {folders.filter((f) => f.departmentId).length}
                </p>
              </div>
              <div className="rounded-lg bg-secondary-100 p-3">
                <Users className="h-6 w-6 text-secondary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text-secondary">Shared With Me</p>
                <p className="mt-1 text-2xl font-bold">
                  {folders.filter((f) => f._count.permissions > 0).length}
                </p>
              </div>
              <div className="rounded-lg bg-info-light p-3">
                <Lock className="h-6 w-6 text-info-dark" />
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
              <Input placeholder="Search folders..." className="pl-9" />
            </div>
            <Select defaultValue={searchParams.department || 'all'}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept.id} value={dept.id}>
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Folders Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {folders.map((folder) => (
          <Card key={folder.id} className="card-hover group">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <div className="relative">
                  <div className="rounded-xl bg-primary-100 p-4 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                    <FolderOpen className="h-12 w-12" />
                  </div>
                  {folder.department && (
                    <div className="absolute -bottom-1 -right-1 rounded-full bg-secondary p-1">
                      <Users className="h-3 w-3 text-white" />
                    </div>
                  )}
                </div>
                
                <Link
                  href={folder.webUrl || `/drives/${folder.id}`}
                  className="mt-4 font-semibold text-text-primary hover:text-primary"
                  target={folder.webUrl ? '_blank' : undefined}
                >
                  {folder.name}
                </Link>
                
                <p className="mt-1 text-sm text-text-muted line-clamp-2">
                  {folder.description || 'No description'}
                </p>

                <div className="mt-3 flex flex-wrap justify-center gap-2">
                  {folder.isCompanyWide && (
                    <Badge variant="outline" className="text-xs">
                      Company-wide
                    </Badge>
                  )}
                  {folder.department && (
                    <Badge variant="secondary" className="text-xs">
                      {folder.department.name}
                    </Badge>
                  )}
                </div>

                <div className="mt-4 flex items-center gap-4 text-xs text-text-muted">
                  <div className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    <span>{folder._count.permissions} users</span>
                  </div>
                </div>

                <div className="mt-4 w-full border-t pt-4">
                  <div className="flex justify-between items-center">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={folder.webUrl || `/drives/${folder.id}`} target={folder.webUrl ? '_blank' : undefined}>
                        Open
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm">
                      <Upload className="h-3 w-3 mr-1" />
                      Upload
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {folders.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FolderOpen className="h-12 w-12 text-text-muted" />
            <h3 className="mt-4 text-lg font-semibold">No shared folders found</h3>
            <p className="mt-2 text-text-secondary">Create a shared folder to collaborate with your team.</p>
            <Button className="mt-4" asChild>
              <Link href="/drives/new">
                <Plus className="mr-2 h-4 w-4" />
                Create Folder
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
