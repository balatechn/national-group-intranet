import Link from 'next/link';
import {
  Building2,
  Users,
  CheckSquare,
  Calendar,
  Ticket,
  Monitor,
  TrendingUp,
  Clock,
  AlertTriangle,
  Bell,
  ArrowRight,
  Plus,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Badge,
} from '@/components/ui';

export const dynamic = 'force-dynamic';

// Stats data - In production, this would come from the database
const stats = [
  {
    title: 'Total Companies',
    value: '5',
    change: '+1 this month',
    trend: 'up',
    icon: Building2,
    color: 'bg-primary-100 text-primary',
  },
  {
    title: 'Active Employees',
    value: '247',
    change: '+12 this month',
    trend: 'up',
    icon: Users,
    color: 'bg-success-light text-success-dark',
  },
  {
    title: 'Open Tasks',
    value: '34',
    change: '8 due today',
    trend: 'neutral',
    icon: CheckSquare,
    color: 'bg-warning-light text-warning-dark',
  },
  {
    title: 'IT Tickets',
    value: '12',
    change: '3 critical',
    trend: 'down',
    icon: Ticket,
    color: 'bg-danger-light text-danger-dark',
  },
];

const announcements = [
  {
    id: 1,
    title: 'System Maintenance Scheduled',
    content: 'The intranet will be down for maintenance on Feb 5th, 10 PM - 2 AM IST.',
    priority: 'high',
    date: 'Jan 30, 2026',
  },
  {
    id: 2,
    title: 'New Leave Policy Update',
    content: 'Please review the updated leave policy effective from February 1st.',
    priority: 'normal',
    date: 'Jan 29, 2026',
  },
  {
    id: 3,
    title: 'Welcome New Team Members',
    content: 'Please welcome our new joiners in the IT and Finance departments.',
    priority: 'normal',
    date: 'Jan 28, 2026',
  },
];

const upcomingEvents = [
  {
    id: 1,
    title: 'Monthly Town Hall',
    date: 'Feb 1, 2026',
    time: '10:00 AM',
    type: 'company',
  },
  {
    id: 2,
    title: 'IT Security Training',
    date: 'Feb 3, 2026',
    time: '2:00 PM',
    type: 'training',
  },
  {
    id: 3,
    title: 'Project Review - Alpha',
    date: 'Feb 5, 2026',
    time: '11:00 AM',
    type: 'meeting',
  },
];

const recentTasks = [
  {
    id: 1,
    title: 'Complete Q4 Financial Report',
    assignee: 'John Doe',
    dueDate: 'Jan 31, 2026',
    status: 'IN_PROGRESS',
    priority: 'HIGH',
  },
  {
    id: 2,
    title: 'Review IT Security Policies',
    assignee: 'Jane Smith',
    dueDate: 'Feb 2, 2026',
    status: 'TODO',
    priority: 'MEDIUM',
  },
  {
    id: 3,
    title: 'Update Employee Handbook',
    assignee: 'Mike Wilson',
    dueDate: 'Feb 5, 2026',
    status: 'TODO',
    priority: 'LOW',
  },
];

const quickLinks = [
  { title: 'Submit IT Request', href: '/it/requests/new', icon: Plus },
  { title: 'Create Task', href: '/tasks/new', icon: CheckSquare },
  { title: 'View Calendar', href: '/calendar', icon: Calendar },
  { title: 'Browse Policies', href: '/policies', icon: Monitor },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-description">Welcome back! Here's what's happening today.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">
            <Bell className="mr-2 h-4 w-4" />
            Notifications
          </Button>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Quick Action
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-text-secondary">{stat.title}</p>
                    <p className="mt-1 text-3xl font-bold text-text-primary">{stat.value}</p>
                    <p className="mt-1 text-xs text-text-muted">{stat.change}</p>
                  </div>
                  <div className={`rounded-lg p-3 ${stat.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Announcements */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Announcements</CardTitle>
              <CardDescription>Latest updates from the organization</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/announcements">
                View all
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {announcements.map((announcement) => (
                <div
                  key={announcement.id}
                  className="flex gap-4 rounded-lg border border-border p-4 transition-colors hover:bg-surface-100"
                >
                  <div
                    className={`mt-1 h-2 w-2 flex-shrink-0 rounded-full ${
                      announcement.priority === 'high' ? 'bg-danger' : 'bg-primary'
                    }`}
                  />
                  <div className="flex-1">
                    <h4 className="font-medium text-text-primary">{announcement.title}</h4>
                    <p className="mt-1 text-sm text-text-secondary">{announcement.content}</p>
                    <p className="mt-2 text-xs text-text-muted">{announcement.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Events */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Upcoming Events</CardTitle>
              <CardDescription>Your schedule for the week</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/calendar">
                <Calendar className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex items-start gap-3 rounded-lg border border-border p-3"
                >
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary-100">
                    <Calendar className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-text-primary">{event.title}</h4>
                    <div className="mt-1 flex items-center gap-2 text-xs text-text-muted">
                      <span>{event.date}</span>
                      <span>•</span>
                      <span>{event.time}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Tasks & Quick Links */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Tasks */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Tasks</CardTitle>
              <CardDescription>Tasks assigned to you</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/tasks">
                View all
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between rounded-lg border border-border p-4"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`h-2 w-2 rounded-full ${
                        task.priority === 'HIGH'
                          ? 'bg-danger'
                          : task.priority === 'MEDIUM'
                          ? 'bg-warning'
                          : 'bg-gray-400'
                      }`}
                    />
                    <div>
                      <h4 className="text-sm font-medium text-text-primary">{task.title}</h4>
                      <p className="text-xs text-text-muted">
                        Assigned to: {task.assignee} • Due: {task.dueDate}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={
                      task.status === 'IN_PROGRESS'
                        ? 'warning'
                        : task.status === 'COMPLETED'
                        ? 'success'
                        : 'info'
                    }
                  >
                    {task.status.replace('_', ' ')}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Links */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Links</CardTitle>
            <CardDescription>Frequently used actions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {quickLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="flex items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-surface-100"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <span className="text-sm font-medium text-text-primary">{link.title}</span>
                    <ArrowRight className="ml-auto h-4 w-4 text-text-muted" />
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* IT Alerts Section */}
      <Card className="border-warning">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            <CardTitle>IT Alerts</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2 rounded-lg bg-warning-light px-4 py-2">
              <Clock className="h-4 w-4 text-warning-dark" />
              <span className="text-sm font-medium text-warning-dark">
                3 software licenses expiring this week
              </span>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-danger-light px-4 py-2">
              <AlertTriangle className="h-4 w-4 text-danger-dark" />
              <span className="text-sm font-medium text-danger-dark">
                2 critical tickets pending
              </span>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-primary-100 px-4 py-2">
              <Monitor className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">
                5 new IT requests awaiting approval
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
