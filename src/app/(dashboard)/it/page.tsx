import Link from 'next/link';
import {
  Ticket,
  FileText,
  Monitor,
  Package,
  Smartphone,
  Building2,
  BarChart3,
  ArrowRight,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui';

export const dynamic = 'force-dynamic';

const itModules = [
  {
    title: 'IT Tickets',
    description: 'Submit and track IT support tickets',
    href: '/it/tickets',
    icon: Ticket,
    color: 'bg-blue-100 text-blue-600',
  },
  {
    title: 'IT Requests',
    description: 'Request new hardware, software, or access',
    href: '/it/requests',
    icon: FileText,
    color: 'bg-purple-100 text-purple-600',
  },
  {
    title: 'System Assets',
    description: 'Manage hardware inventory',
    href: '/it/masters/systems',
    icon: Monitor,
    color: 'bg-green-100 text-green-600',
  },
  {
    title: 'Software',
    description: 'Track software licenses',
    href: '/it/masters/software',
    icon: Package,
    color: 'bg-orange-100 text-orange-600',
  },
  {
    title: 'Mobile Devices',
    description: 'Manage mobile phones and tablets',
    href: '/it/masters/mobiles',
    icon: Smartphone,
    color: 'bg-pink-100 text-pink-600',
  },
  {
    title: 'Vendors',
    description: 'IT vendor management',
    href: '/it/masters/vendors',
    icon: Building2,
    color: 'bg-cyan-100 text-cyan-600',
  },
  {
    title: 'Reports',
    description: 'IT analytics and reports',
    href: '/it/reports',
    icon: BarChart3,
    color: 'bg-indigo-100 text-indigo-600',
  },
];

export default function ITPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">IT & Systems</h1>
          <p className="page-description">
            Manage IT infrastructure, support tickets, and service requests
          </p>
        </div>
      </div>

      {/* Module Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {itModules.map((module) => (
          <Link key={module.href} href={module.href}>
            <Card className="card-hover h-full">
              <CardContent className="pt-6">
                <div className={`w-fit rounded-lg p-3 ${module.color}`}>
                  <module.icon className="h-6 w-6" />
                </div>
                <h3 className="mt-4 font-semibold text-text-primary">
                  {module.title}
                </h3>
                <p className="mt-1 text-sm text-text-secondary">
                  {module.description}
                </p>
                <div className="mt-4 flex items-center text-sm font-medium text-primary">
                  <span>Open</span>
                  <ArrowRight className="ml-1 h-4 w-4" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
