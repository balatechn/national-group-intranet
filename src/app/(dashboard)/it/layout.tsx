import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Ticket, 
  FileText, 
  Monitor, 
  Package, 
  Smartphone, 
  Building2, 
  BarChart3,
  Settings
} from 'lucide-react';

interface ITLayoutProps {
  children: ReactNode;
}

const itNavItems = [
  {
    href: '/it/tickets',
    label: 'IT Tickets',
    icon: Ticket,
  },
  {
    href: '/it/requests',
    label: 'IT Requests',
    icon: FileText,
  },
  {
    href: '/it/masters/systems',
    label: 'System Assets',
    icon: Monitor,
  },
  {
    href: '/it/masters/software',
    label: 'Software',
    icon: Package,
  },
  {
    href: '/it/masters/mobiles',
    label: 'Mobile Devices',
    icon: Smartphone,
  },
  {
    href: '/it/masters/vendors',
    label: 'Vendors',
    icon: Building2,
  },
  {
    href: '/it/reports',
    label: 'Reports',
    icon: BarChart3,
  },
];

export default function ITLayout({ children }: ITLayoutProps) {
  return <>{children}</>;
}
