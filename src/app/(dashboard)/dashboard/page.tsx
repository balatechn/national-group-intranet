import Link from 'next/link';
import {
  Building2,
  Users,
  CheckSquare,
  Calendar,
  Ticket,
  Monitor,
  FileText,
  FolderOpen,
  Clock,
  AlertTriangle,
  Bell,
  ArrowRight,
  Plus,
  ChevronRight,
  Megaphone,
  Briefcase,
  Settings,
  BookOpen,
  BarChart3,
  Globe,
  Search,
  Star,
  TrendingUp,
  Zap,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
} from '@/components/ui';

export const dynamic = 'force-dynamic';

// Quick Access Apps - SharePoint style
const quickAccessApps = [
  { title: 'IT Helpdesk', href: '/it', icon: Monitor, color: 'bg-blue-500', description: 'Tickets & Requests' },
  { title: 'Projects', href: '/projects', icon: Briefcase, color: 'bg-purple-500', description: 'Manage Projects' },
  { title: 'Tasks', href: '/tasks', icon: CheckSquare, color: 'bg-green-500', description: 'My Tasks' },
  { title: 'Calendar', href: '/calendar', icon: Calendar, color: 'bg-orange-500', description: 'Events & Meetings' },
  { title: 'Documents', href: '/drives', icon: FolderOpen, color: 'bg-yellow-500', description: 'Company Drives' },
  { title: 'Policies', href: '/policies', icon: BookOpen, color: 'bg-red-500', description: 'HR & IT Policies' },
  { title: 'Directory', href: '/departments', icon: Users, color: 'bg-teal-500', description: 'Find People' },
  { title: 'Reports', href: '/it/reports', icon: BarChart3, color: 'bg-indigo-500', description: 'Analytics' },
];

// News/Announcements
const newsItems = [
  {
    id: 1,
    title: 'System Maintenance Scheduled for February 5th',
    excerpt: 'The intranet will undergo scheduled maintenance on Feb 5th from 10 PM to 2 AM IST. Please save your work before the maintenance window.',
    category: 'IT Update',
    date: 'Jan 30, 2026',
    author: 'IT Department',
    priority: 'high',
  },
  {
    id: 2,
    title: 'New Leave Policy Effective February 1st',
    excerpt: 'We are pleased to announce updates to our leave policy including additional flexibility for remote work arrangements.',
    category: 'HR Update',
    date: 'Jan 29, 2026',
    author: 'HR Team',
    priority: 'normal',
  },
  {
    id: 3,
    title: 'Welcome Our New Team Members',
    excerpt: 'Please join us in welcoming 12 new colleagues who joined National Group this month across IT, Finance, and Operations.',
    category: 'Company News',
    date: 'Jan 28, 2026',
    author: 'Communications',
    priority: 'normal',
  },
  {
    id: 4,
    title: 'Q4 2025 Results - Record Growth Achieved',
    excerpt: 'National Group has achieved record growth in Q4 2025, exceeding targets by 15%. Thank you to all teams for your dedication.',
    category: 'Business',
    date: 'Jan 27, 2026',
    author: 'Leadership Team',
    priority: 'normal',
  },
];

// Upcoming Events
const upcomingEvents = [
  {
    id: 1,
    title: 'Monthly Town Hall Meeting',
    date: 'Feb 1',
    time: '10:00 AM',
    location: 'Main Conference Hall',
  },
  {
    id: 2,
    title: 'IT Security Awareness Training',
    date: 'Feb 3',
    time: '2:00 PM',
    location: 'Training Room 2',
  },
  {
    id: 3,
    title: 'Project Alpha Review',
    date: 'Feb 5',
    time: '11:00 AM',
    location: 'Meeting Room A',
  },
  {
    id: 4,
    title: 'Birthday Celebrations - February',
    date: 'Feb 7',
    time: '4:00 PM',
    location: 'Cafeteria',
  },
];

// Recent Documents
const recentDocuments = [
  { name: 'Q4 Financial Report.xlsx', modified: '2 hours ago', type: 'excel' },
  { name: 'IT Policy 2026.pdf', modified: 'Yesterday', type: 'pdf' },
  { name: 'Project Proposal.docx', modified: '2 days ago', type: 'word' },
  { name: 'Employee Handbook.pdf', modified: '3 days ago', type: 'pdf' },
];

// Frequent Sites
const frequentSites = [
  { name: 'IT Department', href: '/it', icon: Monitor },
  { name: 'HR Portal', href: '/policies', icon: Users },
  { name: 'Finance Team', href: '/departments', icon: Building2 },
  { name: 'Project Hub', href: '/projects', icon: Briefcase },
];

// Activity Feed
const activityFeed = [
  { user: 'Priya Sharma', action: 'created a new IT ticket', time: '5 minutes ago', icon: Ticket },
  { user: 'Rahul Kumar', action: 'completed task "Update Documentation"', time: '15 minutes ago', icon: CheckSquare },
  { user: 'Amit Patel', action: 'uploaded new policy document', time: '1 hour ago', icon: FileText },
  { user: 'Sneha Reddy', action: 'scheduled a meeting for Feb 3', time: '2 hours ago', icon: Calendar },
];

