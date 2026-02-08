'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { cn } from '@/lib/utils';
import {
  Home,
  Building2,
  Users,
  Calendar,
  CheckSquare,
  FolderOpen,
  Briefcase,
  FileText,
  Monitor,
  Ticket,
  ClipboardList,
  HardDrive,
  BarChart3,
  ChevronDown,
  ChevronRight,
  Settings,
  Menu,
  X,
  UserCircle,
} from 'lucide-react';

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  children?: NavItem[];
  /** Restrict this item to specific roles */
  roles?: string[];
}

/** Roles allowed to see "IT & Systems" menu */
const IT_ROLES = ['SUPER_ADMIN', 'ADMIN', 'IT_ADMIN'];

const navigation: NavItem[] = [
  { title: 'Home', href: '/dashboard', icon: Home },
  { title: 'Companies', href: '/companies', icon: Building2 },
  { title: 'Departments', href: '/departments', icon: Users },
  { title: 'Employees', href: '/employees', icon: UserCircle },
  { title: 'Calendar', href: '/calendar', icon: Calendar },
  { title: 'Tasks', href: '/tasks', icon: CheckSquare },
  { title: 'Shared Drives', href: '/drives', icon: FolderOpen },
  { title: 'Projects', href: '/projects', icon: Briefcase },
  { title: 'Policies', href: '/policies', icon: FileText },
  {
    title: 'IT & Systems',
    href: '/it',
    icon: Monitor,
    roles: IT_ROLES,
    children: [
      { title: 'IT Requests', href: '/it/requests', icon: ClipboardList },
      { title: 'IT Tickets', href: '/it/tickets', icon: Ticket },
      {
        title: 'Masters',
        href: '/it/masters',
        icon: Settings,
        children: [
          { title: 'Systems', href: '/it/masters/systems', icon: HardDrive },
          { title: 'Software', href: '/it/masters/software', icon: Monitor },
          { title: 'Mobile Devices', href: '/it/masters/mobiles', icon: Monitor },
          { title: 'Vendors', href: '/it/masters/vendors', icon: Building2 },
        ],
      },
      { title: 'Reports', href: '/it/reports', icon: BarChart3 },
    ],
  },
  { title: 'Settings', href: '/settings', icon: Settings },
];

function NavItemComponent({
  item,
  depth = 0,
}: {
  item: NavItem;
  depth?: number;
}) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(pathname.startsWith(item.href));
  const hasChildren = item.children && item.children.length > 0;
  const isActive = pathname === item.href || (hasChildren && pathname.startsWith(item.href));

  const Icon = item.icon;

  if (hasChildren) {
    return (
      <div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            'flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors',
            isActive
              ? 'bg-primary-100 text-primary'
              : 'text-text-secondary hover:bg-surface-100 hover:text-text-primary'
          )}
          style={{ paddingLeft: `${depth * 12 + 12}px` }}
        >
          <div className="flex items-center gap-3">
            <Icon className="h-5 w-5" />
            <span>{item.title}</span>
          </div>
          {isOpen ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </button>
        {isOpen && (
          <div className="mt-1 space-y-1">
            {item.children?.map((child) => (
              <NavItemComponent key={child.href} item={child} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <Link
      href={item.href}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
        isActive
          ? 'bg-primary-100 text-primary'
          : 'text-text-secondary hover:bg-surface-100 hover:text-text-primary'
      )}
      style={{ paddingLeft: `${depth * 12 + 12}px` }}
    >
      <Icon className="h-5 w-5" />
      <span>{item.title}</span>
    </Link>
  );
}

export function Sidebar() {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { data: session } = useSession();
  const userRole = (session?.user as any)?.role || 'EMPLOYEE';

  // Filter navigation items based on user role
  const filteredNavigation = useMemo(
    () => navigation.filter((item) => !item.roles || item.roles.includes(userRole)),
    [userRole]
  );

  return (
    <>
      {/* Mobile menu button */}
      <button
        className="fixed left-4 top-4 z-50 rounded-lg bg-primary p-2 text-white lg:hidden"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
      >
        {isMobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-40 h-screen w-64 transform border-r border-border bg-white transition-transform duration-200 ease-in-out lg:translate-x-0',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center border-b border-primary/20 px-6 bg-gradient-to-r from-primary-50 to-white">
          <Link href="/dashboard" className="flex items-center gap-3">
            <Image
              src="/national-logo.png"
              alt="National Group"
              width={40}
              height={40}
              className="object-contain"
              priority
            />
            <span className="text-lg font-bold text-primary">National Group</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="h-[calc(100vh-4rem)] overflow-y-auto p-4">
          <div className="space-y-1">
            {filteredNavigation.map((item) => (
              <NavItemComponent key={item.href} item={item} />
            ))}
          </div>
        </nav>
      </aside>
    </>
  );
}
