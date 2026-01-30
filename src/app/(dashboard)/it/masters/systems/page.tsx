import Link from 'next/link';
import { Plus, Search, Monitor, Server, Laptop, HardDrive, Filter } from 'lucide-react';
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
import { getAssets } from '@/actions/assets';
import { formatDate, getStatusColor } from '@/lib/utils';

export default async function SystemAssetsPage({
  searchParams,
}: {
  searchParams: { status?: string; type?: string; page?: string };
}) {
  const { assets, pagination } = await getAssets({
    status: searchParams.status,
    type: searchParams.type,
    page: searchParams.page ? parseInt(searchParams.page) : 1,
    limit: 10,
  });

  const assetTypeIcons: Record<string, React.ReactNode> = {
    DESKTOP: <Monitor className="h-5 w-5" />,
    LAPTOP: <Laptop className="h-5 w-5" />,
    SERVER: <Server className="h-5 w-5" />,
    PRINTER: <HardDrive className="h-5 w-5" />,
    NETWORK: <HardDrive className="h-5 w-5" />,
    OTHER: <HardDrive className="h-5 w-5" />,
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">System Assets</h1>
          <p className="page-description">Manage hardware inventory and assignments</p>
        </div>
        <Button asChild>
          <Link href="/it/masters/systems/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Asset
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text-secondary">Total Assets</p>
                <p className="mt-1 text-2xl font-bold">{pagination.total}</p>
              </div>
              <div className="rounded-lg bg-primary-100 p-3">
                <Monitor className="h-6 w-6 text-primary" />
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
                  {assets.filter((a) => a.status === 'ACTIVE').length}
                </p>
              </div>
              <div className="rounded-lg bg-success-light p-3">
                <Monitor className="h-6 w-6 text-success-dark" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text-secondary">In Maintenance</p>
                <p className="mt-1 text-2xl font-bold">
                  {assets.filter((a) => a.status === 'MAINTENANCE').length}
                </p>
              </div>
              <div className="rounded-lg bg-warning-light p-3">
                <Monitor className="h-6 w-6 text-warning-dark" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text-secondary">Retired</p>
                <p className="mt-1 text-2xl font-bold">
                  {assets.filter((a) => a.status === 'RETIRED').length}
                </p>
              </div>
              <div className="rounded-lg bg-gray-100 p-3">
                <Monitor className="h-6 w-6 text-gray-500" />
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
              <Input placeholder="Search assets..." className="pl-9" />
            </div>
            <Select defaultValue={searchParams.status || 'all'}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                <SelectItem value="RETIRED">Retired</SelectItem>
                <SelectItem value="DISPOSED">Disposed</SelectItem>
              </SelectContent>
            </Select>
            <Select defaultValue={searchParams.type || 'all'}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="DESKTOP">Desktop</SelectItem>
                <SelectItem value="LAPTOP">Laptop</SelectItem>
                <SelectItem value="SERVER">Server</SelectItem>
                <SelectItem value="PRINTER">Printer</SelectItem>
                <SelectItem value="NETWORK">Network</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Assets Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Asset</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Specifications</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Warranty</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assets.map((asset) => (
                <TableRow key={asset.id}>
                  <TableCell>
                    <Link
                      href={`/it/masters/systems/${asset.id}`}
                      className="block"
                    >
                      <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-primary-100 p-2 text-primary">
                          {assetTypeIcons[asset.assetType] || <Monitor className="h-5 w-5" />}
                        </div>
                        <div>
                          <p className="font-medium text-text-primary hover:text-primary">
                            {asset.name}
                          </p>
                          <p className="text-xs text-text-muted">{asset.assetTag}</p>
                        </div>
                      </div>
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{asset.assetType}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <p>{asset.brand} {asset.model}</p>
                      {asset.serialNumber && (
                        <p className="text-xs text-text-muted">S/N: {asset.serialNumber}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(asset.status)}>{asset.status}</Badge>
                  </TableCell>
                  <TableCell>
                    {asset.assignedTo ? (
                      <span className="text-sm">
                        {asset.assignedTo.firstName} {asset.assignedTo.lastName}
                      </span>
                    ) : (
                      <span className="text-text-muted">Unassigned</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {asset.warrantyExpiry ? (
                      <span
                        className={`text-sm ${
                          new Date(asset.warrantyExpiry) < new Date()
                            ? 'text-danger-dark'
                            : 'text-text-secondary'
                        }`}
                      >
                        {formatDate(asset.warrantyExpiry)}
                      </span>
                    ) : (
                      <span className="text-text-muted">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {assets.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Monitor className="h-12 w-12 text-text-muted" />
            <h3 className="mt-4 text-lg font-semibold">No assets found</h3>
            <p className="mt-2 text-text-secondary">Add a system asset to track your inventory.</p>
            <Button className="mt-4" asChild>
              <Link href="/it/masters/systems/new">
                <Plus className="mr-2 h-4 w-4" />
                Add Asset
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
