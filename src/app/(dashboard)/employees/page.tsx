'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Users,
  Search,
  Filter,
  Building2,
  Mail,
  Phone,
  ChevronRight,
  UserCircle,
  Network,
  Table,
  LayoutGrid,
  ChevronDown,
  ChevronUp,
  User,
  Briefcase,
  Upload,
  Download,
  Pencil,
  Loader2,
  Eye,
  EyeOff,
  KeyRound,
  CheckCircle2,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
  Input,
  Label,
  Select as UISelect,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui';
import { EmployeeActions } from '@/components/masters';

interface Employee {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  displayName: string | null;
  email: string;
  phone: string | null;
  avatar: string | null;
  jobTitle: string | null;
  role: string;
  status: string;
  company: {
    id: string;
    name: string;
    shortName: string | null;
    code: string;
  } | null;
  department: {
    id: string;
    name: string;
    code: string;
  } | null;
  manager: {
    id: string;
    firstName: string;
    lastName: string;
    jobTitle: string | null;
  } | null;
  subordinates: {
    id: string;
    firstName: string;
    lastName: string;
  }[];
  _count: {
    subordinates: number;
  };
}

interface Company {
  id: string;
  name: string;
  shortName: string | null;
  code: string;
}

interface Department {
  id: string;
  name: string;
  code: string;
}

// Skeleton component for loading state
function EmployeeSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="bg-white rounded-xl border border-surface-200 p-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-surface-200 rounded-full" />
          <div className="flex-1">
            <div className="h-5 bg-surface-200 rounded w-48 mb-2" />
            <div className="h-4 bg-surface-200 rounded w-32 mb-1" />
            <div className="h-3 bg-surface-200 rounded w-40" />
          </div>
        </div>
      </div>
    </div>
  );
}

