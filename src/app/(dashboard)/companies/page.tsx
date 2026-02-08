import { Building2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui';
import { getCompanyHierarchy, getCompanies } from '@/actions/companies';
import { CompanyActions } from '@/components/masters';
import { CompanyHierarchyView } from './CompanyHierarchyView';

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
        <CompanyHierarchyView companies={displayCompanies} />
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
