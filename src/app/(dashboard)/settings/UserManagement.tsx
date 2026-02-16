'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Shield,
  Save,
  Loader2,
  ChevronDown,
  ChevronUp,
  Eye,
  Edit3,
  Building2,
  Users,
  RotateCcw,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Label,
} from '@/components/ui';
import {
  APP_MODULES,
  ALL_ROLES,
  MODULE_LABELS,
  ROLE_LABELS,
  DEFAULT_PERMISSIONS,
  type AppModule,
  type UserRole,
  type RolePermissionRow,
} from '@/lib/permissions';

interface Company {
  id: string;
  name: string;
}

interface Department {
  id: string;
  name: string;
  companyId: string;
}

export default function UserManagement() {
  const [permissions, setPermissions] = useState<RolePermissionRow[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [expandedRole, setExpandedRole] = useState<UserRole | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  const fetchPermissions = useCallback(async () => {
    try {
      const response = await fetch('/api/settings/permissions');
      if (response.ok) {
        const data = await response.json();
        setPermissions(data.permissions);
        setCompanies(data.companies || []);
        setDepartments(data.departments || []);
      }
    } catch (error) {
      console.error('Error fetching permissions:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  const togglePermission = (role: UserRole, module: AppModule, field: 'canView' | 'canEdit') => {
    setPermissions((prev) =>
      prev.map((p) => {
        if (p.role === role && p.module === module) {
          const updated = { ...p };
          updated[field] = !updated[field];
          // If turning off view, also turn off edit
          if (field === 'canView' && !updated.canView) {
            updated.canEdit = false;
          }
          // If turning on edit, also turn on view
          if (field === 'canEdit' && updated.canEdit) {
            updated.canView = true;
          }
          return updated;
        }
        return p;
      })
    );
    setHasChanges(true);
    setMessage(null);
  };

  const updateScope = (
    role: UserRole,
    module: AppModule,
    field: 'companyIds' | 'departmentIds',
    values: string[]
  ) => {
    setPermissions((prev) =>
      prev.map((p) => {
        if (p.role === role && p.module === module) {
          return { ...p, [field]: values };
        }
        return p;
      })
    );
    setHasChanges(true);
    setMessage(null);
  };

  const resetToDefaults = (role: UserRole) => {
    const defaults = DEFAULT_PERMISSIONS[role];
    setPermissions((prev) =>
      prev.map((p) => {
        if (p.role === role) {
          return {
            ...p,
            canView: defaults[p.module].canView,
            canEdit: defaults[p.module].canEdit,
            companyIds: [],
            departmentIds: [],
          };
        }
        return p;
      })
    );
    setHasChanges(true);
    setMessage(null);
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const response = await fetch('/api/settings/permissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permissions }),
      });
      if (response.ok) {
        setMessage({ type: 'success', text: 'Permissions saved successfully!' });
        setHasChanges(false);
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.message || 'Failed to save permissions' });
      }
    } catch {
      setMessage({ type: 'error', text: 'An error occurred while saving' });
    } finally {
      setSaving(false);
    }
  };

  const getPermissionsForRole = (role: UserRole) =>
    permissions.filter((p) => p.role === role);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header description */}
      <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
        <div className="flex items-start gap-3">
          <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-900">
              Role-Based Access Control
            </p>
            <p className="text-xs text-blue-700 mt-1">
              Configure which modules each role can <strong>View</strong> or <strong>Edit</strong>.
              You can also restrict access by Company and Department scope.
              SUPER_ADMIN always has full access.
            </p>
          </div>
        </div>
      </div>

      {/* Permission matrix by role */}
      <div className="space-y-3">
        {ALL_ROLES.map((role) => {
          const rolePerms = getPermissionsForRole(role);
          const isExpanded = expandedRole === role;
          const isSuperAdmin = role === 'SUPER_ADMIN';

          return (
            <Card key={role} className={isSuperAdmin ? 'opacity-70' : ''}>
              <CardHeader
                className="cursor-pointer py-3 px-4"
                onClick={() => setExpandedRole(isExpanded ? null : role)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-base">
                      {ROLE_LABELS[role]}
                    </CardTitle>
                    {isSuperAdmin && (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                        Full Access (Locked)
                      </span>
                    )}
                    <span className="text-xs text-text-secondary">
                      {rolePerms.filter((p) => p.canView).length} view,{' '}
                      {rolePerms.filter((p) => p.canEdit).length} edit
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {!isSuperAdmin && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          resetToDefaults(role);
                        }}
                        className="h-7 text-xs gap-1"
                        title="Reset to defaults"
                      >
                        <RotateCcw className="h-3 w-3" />
                        Reset
                      </Button>
                    )}
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-text-secondary" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-text-secondary" />
                    )}
                  </div>
                </div>
              </CardHeader>

              {isExpanded && (
                <CardContent className="pt-0 px-4 pb-4">
                  {/* Module Permission Table */}
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-surface-50 border-b">
                          <th className="text-left py-2 px-3 font-medium text-text-secondary w-[180px]">
                            Module
                          </th>
                          <th className="text-center py-2 px-3 font-medium text-text-secondary w-[80px]">
                            <div className="flex items-center justify-center gap-1">
                              <Eye className="h-3.5 w-3.5" />
                              View
                            </div>
                          </th>
                          <th className="text-center py-2 px-3 font-medium text-text-secondary w-[80px]">
                            <div className="flex items-center justify-center gap-1">
                              <Edit3 className="h-3.5 w-3.5" />
                              Edit
                            </div>
                          </th>
                          <th className="text-left py-2 px-3 font-medium text-text-secondary">
                            <div className="flex items-center gap-1">
                              <Building2 className="h-3.5 w-3.5" />
                              Company Scope
                            </div>
                          </th>
                          <th className="text-left py-2 px-3 font-medium text-text-secondary">
                            <div className="flex items-center gap-1">
                              <Users className="h-3.5 w-3.5" />
                              Department Scope
                            </div>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {APP_MODULES.map((mod, idx) => {
                          const perm = rolePerms.find((p) => p.module === mod);
                          if (!perm) return null;

                          return (
                            <tr
                              key={mod}
                              className={idx % 2 === 0 ? 'bg-white' : 'bg-surface-50/50'}
                            >
                              <td className="py-2 px-3 font-medium text-text-primary">
                                {MODULE_LABELS[mod]}
                              </td>
                              <td className="py-2 px-3 text-center">
                                <input
                                  type="checkbox"
                                  checked={perm.canView}
                                  disabled={isSuperAdmin}
                                  onChange={() => togglePermission(role, mod, 'canView')}
                                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer disabled:cursor-not-allowed"
                                />
                              </td>
                              <td className="py-2 px-3 text-center">
                                <input
                                  type="checkbox"
                                  checked={perm.canEdit}
                                  disabled={isSuperAdmin}
                                  onChange={() => togglePermission(role, mod, 'canEdit')}
                                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer disabled:cursor-not-allowed"
                                />
                              </td>
                              <td className="py-2 px-3">
                                <MultiSelect
                                  options={companies.map((c) => ({ value: c.id, label: c.name }))}
                                  selected={perm.companyIds}
                                  onChange={(vals) => updateScope(role, mod, 'companyIds', vals)}
                                  placeholder="All Companies"
                                  disabled={isSuperAdmin}
                                />
                              </td>
                              <td className="py-2 px-3">
                                <MultiSelect
                                  options={departments
                                    .filter(
                                      (d) =>
                                        perm.companyIds.length === 0 ||
                                        perm.companyIds.includes(d.companyId)
                                    )
                                    .map((d) => ({ value: d.id, label: d.name }))}
                                  selected={perm.departmentIds}
                                  onChange={(vals) => updateScope(role, mod, 'departmentIds', vals)}
                                  placeholder="All Departments"
                                  disabled={isSuperAdmin}
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {/* Messages */}
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

      {/* Save Button */}
      <div className="flex justify-end pt-2 border-t">
        <Button
          onClick={handleSave}
          disabled={saving || !hasChanges}
          className="gap-2"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Save Permissions
        </Button>
      </div>
    </div>
  );
}

// ---------- MultiSelect dropdown component ----------

interface MultiSelectProps {
  options: { value: string; label: string }[];
  selected: string[];
  onChange: (values: string[]) => void;
  placeholder: string;
  disabled?: boolean;
}

function MultiSelect({ options, selected, onChange, placeholder, disabled }: MultiSelectProps) {
  const [open, setOpen] = useState(false);

  const toggle = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  const selectedLabels = options
    .filter((o) => selected.includes(o.value))
    .map((o) => o.label);

  return (
    <div className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen(!open)}
        className="w-full flex items-center justify-between text-xs border rounded px-2 py-1.5 bg-white hover:bg-surface-50 disabled:opacity-50 disabled:cursor-not-allowed min-h-[30px] text-left"
      >
        <span className={selected.length === 0 ? 'text-text-secondary' : 'text-text-primary'}>
          {selected.length === 0
            ? placeholder
            : selectedLabels.length <= 2
            ? selectedLabels.join(', ')
            : `${selectedLabels.length} selected`}
        </span>
        <ChevronDown className="h-3 w-3 text-text-secondary ml-1 flex-shrink-0" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute z-20 top-full mt-1 left-0 w-56 bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto">
            {options.length === 0 ? (
              <div className="px-3 py-2 text-xs text-text-secondary">No options</div>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => {
                    onChange([]);
                    setOpen(false);
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs text-primary hover:bg-primary-50 border-b"
                >
                  Clear all (= All)
                </button>
                {options.map((opt) => (
                  <label
                    key={opt.value}
                    className="flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-surface-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selected.includes(opt.value)}
                      onChange={() => toggle(opt.value)}
                      className="h-3.5 w-3.5 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    {opt.label}
                  </label>
                ))}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
