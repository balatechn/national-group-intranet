import Link from 'next/link';
import { Plus, Search, Package, Key, AlertCircle, CheckCircle } from 'lucide-react';
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
import { getSoftware } from '@/actions/assets';
import { formatDate, getStatusColor } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function SoftwarePage({
  searchParams,
}: {
  searchParams: { licenseType?: string; page?: string };
}) {
  const { software, pagination } = await getSoftware({
    licenseType: searchParams.licenseType,
    page: searchParams.page ? parseInt(searchParams.page) : 1,
    limit: 10,
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Software Management</h1>
          <p className="page-description">Track software licenses and installations</p>
        </div>
        <Button asChild>
          <Link href="/it/masters/software/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Software
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text-secondary">Total Software</p>
                <p className="mt-1 text-2xl font-bold">{pagination.total}</p>
              </div>
              <div className="rounded-lg bg-primary-100 p-3">
                <Package className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text-secondary">Active Licenses</p>
                <p className="mt-1 text-2xl font-bold">
                  {software.filter((s) => s.isActive).length}
                </p>
              </div>
              <div className="rounded-lg bg-success-light p-3">
                <Key className="h-6 w-6 text-success-dark" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text-secondary">Expiring Soon</p>
                <p className="mt-1 text-2xl font-bold">
                  {software.filter((s) => {
                    if (!s.expiryDate) return false;
                    const daysUntilExpiry = Math.ceil(
                      (new Date(s.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                    );
                    return daysUntilExpiry > 0 && daysUntilExpiry <= 30;
                  }).length}
                </p>
              </div>
              <div className="rounded-lg bg-warning-light p-3">
                <AlertCircle className="h-6 w-6 text-warning-dark" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text-secondary">Expired</p>
                <p className="mt-1 text-2xl font-bold">
                  {software.filter((s) => {
                    if (!s.expiryDate) return false;
                    return new Date(s.expiryDate) < new Date();
                  }).length}
                </p>
              </div>
              <div className="rounded-lg bg-danger-light p-3">
                <AlertCircle className="h-6 w-6 text-danger-dark" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
              <Input placeholder="Search software..." className="pl-9" />
            </div>
            <Select defaultValue={searchParams.licenseType || 'all'}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="License" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="PERPETUAL">Perpetual</SelectItem>
                <SelectItem value="SUBSCRIPTION">Subscription</SelectItem>
                <SelectItem value="FREE">Free</SelectItem>
                <SelectItem value="TRIAL">Trial</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Software Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Software</TableHead>
                <TableHead>License Type</TableHead>
                <TableHead>Licenses</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Expiry</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {software.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <Link
                      href={`/it/masters/software/${item.id}`}
                      className="block"
                    >
                      <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-primary-100 p-2 text-primary">
                          <Package className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-medium text-text-primary hover:text-primary">
                            {item.name}
                          </p>
                          <p className="text-xs text-text-muted">v{item.version}</p>
                        </div>
                      </div>
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{item.licenseType.replace(/_/g, ' ')}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <p>{item.usedLicenses} / {item.totalLicenses}</p>
                      <div className="mt-1 h-2 w-24 rounded-full bg-gray-200">
                        <div
                          className={`h-2 rounded-full ${
                            item.usedLicenses / item.totalLicenses > 0.9
                              ? 'bg-danger'
                              : item.usedLicenses / item.totalLicenses > 0.7
                              ? 'bg-warning'
                              : 'bg-success'
                          }`}
                          style={{ width: `${(item.usedLicenses / item.totalLicenses) * 100}%` }}
                        />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={item.isActive ? 'bg-success' : 'bg-gray-400'}>
                      {item.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {item.vendor ? (
                      <span className="text-sm">{item.vendor.name}</span>
                    ) : (
                      <span className="text-text-muted">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {item.expiryDate ? (
                      <span
                        className={`text-sm ${
                          new Date(item.expiryDate) < new Date()
                            ? 'text-danger-dark'
                            : new Date(item.expiryDate) <
                              new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                            ? 'text-warning-dark'
                            : 'text-text-secondary'
                        }`}
                      >
                        {formatDate(item.expiryDate)}
                      </span>
                    ) : (
                      <span className="text-success-dark">Perpetual</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {software.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-text-muted" />
            <h3 className="mt-4 text-lg font-semibold">No software found</h3>
            <p className="mt-2 text-text-secondary">Add software to track your licenses.</p>
            <Button className="mt-4" asChild>
              <Link href="/it/masters/software/new">
                <Plus className="mr-2 h-4 w-4" />
                Add Software
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