export default function DashboardPage() {
  return (
    <div className="space-y-8 -mt-4">
      {/* Hero Banner - SharePoint Style */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary via-primary-600 to-secondary p-8 text-white">
        <div className="absolute inset-0 bg-[url('/pattern.svg')] opacity-10" />
        <div className="relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="max-w-2xl">
              <h1 className="text-3xl font-bold mb-2">Welcome to National Group Intranet</h1>
              <p className="text-white/90 text-lg">
                Your central hub for company news, resources, and collaboration. Stay connected with your team.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button className="bg-white text-primary hover:bg-white/90">
                  <Search className="mr-2 h-4 w-4" />
                  Search Portal
                </Button>
                <Button variant="outline" className="border-white/30 text-white hover:bg-white/10">
                  <Plus className="mr-2 h-4 w-4" />
                  Create New
                </Button>
              </div>
            </div>
            <div className="hidden lg:block">
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl bg-white/10 backdrop-blur-sm p-4 text-center">
                  <p className="text-3xl font-bold">247</p>
                  <p className="text-sm text-white/80">Employees</p>
                </div>
                <div className="rounded-xl bg-white/10 backdrop-blur-sm p-4 text-center">
                  <p className="text-3xl font-bold">5</p>
                  <p className="text-sm text-white/80">Companies</p>
                </div>
                <div className="rounded-xl bg-white/10 backdrop-blur-sm p-4 text-center">
                  <p className="text-3xl font-bold">34</p>
                  <p className="text-sm text-white/80">Active Tasks</p>
                </div>
                <div className="rounded-xl bg-white/10 backdrop-blur-sm p-4 text-center">
                  <p className="text-3xl font-bold">12</p>
                  <p className="text-sm text-white/80">Open Tickets</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Decorative elements */}
        <div className="absolute -bottom-10 -right-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -top-10 -left-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
      </div>

      {/* Quick Access Apps - SharePoint App Launcher Style */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-text-primary flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Quick Access
          </h2>
          <Link href="#" className="text-sm text-primary hover:underline flex items-center gap-1">
            See all <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
          {quickAccessApps.map((app) => {
            const Icon = app.icon;
            return (
              <Link
                key={app.href}
                href={app.href}
                className="group flex flex-col items-center gap-3 rounded-xl border border-border bg-white p-4 transition-all hover:shadow-lg hover:border-primary/30 hover:-translate-y-1"
              >
                <div className={`${app.color} rounded-xl p-3 text-white transition-transform group-hover:scale-110`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-text-primary">{app.title}</p>
                  <p className="text-xs text-text-muted hidden sm:block">{app.description}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* News Section - SharePoint News Web Part Style */}
        <section className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-text-primary flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-primary" />
              Company News
            </h2>
            <Link href="/announcements" className="text-sm text-primary hover:underline flex items-center gap-1">
              View all news <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          
          {/* Featured News Card */}
          <div className="mb-4">
            <Link href="#" className="group block">
              <div className="relative overflow-hidden rounded-xl border border-border bg-gradient-to-br from-primary/5 to-secondary/5">
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="destructive" className="text-xs">Important</Badge>
                    <span className="text-xs text-text-muted">{newsItems[0].category}</span>
                  </div>
                  <h3 className="text-xl font-semibold text-text-primary group-hover:text-primary transition-colors mb-2">
                    {newsItems[0].title}
                  </h3>
                  <p className="text-text-secondary line-clamp-2 mb-4">{newsItems[0].excerpt}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-text-muted">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Users className="h-4 w-4 text-primary" />
                      </div>
                      <span>{newsItems[0].author}</span>
                      <span>•</span>
                      <span>{newsItems[0].date}</span>
                    </div>
                    <ArrowRight className="h-5 w-5 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              </div>
            </Link>
          </div>

          {/* News Grid */}
          <div className="grid gap-4 sm:grid-cols-3">
            {newsItems.slice(1).map((news) => (
              <Link key={news.id} href="#" className="group block">
                <Card className="h-full transition-all hover:shadow-md hover:border-primary/30">
                  <CardContent className="p-4">
                    <span className="text-xs font-medium text-primary">{news.category}</span>
                    <h4 className="mt-2 font-medium text-text-primary line-clamp-2 group-hover:text-primary transition-colors">
                      {news.title}
                    </h4>
                    <p className="mt-2 text-sm text-text-secondary line-clamp-2">{news.excerpt}</p>
                    <p className="mt-3 text-xs text-text-muted">{news.date}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        {/* Sidebar */}
        <aside className="space-y-6">
          {/* Upcoming Events */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  Upcoming Events
                </CardTitle>
                <Link href="/calendar" className="text-xs text-primary hover:underline">
                  View all
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {upcomingEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex gap-3 p-3 rounded-lg hover:bg-surface-100 transition-colors cursor-pointer"
                >
                  <div className="flex-shrink-0 w-12 text-center">
                    <div className="bg-primary/10 rounded-lg py-1.5">
                      <p className="text-xs text-primary font-medium">{event.date.split(' ')[0]}</p>
                      <p className="text-lg font-bold text-primary">{event.date.split(' ')[1]}</p>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-text-primary truncate">{event.title}</p>
                    <p className="text-xs text-text-muted">{event.time}</p>
                    <p className="text-xs text-text-muted truncate">{event.location}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Recent Documents */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Recent Documents
                </CardTitle>
                <Link href="/drives" className="text-xs text-primary hover:underline">
                  View all
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {recentDocuments.map((doc, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-surface-100 transition-colors cursor-pointer"
                >
                  <div className={`p-2 rounded-lg ${
                    doc.type === 'excel' ? 'bg-green-100 text-green-600' :
                    doc.type === 'pdf' ? 'bg-red-100 text-red-600' :
                    'bg-blue-100 text-blue-600'
                  }`}>
                    <FileText className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">{doc.name}</p>
                    <p className="text-xs text-text-muted">{doc.modified}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Frequent Sites */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Star className="h-5 w-5 text-primary" />
                Frequent Sites
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                {frequentSites.map((site) => {
                  const Icon = site.icon;
                  return (
                    <Link
                      key={site.href}
                      href={site.href}
                      className="flex items-center gap-2 p-3 rounded-lg border border-border hover:bg-surface-100 hover:border-primary/30 transition-all"
                    >
                      <Icon className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium text-text-primary truncate">{site.name}</span>
                    </Link>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>

      {/* Activity & Alerts Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Activity Feed */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Recent Activity
              </CardTitle>
              <Button variant="ghost" size="sm">View all</Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activityFeed.map((activity, index) => {
                const Icon = activity.icon;
                return (
                  <div key={index} className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-text-primary">
                        <span className="font-medium">{activity.user}</span>{' '}
                        {activity.action}
                      </p>
                      <p className="text-xs text-text-muted">{activity.time}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* IT Alerts & Quick Actions */}
        <div className="space-y-6">
          {/* IT Alerts */}
          <Card className="border-l-4 border-l-warning">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <AlertTriangle className="h-5 w-5 text-warning" />
                IT Alerts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-warning-light">
                <Clock className="h-5 w-5 text-warning-dark flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-warning-dark">3 Software Licenses Expiring</p>
                  <p className="text-xs text-warning-dark/70">Review and renew before deadline</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-danger-light">
                <Ticket className="h-5 w-5 text-danger-dark flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-danger-dark">2 Critical Tickets Pending</p>
                  <p className="text-xs text-danger-dark/70">Immediate attention required</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-primary-100">
                <Bell className="h-5 w-5 text-primary flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-primary">5 Requests Awaiting Approval</p>
                  <p className="text-xs text-primary/70">Review pending IT requests</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Zap className="h-5 w-5 text-primary" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" className="justify-start h-auto py-3" asChild>
                  <Link href="/it/tickets/new">
                    <Ticket className="h-4 w-4 mr-2 text-primary" />
                    <span className="text-sm">New Ticket</span>
                  </Link>
                </Button>
                <Button variant="outline" className="justify-start h-auto py-3" asChild>
                  <Link href="/it/requests/new">
                    <Plus className="h-4 w-4 mr-2 text-primary" />
                    <span className="text-sm">IT Request</span>
                  </Link>
                </Button>
                <Button variant="outline" className="justify-start h-auto py-3" asChild>
                  <Link href="/tasks">
                    <CheckSquare className="h-4 w-4 mr-2 text-primary" />
                    <span className="text-sm">My Tasks</span>
                  </Link>
                </Button>
                <Button variant="outline" className="justify-start h-auto py-3" asChild>
                  <Link href="/calendar">
                    <Calendar className="h-4 w-4 mr-2 text-primary" />
                    <span className="text-sm">Calendar</span>
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer Links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-border">
        <Link href="/about" className="flex items-center gap-2 p-4 rounded-lg hover:bg-surface-100 transition-colors">
          <Globe className="h-5 w-5 text-primary" />
          <span className="text-sm font-medium">About Us</span>
        </Link>
        <Link href="/departments" className="flex items-center gap-2 p-4 rounded-lg hover:bg-surface-100 transition-colors">
          <Building2 className="h-5 w-5 text-primary" />
          <span className="text-sm font-medium">Our Companies</span>
        </Link>
        <Link href="/policies" className="flex items-center gap-2 p-4 rounded-lg hover:bg-surface-100 transition-colors">
          <BookOpen className="h-5 w-5 text-primary" />
          <span className="text-sm font-medium">Policies</span>
        </Link>
        <Link href="/it" className="flex items-center gap-2 p-4 rounded-lg hover:bg-surface-100 transition-colors">
          <Settings className="h-5 w-5 text-primary" />
          <span className="text-sm font-medium">IT Support</span>
        </Link>
      </div>
    </div>
  );
}
