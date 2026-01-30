import Link from 'next/link';
import { Plus, Search, FileText, Download, Eye, Calendar, Building2, Tag } from 'lucide-react';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui';
import { prisma } from '@/lib/db';
import { formatDate, getStatusColor } from '@/lib/utils';

// Revalidate every 2 minutes
export const revalidate = 120;

async function getPolicies(params: {
  category?: string;
  company?: string;
  search?: string;
}) {
  const where: any = {
    isActive: true,
  };
  
  if (params.category && params.category !== 'all') {
    where.category = params.category;
  }
  
  if (params.company && params.company !== 'all') {
    where.companyId = params.company;
  }
  
  if (params.search) {
    where.OR = [
      { title: { contains: params.search, mode: 'insensitive' } },
      { description: { contains: params.search, mode: 'insensitive' } },
    ];
  }

  const policies = await prisma.policy.findMany({
    where,
    include: {
      company: true,
    },
    orderBy: { effectiveDate: 'desc' },
  });

  return policies;
}

async function getCompanies() {
  return prisma.company.findMany({
    where: { isActive: true },
    select: { id: true, name: true, shortName: true },
    orderBy: { name: 'asc' },
  });
}

const categoryColors: Record<string, string> = {
  HR: 'bg-purple-100 text-purple-800',
  IT_SECURITY: 'bg-blue-100 text-blue-800',
  COMPLIANCE: 'bg-red-100 text-red-800',
  OPERATIONAL: 'bg-yellow-100 text-yellow-800',
  GENERAL: 'bg-gray-100 text-gray-800',
};

export default async function PoliciesPage({
  searchParams,
}: {
  searchParams: { category?: string; company?: string; search?: string };
}) {
  const [policies, companies] = await Promise.all([
    getPolicies({
      category: searchParams.category,
      company: searchParams.company,
      search: searchParams.search,
    }),
    getCompanies(),
  ]);

  // Group policies by category for the grid view
  const policiesByCategory = policies.reduce((acc, policy) => {
    const category = policy.category || 'GENERAL';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(policy);
    return acc;
  }, {} as Record<string, typeof policies>);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Policies & Documents</h1>
          <p className="page-description">Access company policies and standard operating procedures</p>
        </div>
        <Button asChild>
          <Link href="/policies/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Policy
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text-secondary">Total Policies</p>
                <p className="mt-1 text-2xl font-bold">{policies.length}</p>
              </div>
              <div className="rounded-lg bg-primary-100 p-3">
                <FileText className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text-secondary">HR Policies</p>
                <p className="mt-1 text-2xl font-bold">
                  {policies.filter((p) => p.category === 'HR' as any).length}
                </p>
              </div>
              <div className="rounded-lg bg-purple-100 p-3">
                <FileText className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text-secondary">IT Security Policies</p>
                <p className="mt-1 text-2xl font-bold">
                  {policies.filter((p) => p.category === 'IT_SECURITY' as any).length}
                </p>
              </div>
              <div className="rounded-lg bg-blue-100 p-3">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text-secondary">Categories</p>
                <p className="mt-1 text-2xl font-bold">
                  {Object.keys(policiesByCategory).length}
                </p>
              </div>
              <div className="rounded-lg bg-secondary-100 p-3">
                <Tag className="h-6 w-6 text-secondary" />
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
              <Input placeholder="Search policies..." className="pl-9" />
            </div>
            <Select defaultValue={searchParams.category || 'all'}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="HR">HR</SelectItem>
                <SelectItem value="IT_SECURITY">IT Security</SelectItem>
                <SelectItem value="COMPLIANCE">Compliance</SelectItem>
                <SelectItem value="OPERATIONAL">Operational</SelectItem>
                <SelectItem value="GENERAL">General</SelectItem>
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

      {/* Policies Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40%]">Policy</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Effective Date</TableHead>
                <TableHead>Version</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {policies.map((policy) => (
                <TableRow key={policy.id}>
                  <TableCell>
                    <div className="flex items-start gap-3">
                      <div className={`rounded-lg p-2 ${categoryColors[policy.category || 'GENERAL']}`}>
                        <FileText className="h-5 w-5" />
                      </div>
                      <div>
                        <Link
                          href={`/policies/${policy.id}`}
                          className="font-medium text-text-primary hover:text-primary"
                        >
                          {policy.title}
                        </Link>
                        {policy.description && (
                          <p className="text-sm text-text-muted line-clamp-1 mt-0.5">
                            {policy.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={categoryColors[policy.category || 'GENERAL']}>
                      {policy.category || 'General'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Building2 className="h-4 w-4 text-text-muted" />
                      <span className="text-sm">
                        {policy.company?.shortName || policy.company?.name || 'All Companies'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm text-text-secondary">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDate(policy.effectiveDate)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">v{policy.version}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/policies/${policy.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                      {policy.fileUrl && (
                        <Button variant="ghost" size="sm" asChild>
                          <a href={policy.fileUrl} target="_blank" rel="noopener noreferrer">
                            <Download className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {policies.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-text-muted" />
            <h3 className="mt-4 text-lg font-semibold">No policies found</h3>
            <p className="mt-2 text-text-secondary">Add a policy document to get started.</p>
            <Button className="mt-4" asChild>
              <Link href="/policies/new">
                <Plus className="mr-2 h-4 w-4" />
                Add Policy
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
