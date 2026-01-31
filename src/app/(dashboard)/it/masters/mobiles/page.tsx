import Link from 'next/link';
import { Search, Smartphone, Tablet, AlertCircle, Plus } from 'lucide-react';
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
import { getMobileDevices } from '@/actions/assets';
import { formatDate, getStatusColor } from '@/lib/utils';
import { MobileActions } from '@/components/masters';

// Revalidate every 2 minutes
export const revalidate = 120;

export default async function MobileDevicesPage({
  searchParams,
}: {
  searchParams: { status?: string; page?: string };
}) {
  const { devices, pagination } = await getMobileDevices({
    status: searchParams.status,
    page: searchParams.page ? parseInt(searchParams.page) : 1,
    limit: 10,
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Mobile Devices</h1>
          <p className="page-description">Manage mobile phones and tablets inventory</p>
        </div>
        <MobileActions />
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text-secondary">Total Devices</p>
                <p className="mt-1 text-2xl font-bold">{pagination.total}</p>
              </div>
              <div className="rounded-lg bg-primary-100 p-3">
                <Smartphone className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text-secondary">Available</p>
                <p className="mt-1 text-2xl font-bold">
                  {devices.filter((d) => d.status === 'AVAILABLE').length}
                </p>
              </div>
              <div className="rounded-lg bg-success-light p-3">
                <Smartphone className="h-6 w-6 text-success-dark" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text-secondary">Phones</p>
                <p className="mt-1 text-2xl font-bold">
                  {devices.filter((d) => d.deviceType.toUpperCase() === 'PHONE').length}
                </p>
              </div>
              <div className="rounded-lg bg-info-light p-3">
                <Smartphone className="h-6 w-6 text-info-dark" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text-secondary">Tablets</p>
                <p className="mt-1 text-2xl font-bold">
                  {devices.filter((d) => d.deviceType === 'TABLET').length}
                </p>
              </div>
              <div className="rounded-lg bg-secondary-100 p-3">
                <Tablet className="h-6 w-6 text-secondary" />
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
              <Input placeholder="Search devices..." className="pl-9" />
            </div>
            <Select defaultValue={searchParams.status || 'all'}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="AVAILABLE">Available</SelectItem>
                <SelectItem value="ASSIGNED">Assigned</SelectItem>
                <SelectItem value="UNDER_MAINTENANCE">Under Maintenance</SelectItem>
                <SelectItem value="RETIRED">Retired</SelectItem>
                <SelectItem value="DISPOSED">Disposed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Devices Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Device</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Phone Number</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Plan Expiry</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {devices.map((device) => (
                <TableRow key={device.id}>
                  <TableCell>
                    <Link
                      href={`/it/masters/mobiles/${device.id}`}
                      className="block"
                    >
                      <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-primary-100 p-2 text-primary">
                          {device.deviceType === 'TABLET' ? (
                            <Tablet className="h-5 w-5" />
                          ) : (
                            <Smartphone className="h-5 w-5" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-text-primary hover:text-primary">
                            {device.manufacturer} {device.model}
                          </p>
                          <p className="text-xs text-text-muted">IMEI: {device.imei || 'N/A'}</p>
                        </div>
                      </div>
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{device.deviceType}</Badge>
                  </TableCell>
                  <TableCell>
                    {device.mobileNumber ? (
                      <span className="text-sm">{device.mobileNumber}</span>
                    ) : (
                      <span className="text-text-muted">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(device.status)}>{device.status}</Badge>
                  </TableCell>
                  <TableCell>
                    {device.assignedTo ? (
                      <span className="text-sm">
                        {device.assignedTo.firstName} {device.assignedTo.lastName}
                      </span>
                    ) : (
                      <span className="text-text-muted">Unassigned</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {device.warrantyExpiry ? (
                      <span
                        className={`text-sm ${
                          new Date(device.warrantyExpiry) < new Date()
                            ? 'text-danger-dark'
                            : new Date(device.warrantyExpiry) <
                              new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                            ? 'text-warning-dark'
                            : 'text-text-secondary'
                        }`}
                      >
                        {formatDate(device.warrantyExpiry)}
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

      {devices.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Smartphone className="h-12 w-12 text-text-muted" />
            <h3 className="mt-4 text-lg font-semibold">No devices found</h3>
            <p className="mt-2 text-text-secondary">Add a mobile device to track your inventory.</p>
            <Button className="mt-4" asChild>
              <Link href="/it/masters/mobiles/new">
                <Plus className="mr-2 h-4 w-4" />
                Add Device
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
