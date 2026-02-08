'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import {
  ArrowLeft,
  ArrowRight,
  Briefcase,
  Send,
  Calendar,
  Users,
  Building2,
  GanttChart,
  Plus,
  Trash2,
  GripVertical,
  ChevronRight,
  Clock,
  Target,
  Flag,
  Check,
  AlertTriangle,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Zap,
  ListChecks,
  UserPlus,
  X,
  Search,
  Sparkles,
  FileText,
  Eye,
  Loader2,
  CheckCircle2,
  Circle,
  Hash,
  TrendingUp,
  Activity,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Badge,
} from '@/components/ui';
import { createProject, getCompaniesForSelect, getDepartmentsForSelect, getUsersForSelect, createMilestone, addProjectMember } from '@/actions/projects';

// ==========================================
// CONSTANTS & TYPES
// ==========================================

const STEPS = [
  { id: 1, label: 'Project Info', icon: Briefcase, description: 'Basic details' },
  { id: 2, label: 'Team', icon: Users, description: 'Add members' },
  { id: 3, label: 'Timeline', icon: GanttChart, description: 'Phases & deliverables' },
  { id: 4, label: 'Review', icon: Eye, description: 'Confirm & create' },
];

const PROJECT_STATUSES = [
  { value: 'PLANNED', label: 'Planned', color: 'bg-blue-100 text-blue-700', dot: 'bg-blue-500' },
  { value: 'ACTIVE', label: 'Active', color: 'bg-green-100 text-green-700', dot: 'bg-green-500' },
  { value: 'ON_HOLD', label: 'On Hold', color: 'bg-orange-100 text-orange-700', dot: 'bg-orange-500' },
];

const MEMBER_ROLES = [
  'Project Lead',
  'Developer',
  'Designer',
  'QA Engineer',
  'Business Analyst',
  'Scrum Master',
  'Consultant',
  'Stakeholder',
  'Member',
];

const GANTT_TEMPLATES = [
  {
    id: 'software',
    name: 'Software Development',
    description: 'Agile/Waterfall software project',
    icon: '💻',
    phases: [
      { name: 'Requirements & Planning', duration: 2, color: 'bg-blue-500' },
      { name: 'Design & Architecture', duration: 2, color: 'bg-purple-500' },
      { name: 'Development Sprint 1', duration: 3, color: 'bg-green-500' },
      { name: 'Development Sprint 2', duration: 3, color: 'bg-green-500' },
      { name: 'Testing & QA', duration: 2, color: 'bg-orange-500' },
      { name: 'Deployment & Launch', duration: 1, color: 'bg-red-500' },
    ],
  },
  {
    id: 'construction',
    name: 'Construction',
    description: 'Building & infrastructure',
    icon: '🏗️',
    phases: [
      { name: 'Site Survey & Permits', duration: 2, color: 'bg-gray-500' },
      { name: 'Foundation Work', duration: 3, color: 'bg-yellow-600' },
      { name: 'Structural Work', duration: 4, color: 'bg-orange-500' },
      { name: 'MEP Installation', duration: 3, color: 'bg-blue-500' },
      { name: 'Finishing', duration: 3, color: 'bg-purple-500' },
      { name: 'Inspection & Handover', duration: 1, color: 'bg-green-500' },
    ],
  },
  {
    id: 'marketing',
    name: 'Marketing Campaign',
    description: 'Campaign planning & execution',
    icon: '📢',
    phases: [
      { name: 'Market Research', duration: 1, color: 'bg-indigo-500' },
      { name: 'Strategy Development', duration: 1, color: 'bg-blue-500' },
      { name: 'Content Creation', duration: 2, color: 'bg-purple-500' },
      { name: 'Campaign Launch', duration: 1, color: 'bg-green-500' },
      { name: 'Monitoring & Optimization', duration: 3, color: 'bg-orange-500' },
      { name: 'Analysis & Reporting', duration: 1, color: 'bg-red-500' },
    ],
  },
  {
    id: 'product',
    name: 'Product Launch',
    description: 'New product development',
    icon: '🚀',
    phases: [
      { name: 'Ideation & Research', duration: 2, color: 'bg-pink-500' },
      { name: 'Prototype Development', duration: 3, color: 'bg-blue-500' },
      { name: 'Testing & Iteration', duration: 2, color: 'bg-yellow-500' },
      { name: 'Manufacturing Setup', duration: 2, color: 'bg-gray-500' },
      { name: 'Marketing Prep', duration: 2, color: 'bg-purple-500' },
      { name: 'Launch & Distribution', duration: 1, color: 'bg-green-500' },
    ],
  },
  {
    id: 'custom',
    name: 'Custom',
    description: 'Build from scratch',
    icon: '⚙️',
    phases: [],
  },
];

