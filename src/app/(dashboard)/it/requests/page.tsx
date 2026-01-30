import Link from 'next/link';
import { Plus, Search, FileText, Filter, Clock, CheckCircle, XCircle } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Badge,
  Avatar,
  AvatarFallback,
  AvatarImage,
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
import { getITRequests } from '@/actions/it-requests';
import { formatDateTime, getInitials, getStatusColor } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function ITRequestsPage({
  searchParams,
}: {
  searchParams: { status?: string; type?: string; page?: string };
}) {
  const { requests, pagination } = await getITRequests({
    status: searchParams.status,
    type: searchParams.type,
    page: searchParams.page ? parseInt(searchParams.page) : 1,
    limit: 10,
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">IT Requests</h1>
          <p className="page-description">Manage IT service requests and approvals</p>
        </div>
        <Button asChild>
          <Link href="/it/requests/new">
            <Plus className="mr-2 h-4 w-4" />
            New Request
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text-secondary">Total Requests</p>
                <p className="mt-1 text-2xl font-bold">{pagination.total}</p>
              </div>
              <div className="rounded-lg bg-primary-100 p-3">
                <FileText className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text-secondary">Pending Approval</p>
                <p className="mt-1 text-2xl font-bold">
                  {requests.filter((r) => r.status === 'PENDING_APPROVAL').length}
                </p>
              </div>
              <div className="rounded-lg bg-warning-light p-3">
                <Clock className="h-6 w-6 text-warning-dark" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text-secondary">Approved</p>
                <p className="mt-1 text-2xl font-bold">
                  {requests.filter((r) => r.status === 'APPROVED' || r.status === 'COMPLETED').length}
                </p>
              </div>
              <div className="rounded-lg bg-success-light p-3">
                <CheckCircle className="h-6 w-6 text-success-dark" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text-secondary">Rejected</p>
                <p className="mt-1 text-2xl font-bold">
                  {requests.filter((r) => r.status === 'REJECTED').length}
                </p>
              </div>
              <div className="rounded-lg bg-danger-light p-3">
                <XCircle className="h-6 w-6 text-danger-dark" />
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
              <Input placeholder="Search requests..." className="pl-9" />
            </div>
            <Select defaultValue={searchParams.status || 'all'}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Select defaultValue={searchParams.type || 'all'}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="NEW_HARDWARE">New Hardware</SelectItem>
                <SelectItem value="NEW_SOFTWARE">New Software</SelectItem>
                <SelectItem value="ACCESS_REQUEST">Access Request</SelectItem>
                <SelectItem value="UPGRADE">Upgrade</SelectItem>
                <SelectItem value="REPLACEMENT">Replacement</SelectItem>
                <SelectItem value="NEW_EMPLOYEE">New Employee</SelectItem>
                <SelectItem value="TERMINATION">Termination</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Requests Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Request</TableHead>
                <TableHead>Requester</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Approver</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell>
                    <Link
                      href={`/it/requests/${request.id}`}
                      className="block"
                    >
                      <span className="text-xs text-text-muted">{request.requestNumber}</span>
                      <p className="font-medium text-text-primary hover:text-primary">
                        {request.subject}
                      </p>
                    </Link>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={request.requestor.avatar || ''} />
                        <AvatarFallback>
                          {getInitials(`${request.requestor.firstName} ${request.requestor.lastName}`)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">
                        {request.requestor.firstName} {request.requestor.lastName}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{request.type.replace(/_/g, ' ')}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(request.status)}>
                      {request.status.replace(/_/g, ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-text-secondary">
                      {formatDateTime(request.createdAt)}
                    </span>
                  </TableCell>
                  <TableCell>
                    {request.approvals && request.approvals.length > 0 ? (
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>
                            {getInitials(`${request.approvals[0].approver.firstName} ${request.approvals[0].approver.lastName}`)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">
                          {request.approvals[0].approver.firstName} {request.approvals[0].approver.lastName}
                        </span>
                      </div>
                    ) : (
                      <span className="text-text-muted">Pending</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {requests.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-text-muted" />
            <h3 className="mt-4 text-lg font-semibold">No requests found</h3>
            <p className="mt-2 text-text-secondary">Submit a request to get started.</p>
            <Button className="mt-4" asChild>
              <Link href="/it/requests/new">
                <Plus className="mr-2 h-4 w-4" />
                New Request
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
