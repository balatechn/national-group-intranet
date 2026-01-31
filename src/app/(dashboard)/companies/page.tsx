import Link from 'next/link';
import { Building2, Users, Briefcase } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Badge,
} from '@/components/ui';
import { getCompanies } from '@/actions/companies';
import { CompanyActions } from '@/components/masters';

// Revalidate every 60 seconds
export const revalidate = 60;

// Company card component for consistency
function CompanyCard({ company, isParent = false }: { 
  company: {
    id: string;
    name: string;
    code: string;
    description: string | null;
    isActive: boolean;
    _count: {
      users: number;
      departments: number;
      projects: number;
    };
  };
  isParent?: boolean;
}) {
  return (
    <Link href={`/companies/${company.id}`}>
      <Card className={`h-full cursor-pointer transition-all hover:border-primary hover:shadow-card-hover ${isParent ? 'border-2 border-primary/30' : ''}`}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className={`flex items-center justify-center rounded-lg bg-primary-100 ${isParent ? 'h-14 w-14' : 'h-12 w-12'}`}>
              <Building2 className={`text-primary ${isParent ? 'h-7 w-7' : 'h-6 w-6'}`} />
            </div>
            <Badge variant={company.isActive ? 'success' : 'secondary'}>
              {company.isActive ? 'Active' : 'Inactive'}
            </Badge>
          </div>
          <CardTitle className={`mt-3 ${isParent ? 'text-lg' : 'text-base'}`}>{company.name}</CardTitle>
          <CardDescription className="font-medium">{company.code}</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-3 gap-2 text-center">
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
            <p className="mt-3 line-clamp-2 text-sm text-text-secondary">
              {company.description}
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

export default async function CompaniesPage() {
  const { companies } = await getCompanies({ isActive: true, limit: 100 });

  // Define the company codes for the hierarchy
  const parentCode = 'NGI';
  const subsidiaryOrder = ['NCI', 'NIB', 'NRE', 'RAC', 'IST'];

  // Find parent company
  const parentCompany = companies.find(c => c.code === parentCode);
  
  // Get subsidiaries in the defined order
  const subsidiaries = subsidiaryOrder
    .map(code => companies.find(c => c.code === code))
    .filter((c): c is NonNullable<typeof c> => c !== undefined);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Companies</h1>
          <p className="page-description">Manage companies under National Group</p>
        </div>
        <CompanyActions />
      </div>

      {/* Organization Hierarchy */}
      <div className="flex flex-col items-center">
        {/* Parent Company */}
        {parentCompany && (
          <div className="w-full max-w-sm">
            <CompanyCard company={parentCompany} isParent />
          </div>
        )}

        {/* Connector Line from Parent to Children */}
        {parentCompany && subsidiaries.length > 0 && (
          <div className="flex flex-col items-center">
            <div className="h-8 w-0.5 bg-gray-800"></div>
            <div className="h-0.5 w-[calc(100vw-8rem)] max-w-5xl bg-gray-800"></div>
          </div>
        )}

        {/* Subsidiary Companies */}
        {subsidiaries.length > 0 && (
          <div className="relative grid w-full grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {subsidiaries.map((company, index) => (
              <div key={company.id} className="flex flex-col items-center">
                {/* Vertical connector to each subsidiary */}
                <div className="h-6 w-0.5 bg-gray-800"></div>
                <CompanyCard company={company} />
              </div>
            ))}
          </div>
        )}
      </div>

      {companies.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="h-12 w-12 text-text-muted" />
            <h3 className="mt-4 text-lg font-semibold">No companies found</h3>
            <p className="mt-2 text-text-secondary">Get started by adding your first company.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
