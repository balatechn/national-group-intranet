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
import { getCompanyHierarchy, getCompanies } from '@/actions/companies';
import { CompanyActions } from '@/components/masters';

// Revalidate every 60 seconds
export const revalidate = 60;

// Types for hierarchy
interface CompanyWithHierarchy {
  id: string;
  name: string;
  code: string;
  description: string | null;
  isActive: boolean;
  parentId: string | null;
  subsidiaries?: CompanyWithHierarchy[];
  _count: {
    users: number;
    departments: number;
    projects: number;
    subsidiaries?: number;
  };
}

// Company card component
function CompanyCard({ 
  company, 
  isParent = false,
}: { 
  company: CompanyWithHierarchy;
  isParent?: boolean;
}) {
  return (
    <Link href={`/companies/${company.id}`} className="block">
      <Card className={`h-full transition-all hover:shadow-card-hover ${isParent ? 'border-2 border-primary/40 bg-white shadow-lg' : 'hover:border-primary/30'}`}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className={`flex items-center justify-center rounded-lg bg-primary-100 ${isParent ? 'h-14 w-14' : 'h-10 w-10'}`}>
              <Building2 className={`text-primary ${isParent ? 'h-7 w-7' : 'h-5 w-5'}`} />
            </div>
            <Badge variant={company.isActive ? 'success' : 'secondary'} className="text-xs">
              {company.isActive ? 'Active' : 'Inactive'}
            </Badge>
          </div>
          <CardTitle className={`mt-3 leading-tight ${isParent ? 'text-lg' : 'text-sm'}`}>
            {company.name}
          </CardTitle>
          <CardDescription className="font-medium text-primary">
            {company.code}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-3 gap-1 text-center">
            <div className="rounded-md bg-gray-50 p-2">
              <div className="flex items-center justify-center gap-1 text-text-muted">
                <Users className="h-3 w-3" />
              </div>
              <p className={`font-semibold ${isParent ? 'text-lg' : 'text-base'}`}>{company._count.users}</p>
              <p className="text-[10px] text-text-muted">Employees</p>
            </div>
            <div className="rounded-md bg-gray-50 p-2">
              <div className="flex items-center justify-center gap-1 text-text-muted">
                <Building2 className="h-3 w-3" />
              </div>
              <p className={`font-semibold ${isParent ? 'text-lg' : 'text-base'}`}>{company._count.departments}</p>
              <p className="text-[10px] text-text-muted">Departments</p>
            </div>
            <div className="rounded-md bg-gray-50 p-2">
              <div className="flex items-center justify-center gap-1 text-text-muted">
                <Briefcase className="h-3 w-3" />
              </div>
              <p className={`font-semibold ${isParent ? 'text-lg' : 'text-base'}`}>{company._count.projects}</p>
              <p className="text-[10px] text-text-muted">Projects</p>
            </div>
          </div>
          {company.description && (
            <p className={`mt-3 line-clamp-2 text-text-secondary ${isParent ? 'text-sm' : 'text-xs'}`}>
              {company.description}
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

// Hierarchy Tree Component
function HierarchyTree({ companies }: { companies: CompanyWithHierarchy[] }) {
  // Separate parent companies and standalone companies
  const parentCompanies = companies.filter(c => (c._count.subsidiaries || 0) > 0 || (c.subsidiaries && c.subsidiaries.length > 0));
  const standaloneCompanies = companies.filter(c => !c.parentId && (c._count.subsidiaries || 0) === 0 && (!c.subsidiaries || c.subsidiaries.length === 0));

  return (
    <div className="space-y-12">
      {/* Companies with Subsidiaries */}
      {parentCompanies.map((parent) => (
        <div key={parent.id} className="flex flex-col items-center">
          {/* Parent Company Card */}
          <div className="w-full max-w-sm">
            <CompanyCard company={parent} isParent />
          </div>

          {/* Connector Lines and Subsidiaries */}
          {parent.subsidiaries && parent.subsidiaries.length > 0 && (
            <>
              {/* Vertical line from parent */}
              <div className="h-8 w-1 bg-gray-800"></div>
              
              {/* Horizontal line spanning all subsidiaries */}
              <div 
                className="h-1 bg-gray-800" 
                style={{ 
                  width: `min(calc(${parent.subsidiaries.length * 220}px - 40px), calc(100vw - 4rem))`,
                  maxWidth: '100%'
                }}
              ></div>

              {/* Subsidiaries Grid with connectors */}
              <div className="flex flex-wrap justify-center gap-0">
                {parent.subsidiaries.map((subsidiary) => (
                  <div 
                    key={subsidiary.id} 
                    className="flex flex-col items-center px-2"
                    style={{ width: '200px' }}
                  >
                    {/* Vertical connector to each subsidiary */}
                    <div className="h-6 w-1 bg-gray-800"></div>
                    <CompanyCard company={subsidiary as CompanyWithHierarchy} />
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      ))}

      {/* Standalone Companies (no parent, no subsidiaries) */}
      {standaloneCompanies.length > 0 && (
        <div className="mt-8">
          <h3 className="mb-4 text-lg font-semibold text-text-secondary flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Other Companies
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {standaloneCompanies.map((company) => (
              <CompanyCard key={company.id} company={company} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default async function CompaniesPage() {
  // Get hierarchical data
  const hierarchyData = await getCompanyHierarchy();
  
  // Also get all companies for the complete picture
  const { companies: allCompanies } = await getCompanies({ isActive: true, limit: 100 });
  
  // Merge hierarchy data with counts - find companies that are parents
  const companiesWithHierarchy: CompanyWithHierarchy[] = hierarchyData.map(parent => ({
    ...parent,
    _count: {
      ...parent._count,
      subsidiaries: parent.subsidiaries?.length || 0,
    },
  }));

  // Find standalone companies (not in hierarchy as parent or child)
  const hierarchyIds = new Set<string>();
  hierarchyData.forEach(parent => {
    hierarchyIds.add(parent.id);
    parent.subsidiaries?.forEach(sub => hierarchyIds.add(sub.id));
  });
  
  const standaloneCompanies = allCompanies
    .filter(c => !hierarchyIds.has(c.id))
    .map(c => ({
      ...c,
      subsidiaries: [],
      _count: {
        ...c._count,
        subsidiaries: 0,
      },
    }));

  // Combine all for display
  const displayCompanies = [...companiesWithHierarchy, ...standaloneCompanies];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Companies</h1>
          <p className="page-description">Organization structure of National Group</p>
        </div>
        <CompanyActions />
      </div>

      {/* Organization Hierarchy */}
      {displayCompanies.length > 0 ? (
        <HierarchyTree companies={displayCompanies} />
      ) : (
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
