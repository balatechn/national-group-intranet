import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui';
import { 
  BarChart3, 
  Ticket, 
  FileText, 
  Monitor, 
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { prisma } from '@/lib/db';

// Revalidate every 2 minutes
export const revalidate = 120;

async function getITStats() {
  const [
    totalTickets,
    openTickets,
    resolvedTickets,
    totalRequests,
    pendingRequests,
    totalAssets,
    activeAssets,
    totalSoftware,
    expiringSoftware,
  ] = await Promise.all([
    prisma.iTTicket.count(),
    prisma.iTTicket.count({ where: { status: { in: ['OPEN', 'IN_PROGRESS'] } } }),
    prisma.iTTicket.count({ where: { status: 'RESOLVED' } }),
    prisma.iTRequest.count(),
    prisma.iTRequest.count({ where: { status: 'PENDING_APPROVAL' } }),
    prisma.systemAsset.count(),
    prisma.systemAsset.count({ where: { status: 'AVAILABLE' } }),
    prisma.software.count(),
    prisma.software.count({
      where: {
        expiryDate: {
          lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          gte: new Date(),
        },
      },
    }),
  ]);

  // Get tickets by category
  const ticketsByCategory = await prisma.iTTicket.groupBy({
    by: ['category'],
    _count: { id: true },
  });

  // Get tickets by priority
  const ticketsByPriority = await prisma.iTTicket.groupBy({
    by: ['priority'],
    _count: { id: true },
  });

  // Get recent tickets
  const recentTickets = await prisma.iTTicket.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: {
      creator: {
        select: { firstName: true, lastName: true },
      },
    },
  });

  return {
    totalTickets,
    openTickets,
    resolvedTickets,
    totalRequests,
    pendingRequests,
    totalAssets,
    activeAssets,
    totalSoftware,
    expiringSoftware,
    ticketsByCategory,
    ticketsByPriority,
    recentTickets,
  };
}