// Organization Tree Node Component
function OrgTreeNode({ 
  employee, 
  level = 0, 
  allEmployees,
  expandedNodes,
  toggleNode 
}: { 
  employee: Employee;
  level?: number;
  allEmployees: Employee[];
  expandedNodes: Set<string>;
  toggleNode: (id: string) => void;
}) {
  const subordinates = allEmployees.filter(e => e.manager?.id === employee.id);
  const hasSubordinates = subordinates.length > 0;
  const isExpanded = expandedNodes.has(employee.id);

  return (
    <div className={level > 0 ? 'ml-6 border-l-2 border-surface-200 pl-4' : ''}>
      <div className="py-2">
        <div 
          className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
            hasSubordinates ? 'hover:bg-surface-50 cursor-pointer' : 'bg-surface-50'
          }`}
          onClick={() => hasSubordinates && toggleNode(employee.id)}
        >
          {hasSubordinates && (
            <button className="text-text-secondary">
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
          )}
          {!hasSubordinates && <div className="w-4" />}
          
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
            {employee.firstName[0]}{employee.lastName[0]}
          </div>
          
          <div className="flex-1 min-w-0">
            <Link 
              href={`/employees/${employee.id}`}
              className="font-medium text-text-primary hover:text-primary transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              {employee.displayName || `${employee.firstName} ${employee.lastName}`}
            </Link>
            <div className="text-sm text-text-secondary truncate">
              {employee.jobTitle || 'No Title'}
            </div>
          </div>
          
          <div className="text-right hidden md:block">
            <div className="text-xs text-text-secondary">
              {employee.company?.shortName || employee.company?.name}
            </div>
            {hasSubordinates && (
              <div className="text-xs text-primary">
                {subordinates.length} direct report{subordinates.length !== 1 ? 's' : ''}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {hasSubordinates && isExpanded && (
        <div className="space-y-0">
          {subordinates.map((sub) => (
            <OrgTreeNode 
              key={sub.id} 
              employee={sub} 
              level={level + 1}
              allEmployees={allEmployees}
              expandedNodes={expandedNodes}
              toggleNode={toggleNode}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function EmployeeMasterPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCompany, setSelectedCompany] = useState<string>('all');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table' | 'org'>('grid');
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [empRes, compRes, deptRes] = await Promise.all([
        fetch('/api/employees'),
        fetch('/api/companies'),
        fetch('/api/departments'),
      ]);
      
      if (empRes.ok) {
        const data = await empRes.json();
        setEmployees(data.employees || data);
      }
      
      if (compRes.ok) {
        const data = await compRes.json();
        setCompanies(data.companies || data);
      }
      
      if (deptRes.ok) {
        const data = await deptRes.json();
        setDepartments(data.departments || data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      const matchesSearch = 
        searchQuery === '' ||
        `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.employeeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.jobTitle?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCompany = 
        selectedCompany === 'all' || emp.company?.id === selectedCompany;

      const matchesDepartment = 
        selectedDepartment === 'all' || emp.department?.id === selectedDepartment;

      const matchesStatus = 
        selectedStatus === 'all' || emp.status === selectedStatus;

      return matchesSearch && matchesCompany && matchesDepartment && matchesStatus;
    });
  }, [employees, searchQuery, selectedCompany, selectedDepartment, selectedStatus]);

  // Get top-level employees (those without managers or CEO)
  const topLevelEmployees = useMemo(() => {
    return filteredEmployees.filter(emp => !emp.manager);
  }, [filteredEmployees]);

  const toggleNode = (id: string) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const expandAll = () => {
    const allIds = new Set(filteredEmployees.map(e => e.id));
    setExpandedNodes(allIds);
  };

  const collapseAll = () => {
    setExpandedNodes(new Set());
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-700';
      case 'INACTIVE':
        return 'bg-gray-100 text-gray-700';
      case 'SUSPENDED':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'bg-purple-100 text-purple-700';
      case 'ADMIN':
        return 'bg-blue-100 text-blue-700';
      case 'IT_ADMIN':
        return 'bg-cyan-100 text-cyan-700';
      case 'HR_ADMIN':
        return 'bg-pink-100 text-pink-700';
      case 'MANAGER':
        return 'bg-amber-100 text-amber-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const formatRole = (role: string) => {
    return role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // Edit Employee state
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [editForm, setEditForm] = useState({
    employeeId: '',
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    jobTitle: '',
    role: 'EMPLOYEE',
    status: 'ACTIVE',
    companyId: '',
    departmentId: '',
    managerId: '',
  });
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);
  const [resetSuccess, setResetSuccess] = useState('');

  const openEditDialog = (employee: Employee, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setEditingEmployee(employee);
    setEditForm({
      employeeId: employee.employeeId,
      email: employee.email,
      firstName: employee.firstName,
      lastName: employee.lastName,
      phone: employee.phone || '',
      jobTitle: employee.jobTitle || '',
      role: employee.role,
      status: employee.status,
      companyId: employee.company?.id || '',
      departmentId: employee.department?.id || '',
      managerId: employee.manager?.id || '',
    });
    setEditError('');
    setShowResetPassword(false);
    setNewPassword('');
    setConfirmPassword('');
    setResetSuccess('');
  };

  const handleResetPassword = async () => {
    if (!editingEmployee) return;
    if (!newPassword || newPassword.length < 8) {
      setEditError('New password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setEditError('Passwords do not match');
      return;
    }

    setResettingPassword(true);
    setEditError('');

    try {
      const res = await fetch(`/api/employees/${editingEmployee.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword }),
      });

      const result = await res.json();

      if (!res.ok) {
        setEditError(result.error || 'Failed to reset password');
        return;
      }

      setNewPassword('');
      setConfirmPassword('');
      setShowResetPassword(false);
      setResetSuccess(`Password for ${editingEmployee.firstName} ${editingEmployee.lastName} has been reset successfully.`);
      setTimeout(() => setResetSuccess(''), 5000);
    } catch (err) {
      setEditError('Something went wrong. Please try again.');
    } finally {
      setResettingPassword(false);
    }
  };

  const handleEditChange = (field: string, value: string) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
    if (editError) setEditError('');
  };

  const handleEditSubmit = async () => {
    if (!editingEmployee) return;
    if (!editForm.employeeId.trim()) return setEditError('Employee ID is required');
    if (!editForm.email.trim()) return setEditError('Email is required');
    if (!editForm.firstName.trim()) return setEditError('First name is required');
    if (!editForm.lastName.trim()) return setEditError('Last name is required');

    setEditSaving(true);
    setEditError('');

    try {
      const payload: Record<string, any> = {
        employeeId: editForm.employeeId.trim(),
        email: editForm.email.trim().toLowerCase(),
        firstName: editForm.firstName.trim(),
        lastName: editForm.lastName.trim(),
        role: editForm.role,
        status: editForm.status,
      };

      payload.phone = editForm.phone.trim() || null;
      payload.jobTitle = editForm.jobTitle.trim() || null;
      payload.companyId = editForm.companyId || null;
      payload.departmentId = editForm.departmentId || null;
      payload.managerId = editForm.managerId || null;

      const res = await fetch(`/api/employees/${editingEmployee.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (!res.ok) {
        setEditError(result.error || 'Failed to update employee');
        return;
      }

      setEditingEmployee(null);
      fetchData(); // Refresh employee list
    } catch (err) {
      setEditError('Something went wrong. Please try again.');
    } finally {
      setEditSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-text-secondary mb-2">
          <Link href="/dashboard" className="hover:text-primary">Home</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-text-primary">Employee Master</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
              <Users className="w-7 h-7 text-primary" />
              Employee Master
            </h1>
            <p className="text-text-secondary mt-1">
              Manage employees and view organizational hierarchy
            </p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-text-secondary">
              {filteredEmployees.length} employee{filteredEmployees.length !== 1 ? 's' : ''}
            </span>
            <EmployeeActions />
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white rounded-xl border border-surface-200 p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
              <input
                type="text"
                placeholder="Search by name, email, employee ID, or job title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <select
              value={selectedCompany}
              onChange={(e) => setSelectedCompany(e.target.value)}
              className="px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
            >
              <option value="all">All Companies</option>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.shortName || company.name}
                </option>
              ))}
            </select>

            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
            >
              <option value="all">All Departments</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
            >
              <option value="all">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="SUSPENDED">Suspended</option>
            </select>
          </div>

          {/* View Toggle */}
          <div className="flex items-center gap-1 bg-surface-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'grid' 
                  ? 'bg-white text-primary shadow-sm' 
                  : 'text-text-secondary hover:text-text-primary'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'table' 
                  ? 'bg-white text-primary shadow-sm' 
                  : 'text-text-secondary hover:text-text-primary'
              }`}
              title="Table View"
            >
              <Table className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('org')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'org' 
                  ? 'bg-white text-primary shadow-sm' 
                  : 'text-text-secondary hover:text-text-primary'
              }`}
              title="Organization View"
            >
              <Network className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <EmployeeSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Grid View */}
      {!loading && viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEmployees.map((employee) => (
            <div
              key={employee.id}
              className="bg-white rounded-xl border border-surface-200 p-6 hover:shadow-lg hover:border-primary/30 transition-all group relative"
            >
              {/* Edit Button */}
              <button
                onClick={(e) => openEditDialog(employee, e)}
                className="absolute top-4 right-4 p-2 rounded-lg bg-surface-50 text-text-secondary hover:bg-primary/10 hover:text-primary transition-colors opacity-0 group-hover:opacity-100 z-10"
                title="Edit Employee"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl flex-shrink-0 group-hover:bg-primary group-hover:text-white transition-colors">
                  {employee.firstName[0]}{employee.lastName[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <Link href={`/employees/${employee.id}`}>
                    <h3 className="font-semibold text-text-primary hover:text-primary truncate transition-colors">
                      {employee.displayName || `${employee.firstName} ${employee.lastName}`}
                    </h3>
                  </Link>
                  <p className="text-sm text-text-secondary truncate">
                    {employee.jobTitle || 'No Title'}
                  </p>
                  <p className="text-xs text-text-secondary mt-1 truncate">
                    {employee.employeeId}
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-surface-100 space-y-2">
                <div className="flex items-center gap-2 text-sm text-text-secondary">
                  <Building2 className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">
                    {employee.company?.shortName || employee.company?.name || 'No Company'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-text-secondary">
                  <Briefcase className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">
                    {employee.department?.name || 'No Department'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-text-secondary">
                  <Mail className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{employee.email}</span>
                </div>
                {employee.manager && (
                  <div className="flex items-center gap-2 text-sm text-text-secondary">
                    <User className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">
                      Reports to: {employee.manager.firstName} {employee.manager.lastName}
                    </span>
                  </div>
                )}
              </div>

              <div className="mt-4 flex items-center gap-2 flex-wrap">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(employee.status)}`}>
                  {employee.status}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getRoleColor(employee.role)}`}>
                  {formatRole(employee.role)}
                </span>
                {employee._count?.subordinates > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                    {employee._count.subordinates} reports
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Table View */}
      {!loading && viewMode === 'table' && (
        <div className="bg-white rounded-xl border border-surface-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-surface-50 border-b border-surface-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                    Employee
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                    Company / Department
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                    Reports To
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-text-secondary uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100">
                {filteredEmployees.map((employee) => (
                  <tr 
                    key={employee.id}
                    className="hover:bg-surface-50 transition-colors"
                  >
                    <td className="px-4 py-4">
                      <Link href={`/employees/${employee.id}`} className="flex items-center gap-3 group">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm flex-shrink-0 group-hover:bg-primary group-hover:text-white transition-colors">
                          {employee.firstName[0]}{employee.lastName[0]}
                        </div>
                        <div>
                          <div className="font-medium text-text-primary group-hover:text-primary transition-colors">
                            {employee.displayName || `${employee.firstName} ${employee.lastName}`}
                          </div>
                          <div className="text-sm text-text-secondary">
                            {employee.jobTitle || 'No Title'}
                          </div>
                          <div className="text-xs text-text-secondary">
                            {employee.employeeId}
                          </div>
                        </div>
                      </Link>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm text-text-primary">
                        {employee.company?.shortName || employee.company?.name || 'N/A'}
                      </div>
                      <div className="text-sm text-text-secondary">
                        {employee.department?.name || 'N/A'}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      {employee.manager ? (
                        <Link 
                          href={`/employees/${employee.manager.id}`}
                          className="text-sm text-primary hover:underline"
                        >
                          {employee.manager.firstName} {employee.manager.lastName}
                          <div className="text-xs text-text-secondary">
                            {employee.manager.jobTitle}
                          </div>
                        </Link>
                      ) : (
                        <span className="text-sm text-text-secondary">—</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(employee.role)}`}>
                        {formatRole(employee.role)}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(employee.status)}`}>
                        {employee.status}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-col gap-1">
                        <a 
                          href={`mailto:${employee.email}`}
                          className="text-sm text-primary hover:underline flex items-center gap-1"
                        >
                          <Mail className="w-3 h-3" />
                          Email
                        </a>
                        {employee.phone && (
                          <a 
                            href={`tel:${employee.phone}`}
                            className="text-sm text-text-secondary hover:text-primary flex items-center gap-1"
                          >
                            <Phone className="w-3 h-3" />
                            {employee.phone}
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <button
                        onClick={() => openEditDialog(employee)}
                        className="p-2 rounded-lg text-text-secondary hover:bg-primary/10 hover:text-primary transition-colors"
                        title="Edit Employee"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Organization View */}
      {!loading && viewMode === 'org' && (
        <div className="bg-white rounded-xl border border-surface-200">
          <div className="p-4 border-b border-surface-200 flex items-center justify-between">
            <h2 className="font-semibold text-text-primary flex items-center gap-2">
              <Network className="w-5 h-5 text-primary" />
              Organization Hierarchy
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={expandAll}
                className="px-3 py-1.5 text-sm bg-surface-100 hover:bg-surface-200 rounded-lg transition-colors"
              >
                Expand All
              </button>
              <button
                onClick={collapseAll}
                className="px-3 py-1.5 text-sm bg-surface-100 hover:bg-surface-200 rounded-lg transition-colors"
              >
                Collapse All
              </button>
            </div>
          </div>
          <div className="p-4">
            {topLevelEmployees.length > 0 ? (
              <div className="space-y-0">
                {topLevelEmployees.map((employee) => (
                  <OrgTreeNode
                    key={employee.id}
                    employee={employee}
                    allEmployees={filteredEmployees}
                    expandedNodes={expandedNodes}
                    toggleNode={toggleNode}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-text-secondary">
                <Network className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No employees found matching your criteria</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredEmployees.length === 0 && (
        <div className="bg-white rounded-xl border border-surface-200 p-12 text-center">
          <Users className="w-16 h-16 mx-auto text-text-secondary opacity-50 mb-4" />
          <h3 className="text-lg font-semibold text-text-primary mb-2">
            No Employees Found
          </h3>
          <p className="text-text-secondary">
            {searchQuery || selectedCompany !== 'all' || selectedDepartment !== 'all' || selectedStatus !== 'all'
              ? 'Try adjusting your search filters'
              : 'No employees have been added yet'}
          </p>
        </div>
      )}

      {/* Edit Employee Dialog */}
      <Dialog open={!!editingEmployee} onOpenChange={(open) => {
        if (!open) {
          setEditingEmployee(null);
          setEditError('');
          setShowResetPassword(false);
          setNewPassword('');
          setConfirmPassword('');
          setResetSuccess('');
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="w-5 h-5 text-primary" />
              Edit Employee
            </DialogTitle>
            <DialogDescription>
              Update employee details. Required fields are marked with *.
            </DialogDescription>
          </DialogHeader>

          {editError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {editError}
            </div>
          )}

          <div className="grid gap-4">
            {/* Row 1: Employee ID & Email */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-employeeId">Employee ID *</Label>
                <Input
                  id="edit-employeeId"
                  value={editForm.employeeId}
                  onChange={(e) => handleEditChange('employeeId', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email *</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editForm.email}
                  onChange={(e) => handleEditChange('email', e.target.value)}
                />
              </div>
            </div>

            {/* Row 2: First Name & Last Name */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-firstName">First Name *</Label>
                <Input
                  id="edit-firstName"
                  value={editForm.firstName}
                  onChange={(e) => handleEditChange('firstName', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-lastName">Last Name *</Label>
                <Input
                  id="edit-lastName"
                  value={editForm.lastName}
                  onChange={(e) => handleEditChange('lastName', e.target.value)}
                />
              </div>
            </div>

            {/* Row 3: Phone & Job Title */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-phone">Phone</Label>
                <Input
                  id="edit-phone"
                  value={editForm.phone}
                  onChange={(e) => handleEditChange('phone', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-jobTitle">Job Title</Label>
                <Input
                  id="edit-jobTitle"
                  value={editForm.jobTitle}
                  onChange={(e) => handleEditChange('jobTitle', e.target.value)}
                />
              </div>
            </div>

            {/* Row 4: Role & Status */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Role</Label>
                <UISelect
                  value={editForm.role}
                  onValueChange={(value) => handleEditChange('role', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EMPLOYEE">Employee</SelectItem>
                    <SelectItem value="MANAGER">Manager</SelectItem>
                    <SelectItem value="HR_ADMIN">HR Admin</SelectItem>
                    <SelectItem value="IT_ADMIN">IT Admin</SelectItem>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                    <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                  </SelectContent>
                </UISelect>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <UISelect
                  value={editForm.status}
                  onValueChange={(value) => handleEditChange('status', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="INACTIVE">Inactive</SelectItem>
                    <SelectItem value="SUSPENDED">Suspended</SelectItem>
                  </SelectContent>
                </UISelect>
              </div>
            </div>

            {/* Row 5: Company & Department */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Company</Label>
                <UISelect
                  value={editForm.companyId || 'none'}
                  onValueChange={(value) => handleEditChange('companyId', value === 'none' ? '' : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select company" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Company</SelectItem>
                    {companies.map((company) => (
                      <SelectItem key={company.id} value={company.id}>
                        {company.shortName || company.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </UISelect>
              </div>
              <div className="space-y-2">
                <Label>Department</Label>
                <UISelect
                  value={editForm.departmentId || 'none'}
                  onValueChange={(value) => handleEditChange('departmentId', value === 'none' ? '' : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Department</SelectItem>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </UISelect>
              </div>
            </div>

            {/* Row 6: Reporting Manager */}
            <div className="space-y-2">
              <Label>Reporting Manager</Label>
              <UISelect
                value={editForm.managerId || 'none'}
                onValueChange={(value) => handleEditChange('managerId', value === 'none' ? '' : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select manager" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Manager</SelectItem>
                  {employees
                    .filter((e) => e.id !== editingEmployee?.id)
                    .map((emp) => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {emp.firstName} {emp.lastName}{emp.jobTitle ? ` — ${emp.jobTitle}` : ''}
                      </SelectItem>
                    ))}
                </SelectContent>
              </UISelect>
            </div>

            {/* Reset Password Section */}
            <div className="border-t border-surface-200 pt-4 mt-2">
              {resetSuccess && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2 mb-3">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  {resetSuccess}
                </div>
              )}
              {!showResetPassword ? (
                <button
                  type="button"
                  onClick={() => setShowResetPassword(true)}
                  className="flex items-center gap-2 text-sm font-medium text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 px-4 py-2.5 rounded-lg transition-colors w-full justify-center border border-amber-200"
                >
                  <KeyRound className="w-4 h-4" />
                  Reset Password
                </button>
              ) : (
                <div className="space-y-3 bg-amber-50/50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-amber-800">
                    <KeyRound className="w-4 h-4" />
                    Reset Password for {editingEmployee?.firstName} {editingEmployee?.lastName}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-password">New Password *</Label>
                    <div className="relative">
                      <Input
                        id="new-password"
                        type={showNewPassword ? 'text' : 'password'}
                        placeholder="Minimum 8 characters"
                        value={newPassword}
                        onChange={(e) => { setNewPassword(e.target.value); if (editError) setEditError(''); }}
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm Password *</Label>
                    <Input
                      id="confirm-password"
                      type={showNewPassword ? 'text' : 'password'}
                      placeholder="Re-enter new password"
                      value={confirmPassword}
                      onChange={(e) => { setConfirmPassword(e.target.value); if (editError) setEditError(''); }}
                    />
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setShowResetPassword(false);
                        setNewPassword('');
                        setConfirmPassword('');
                        setEditError('');
                      }}
                      disabled={resettingPassword}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleResetPassword}
                      disabled={resettingPassword || !newPassword || !confirmPassword}
                      className="bg-amber-600 hover:bg-amber-700"
                    >
                      {resettingPassword ? (
                        <>
                          <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                          Resetting...
                        </>
                      ) : (
                        <>
                          <KeyRound className="mr-2 h-3 w-3" />
                          Reset Password
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEditingEmployee(null);
                setEditError('');
                setShowResetPassword(false);
                setNewPassword('');
                setConfirmPassword('');
                setResetSuccess('');
              }}
              disabled={editSaving}
            >
              Cancel
            </Button>
            <Button onClick={handleEditSubmit} disabled={editSaving}>
              {editSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Pencil className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
