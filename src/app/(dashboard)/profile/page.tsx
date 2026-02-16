'use client';

import React from 'react';
import { useSession } from '@/lib/session-context';
import {
  User,
  Mail,
  Phone,
  Building2,
  Briefcase,
  Shield,
  Calendar,
  Hash,
  MapPin,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
} from '@/components/ui';
import { getInitials } from '@/lib/utils';

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Admin',
  IT_ADMIN: 'IT Admin',
  HR_ADMIN: 'HR Admin',
  MANAGER: 'Manager',
  EMPLOYEE: 'Employee',
};

const ROLE_COLORS: Record<string, string> = {
  SUPER_ADMIN: 'bg-red-100 text-red-700 border-red-200',
  ADMIN: 'bg-purple-100 text-purple-700 border-purple-200',
  IT_ADMIN: 'bg-blue-100 text-blue-700 border-blue-200',
  HR_ADMIN: 'bg-green-100 text-green-700 border-green-200',
  MANAGER: 'bg-amber-100 text-amber-700 border-amber-200',
  EMPLOYEE: 'bg-gray-100 text-gray-700 border-gray-200',
};

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const user = session?.user;

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-text-secondary">Please log in to view your profile.</p>
      </div>
    );
  }

  const roleLabel = ROLE_LABELS[user.role] || user.role;
  const roleColor = ROLE_COLORS[user.role] || ROLE_COLORS.EMPLOYEE;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary">My Profile</h1>
        <p className="text-sm text-text-secondary">Your account information</p>
      </div>

      {/* Profile Card */}
      <Card>
        <CardContent className="p-8">
          <div className="flex flex-col md:flex-row items-start gap-8">
            {/* Avatar Section */}
            <div className="flex flex-col items-center gap-3">
              <Avatar className="h-28 w-28 border-4 border-primary/20">
                <AvatarImage src={user.avatar || ''} />
                <AvatarFallback className="text-3xl bg-primary/10 text-primary font-semibold">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
              <Badge className={`${roleColor} border px-3 py-1 text-sm font-medium`}>
                {roleLabel}
              </Badge>
            </div>

            {/* Info Section */}
            <div className="flex-1 space-y-6 w-full">
              <div>
                <h2 className="text-2xl font-bold text-text-primary">{user.name}</h2>
                <p className="text-text-secondary">{user.email}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Employee ID */}
                <InfoItem
                  icon={Hash}
                  label="Employee ID"
                  value={user.employeeId}
                />

                {/* Email */}
                <InfoItem
                  icon={Mail}
                  label="Email Address"
                  value={user.email}
                />

                {/* Role */}
                <InfoItem
                  icon={Shield}
                  label="Role"
                  value={roleLabel}
                />

                {/* Company */}
                <InfoItem
                  icon={Building2}
                  label="Company"
                  value={user.companyName || 'Not assigned'}
                />

                {/* Department */}
                <InfoItem
                  icon={Briefcase}
                  label="Department"
                  value={user.departmentName || 'Not assigned'}
                />

                {/* Provider */}
                <InfoItem
                  icon={User}
                  label="Login Method"
                  value={user.provider === 'credentials' ? 'Email & Password' : 'SSO'}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-text-secondary flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Company
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold text-text-primary">
              {user.companyName || 'Not assigned'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-text-secondary flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              Department
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold text-text-primary">
              {user.departmentName || 'Not assigned'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-text-secondary flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Access Level
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold text-text-primary">{roleLabel}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function InfoItem({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 rounded-lg bg-primary/10 p-2">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div>
        <p className="text-xs text-text-muted uppercase tracking-wide">{label}</p>
        <p className="text-sm font-medium text-text-primary">{value}</p>
      </div>
    </div>
  );
}
