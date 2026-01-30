import Link from 'next/link';
import { Plus, Search, Building2, Users, Briefcase, Filter } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Badge,
} from '@/components/ui';
import { getCompanies } from '@/actions/companies';

export default async function CompaniesPage() {
  const { companies } = await getCompanies({ isActive: true });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Companies</h1>
          <p className="page-description">Manage companies under National Group</p>
        </div>
        <Button asChild>
          <Link href="/companies/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Company
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
              <Input placeholder="Search companies..." className="pl-9" />
            </div>
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Companies Grid */}
      <div className="card-grid">
        {companies.map((company) => (
          <Link key={company.id} href={`/companies/${company.id}`}>
            <Card className="h-full cursor-pointer transition-all hover:border-primary hover:shadow-card-hover">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-100">
                    <Building2 className="h-6 w-6 text-primary" />
                  </div>
                  <Badge variant={company.isActive ? 'success' : 'secondary'}>
                    {company.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <CardTitle className="mt-4">{company.name}</CardTitle>
                <CardDescription>{company.code}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="flex items-center justify-center gap-1 text-text-muted">
                      <Users className="h-4 w-4" />
                    </div>
                    <p className="mt-1 text-lg font-semibold">{company._count.users}</p>
                    <p className="text-xs text-text-muted">Employees</p>
                  </div>
                  <div>
                    <div className="flex items-center justify-center gap-1 text-text-muted">
                      <Building2 className="h-4 w-4" />
                    </div>
                    <p className="mt-1 text-lg font-semibold">{company._count.departments}</p>
                    <p className="text-xs text-text-muted">Departments</p>
                  </div>
                  <div>
                    <div className="flex items-center justify-center gap-1 text-text-muted">
                      <Briefcase className="h-4 w-4" />
                    </div>
                    <p className="mt-1 text-lg font-semibold">{company._count.projects}</p>
                    <p className="text-xs text-text-muted">Projects</p>
                  </div>
                </div>
                {company.description && (
                  <p className="mt-4 line-clamp-2 text-sm text-text-secondary">
                    {company.description}
                  </p>
                )}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {companies.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="h-12 w-12 text-text-muted" />
            <h3 className="mt-4 text-lg font-semibold">No companies found</h3>
            <p className="mt-2 text-text-secondary">Get started by adding your first company.</p>
            <Button className="mt-4" asChild>
              <Link href="/companies/new">
                <Plus className="mr-2 h-4 w-4" />
                Add Company
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
