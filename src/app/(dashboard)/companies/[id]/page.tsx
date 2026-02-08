import { prisma } from '@/lib/db';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  ChevronRight,
  Building2,
  Mail,
  Phone,
  Globe,
  MapPin,
  Users,
  Briefcase,
  ArrowLeft,
  Calendar,
  FileText,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, Badge } from '@/components/ui';
import { formatDate } from '@/lib/utils';
import { CompanyEditActions } from './CompanyEditActions';

export const revalidate = 60;

async function getCompany(id: string) {
  const company = await prisma.company.findUnique({
    where: { id },
    include: {
      parent: {
        select: { id: true, name: true, code: true },
      },
      subsidiaries: {
        where: { isActive: true },
        include: {
          _count: { select: { users: true, departments: true } },
        },
        orderBy: { name: 'asc' },
      },
      departments: {
        where: { isActive: true },
        include: {
          head: { select: { id: true, firstName: true, lastName: true } },
          _count: { select: { users: true } },
        },
        orderBy: { name: 'asc' },
        take: 10,
      },
      _count: {
        select: {
          users: true,
          departments: true,
          projects: true,
          systemAssets: true,
          softwareAssets: true,
          mobileDevices: true,
          subsidiaries: true,
          events: true,
          policies: true,
        },
      },
    },
  });

  return company;
}

export default async function CompanyDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const company = await getCompany(params.id);

  if (!company) {
    notFound();
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="mb-2">
        <div className="flex items-center gap-2 text-sm text-text-secondary mb-4">
          <Link href="/dashboard" className="hover:text-primary">
            Home
          </Link>
          <ChevronRight className="w-4 h-4" />
          <Link href="/companies" className="hover:text-primary">
            Companies
          </Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-text-primary">{company.name}</span>
        </div>
        <Link
          href="/companies"
          className="inline-flex items-center gap-2 text-primary hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Companies
        </Link>
      </div>

      {/* Header Card */}
      <Card>
        <div className="h-20 bg-gradient-to-r from-primary to-primary/70 rounded-t-lg" />
        <CardContent className="pt-0">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-10">
            <div className="w-20 h-20 rounded-lg bg-white border-4 border-white shadow-lg flex items-center justify-center text-primary">
              <Building2 className="h-10 w-10" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold text-text-primary">{company.name}</h1>
                <Badge variant={company.isActive ? 'success' : 'secondary'}>
                  {company.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <p className="text-text-secondary font-medium">{company.code}</p>
              {company.shortName && (
                <p className="text-sm text-text-muted">({company.shortName})</p>
              )}
            </div>
            <CompanyEditActions company={company} />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          {company.description && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  About
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-text-secondary">{company.description}</p>
              </CardContent>
            </Card>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Card>
              <CardContent className="pt-6 text-center">
                <Users className="h-6 w-6 mx-auto text-primary mb-2" />
                <p className="text-2xl font-bold">{company._count.users}</p>
                <p className="text-sm text-text-muted">Employees</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <Building2 className="h-6 w-6 mx-auto text-primary mb-2" />
                <p className="text-2xl font-bold">{company._count.departments}</p>
                <p className="text-sm text-text-muted">Departments</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <Briefcase className="h-6 w-6 mx-auto text-primary mb-2" />
                <p className="text-2xl font-bold">{company._count.projects}</p>
                <p className="text-sm text-text-muted">Projects</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <Calendar className="h-6 w-6 mx-auto text-primary mb-2" />
                <p className="text-2xl font-bold">{company._count.events}</p>
                <p className="text-sm text-text-muted">Events</p>
              </CardContent>
            </Card>
          </div>

          {/* Departments */}
          {company.departments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Departments ({company._count.departments})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {company.departments.map((dept) => (
                    <Link
                      key={dept.id}
                      href={`/departments/${dept.id}`}
                      className="flex items-center justify-between rounded-lg border p-3 hover:bg-gray-50 transition-colors"
                    >
                      <div>
                        <p className="font-medium text-text-primary">{dept.name}</p>
                        <p className="text-sm text-text-muted">{dept.code}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{dept._count.users} employees</p>
                        {dept.head && (
                          <p className="text-xs text-text-muted">
                            Head: {dept.head.firstName} {dept.head.lastName}
                          </p>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Subsidiaries */}
          {company.subsidiaries.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Subsidiaries ({company.subsidiaries.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-2">
                  {company.subsidiaries.map((sub) => (
                    <Link
                      key={sub.id}
                      href={`/companies/${sub.id}`}
                      className="flex items-center gap-3 rounded-lg border p-3 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100">
                        <Building2 className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-text-primary">{sub.name}</p>
                        <p className="text-xs text-text-muted">
                          {sub._count.users} employees • {sub._count.departments} depts
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Contact Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {company.email && (
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-text-muted" />
                  <a href={`mailto:${company.email}`} className="text-sm hover:text-primary">
                    {company.email}
                  </a>
                </div>
              )}
              {company.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-text-muted" />
                  <a href={`tel:${company.phone}`} className="text-sm hover:text-primary">
                    {company.phone}
                  </a>
                </div>
              )}
              {company.website && (
                <div className="flex items-center gap-3">
                  <Globe className="h-4 w-4 text-text-muted" />
                  <a
                    href={company.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm hover:text-primary"
                  >
                    {company.website}
                  </a>
                </div>
              )}
              {(company.city || company.state || company.country) && (
                <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 text-text-muted mt-0.5" />
                  <div className="text-sm">
                    {company.address && <p>{company.address}</p>}
                    <p>
                      {[company.city, company.state, company.postalCode]
                        .filter(Boolean)
                        .join(', ')}
                    </p>
                    {company.country && <p>{company.country}</p>}
                  </div>
                </div>
              )}
              {!company.email && !company.phone && !company.website && !company.city && (
                <p className="text-sm text-text-muted">No contact information available</p>
              )}
            </CardContent>
          </Card>

          {/* Parent Company */}
          {company.parent && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Parent Company</CardTitle>
              </CardHeader>
              <CardContent>
                <Link
                  href={`/companies/${company.parent.id}`}
                  className="flex items-center gap-3 rounded-lg border p-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-text-primary">{company.parent.name}</p>
                    <p className="text-xs text-text-muted">{company.parent.code}</p>
                  </div>
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Tax & Legal */}
          {company.taxId && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Legal Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm">
                  <p className="text-text-muted">Tax ID / GST</p>
                  <p className="font-medium">{company.taxId}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Timestamps */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Record Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-text-muted">Created</span>
                <span>{formatDate(company.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Last Updated</span>
                <span>{formatDate(company.updatedAt)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
