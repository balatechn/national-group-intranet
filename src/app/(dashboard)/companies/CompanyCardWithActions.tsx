'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Building2, Users, Briefcase, MoreVertical, Pencil, Trash2, Eye, Loader2 } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui';
import { deleteCompany } from '@/actions/companies';

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

interface CompanyCardProps {
  company: CompanyWithHierarchy;
  isParent?: boolean;
}

export function CompanyCardWithActions({ company, isParent = false }: CompanyCardProps) {
  const router = useRouter();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);

    try {
      const result = await deleteCompany(company.id);
      if (result.success) {
        setShowDeleteDialog(false);
        router.refresh();
      } else {
        setError('Failed to delete company');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Card className={`h-full transition-all hover:shadow-card-hover ${isParent ? 'border-2 border-primary/40 bg-white shadow-lg' : 'hover:border-primary/30'}`}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <Link href={`/companies/${company.id}`}>
              <div className={`flex items-center justify-center rounded-lg bg-primary-100 ${isParent ? 'h-14 w-14' : 'h-10 w-10'} hover:bg-primary-200 transition-colors cursor-pointer`}>
                <Building2 className={`text-primary ${isParent ? 'h-7 w-7' : 'h-5 w-5'}`} />
              </div>
            </Link>
            <div className="flex items-center gap-2">
              <Badge variant={company.isActive ? 'success' : 'secondary'} className="text-xs">
                {company.isActive ? 'Active' : 'Inactive'}
              </Badge>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href={`/companies/${company.id}`}>
                      <Eye className="mr-2 h-4 w-4" />
                      View Details
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href={`/companies/${company.id}?edit=true`}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-danger focus:text-danger"
                    onClick={() => setShowDeleteDialog(true)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <Link href={`/companies/${company.id}`} className="block hover:underline">
            <CardTitle className={`mt-3 leading-tight ${isParent ? 'text-lg' : 'text-sm'}`}>
              {company.name}
            </CardTitle>
          </Link>
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Company</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{company.name}</strong>? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>

          {error && (
            <div className="rounded-md bg-danger-light p-3 text-sm text-danger-dark">
              {error}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
