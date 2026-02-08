'use client';

import { useState, useEffect } from 'react';
import { Upload, Download, UserPlus, Eye, EyeOff, Loader2 } from 'lucide-react';
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui';
import { BulkUploadModal, DownloadTemplateButton } from '@/components/bulk-upload/BulkUploadModal';
import { EXCEL_TEMPLATES } from '@/lib/excel';

interface Company {
  id: string;
  name: string;
  shortName: string | null;
}

interface Department {
  id: string;
  name: string;
}

interface ManagerOption {
  id: string;
  firstName: string;
  lastName: string;
  jobTitle: string | null;
}

const ROLES = [
  { value: 'EMPLOYEE', label: 'Employee' },
  { value: 'MANAGER', label: 'Manager' },
  { value: 'HR_ADMIN', label: 'HR Admin' },
  { value: 'IT_ADMIN', label: 'IT Admin' },
  { value: 'ADMIN', label: 'Admin' },
  { value: 'SUPER_ADMIN', label: 'Super Admin' },
];

const initialFormState = {
  employeeId: '',
  email: '',
  password: '',
  firstName: '',
  lastName: '',
  phone: '',
  jobTitle: '',
  role: 'EMPLOYEE',
  companyId: '',
  departmentId: '',
  managerId: '',
};

export function EmployeeActions() {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [form, setForm] = useState(initialFormState);
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [companies, setCompanies] = useState<Company[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [managers, setManagers] = useState<ManagerOption[]>([]);

  useEffect(() => {
    if (showAddDialog) {
      fetchDropdownData();
    }
  }, [showAddDialog]);

  const fetchDropdownData = async () => {
    try {
      const [compRes, deptRes, empRes] = await Promise.all([
        fetch('/api/companies'),
        fetch('/api/departments'),
        fetch('/api/employees'),
      ]);

      if (compRes.ok) {
        const data = await compRes.json();
        setCompanies(data.companies || data);
      }
      if (deptRes.ok) {
        const data = await deptRes.json();
        setDepartments(data.departments || data);
      }
      if (empRes.ok) {
        const data = await empRes.json();
        const emps = data.employees || data;
        setManagers(
          emps.map((e: any) => ({
            id: e.id,
            firstName: e.firstName,
            lastName: e.lastName,
            jobTitle: e.jobTitle,
          }))
        );
      }
    } catch (err) {
      console.error('Error fetching dropdown data:', err);
    }
  };

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (error) setError('');
  };

  const handleSubmit = async () => {
    // Basic validation
    if (!form.employeeId.trim()) return setError('Employee ID is required');
    if (!form.email.trim()) return setError('Email is required');
    if (!form.password || form.password.length < 8) return setError('Password must be at least 8 characters');
    if (!form.firstName.trim()) return setError('First name is required');
    if (!form.lastName.trim()) return setError('Last name is required');

    setSaving(true);
    setError('');

    try {
      const payload: Record<string, any> = {
        employeeId: form.employeeId.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        role: form.role,
      };

      if (form.phone.trim()) payload.phone = form.phone.trim();
      if (form.jobTitle.trim()) payload.jobTitle = form.jobTitle.trim();
      if (form.companyId) payload.companyId = form.companyId;
      if (form.departmentId) payload.departmentId = form.departmentId;
      if (form.managerId) payload.managerId = form.managerId;

      const res = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (!res.ok) {
        setError(result.error || 'Failed to create employee');
        return;
      }

      setShowAddDialog(false);
      setForm(initialFormState);
      window.location.reload();
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleUpload = async (data: Record<string, any>[]) => {
    const response = await fetch('/api/employees/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data }),
    });

    const result = await response.json();
    
    if (response.ok && result.success) {
      window.location.reload();
    }
    
    return result;
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <DownloadTemplateButton 
          template={EXCEL_TEMPLATES.employees} 
          label="Sample Template"
        />
        <Button variant="outline" onClick={() => setShowUploadModal(true)}>
          <Upload className="mr-2 h-4 w-4" />
          Bulk Upload
        </Button>
        <Button onClick={() => setShowAddDialog(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Add Employee
        </Button>
      </div>

      {/* Bulk Upload Modal */}
      {showUploadModal && (
        <BulkUploadModal
          title="Bulk Upload Employees"
          template={EXCEL_TEMPLATES.employees}
          onUpload={handleUpload}
          onClose={() => setShowUploadModal(false)}
        />
      )}

      {/* Add Employee Dialog */}
      <Dialog open={showAddDialog} onOpenChange={(open) => {
        setShowAddDialog(open);
        if (!open) {
          setForm(initialFormState);
          setError('');
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-primary" />
              Add New Employee
            </DialogTitle>
            <DialogDescription>
              Create a new employee account. All required fields are marked with *.
            </DialogDescription>
          </DialogHeader>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="grid gap-4">
            {/* Row 1: Employee ID & Email */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="employeeId">Employee ID *</Label>
                <Input
                  id="employeeId"
                  placeholder="e.g. EMP001"
                  value={form.employeeId}
                  onChange={(e) => handleChange('employeeId', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="employee@company.com"
                  value={form.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                />
              </div>
            </div>

            {/* Row 2: First Name & Last Name */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  placeholder="First name"
                  value={form.firstName}
                  onChange={(e) => handleChange('firstName', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  placeholder="Last name"
                  value={form.lastName}
                  onChange={(e) => handleChange('lastName', e.target.value)}
                />
              </div>
            </div>

            {/* Row 3: Password */}
            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Minimum 8 characters"
                  value={form.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Row 4: Phone & Job Title */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  placeholder="+91 XXXXX XXXXX"
                  value={form.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="jobTitle">Job Title</Label>
                <Input
                  id="jobTitle"
                  placeholder="e.g. Software Engineer"
                  value={form.jobTitle}
                  onChange={(e) => handleChange('jobTitle', e.target.value)}
                />
              </div>
            </div>

            {/* Row 5: Role */}
            <div className="space-y-2">
              <Label>Role</Label>
              <Select
                value={form.role}
                onValueChange={(value) => handleChange('role', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Row 6: Company & Department */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Company</Label>
                <Select
                  value={form.companyId || 'none'}
                  onValueChange={(value) => handleChange('companyId', value === 'none' ? '' : value)}
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
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Department</Label>
                <Select
                  value={form.departmentId || 'none'}
                  onValueChange={(value) => handleChange('departmentId', value === 'none' ? '' : value)}
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
                </Select>
              </div>
            </div>

            {/* Row 7: Reporting Manager */}
            <div className="space-y-2">
              <Label>Reporting Manager</Label>
              <Select
                value={form.managerId || 'none'}
                onValueChange={(value) => handleChange('managerId', value === 'none' ? '' : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select manager" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Manager</SelectItem>
                  {managers.map((mgr) => (
                    <SelectItem key={mgr.id} value={mgr.id}>
                      {mgr.firstName} {mgr.lastName}{mgr.jobTitle ? ` — ${mgr.jobTitle}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAddDialog(false);
                setForm(initialFormState);
                setError('');
              }}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Create Employee
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
