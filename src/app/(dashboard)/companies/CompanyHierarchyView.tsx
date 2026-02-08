'use client';

import { useState, useMemo } from 'react';
import { Search, Building2 } from 'lucide-react';
import { Card, CardContent, Input } from '@/components/ui';
import { CompanyCardWithActions } from './CompanyCardWithActions';

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

interface CompanyHierarchyViewProps {
  companies: CompanyWithHierarchy[];
}

export function CompanyHierarchyView({ companies }: CompanyHierarchyViewProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter companies based on search
  const filteredCompanies = useMemo(() => {
    if (!searchQuery.trim()) return companies;

    const query = searchQuery.toLowerCase();
    
    return companies
      .map((company) => {
        // Check if parent matches
        const parentMatches =
          company.name.toLowerCase().includes(query) ||
          company.code.toLowerCase().includes(query) ||
          (company.description?.toLowerCase().includes(query) ?? false);

        // Check if any subsidiary matches
        const matchingSubsidiaries = company.subsidiaries?.filter(
          (sub) =>
            sub.name.toLowerCase().includes(query) ||
            sub.code.toLowerCase().includes(query) ||
            (sub.description?.toLowerCase().includes(query) ?? false)
        );

        // If parent matches, show all its subsidiaries
        if (parentMatches) {
          return company;
        }

        // If only some subsidiaries match, return parent with only matching subsidiaries
        if (matchingSubsidiaries && matchingSubsidiaries.length > 0) {
          return {
            ...company,
            subsidiaries: matchingSubsidiaries,
          };
        }

        return null;
      })
      .filter((c): c is CompanyWithHierarchy => c !== null);
  }, [companies, searchQuery]);

  // Separate parent companies and standalone companies
  const parentCompanies = filteredCompanies.filter(
    (c) => (c._count.subsidiaries || 0) > 0 || (c.subsidiaries && c.subsidiaries.length > 0)
  );
  const standaloneCompanies = filteredCompanies.filter(
    (c) =>
      !c.parentId &&
      (c._count.subsidiaries || 0) === 0 &&
      (!c.subsidiaries || c.subsidiaries.length === 0)
  );

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
            <Input
              type="text"
              placeholder="Search companies by name or code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          {searchQuery && (
            <p className="mt-2 text-sm text-text-muted">
              Showing {filteredCompanies.length} of {companies.length} companies
            </p>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {filteredCompanies.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Search className="h-12 w-12 text-text-muted" />
            <h3 className="mt-4 text-lg font-semibold">No companies found</h3>
            <p className="mt-2 text-text-secondary">
              Try adjusting your search query
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-12">
          {/* Companies with Subsidiaries */}
          {parentCompanies.map((parent) => (
            <div key={parent.id} className="flex flex-col items-center">
              {/* Parent Company Card */}
              <div className="w-full max-w-sm">
                <CompanyCardWithActions company={parent} isParent />
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
                      maxWidth: '100%',
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
                        <CompanyCardWithActions company={subsidiary as CompanyWithHierarchy} />
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
                  <CompanyCardWithActions key={company.id} company={company} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
