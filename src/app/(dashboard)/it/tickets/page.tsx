import Link from 'next/link';
import { Plus, Search, Ticket, Filter, Clock, AlertTriangle } from 'lucide-react';
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
import { getTickets } from '@/actions/tickets';
import { formatDateTime, getInitials, getStatusColor, getPriorityColor, calculateSLAStatus } from '@/lib/utils';

// Revalidate every 30 seconds for fresh ticket data
export const revalidate = 30;

export default async function ITTicketsPage({
  searchParams,
}: {
  searchParams: { status?: string; priority?: string; category?: string; page?: string };
}) {
  const { tickets, pagination } = await getTickets({
    status: searchParams.status,
    priority: searchParams.priority,
    category: searchParams.category,
    page: searchParams.page ? parseInt(searchParams.page) : 1,
    limit: 10,
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">IT Tickets</h1>
          <p className="page-description">Track and manage IT support tickets</p>
        </div>
        <Button asChild>
          <Link href="/it/tickets/new">
            <Plus className="mr-2 h-4 w-4" />
            Create Ticket
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text-secondary">Open Tickets</p>
                <p className="mt-1 text-2xl font-bold">
                  {tickets.filter((t) => t.status === 'OPEN').length}
                </p>
              </div>
              <div className="rounded-lg bg-primary-100 p-3">
                <Ticket className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text-secondary">In Progress</p>
                <p className="mt-1 text-2xl font-bold">
                  {tickets.filter((t) => t.status === 'IN_PROGRESS').length}
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
                <p className="text-sm font-medium text-text-secondary">Resolved</p>
                <p className="mt-1 text-2xl font-bold">
                  {tickets.filter((t) => t.status === 'RESOLVED').length}
                </p>
              </div>
              <div className="rounded-lg bg-success-light p-3">
                <Ticket className="h-6 w-6 text-success-dark" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text-secondary">Critical</p>
                <p className="mt-1 text-2xl font-bold">
                  {tickets.filter((t) => t.priority === 'CRITICAL' && t.status !== 'CLOSED').length}
                </p>
              </div>
              <div className="rounded-lg bg-danger-light p-3">
                <AlertTriangle className="h-6 w-6 text-danger-dark" />
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
              <Input placeholder="Search tickets..." className="pl-9" />
            </div>
            <Select defaultValue={searchParams.status || 'all'}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="OPEN">Open</SelectItem>
                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                <SelectItem value="WAITING_FOR_USER">Waiting</SelectItem>
                <SelectItem value="RESOLVED">Resolved</SelectItem>
                <SelectItem value="CLOSED">Closed</SelectItem>
              </SelectContent>
            </Select>
            <Select defaultValue={searchParams.priority || 'all'}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="CRITICAL">Critical</SelectItem>
                <SelectItem value="HIGH">High</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="LOW">Low</SelectItem>
              </SelectContent>
            </Select>
            <Select defaultValue={searchParams.category || 'all'}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="HARDWARE">Hardware</SelectItem>
                <SelectItem value="SOFTWARE">Software</SelectItem>
                <SelectItem value="NETWORK">Network</SelectItem>
                <SelectItem value="ACCESS">Access</SelectItem>
                <SelectItem value="EMAIL">Email</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tickets Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ticket</TableHead>
                <TableHead>Creator</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>SLA</TableHead>
                <TableHead>Assignee</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tickets.map((ticket) => {
                const slaStatus = calculateSLAStatus(ticket.slaDeadline);
                return (
                  <TableRow key={ticket.id}>
                    <TableCell>
                      <Link
                        href={`/it/tickets/${ticket.id}`}
                        className="block"
                      >
                        <span className="text-xs text-text-muted">{ticket.ticketNumber}</span>
                        <p className="font-medium text-text-primary hover:text-primary">
                          {ticket.subject}
                        </p>
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={ticket.creator.avatar || ''} />
                          <AvatarFallback>
                            {getInitials(`${ticket.creator.firstName} ${ticket.creator.lastName}`)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">
                          {ticket.creator.firstName} {ticket.creator.lastName}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{ticket.category}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getPriorityColor(ticket.priority)}>
                        {ticket.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(ticket.status)}>
                        {ticket.status.replace(/_/g, ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {ticket.slaDeadline && ticket.status !== 'CLOSED' ? (
                        <Badge
                          variant={
                            slaStatus.status === 'breached'
                              ? 'danger'
                              : slaStatus.status === 'warning'
                              ? 'warning'
                              : 'success'
                          }
                        >
                          {slaStatus.status === 'breached'
                            ? 'Breached'
                            : slaStatus.hoursRemaining
                            ? `${slaStatus.hoursRemaining}h left`
                            : 'On Track'}
                        </Badge>
                      ) : (
                        <span className="text-text-muted">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {ticket.assignee ? (
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={ticket.assignee.avatar || ''} />
                            <AvatarFallback>
                              {getInitials(`${ticket.assignee.firstName} ${ticket.assignee.lastName}`)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm">
                            {ticket.assignee.firstName} {ticket.assignee.lastName}
                          </span>
                        </div>
                      ) : (
                        <span className="text-text-muted">Unassigned</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {tickets.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Ticket className="h-12 w-12 text-text-muted" />
            <h3 className="mt-4 text-lg font-semibold">No tickets found</h3>
            <p className="mt-2 text-text-secondary">Create a ticket to get IT support.</p>
            <Button className="mt-4" asChild>
              <Link href="/it/tickets/new">
                <Plus className="mr-2 h-4 w-4" />
                Create Ticket
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