const PHASE_COLORS = [
  { value: 'bg-blue-500', label: 'Blue', hex: '#3b82f6' },
  { value: 'bg-green-500', label: 'Green', hex: '#22c55e' },
  { value: 'bg-purple-500', label: 'Purple', hex: '#a855f7' },
  { value: 'bg-orange-500', label: 'Orange', hex: '#f97316' },
  { value: 'bg-red-500', label: 'Red', hex: '#ef4444' },
  { value: 'bg-yellow-500', label: 'Yellow', hex: '#eab308' },
  { value: 'bg-yellow-600', label: 'Amber', hex: '#ca8a04' },
  { value: 'bg-pink-500', label: 'Pink', hex: '#ec4899' },
  { value: 'bg-indigo-500', label: 'Indigo', hex: '#6366f1' },
  { value: 'bg-gray-500', label: 'Gray', hex: '#6b7280' },
  { value: 'bg-cyan-500', label: 'Cyan', hex: '#06b6d4' },
];

interface Phase {
  name: string;
  duration: number;
  color: string;
}

interface TeamMember {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

interface Deliverable {
  id: string;
  name: string;
  description: string;
}

interface CompanyOption {
  id: string;
  name: string;
  shortName: string | null;
}

interface DeptOption {
  id: string;
  name: string;
  code: string;
}

interface UserOption {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

// ==========================================
// STEP INDICATOR
// ==========================================

function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex items-center justify-between mb-8">
      {STEPS.map((step, index) => {
        const StepIcon = step.icon;
        const isActive = currentStep === step.id;
        const isCompleted = currentStep > step.id;

        return (
          <div key={step.id} className="flex items-center flex-1 last:flex-initial">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                  isCompleted
                    ? 'bg-green-500 text-white shadow-md'
                    : isActive
                    ? 'bg-primary text-white shadow-lg ring-4 ring-primary/20'
                    : 'bg-gray-100 text-gray-400'
                }`}
              >
                {isCompleted ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <StepIcon className="w-5 h-5" />
                )}
              </div>
              <div className="hidden sm:block">
                <p
                  className={`text-sm font-semibold ${
                    isActive ? 'text-primary' : isCompleted ? 'text-green-600' : 'text-gray-400'
                  }`}
                >
                  {step.label}
                </p>
                <p className="text-xs text-gray-400">{step.description}</p>
              </div>
            </div>
            {index < STEPS.length - 1 && (
              <div
                className={`flex-1 h-0.5 mx-4 rounded transition-colors ${
                  isCompleted ? 'bg-green-500' : 'bg-gray-200'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ==========================================
// MAIN COMPONENT
// ==========================================

export default function CreateProjectPage() {
  const router = useRouter();
  const { data: session } = useSession();

  // Wizard state
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Data sources
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [departments, setDepartments] = useState<DeptOption[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);

  // Step 1: Project Info
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [ownerId, setOwnerId] = useState('');
  const [status, setStatus] = useState('PLANNED');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [budget, setBudget] = useState('');
  const [autoCodeEnabled, setAutoCodeEnabled] = useState(true);
  const [autoCodeLoading, setAutoCodeLoading] = useState(false);

  // Step 2: Team Members
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [memberSearch, setMemberSearch] = useState('');
  const [memberRole, setMemberRole] = useState('Member');

  // Step 3: Timeline
  const [selectedTemplate, setSelectedTemplate] = useState('software');
  const [phases, setPhases] = useState<Phase[]>(GANTT_TEMPLATES[0].phases);
  const [showGanttPreview, setShowGanttPreview] = useState(true);
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const [newDeliverable, setNewDeliverable] = useState('');

  // Load initial data
  useEffect(() => {
    async function loadData() {
      const [companiesData, usersData] = await Promise.all([
        getCompaniesForSelect(),
        getUsersForSelect(),
      ]);
      setCompanies(companiesData);
      setUsers(usersData);
    }
    loadData();
  }, []);

  // Load departments when company changes
  useEffect(() => {
    async function loadDepts() {
      if (companyId) {
        const depts = await getDepartmentsForSelect(companyId);
        setDepartments(depts);
      } else {
        setDepartments([]);
      }
    }
    loadDepts();
  }, [companyId]);

  // Auto-generate code when company changes
  useEffect(() => {
    if (autoCodeEnabled && companyId) {
      generateProjectCode();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId, autoCodeEnabled]);

  const generateProjectCode = async () => {
    if (!companyId) return;
    setAutoCodeLoading(true);
    try {
      const company = companies.find((c) => c.id === companyId);
      const prefix = company?.shortName || company?.name?.substring(0, 3).toUpperCase() || 'PRJ';
      const res = await fetch(`/api/projects?companyId=${companyId}&limit=1000`);
      const data = await res.json();
      const count = (data.pagination?.total || 0) + 1;
      const newCode = `${prefix}-${String(count).padStart(3, '0')}`;
      setCode(newCode);
    } catch {
      setCode('PRJ-001');
    } finally {
      setAutoCodeLoading(false);
    }
  };

  // ---- Timeline helpers ----
  const getTotalDuration = () => phases.reduce((sum, p) => sum + p.duration, 0);

  const calculateEndDate = useCallback(() => {
    if (!startDate) return null;
    const start = new Date(startDate);
    const totalWeeks = phases.reduce((sum, p) => sum + p.duration, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + totalWeeks * 7);
    return end;
  }, [startDate, phases]);

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = GANTT_TEMPLATES.find((t) => t.id === templateId);
    if (template) setPhases([...template.phases]);
  };

  const addPhase = () => {
    setPhases([...phases, { name: 'New Phase', duration: 1, color: 'bg-gray-500' }]);
  };

  const updatePhase = (index: number, field: keyof Phase, value: string | number) => {
    const updated = [...phases];
    updated[index] = { ...updated[index], [field]: value };
    setPhases(updated);
  };

  const removePhase = (index: number) => {
    setPhases(phases.filter((_, i) => i !== index));
  };

  // ---- Team helpers ----
  const filteredUsers = useMemo(() => {
    const addedIds = new Set(teamMembers.map((m) => m.userId));
    if (ownerId) addedIds.add(ownerId);
    return users.filter(
      (u) =>
        !addedIds.has(u.id) &&
        (memberSearch === '' ||
          `${u.firstName} ${u.lastName}`.toLowerCase().includes(memberSearch.toLowerCase()) ||
          u.email.toLowerCase().includes(memberSearch.toLowerCase()))
    );
  }, [users, teamMembers, ownerId, memberSearch]);

  const addTeamMember = (user: UserOption) => {
    setTeamMembers([
      ...teamMembers,
      {
        userId: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: memberRole,
      },
    ]);
    setMemberSearch('');
    setMemberRole('Member');
  };

  const removeTeamMember = (userId: string) => {
    setTeamMembers(teamMembers.filter((m) => m.userId !== userId));
  };

  const updateMemberRole = (userId: string, role: string) => {
    setTeamMembers(teamMembers.map((m) => (m.userId === userId ? { ...m, role } : m)));
  };

  // ---- Deliverables ----
  const addDeliverable = () => {
    if (!newDeliverable.trim()) return;
    setDeliverables([
      ...deliverables,
      { id: crypto.randomUUID(), name: newDeliverable.trim(), description: '' },
    ]);
    setNewDeliverable('');
  };

  const removeDeliverable = (id: string) => {
    setDeliverables(deliverables.filter((d) => d.id !== id));
  };

  // ---- Risk calculation ----
  const riskLevel = useMemo(() => {
    let score = 0;
    const totalWeeks = getTotalDuration();
    const budgetNum = parseFloat(budget) || 0;

    if (totalWeeks > 24) score += 3;
    else if (totalWeeks > 16) score += 2;
    else if (totalWeeks > 8) score += 1;

    if (teamMembers.length === 0) score += 2;
    else if (teamMembers.length < 2) score += 1;

    if (budgetNum > 5000000) score += 2;
    else if (budgetNum > 1000000) score += 1;

    if (phases.length > 8) score += 2;
    else if (phases.length > 5) score += 1;

    if (score <= 2) return { label: 'Low', color: 'text-green-600', bg: 'bg-green-100', icon: ShieldCheck, value: score };
    if (score <= 5) return { label: 'Medium', color: 'text-amber-600', bg: 'bg-amber-100', icon: Shield, value: score };
    if (score <= 7) return { label: 'High', color: 'text-orange-600', bg: 'bg-orange-100', icon: ShieldAlert, value: score };
    return { label: 'Critical', color: 'text-red-600', bg: 'bg-red-100', icon: AlertTriangle, value: score };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phases, teamMembers, budget]);

  // ---- Navigation ----
  const canProceed = (step: number) => {
    switch (step) {
      case 1:
        return code.trim() && name.trim() && companyId && ownerId;
      case 2:
        return true;
      case 3:
        return true;
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (currentStep < 4 && canProceed(currentStep)) {
      setCurrentStep(currentStep + 1);
      setError(null);
    } else if (!canProceed(currentStep)) {
      setError('Please fill in all required fields before proceeding.');
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setError(null);
    }
  };

  // ---- Submit ----
  const handleSubmit = async () => {
    if (!session?.user?.id) {
      setError('You must be logged in to create a project');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const calculatedEnd = endDate ? new Date(endDate) : calculateEndDate();

      const project = await createProject({
        code: code.trim(),
        name: name.trim(),
        description: description.trim() || undefined,
        status: status as any,
        startDate: startDate ? new Date(startDate) : null,
        endDate: calculatedEnd || null,
        budget: budget ? parseFloat(budget) : null,
        companyId,
        departmentId: departmentId || null,
        ownerId,
      });

      if (project) {
        // Create milestones from phases
        if (phases.length > 0 && startDate) {
          let currentDate = new Date(startDate);
          for (const phase of phases) {
            const dueDate = new Date(currentDate);
            dueDate.setDate(dueDate.getDate() + phase.duration * 7);
            await createMilestone(project.id, {
              name: phase.name,
              description: `Phase duration: ${phase.duration} week(s)`,
              dueDate,
            });
            currentDate = dueDate;
          }
        }

        // Create milestones from deliverables
        for (const deliverable of deliverables) {
          await createMilestone(project.id, {
            name: `📦 ${deliverable.name}`,
            description: deliverable.description || 'Project deliverable',
          });
        }

        // Add team members
        for (const member of teamMembers) {
          try {
            await addProjectMember(project.id, member.userId, member.role);
          } catch {
            // Continue even if a member add fails
          }
        }

        router.push('/projects');
        router.refresh();
      } else {
        setError('Failed to create project. Please try again.');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ---- Helpers for review ----
  const selectedCompany = companies.find((c) => c.id === companyId);
  const selectedDept = departments.find((d) => d.id === departmentId);
  const selectedOwner = users.find((u) => u.id === ownerId);
  const statusInfo = PROJECT_STATUSES.find((s) => s.value === status);
  const RiskIcon = riskLevel.icon;

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="page-header">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/projects">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="page-title flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-primary" />
              Create New Project
            </h1>
            <p className="page-description">
              Step {currentStep} of {STEPS.length} — {STEPS[currentStep - 1].label}
            </p>
          </div>
        </div>
      </div>

      {/* Step Indicator */}
      <StepIndicator currentStep={currentStep} />

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content — 2 cols */}
        <div className="lg:col-span-2 space-y-6">
          {/* ========== STEP 1: PROJECT INFO ========== */}
          {currentStep === 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-primary" />
                  Project Information
                </CardTitle>
                <CardDescription>Fill in the basic project details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Code and Name */}
                <div className="grid gap-4 sm:grid-cols-4">
                  <div className="space-y-2">
                    <Label htmlFor="code">
                      Project Code *
                    </Label>
                    <div className="relative">
                      <Input
                        id="code"
                        placeholder="PRJ-001"
                        value={code}
                        onChange={(e) => {
                          setCode(e.target.value);
                          setAutoCodeEnabled(false);
                        }}
                        className={autoCodeLoading ? 'pr-8' : ''}
                      />
                      {autoCodeLoading && (
                        <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-gray-400" />
                      )}
                    </div>
                    {autoCodeEnabled && companyId && (
                      <p className="text-xs text-green-600 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> Auto-generated
                      </p>
                    )}
                    {!autoCodeEnabled && (
                      <button
                        type="button"
                        className="text-xs text-primary hover:underline"
                        onClick={() => {
                          setAutoCodeEnabled(true);
                          generateProjectCode();
                        }}
                      >
                        Re-generate automatically
                      </button>
                    )}
                  </div>
                  <div className="sm:col-span-3 space-y-2">
                    <Label htmlFor="name">Project Name *</Label>
                    <Input
                      id="name"
                      placeholder="Enter project name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <textarea
                    id="description"
                    rows={3}
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                    placeholder="Describe the project objectives, scope, and deliverables..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                {/* Company and Department */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Company *</Label>
                    <Select value={companyId} onValueChange={(v) => setCompanyId(v)}>
                      <SelectTrigger className={!companyId ? 'text-gray-400' : ''}>
                        <SelectValue placeholder="Select company" />
                      </SelectTrigger>
                      <SelectContent>
                        {companies.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.shortName ? `${c.shortName} — ${c.name}` : c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Department</Label>
                    <Select
                      value={departmentId || 'none'}
                      onValueChange={(v) => setDepartmentId(v === 'none' ? '' : v)}
                      disabled={!companyId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No Department</SelectItem>
                        {departments.map((d) => (
                          <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Owner and Status */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Project Owner *</Label>
                    <Select value={ownerId} onValueChange={(v) => setOwnerId(v)}>
                      <SelectTrigger className={!ownerId ? 'text-gray-400' : ''}>
                        <SelectValue placeholder="Select owner" />
                      </SelectTrigger>
                      <SelectContent>
                        {users.map((u) => (
                          <SelectItem key={u.id} value={u.id}>
                            {u.firstName} {u.lastName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Initial Status</Label>
                    <Select value={status} onValueChange={(v) => setStatus(v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PROJECT_STATUSES.map((s) => (
                          <SelectItem key={s.value} value={s.value}>
                            <div className="flex items-center gap-2">
                              <span className={`w-2 h-2 rounded-full ${s.dot}`} />
                              {s.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Dates and Budget */}
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endDate">End Date</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                    {calculateEndDate() && !endDate && (
                      <p className="text-xs text-amber-600 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Auto: {calculateEndDate()?.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="budget">Budget (₹)</Label>
                    <Input
                      id="budget"
                      type="number"
                      min="0"
                      step="1000"
                      placeholder="e.g., 500000"
                      value={budget}
                      onChange={(e) => setBudget(e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ========== STEP 2: TEAM MEMBERS ========== */}
          {currentStep === 2 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Team Members
                </CardTitle>
                <CardDescription>
                  Add team members and assign roles. The project owner ({selectedOwner?.firstName} {selectedOwner?.lastName}) is automatically included.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Owner badge */}
                {selectedOwner && (
                  <div className="flex items-center gap-3 p-3 bg-primary/5 border border-primary/20 rounded-lg">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                      {selectedOwner.firstName[0]}{selectedOwner.lastName[0]}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{selectedOwner.firstName} {selectedOwner.lastName}</p>
                      <p className="text-xs text-gray-500">{selectedOwner.email}</p>
                    </div>
                    <Badge className="bg-primary/10 text-primary border-0">Owner</Badge>
                  </div>
                )}

                {/* Add member */}
                <div className="border border-gray-200 rounded-lg p-4 space-y-3">
                  <Label className="flex items-center gap-2">
                    <UserPlus className="w-4 h-4" />
                    Add Team Member
                  </Label>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="sm:col-span-2 relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        placeholder="Search by name or email..."
                        value={memberSearch}
                        onChange={(e) => setMemberSearch(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                    <Select value={memberRole} onValueChange={setMemberRole}>
                      <SelectTrigger>
                        <SelectValue placeholder="Role" />
                      </SelectTrigger>
                      <SelectContent>
                        {MEMBER_ROLES.map((r) => (
                          <SelectItem key={r} value={r}>{r}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Search results */}
                  {memberSearch && (
                    <div className="max-h-48 overflow-y-auto border border-gray-100 rounded-lg divide-y divide-gray-100">
                      {filteredUsers.length > 0 ? (
                        filteredUsers.slice(0, 8).map((user) => (
                          <button
                            key={user.id}
                            type="button"
                            onClick={() => addTeamMember(user)}
                            className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 transition-colors text-left"
                          >
                            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-medium text-xs">
                              {user.firstName[0]}{user.lastName[0]}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{user.firstName} {user.lastName}</p>
                              <p className="text-xs text-gray-400 truncate">{user.email}</p>
                            </div>
                            <Plus className="w-4 h-4 text-primary" />
                          </button>
                        ))
                      ) : (
                        <p className="px-3 py-4 text-sm text-gray-400 text-center">No matching employees found</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Added members */}
                {teamMembers.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm text-gray-600">
                      Team ({teamMembers.length} member{teamMembers.length !== 1 ? 's' : ''})
                    </Label>
                    <div className="space-y-2">
                      {teamMembers.map((member) => (
                        <div
                          key={member.userId}
                          className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg group"
                        >
                          <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-semibold text-xs">
                            {member.firstName[0]}{member.lastName[0]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">{member.firstName} {member.lastName}</p>
                            <p className="text-xs text-gray-400">{member.email}</p>
                          </div>
                          <Select
                            value={member.role}
                            onValueChange={(v) => updateMemberRole(member.userId, v)}
                          >
                            <SelectTrigger className="w-40 h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {MEMBER_ROLES.map((r) => (
                                <SelectItem key={r} value={r}>{r}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <button
                            type="button"
                            onClick={() => removeTeamMember(member.userId)}
                            className="p-1.5 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {teamMembers.length === 0 && !memberSearch && (
                  <div className="text-center py-8 text-gray-400">
                    <Users className="w-10 h-10 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">No team members added yet</p>
                    <p className="text-xs mt-1">Search for employees above to add them to the project</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* ========== STEP 3: TIMELINE & DELIVERABLES ========== */}
          {currentStep === 3 && (
            <div className="space-y-6">
              {/* Gantt Templates */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <GanttChart className="h-5 w-5 text-primary" />
                        Project Timeline
                      </CardTitle>
                      <CardDescription>Select a template or create custom phases</CardDescription>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowGanttPreview(!showGanttPreview)}
                    >
                      {showGanttPreview ? 'Hide Preview' : 'Show Preview'}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Template Selection */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {GANTT_TEMPLATES.map((template) => (
                      <button
                        key={template.id}
                        type="button"
                        onClick={() => handleTemplateChange(template.id)}
                        className={`p-3 rounded-lg border text-left transition-all ${
                          selectedTemplate === template.id
                            ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                            : 'border-gray-200 hover:border-primary/50'
                        }`}
                      >
                        <p className="text-lg mb-1">{template.icon}</p>
                        <p className="font-medium text-sm">{template.name}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {template.phases.length > 0 ? `${template.phases.length} phases` : 'Empty'}
                        </p>
                      </button>
                    ))}
                  </div>

                  {/* Gantt Preview */}
                  {showGanttPreview && phases.length > 0 && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-100">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-sm flex items-center gap-2">
                          <Activity className="w-4 h-4 text-primary" />
                          Timeline Preview
                        </h4>
                        <Badge variant="outline">{getTotalDuration()} weeks total</Badge>
                      </div>
                      <div className="space-y-1.5">
                        {phases.map((phase, index) => {
                          const totalDuration = getTotalDuration();
                          const widthPercent = (phase.duration / totalDuration) * 100;
                          const previousDuration = phases.slice(0, index).reduce((sum, p) => sum + p.duration, 0);
                          const leftPercent = (previousDuration / totalDuration) * 100;

                          return (
                            <div key={index} className="relative h-7">
                              <div
                                className={`absolute h-full rounded-md ${phase.color} flex items-center px-2 text-white text-xs font-medium overflow-hidden shadow-sm`}
                                style={{ left: `${leftPercent}%`, width: `${widthPercent}%`, minWidth: '50px' }}
                              >
                                <span className="truncate">{phase.name}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <div className="flex justify-between mt-2 text-xs text-gray-400">
                        <span>Week 1</span>
                        <span>Week {getTotalDuration()}</span>
                      </div>
                    </div>
                  )}

                  {/* Phase Editor */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="flex items-center gap-2">
                        <ListChecks className="w-4 h-4" />
                        Project Phases
                      </Label>
                      <Button type="button" variant="outline" size="sm" onClick={addPhase}>
                        <Plus className="h-4 w-4 mr-1" /> Add Phase
                      </Button>
                    </div>

                    <div className="space-y-2">
                      {phases.map((phase, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 p-2.5 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                        >
                          <GripVertical className="h-4 w-4 text-gray-300 cursor-move flex-shrink-0" />
                          <div
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: PHASE_COLORS.find((c) => c.value === phase.color)?.hex || '#6b7280' }}
                          />
                          <Input
                            value={phase.name}
                            onChange={(e) => updatePhase(index, 'name', e.target.value)}
                            className="flex-1 h-8 text-sm"
                            placeholder="Phase name"
                          />
                          <div className="flex items-center gap-1">
                            <Input
                              type="number"
                              min="1"
                              value={phase.duration}
                              onChange={(e) => updatePhase(index, 'duration', parseInt(e.target.value) || 1)}
                              className="w-14 h-8 text-center text-sm"
                            />
                            <span className="text-xs text-gray-400 w-10">weeks</span>
                          </div>
                          <select
                            value={phase.color}
                            onChange={(e) => updatePhase(index, 'color', e.target.value)}
                            className="w-20 rounded border border-gray-200 px-1.5 py-1 text-xs h-8"
                          >
                            {PHASE_COLORS.map((c) => (
                              <option key={c.value} value={c.value}>{c.label}</option>
                            ))}
                          </select>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => removePhase(index)}
                            className="text-gray-300 hover:text-red-500"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ))}

                      {phases.length === 0 && (
                        <div className="text-center py-6 border-2 border-dashed border-gray-200 rounded-lg text-gray-400">
                          <GanttChart className="w-8 h-8 mx-auto mb-2 opacity-40" />
                          <p className="text-sm">No phases defined</p>
                          <Button type="button" variant="outline" size="sm" className="mt-2" onClick={addPhase}>
                            <Plus className="h-4 w-4 mr-1" /> Add First Phase
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Deliverables */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    Key Deliverables
                  </CardTitle>
                  <CardDescription>Define tangible outputs for this project</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="e.g., Final design mockups, API documentation, User manual..."
                      value={newDeliverable}
                      onChange={(e) => setNewDeliverable(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addDeliverable();
                        }
                      }}
                      className="flex-1"
                    />
                    <Button type="button" variant="outline" onClick={addDeliverable} disabled={!newDeliverable.trim()}>
                      <Plus className="h-4 w-4 mr-1" /> Add
                    </Button>
                  </div>

                  {deliverables.length > 0 ? (
                    <div className="space-y-2">
                      {deliverables.map((d, i) => (
                        <div
                          key={d.id}
                          className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-100 rounded-lg group"
                        >
                          <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                            {i + 1}
                          </div>
                          <span className="flex-1 text-sm font-medium">{d.name}</span>
                          <button
                            type="button"
                            onClick={() => removeDeliverable(d.id)}
                            className="p-1 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 border-2 border-dashed border-gray-200 rounded-lg text-gray-400">
                      <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
                      <p className="text-sm">No deliverables added yet</p>
                      <p className="text-xs mt-1">These will be saved as milestones</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* ========== STEP 4: REVIEW ========== */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5 text-primary" />
                    Review &amp; Create
                  </CardTitle>
                  <CardDescription>Review all details before creating the project</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Project Summary */}
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Hash className="w-4 h-4 text-primary" />
                          <span className="text-sm font-mono text-primary">{code}</span>
                        </div>
                        <h3 className="text-lg font-bold">{name || 'Untitled Project'}</h3>
                        {description && (
                          <p className="text-sm text-gray-500 mt-1 line-clamp-2">{description}</p>
                        )}
                      </div>
                      {statusInfo && (
                        <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-3 border-t border-gray-200">
                      <div>
                        <p className="text-xs text-gray-400 uppercase tracking-wider">Company</p>
                        <p className="text-sm font-medium mt-1">{selectedCompany?.shortName || selectedCompany?.name || '—'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 uppercase tracking-wider">Department</p>
                        <p className="text-sm font-medium mt-1">{selectedDept?.name || '—'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 uppercase tracking-wider">Owner</p>
                        <p className="text-sm font-medium mt-1">
                          {selectedOwner ? `${selectedOwner.firstName} ${selectedOwner.lastName}` : '—'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 uppercase tracking-wider">Budget</p>
                        <p className="text-sm font-medium mt-1">
                          {budget ? `₹${parseFloat(budget).toLocaleString('en-IN')}` : '—'}
                        </p>
                      </div>
                    </div>

                    {(startDate || endDate || calculateEndDate()) && (
                      <div className="flex items-center gap-4 pt-3 border-t border-gray-200">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <div className="flex items-center gap-2 text-sm">
                          <span>{startDate ? new Date(startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'TBD'}</span>
                          <ArrowRight className="w-4 h-4 text-gray-300" />
                          <span>
                            {endDate
                              ? new Date(endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                              : calculateEndDate()
                              ? calculateEndDate()!.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) + ' (auto)'
                              : 'TBD'}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Team Summary */}
                  <div>
                    <h4 className="text-sm font-semibold flex items-center gap-2 mb-3">
                      <Users className="w-4 h-4 text-primary" />
                      Team ({1 + teamMembers.length})
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedOwner && (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/5 border border-primary/20 rounded-full text-sm">
                          <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                            {selectedOwner.firstName[0]}{selectedOwner.lastName[0]}
                          </div>
                          <span className="font-medium">{selectedOwner.firstName}</span>
                          <Badge className="h-4 text-[10px] bg-primary/10 text-primary border-0">Owner</Badge>
                        </div>
                      )}
                      {teamMembers.map((m) => (
                        <div key={m.userId} className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-full text-sm">
                          <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold text-xs">
                            {m.firstName[0]}{m.lastName[0]}
                          </div>
                          <span className="font-medium">{m.firstName}</span>
                          <Badge variant="outline" className="h-4 text-[10px]">{m.role}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Timeline Summary */}
                  {phases.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold flex items-center gap-2 mb-3">
                        <GanttChart className="w-4 h-4 text-primary" />
                        Timeline ({phases.length} phases, {getTotalDuration()} weeks)
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {phases.map((p, i) => (
                          <div key={i} className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-50 border border-gray-200 rounded-md text-xs">
                            <div
                              className="w-2.5 h-2.5 rounded-full"
                              style={{ backgroundColor: PHASE_COLORS.find((c) => c.value === p.color)?.hex || '#6b7280' }}
                            />
                            <span className="font-medium">{p.name}</span>
                            <span className="text-gray-400">({p.duration}w)</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Deliverables Summary */}
                  {deliverables.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold flex items-center gap-2 mb-3">
                        <FileText className="w-4 h-4 text-primary" />
                        Deliverables ({deliverables.length})
                      </h4>
                      <div className="space-y-1.5">
                        {deliverables.map((d) => (
                          <div key={d.id} className="flex items-center gap-2 text-sm">
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                            <span>{d.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between pt-2">
            <div>
              {currentStep > 1 && (
                <Button type="button" variant="outline" onClick={prevStep}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Previous
                </Button>
              )}
              {currentStep === 1 && (
                <Button type="button" variant="outline" asChild>
                  <Link href="/projects">Cancel</Link>
                </Button>
              )}
            </div>
            <div className="flex items-center gap-3">
              {currentStep < 4 ? (
                <Button type="button" onClick={nextStep} disabled={!canProceed(currentStep)}>
                  Next <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button type="button" onClick={handleSubmit} disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" /> Create Project
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* ========== SIDEBAR ========== */}
        <div className="space-y-6">
          {/* Progress Stats */}
          <Card className="bg-gradient-to-br from-primary/5 to-amber-50/50">
            <CardContent className="pt-6">
              <h3 className="text-sm font-semibold text-gray-600 mb-4">Project Snapshot</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Clock className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-primary">{getTotalDuration()}</p>
                    <p className="text-xs text-gray-400">Total Weeks</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Target className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-primary">{phases.length}</p>
                    <p className="text-xs text-gray-400">Phases</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-primary">{1 + teamMembers.length}</p>
                    <p className="text-xs text-gray-400">Team Members</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-primary">{deliverables.length}</p>
                    <p className="text-xs text-gray-400">Deliverables</p>
                  </div>
                </div>

                {calculateEndDate() && (
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Flag className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-primary">
                        {calculateEndDate()?.toLocaleDateString('en-IN', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                      <p className="text-xs text-gray-400">Est. Completion</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Risk Assessment */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                Risk Assessment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-2.5 rounded-lg ${riskLevel.bg}`}>
                  <RiskIcon className={`h-6 w-6 ${riskLevel.color}`} />
                </div>
                <div>
                  <p className={`text-lg font-bold ${riskLevel.color}`}>{riskLevel.label}</p>
                  <p className="text-xs text-gray-400">Risk Level</p>
                </div>
              </div>

              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">Timeline</span>
                  <div className="flex gap-0.5">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className={`w-6 h-1.5 rounded-full ${
                          getTotalDuration() > (i === 1 ? 8 : i === 2 ? 16 : 24)
                            ? 'bg-orange-400'
                            : 'bg-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">Team Size</span>
                  <div className="flex gap-0.5">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className={`w-6 h-1.5 rounded-full ${
                          teamMembers.length < i ? 'bg-orange-400' : 'bg-green-400'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">Complexity</span>
                  <div className="flex gap-0.5">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className={`w-6 h-1.5 rounded-full ${
                          phases.length > (i === 1 ? 3 : i === 2 ? 5 : 8)
                            ? 'bg-orange-400'
                            : 'bg-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">Budget</span>
                  <div className="flex gap-0.5">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className={`w-6 h-1.5 rounded-full ${
                          (parseFloat(budget) || 0) > (i === 1 ? 500000 : i === 2 ? 1000000 : 5000000)
                            ? 'bg-orange-400'
                            : 'bg-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contextual Tips */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">
                {currentStep === 1 && '💡 Project Tips'}
                {currentStep === 2 && '💡 Team Tips'}
                {currentStep === 3 && '💡 Timeline Tips'}
                {currentStep === 4 && '✅ Ready to Go'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {currentStep === 1 && (
                <>
                  <div className="flex gap-2">
                    <ChevronRight className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <p className="text-gray-500">Use clear, descriptive project names</p>
                  </div>
                  <div className="flex gap-2">
                    <ChevronRight className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <p className="text-gray-500">Set realistic start dates and budgets</p>
                  </div>
                  <div className="flex gap-2">
                    <ChevronRight className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <p className="text-gray-500">Project codes are auto-generated from company</p>
                  </div>
                </>
              )}
              {currentStep === 2 && (
                <>
                  <div className="flex gap-2">
                    <ChevronRight className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <p className="text-gray-500">Assign clear roles to every team member</p>
                  </div>
                  <div className="flex gap-2">
                    <ChevronRight className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <p className="text-gray-500">Keep teams small for better agility</p>
                  </div>
                  <div className="flex gap-2">
                    <ChevronRight className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <p className="text-gray-500">You can add more members after creation</p>
                  </div>
                </>
              )}
              {currentStep === 3 && (
                <>
                  <div className="flex gap-2">
                    <ChevronRight className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <p className="text-gray-500">Break down into manageable phases</p>
                  </div>
                  <div className="flex gap-2">
                    <ChevronRight className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <p className="text-gray-500">Add buffer time for unexpected delays</p>
                  </div>
                  <div className="flex gap-2">
                    <ChevronRight className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <p className="text-gray-500">Deliverables are saved as trackable milestones</p>
                  </div>
                </>
              )}
              {currentStep === 4 && (
                <>
                  <div className="flex gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                    <p className="text-gray-500">Review all details carefully</p>
                  </div>
                  <div className="flex gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                    <p className="text-gray-500">Click &quot;Create Project&quot; to finalize</p>
                  </div>
                  <div className="flex gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                    <p className="text-gray-500">Team members will be notified</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
