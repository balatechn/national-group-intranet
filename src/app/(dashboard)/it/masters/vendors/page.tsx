import Link from 'next/link';
import { Search, Building2, Phone, Mail, Globe, MapPin, Star } from 'lucide-react';
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
import { getVendors } from '@/actions/assets';
import { formatDate, getStatusColor } from '@/lib/utils';
import { VendorActions } from '@/components/masters';

// Revalidate every 2 minutes
export const revalidate = 120;

export default async function VendorsPage({
  searchParams,
}: {
  searchParams: { type?: string; page?: string };
}) {
  const { vendors, pagination } = await getVendors({
    type: searchParams.type,
    page: searchParams.page ? parseInt(searchParams.page) : 1,
    limit: 10,
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Vendors</h1>
          <p className="page-description">Manage IT vendors and service providers</p>
        </div>
        <VendorActions />
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text-secondary">Total Vendors</p>
                <p className="mt-1 text-2xl font-bold">{pagination.total}</p>
              </div>
              <div className="rounded-lg bg-primary-100 p-3">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text-secondary">Active</p>
                <p className="mt-1 text-2xl font-bold">
                  {vendors.filter((v) => v.isActive).length}
                </p>
              </div>
              <div className="rounded-lg bg-success-light p-3">
                <Building2 className="h-6 w-6 text-success-dark" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text-secondary">With Assets</p>
                <p className="mt-1 text-2xl font-bold">
                  {vendors.filter((v) => v._count.systemAssets > 0).length}
                </p>
              </div>
              <div className="rounded-lg bg-warning-light p-3">
                <Star className="h-6 w-6 text-warning-dark" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text-secondary">Inactive</p>
                <p className="mt-1 text-2xl font-bold">
                  {vendors.filter((v) => !v.isActive).length}
                </p>
              </div>
              <div className="rounded-lg bg-gray-100 p-3">
                <Building2 className="h-6 w-6 text-gray-500" />
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
              <Input placeholder="Search vendors..." className="pl-9" />
            </div>
            <Select defaultValue={searchParams.type || 'all'}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Hardware">Hardware</SelectItem>
                <SelectItem value="Software">Software</SelectItem>
                <SelectItem value="Services">Services</SelectItem>
                <SelectItem value="Cloud">Cloud</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Vendors Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vendor</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Contract Expiry</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vendors.map((vendor) => (
                <TableRow key={vendor.id}>
                  <TableCell>
                    <Link
                      href={`/it/masters/vendors/${vendor.id}`}
                      className="block"
                    >
                      <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-primary-100 p-2 text-primary">
                          <Building2 className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-text-primary hover:text-primary">
                              {vendor.name}
                            </p>
                          </div>
                          {vendor.website && (
                            <p className="text-xs text-text-muted">{vendor.website}</p>
                          )}
                        </div>
                      </div>
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{vendor.type || 'N/A'}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1 text-sm">
                      {vendor.contactPerson && (
                        <p className="text-text-primary">{vendor.contactPerson}</p>
                      )}
                      {vendor.email && (
                        <div className="flex items-center gap-1 text-text-muted">
                          <Mail className="h-3 w-3" />
                          <span>{vendor.email}</span>
                        </div>
                      )}
                      {vendor.phone && (
                        <div className="flex items-center gap-1 text-text-muted">
                          <Phone className="h-3 w-3" />
                          <span>{vendor.phone}</span>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={vendor.isActive ? 'bg-success' : 'bg-gray-400'}>
                      {vendor.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {vendor.contractEnd ? (
                      <span
                        className={`text-sm ${
                          new Date(vendor.contractEnd) < new Date()
                            ? 'text-danger-dark'
                            : new Date(vendor.contractEnd) <
                              new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                            ? 'text-warning-dark'
                            : 'text-text-secondary'
                        }`}
                      >
                        {formatDate(vendor.contractEnd)}
                      </span>
                    ) : (
                      <span className="text-text-muted">No contract</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {vendors.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="h-12 w-12 text-text-muted" />
            <h3 className="mt-4 text-lg font-semibold">No vendors found</h3>
            <p className="mt-2 text-text-secondary">Add a vendor to manage your IT suppliers.</p>
            <Button className="mt-4" asChild>
              <Link href="/it/masters/vendors/new">
                <Plus className="mr-2 h-4 w-4" />
                Add Vendor
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
