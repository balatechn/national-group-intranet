'use client';

import React, { useState } from 'react';
import { useSession } from '@/lib/session-context';
import {
  User,
  Mail,
  Building2,
  Briefcase,
  Shield,
  Hash,
  Lock,
  Eye,
  EyeOff,
  Check,
  Loader2,
  AlertCircle,
  KeyRound,
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
  Button,
  Input,
  Label,
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
        <p className="text-sm text-text-secondary">Your account information and security settings</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Profile Info */}
        <div className="lg:col-span-2 space-y-6">
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <InfoItem icon={Hash} label="Employee ID" value={user.employeeId} />
                    <InfoItem icon={Mail} label="Email Address" value={user.email} />
                    <InfoItem icon={Shield} label="Role" value={roleLabel} />
                    <InfoItem icon={Building2} label="Company" value={user.companyName || 'Not assigned'} />
                    <InfoItem icon={Briefcase} label="Department" value={user.departmentName || 'Not assigned'} />
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

        {/* Right Column - Change Password */}
        <div>
          <ChangePasswordCard />
        </div>
      </div>
    </div>
  );
}

// ==========================================
// Change Password Component
// ==========================================

function ChangePasswordCard() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const passwordRequirements = [
    { label: 'At least 8 characters', met: newPassword.length >= 8 },
    { label: 'One uppercase letter', met: /[A-Z]/.test(newPassword) },
    { label: 'One lowercase letter', met: /[a-z]/.test(newPassword) },
    { label: 'One number', met: /\d/.test(newPassword) },
    { label: 'Passwords match', met: newPassword.length > 0 && newPassword === confirmPassword },
  ];

  const allRequirementsMet = passwordRequirements.every((r) => r.met);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!allRequirementsMet) {
      setMessage({ type: 'error', text: 'Please meet all password requirements' });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const result = await response.json();

      if (!response.ok) {
        setMessage({ type: 'error', text: result.error || 'Failed to change password' });
      } else {
        setMessage({ type: 'success', text: 'Password changed successfully!' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch {
      setMessage({ type: 'error', text: 'An unexpected error occurred' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <KeyRound className="h-5 w-5 text-primary" />
          Change Password
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Message */}
          {message && (
            <div
              className={`rounded-lg p-3 text-sm flex items-center gap-2 ${
                message.type === 'success'
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}
            >
              {message.type === 'success' ? (
                <Check className="h-4 w-4 flex-shrink-0" />
              ) : (
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
              )}
              {message.text}
            </div>
          )}

          {/* Current Password */}
          <div className="space-y-1.5">
            <Label htmlFor="currentPassword" className="text-sm">
              Current Password
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
              <Input
                id="currentPassword"
                type={showCurrent ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="pl-9 pr-10"
                placeholder="Enter current password"
                required
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
              >
                {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div className="space-y-1.5">
            <Label htmlFor="newPassword" className="text-sm">
              New Password
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
              <Input
                id="newPassword"
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="pl-9 pr-10"
                placeholder="Enter new password"
                required
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
              >
                {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword" className="text-sm">
              Confirm New Password
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
              <Input
                id="confirmPassword"
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="pl-9 pr-10"
                placeholder="Confirm new password"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
              >
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Password Requirements */}
          {newPassword.length > 0 && (
            <div className="space-y-1.5 pt-1">
              <p className="text-xs font-medium text-text-muted uppercase tracking-wide">Requirements</p>
              {passwordRequirements.map((req, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  {req.met ? (
                    <Check className="h-3.5 w-3.5 text-green-500" />
                  ) : (
                    <div className="h-3.5 w-3.5 rounded-full border border-gray-300" />
                  )}
                  <span className={req.met ? 'text-green-600' : 'text-text-muted'}>{req.label}</span>
                </div>
              ))}
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            disabled={isLoading || !allRequirementsMet || !currentPassword}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Changing Password...
              </>
            ) : (
              <>
                <Lock className="h-4 w-4 mr-2" />
                Change Password
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

// ==========================================
// Shared Components
// ==========================================

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
