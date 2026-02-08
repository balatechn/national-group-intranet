'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import {
  Settings,
  Upload,
  Save,
  Image as ImageIcon,
  Loader2,
  Users,
  Shield,
  Building2,
  Search,
  ChevronDown,
  Check,
  X,
  UserCog,
  Filter,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Button,
  Input,
  Label,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Badge,
  Avatar,
  AvatarImage,
  AvatarFallback,
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui';

const ROLES = [
  { value: 'SUPER_ADMIN', label: 'Super Admin', color: 'bg-red-100 text-red-700 border-red-200' },
  { value: 'ADMIN', label: 'Admin', color: 'bg-purple-100 text-purple-700 border-purple-200' },
  { value: 'IT_ADMIN', label: 'IT Admin', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { value: 'HR_ADMIN', label: 'HR Admin', color: 'bg-pink-100 text-pink-700 border-pink-200' },
  { value: 'MANAGER', label: 'Manager', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  { value: 'EMPLOYEE', label: 'Employee', color: 'bg-gray-100 text-gray-700 border-gray-200' },
];

const STATUSES = [
  { value: 'ACTIVE', label: 'Active', color: 'bg-emerald-100 text-emerald-700' },
  { value: 'INACTIVE', label: 'Inactive', color: 'bg-gray-100 text-gray-600' },
  { value: 'SUSPENDED', label: 'Suspended', color: 'bg-red-100 text-red-700' },
];

interface ManagedUser {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar: string | null;
  role: string;
  status: string;
  jobTitle: string | null;
  company: { id: string; name: string } | null;
  department: { id: string; name: string } | null;
}

interface CompanyOption {
  id: string;
  name: string;
  code: string;
}

function getRoleBadge(role: string) {
  const r = ROLES.find((x) => x.value === role);
  return r || { value: role, label: role, color: 'bg-gray-100 text-gray-700 border-gray-200' };
}

function getStatusBadge(status: string) {
  const s = STATUSES.find((x) => x.value === status);
  return s || { value: status, label: status, color: 'bg-gray-100 text-gray-600' };
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export default function SettingsPage() {
  const { data: session } = useSession();
  const [logo, setLogo] = useState<string>('');
  const [companyName, setCompanyName] = useState<string>('National Group');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // User management state
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterCompany, setFilterCompany] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [userMessage, setUserMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const isAdmin = session?.user?.role === 'SUPER_ADMIN' || session?.user?.role === 'ADMIN';

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings');
      if (response.ok) {
        const data = await response.json();
        if (data.logo) setLogo(data.logo);
        if (data.companyName) setCompanyName(data.companyName);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch users and companies for user management tab
  const fetchUsersAndCompanies = async () => {
    if (users.length > 0) return; // already loaded
    setLoadingUsers(true);
    try {
      const [usersRes, companiesRes] = await Promise.all([
        fetch('/api/employees?limit=500'),
        fetch('/api/companies'),
      ]);
      if (usersRes.ok) {
        const data = await usersRes.json();
        setUsers(data.employees || []);
      }
      if (companiesRes.ok) {
        const data = await companiesRes.json();
        setCompanies(data.companies || data || []);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoadingUsers(false);
    }
  };

  // Filtered users
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const search = userSearch.toLowerCase();
      const matchSearch =
        !search ||
        `${user.firstName} ${user.lastName}`.toLowerCase().includes(search) ||
        user.email.toLowerCase().includes(search) ||
        user.employeeId.toLowerCase().includes(search);
      const matchRole = filterRole === 'all' || user.role === filterRole;
      const matchCompany = filterCompany === 'all' || user.company?.id === filterCompany;
      const matchStatus = filterStatus === 'all' || user.status === filterStatus;
      return matchSearch && matchRole && matchCompany && matchStatus;
    });
  }, [users, userSearch, filterRole, filterCompany, filterStatus]);

  // Role/company/status counts
  const roleCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    users.forEach((u) => {
      counts[u.role] = (counts[u.role] || 0) + 1;
    });
    return counts;
  }, [users]);

  const companyCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    users.forEach((u) => {
      const key = u.company?.id || 'unassigned';
      counts[key] = (counts[key] || 0) + 1;
    });
    return counts;
  }, [users]);

  // Update user role
  const handleRoleChange = async (userId: string, newRole: string) => {
    setUpdatingUserId(userId);
    setUserMessage(null);
    try {
      const res = await fetch('/api/settings/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role: newRole }),
      });
      if (res.ok) {
        setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
        setUserMessage({ type: 'success', text: 'Role updated successfully' });
      } else {
        const err = await res.json();
        setUserMessage({ type: 'error', text: err.message || 'Failed to update role' });
      }
    } catch {
      setUserMessage({ type: 'error', text: 'An error occurred' });
    } finally {
      setUpdatingUserId(null);
      setTimeout(() => setUserMessage(null), 3000);
    }
  };

  // Update user company
  const handleCompanyChange = async (userId: string, newCompanyId: string | null) => {
    setUpdatingUserId(userId);
    setUserMessage(null);
    try {
      const res = await fetch('/api/settings/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, companyId: newCompanyId }),
      });
      if (res.ok) {
        const company = newCompanyId ? companies.find((c) => c.id === newCompanyId) : null;
        setUsers((prev) =>
          prev.map((u) =>
            u.id === userId
              ? { ...u, company: company ? { id: company.id, name: company.name } : null }
              : u
          )
        );
        setUserMessage({ type: 'success', text: 'Company updated successfully' });
      } else {
        const err = await res.json();
        setUserMessage({ type: 'error', text: err.message || 'Failed to update company' });
      }
    } catch {
      setUserMessage({ type: 'error', text: 'An error occurred' });
    } finally {
      setUpdatingUserId(null);
      setTimeout(() => setUserMessage(null), 3000);
    }
  };

  // Update user status
  const handleStatusChange = async (userId: string, newStatus: string) => {
    setUpdatingUserId(userId);
    setUserMessage(null);
    try {
      const res = await fetch('/api/settings/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, status: newStatus }),
      });
      if (res.ok) {
        setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, status: newStatus } : u)));
        setUserMessage({ type: 'success', text: 'Status updated successfully' });
      } else {
        const err = await res.json();
        setUserMessage({ type: 'error', text: err.message || 'Failed to update status' });
      }
    } catch {
      setUserMessage({ type: 'error', text: 'An error occurred' });
    } finally {
      setUpdatingUserId(null);
      setTimeout(() => setUserMessage(null), 3000);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setMessage({ type: 'error', text: 'Please select an image file' });
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        setMessage({ type: 'error', text: 'Image size should be less than 2MB' });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogo(reader.result as string);
        setMessage(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!isAdmin) {
      setMessage({ type: 'error', text: 'You do not have permission to change settings' });
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logo, companyName }),
      });
      if (response.ok) {
        setMessage({ type: 'success', text: 'Settings saved successfully! Refresh to see changes.' });
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.message || 'Failed to save settings' });
      }
    } catch {
      setMessage({ type: 'error', text: 'An error occurred while saving settings' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100">
          <Settings className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Settings</h1>
          <p className="text-sm text-text-secondary">Manage your organization settings and users</p>
        </div>
      </div>

      <Tabs defaultValue="branding" className="space-y-6">
        <TabsList>
          <TabsTrigger value="branding" className="gap-2">
            <ImageIcon className="h-4 w-4" />
            Branding
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-2" onClick={() => fetchUsersAndCompanies()}>
            <Users className="h-4 w-4" />
            User Management
          </TabsTrigger>
        </TabsList>

        {/* ── Branding Tab ── */}
        <TabsContent value="branding">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                Branding
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name</Label>
                <Input
                  id="companyName"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Enter company name"
                  disabled={!isAdmin}
                />
              </div>

              <div className="space-y-2">
                <Label>Company Logo</Label>
                <div className="flex items-start gap-6">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50 overflow-hidden">
                      {logo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={logo} alt="Company Logo" className="max-w-full max-h-full object-contain" />
                      ) : (
                        <ImageIcon className="h-12 w-12 text-gray-400" />
                      )}
                    </div>
                    <span className="text-xs text-text-secondary">Preview</span>
                  </div>
                  <div className="flex-1 space-y-3">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/*"
                      className="hidden"
                      disabled={!isAdmin}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={!isAdmin}
                      className="gap-2"
                    >
                      <Upload className="h-4 w-4" />
                      Upload Logo
                    </Button>
                    <p className="text-xs text-text-secondary">
                      Recommended: PNG or SVG with transparent background.
                      <br />
                      Maximum size: 2MB. Optimal dimensions: 400x180 pixels.
                    </p>
                    {logo && isAdmin && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setLogo('')}
                        className="text-danger hover:text-danger"
                      >
                        Remove Logo
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {message && (
                <div
                  className={`p-3 rounded-lg text-sm ${
                    message.type === 'success'
                      ? 'bg-success-50 text-success-700 border border-success-200'
                      : 'bg-danger-50 text-danger-700 border border-danger-200'
                  }`}
                >
                  {message.text}
                </div>
              )}

              {isAdmin && (
                <div className="flex justify-end pt-4 border-t">
                  <Button onClick={handleSave} disabled={saving} className="gap-2">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Save Settings
                  </Button>
                </div>
              )}

              {!isAdmin && (
                <div className="p-3 rounded-lg bg-warning-50 text-warning-700 border border-warning-200 text-sm">
                  You need Admin privileges to modify settings.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── User Management Tab ── */}
        <TabsContent value="users">
          {!isAdmin ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <Shield className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-semibold text-gray-700 mb-1">Access Restricted</h3>
                  <p className="text-sm text-gray-500">Only Super Admin and Admin can manage users.</p>
                </div>
              </CardContent>
            </Card>
          ) : loadingUsers ? (
            <div className="flex items-center justify-center min-h-[300px]">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-5 pb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-500 font-medium">Total Users</p>
                        <p className="text-2xl font-bold text-gray-900">{users.length}</p>
                      </div>
                      <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center">
                        <Users className="h-5 w-5 text-blue-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-5 pb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-500 font-medium">Admins</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {(roleCounts['SUPER_ADMIN'] || 0) + (roleCounts['ADMIN'] || 0)}
                        </p>
                      </div>
                      <div className="h-10 w-10 rounded-xl bg-purple-50 flex items-center justify-center">
                        <Shield className="h-5 w-5 text-purple-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-5 pb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-500 font-medium">Companies</p>
                        <p className="text-2xl font-bold text-gray-900">{companies.length}</p>
                      </div>
                      <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-amber-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-5 pb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-500 font-medium">Active Users</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {users.filter((u) => u.status === 'ACTIVE').length}
                        </p>
                      </div>
                      <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                        <Check className="h-5 w-5 text-emerald-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Role Distribution */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Shield className="h-4 w-4 text-primary" />
                    Role Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {ROLES.map((role) => (
                      <button
                        key={role.value}
                        onClick={() => setFilterRole(filterRole === role.value ? 'all' : role.value)}
                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                          filterRole === role.value
                            ? 'ring-2 ring-primary ring-offset-1'
                            : ''
                        } ${role.color}`}
                      >
                        {role.label}
                        <span className="bg-white/60 px-1.5 py-0.5 rounded-full text-[10px] font-bold">
                          {roleCounts[role.value] || 0}
                        </span>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* User Message */}
              {userMessage && (
                <div
                  className={`p-3 rounded-lg text-sm flex items-center justify-between ${
                    userMessage.type === 'success'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}
                >
                  <span>{userMessage.text}</span>
                  <button onClick={() => setUserMessage(null)}>
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}

              {/* Filters & User Table */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <CardTitle className="text-base flex items-center gap-2">
                      <UserCog className="h-4 w-4 text-primary" />
                      All Users ({filteredUsers.length})
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      {/* Search */}
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="Search by name, email, ID..."
                          className="pl-9 w-64"
                          value={userSearch}
                          onChange={(e) => setUserSearch(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 pt-2">
                    <Filter className="h-4 w-4 text-gray-400" />
                    {/* Company Filter */}
                    <Select value={filterCompany} onValueChange={setFilterCompany}>
                      <SelectTrigger className="w-[180px] h-8 text-xs">
                        <SelectValue placeholder="All Companies" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Companies</SelectItem>
                        {companies.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name} ({companyCounts[c.id] || 0})
                          </SelectItem>
                        ))}
                        <SelectItem value="unassigned">Unassigned ({companyCounts['unassigned'] || 0})</SelectItem>
                      </SelectContent>
                    </Select>
                    {/* Role Filter */}
                    <Select value={filterRole} onValueChange={setFilterRole}>
                      <SelectTrigger className="w-[150px] h-8 text-xs">
                        <SelectValue placeholder="All Roles" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Roles</SelectItem>
                        {ROLES.map((r) => (
                          <SelectItem key={r.value} value={r.value}>
                            {r.label} ({roleCounts[r.value] || 0})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {/* Status Filter */}
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                      <SelectTrigger className="w-[130px] h-8 text-xs">
                        <SelectValue placeholder="All Statuses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        {STATUSES.map((s) => (
                          <SelectItem key={s.value} value={s.value}>
                            {s.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {(filterRole !== 'all' || filterCompany !== 'all' || filterStatus !== 'all' || userSearch) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-xs"
                        onClick={() => {
                          setFilterRole('all');
                          setFilterCompany('all');
                          setFilterStatus('all');
                          setUserSearch('');
                        }}
                      >
                        <X className="h-3 w-3 mr-1" />
                        Clear
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[250px]">Employee</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Company</TableHead>
                          <TableHead>Department</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredUsers.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-12 text-gray-400">
                              No users found matching your filters.
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredUsers.map((user) => {
                            const roleBadge = getRoleBadge(user.role);
                            const statusBadge = getStatusBadge(user.status);
                            const isUpdating = updatingUserId === user.id;
                            return (
                              <TableRow key={user.id} className={isUpdating ? 'opacity-60' : ''}>
                                <TableCell>
                                  <div className="flex items-center gap-3">
                                    <Avatar className="h-8 w-8">
                                      <AvatarImage src={user.avatar || ''} />
                                      <AvatarFallback className="text-xs bg-primary-100 text-primary">
                                        {getInitials(`${user.firstName} ${user.lastName}`)}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <p className="text-sm font-medium text-gray-900">
                                        {user.firstName} {user.lastName}
                                      </p>
                                      <p className="text-xs text-gray-400">{user.email}</p>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Select
                                    value={user.role}
                                    onValueChange={(val) => handleRoleChange(user.id, val)}
                                    disabled={isUpdating}
                                  >
                                    <SelectTrigger className="h-7 w-[130px] text-xs border-0 bg-transparent hover:bg-gray-50 px-1">
                                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${roleBadge.color}`}>
                                        {roleBadge.label}
                                      </span>
                                    </SelectTrigger>
                                    <SelectContent>
                                      {ROLES.map((r) => (
                                        <SelectItem key={r.value} value={r.value}>
                                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${r.color}`}>
                                            {r.label}
                                          </span>
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </TableCell>
                                <TableCell>
                                  <Select
                                    value={user.company?.id || 'none'}
                                    onValueChange={(val) => handleCompanyChange(user.id, val === 'none' ? null : val)}
                                    disabled={isUpdating}
                                  >
                                    <SelectTrigger className="h-7 w-[160px] text-xs border-0 bg-transparent hover:bg-gray-50 px-1">
                                      <span className="text-xs text-gray-700 truncate">
                                        {user.company?.name || 'Unassigned'}
                                      </span>
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="none">Unassigned</SelectItem>
                                      {companies.map((c) => (
                                        <SelectItem key={c.id} value={c.id}>
                                          {c.name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </TableCell>
                                <TableCell>
                                  <span className="text-xs text-gray-600">
                                    {user.department?.name || '—'}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  <Select
                                    value={user.status}
                                    onValueChange={(val) => handleStatusChange(user.id, val)}
                                    disabled={isUpdating}
                                  >
                                    <SelectTrigger className="h-7 w-[110px] text-xs border-0 bg-transparent hover:bg-gray-50 px-1">
                                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${statusBadge.color}`}>
                                        {statusBadge.label}
                                      </span>
                                    </SelectTrigger>
                                    <SelectContent>
                                      {STATUSES.map((s) => (
                                        <SelectItem key={s.value} value={s.value}>
                                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${s.color}`}>
                                            {s.label}
                                          </span>
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </TableCell>
                              </TableRow>
                            );
                          })
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