export default async function ITReportsPage() {
  const stats = await getITStats();

  const resolutionRate = stats.totalTickets > 0
    ? Math.round((stats.resolvedTickets / stats.totalTickets) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">IT Reports & Analytics</h1>
          <p className="page-description">Overview of IT operations and performance metrics</p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text-secondary">Total Tickets</p>
                <p className="mt-1 text-3xl font-bold">{stats.totalTickets}</p>
                <div className="mt-2 flex items-center gap-1 text-sm">
                  <span className="text-warning-dark font-medium">{stats.openTickets}</span>
                  <span className="text-text-muted">open</span>
                </div>
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
                <p className="text-sm font-medium text-text-secondary">Resolution Rate</p>
                <p className="mt-1 text-3xl font-bold">{resolutionRate}%</p>
                <div className="mt-2 flex items-center gap-1 text-sm">
                  {resolutionRate >= 80 ? (
                    <>
                      <TrendingUp className="h-4 w-4 text-success-dark" />
                      <span className="text-success-dark">Good</span>
                    </>
                  ) : (
                    <>
                      <TrendingDown className="h-4 w-4 text-danger-dark" />
                      <span className="text-danger-dark">Needs improvement</span>
                    </>
                  )}
                </div>
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
                <p className="text-sm font-medium text-text-secondary">Pending Requests</p>
                <p className="mt-1 text-3xl font-bold">{stats.pendingRequests}</p>
                <div className="mt-2 flex items-center gap-1 text-sm">
                  <span className="text-text-muted">of {stats.totalRequests} total</span>
                </div>
              </div>
              <div className="rounded-lg bg-warning-light p-3">
                <FileText className="h-6 w-6 text-warning-dark" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text-secondary">Active Assets</p>
                <p className="mt-1 text-3xl font-bold">{stats.activeAssets}</p>
                <div className="mt-2 flex items-center gap-1 text-sm">
                  <span className="text-text-muted">of {stats.totalAssets} total</span>
                </div>
              </div>
              <div className="rounded-lg bg-secondary-100 p-3">
                <Monitor className="h-6 w-6 text-secondary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Tickets by Category */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Tickets by Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.ticketsByCategory.map((item) => {
                const percentage = stats.totalTickets > 0
                  ? Math.round((item._count.id / stats.totalTickets) * 100)
                  : 0;
                return (
                  <div key={item.category}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium">{item.category}</span>
                      <span className="text-text-muted">{item._count.id} ({percentage}%)</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-gray-200">
                      <div
                        className="h-2 rounded-full bg-primary"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
              {stats.ticketsByCategory.length === 0 && (
                <p className="text-center text-text-muted py-8">No ticket data available</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tickets by Priority */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Tickets by Priority
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.ticketsByPriority.map((item) => {
                const percentage = stats.totalTickets > 0
                  ? Math.round((item._count.id / stats.totalTickets) * 100)
                  : 0;
                const colorMap: Record<string, string> = {
                  CRITICAL: 'bg-danger',
                  HIGH: 'bg-warning',
                  MEDIUM: 'bg-primary',
                  LOW: 'bg-success',
                };
                return (
                  <div key={item.priority}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium">{item.priority}</span>
                      <span className="text-text-muted">{item._count.id} ({percentage}%)</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-gray-200">
                      <div
                        className={`h-2 rounded-full ${colorMap[item.priority] || 'bg-gray-400'}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
              {stats.ticketsByPriority.length === 0 && (
                <p className="text-center text-text-muted py-8">No ticket data available</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity & Alerts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Tickets */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Tickets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recentTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="flex items-start gap-3 rounded-lg border p-3"
                >
                  <div className={`rounded-full p-1.5 ${
                    ticket.priority === 'CRITICAL' ? 'bg-danger-light' :
                    ticket.priority === 'HIGH' ? 'bg-warning-light' :
                    'bg-gray-100'
                  }`}>
                    <Ticket className={`h-4 w-4 ${
                      ticket.priority === 'CRITICAL' ? 'text-danger-dark' :
                      ticket.priority === 'HIGH' ? 'text-warning-dark' :
                      'text-gray-500'
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-text-primary truncate">
                      {ticket.subject}
                    </p>
                    <p className="text-sm text-text-muted">
                      {ticket.ticketNumber} • {ticket.creator.firstName} {ticket.creator.lastName}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    ticket.status === 'OPEN' ? 'bg-blue-100 text-blue-800' :
                    ticket.status === 'IN_PROGRESS' ? 'bg-yellow-100 text-yellow-800' :
                    ticket.status === 'RESOLVED' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {ticket.status.replace(/_/g, ' ')}
                  </span>
                </div>
              ))}
              {stats.recentTickets.length === 0 && (
                <p className="text-center text-text-muted py-8">No recent tickets</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Alerts & Warnings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Alerts & Warnings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.expiringSoftware > 0 && (
                <div className="flex items-start gap-3 rounded-lg border border-warning bg-warning-light/30 p-3">
                  <div className="rounded-full bg-warning-light p-1.5">
                    <AlertTriangle className="h-4 w-4 text-warning-dark" />
                  </div>
                  <div>
                    <p className="font-medium text-text-primary">
                      Software Licenses Expiring
                    </p>
                    <p className="text-sm text-text-secondary">
                      {stats.expiringSoftware} software license(s) expiring in the next 30 days
                    </p>
                  </div>
                </div>
              )}
              
              {stats.openTickets > 10 && (
                <div className="flex items-start gap-3 rounded-lg border border-danger bg-danger-light/30 p-3">
                  <div className="rounded-full bg-danger-light p-1.5">
                    <Ticket className="h-4 w-4 text-danger-dark" />
                  </div>
                  <div>
                    <p className="font-medium text-text-primary">
                      High Open Ticket Count
                    </p>
                    <p className="text-sm text-text-secondary">
                      {stats.openTickets} tickets are currently open. Consider reviewing the queue.
                    </p>
                  </div>
                </div>
              )}

              {stats.pendingRequests > 5 && (
                <div className="flex items-start gap-3 rounded-lg border border-info bg-info-light/30 p-3">
                  <div className="rounded-full bg-info-light p-1.5">
                    <FileText className="h-4 w-4 text-info-dark" />
                  </div>
                  <div>
                    <p className="font-medium text-text-primary">
                      Pending Approvals
                    </p>
                    <p className="text-sm text-text-secondary">
                      {stats.pendingRequests} IT request(s) awaiting approval
                    </p>
                  </div>
                </div>
              )}

              {stats.expiringSoftware === 0 && stats.openTickets <= 10 && stats.pendingRequests <= 5 && (
                <div className="flex items-start gap-3 rounded-lg border border-success bg-success-light/30 p-3">
                  <div className="rounded-full bg-success-light p-1.5">
                    <CheckCircle className="h-4 w-4 text-success-dark" />
                  </div>
                  <div>
                    <p className="font-medium text-text-primary">
                      All Systems Normal
                    </p>
                    <p className="text-sm text-text-secondary">
                      No critical alerts at this time
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
