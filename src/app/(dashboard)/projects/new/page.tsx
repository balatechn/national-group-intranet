'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  ArrowLeft, 
  Briefcase, 
  Send, 
  Calendar, 
  Users, 
  Building2,
  DollarSign,
  GanttChart,
  Plus,
  Trash2,
  GripVertical,
  ChevronRight,
  Clock,
  Target,
  Flag,
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
import { createProjectSchema, type CreateProjectInput } from '@/validations';
import { createProject, getCompaniesForSelect, getDepartmentsForSelect, getUsersForSelect, createMilestone } from '@/actions/projects';

const projectStatuses = [
  { value: 'PLANNED', label: 'Planned', color: 'bg-blue-100 text-blue-700' },
  { value: 'ACTIVE', label: 'Active', color: 'bg-green-100 text-green-700' },
  { value: 'ON_HOLD', label: 'On Hold', color: 'bg-orange-100 text-orange-700' },
];

// Gantt Chart Templates
const ganttTemplates = [
  {
    id: 'software',
    name: 'Software Development',
    description: 'Agile/Waterfall software project phases',
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
    name: 'Construction Project',
    description: 'Building and infrastructure phases',
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
    description: 'Campaign planning and execution',
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
    description: 'New product development and launch',
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
    name: 'Custom Project',
    description: 'Create your own phases',
    phases: [],
  },
];

interface Phase {
  name: string;
  duration: number;
  color: string;
}

export default function CreateProjectPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [companies, setCompanies] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('software');
  const [phases, setPhases] = useState<Phase[]>(ganttTemplates[0].phases);
  const [showGanttPreview, setShowGanttPreview] = useState(true);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateProjectInput>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      status: 'PLANNED',
    },
  });

  const selectedCompanyId = watch('companyId');
  const selectedStatus = watch('status');
  const startDate = watch('startDate');

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

  useEffect(() => {
    async function loadDepartments() {
      if (selectedCompanyId) {
        const depts = await getDepartmentsForSelect(selectedCompanyId);
        setDepartments(depts);
      } else {
        setDepartments([]);
      }
    }
    loadDepartments();
  }, [selectedCompanyId]);

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = ganttTemplates.find(t => t.id === templateId);
    if (template) {
      setPhases([...template.phases]);
    }
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

  const getTotalDuration = () => phases.reduce((sum, p) => sum + p.duration, 0);

  const calculateEndDate = () => {
    if (!startDate) return null;
    const start = new Date(startDate);
    const totalWeeks = getTotalDuration();
    const end = new Date(start);
    end.setDate(end.getDate() + totalWeeks * 7);
    return end;
  };

  const onSubmit = async (data: CreateProjectInput) => {
    if (!session?.user?.id) {
      setError('You must be logged in to create a project');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Calculate end date from phases if not set
      const endDate = data.endDate || calculateEndDate();
      
      const project = await createProject({
        ...data,
        endDate,
      });

      if (project) {
        // Create milestones from phases
        if (phases.length > 0 && data.startDate) {
          let currentDate = new Date(data.startDate);
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

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="page-header">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/projects">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="page-title">Create New Project</h1>
            <p className="page-description">Plan and organize your project with Gantt chart templates</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {error && (
          <div className="rounded-md bg-danger-light p-3 text-sm text-danger-dark">
            {error}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-primary" />
                  Project Information
                </CardTitle>
                <CardDescription>Basic details about your project</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Code and Name Row */}
                <div className="grid gap-4 sm:grid-cols-4">
                  <div className="form-group">
                    <Label htmlFor="code" required>Project Code</Label>
                    <Input
                      id="code"
                      placeholder="PRJ-001"
                      error={errors.code?.message}
                      {...register('code')}
                    />
                  </div>
                  <div className="form-group sm:col-span-3">
                    <Label htmlFor="name" required>Project Name</Label>
                    <Input
                      id="name"
                      placeholder="Enter project name"
                      error={errors.name?.message}
                      {...register('name')}
                    />
                  </div>
                </div>

                {/* Description */}
                <div className="form-group">
                  <Label htmlFor="description">Description</Label>
                  <textarea
                    id="description"
                    rows={3}
                    className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="Describe the project objectives, scope, and deliverables"
                    {...register('description')}
                  />
                </div>

                {/* Company and Department */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="form-group">
                    <Label required>Company</Label>
                    <Select
                      value={selectedCompanyId}
                      onValueChange={(value) => setValue('companyId', value)}
                    >
                      <SelectTrigger className={errors.companyId ? 'border-danger' : ''}>
                        <SelectValue placeholder="Select company" />
                      </SelectTrigger>
                      <SelectContent>
                        {companies.map((company) => (
                          <SelectItem key={company.id} value={company.id}>
                            {company.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.companyId && (
                      <p className="text-sm text-danger">{errors.companyId.message}</p>
                    )}
                  </div>

                  <div className="form-group">
                    <Label>Department</Label>
                    <Select
                      value={watch('departmentId') || ''}
                      onValueChange={(value) => setValue('departmentId', value || null)}
                      disabled={!selectedCompanyId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.map((dept) => (
                          <SelectItem key={dept.id} value={dept.id}>
                            {dept.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Owner and Status */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="form-group">
                    <Label required>Project Owner</Label>
                    <Select
                      value={watch('ownerId')}
                      onValueChange={(value) => setValue('ownerId', value)}
                    >
                      <SelectTrigger className={errors.ownerId ? 'border-danger' : ''}>
                        <SelectValue placeholder="Select owner" />
                      </SelectTrigger>
                      <SelectContent>
                        {users.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.firstName} {user.lastName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.ownerId && (
                      <p className="text-sm text-danger">{errors.ownerId.message}</p>
                    )}
                  </div>

                  <div className="form-group">
                    <Label>Status</Label>
                    <Select
                      value={selectedStatus}
                      onValueChange={(value) => setValue('status', value as any)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        {projectStatuses.map((status) => (
                          <SelectItem key={status.value} value={status.value}>
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${status.color}`}>
                              {status.label}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Dates and Budget */}
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="form-group">
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input
                      id="startDate"
                      type="date"
                      {...register('startDate')}
                    />
                  </div>
                  <div className="form-group">
                    <Label htmlFor="endDate">End Date</Label>
                    <Input
                      id="endDate"
                      type="date"
                      {...register('endDate')}
                    />
                    {calculateEndDate() && !watch('endDate') && (
                      <p className="text-xs text-text-muted mt-1">
                        Calculated: {calculateEndDate()?.toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <div className="form-group">
                    <Label htmlFor="budget">Budget (₹)</Label>
                    <Input
                      id="budget"
                      type="number"
                      min="0"
                      step="1000"
                      placeholder="e.g., 500000"
                      {...register('budget')}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Gantt Chart Template */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <GanttChart className="h-5 w-5 text-primary" />
                      Project Timeline (Gantt Chart)
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
                  {ganttTemplates.map((template) => (
                    <button
                      key={template.id}
                      type="button"
                      onClick={() => handleTemplateChange(template.id)}
                      className={`p-3 rounded-lg border text-left transition-all ${
                        selectedTemplate === template.id
                          ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <p className="font-medium text-sm">{template.name}</p>
                      <p className="text-xs text-text-muted mt-1">{template.phases.length} phases</p>
                    </button>
                  ))}
                </div>

                {/* Gantt Chart Preview */}
                {showGanttPreview && phases.length > 0 && (
                  <div className="mt-4 p-4 bg-surface-100 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-sm">Timeline Preview</h4>
                      <span className="text-xs text-text-muted">
                        Total: {getTotalDuration()} weeks
                      </span>
                    </div>
                    <div className="space-y-2">
                      {phases.map((phase, index) => {
                        const totalDuration = getTotalDuration();
                        const widthPercent = (phase.duration / totalDuration) * 100;
                        const previousDuration = phases.slice(0, index).reduce((sum, p) => sum + p.duration, 0);
                        const leftPercent = (previousDuration / totalDuration) * 100;
                        
                        return (
                          <div key={index} className="relative h-8">
                            <div
                              className={`absolute h-full rounded ${phase.color} flex items-center px-2 text-white text-xs font-medium overflow-hidden`}
                              style={{
                                left: `${leftPercent}%`,
                                width: `${widthPercent}%`,
                                minWidth: '60px',
                              }}
                            >
                              <span className="truncate">{phase.name}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex justify-between mt-2 text-xs text-text-muted">
                      <span>Week 1</span>
                      <span>Week {getTotalDuration()}</span>
                    </div>
                  </div>
                )}

                {/* Phase Editor */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Project Phases</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addPhase}>
                      <Plus className="h-4 w-4 mr-1" />
                      Add Phase
                    </Button>
                  </div>
                  
                  <div className="space-y-2">
                    {phases.map((phase, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 p-2 bg-white border border-border rounded-lg"
                      >
                        <GripVertical className="h-4 w-4 text-text-muted cursor-move" />
                        <span className={`w-3 h-3 rounded ${phase.color}`} />
                        <Input
                          value={phase.name}
                          onChange={(e) => updatePhase(index, 'name', e.target.value)}
                          className="flex-1"
                          placeholder="Phase name"
                        />
                        <div className="flex items-center gap-1">
                          <Input
                            type="number"
                            min="1"
                            value={phase.duration}
                            onChange={(e) => updatePhase(index, 'duration', parseInt(e.target.value) || 1)}
                            className="w-16 text-center"
                          />
                          <span className="text-xs text-text-muted">weeks</span>
                        </div>
                        <select
                          value={phase.color}
                          onChange={(e) => updatePhase(index, 'color', e.target.value)}
                          className="w-20 rounded border border-border px-2 py-1 text-xs"
                        >
                          <option value="bg-blue-500">Blue</option>
                          <option value="bg-green-500">Green</option>
                          <option value="bg-purple-500">Purple</option>
                          <option value="bg-orange-500">Orange</option>
                          <option value="bg-red-500">Red</option>
                          <option value="bg-yellow-500">Yellow</option>
                          <option value="bg-pink-500">Pink</option>
                          <option value="bg-indigo-500">Indigo</option>
                          <option value="bg-gray-500">Gray</option>
                        </select>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removePhase(index)}
                          className="text-danger hover:text-danger"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Submit */}
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" asChild>
                <Link href="/projects">Cancel</Link>
              </Button>
              <Button type="submit" isLoading={isSubmitting}>
                <Send className="mr-2 h-4 w-4" />
                Create Project
              </Button>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <Card className="bg-gradient-to-br from-primary/5 to-secondary/5">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Clock className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-primary">{getTotalDuration()}</p>
                      <p className="text-xs text-text-muted">Total Weeks</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Target className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-primary">{phases.length}</p>
                      <p className="text-xs text-text-muted">Milestones</p>
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
                            year: 'numeric'
                          })}
                        </p>
                        <p className="text-xs text-text-muted">Est. Completion</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Template Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Selected Template</CardTitle>
              </CardHeader>
              <CardContent>
                {ganttTemplates.find(t => t.id === selectedTemplate) && (
                  <div>
                    <p className="font-medium">
                      {ganttTemplates.find(t => t.id === selectedTemplate)?.name}
                    </p>
                    <p className="text-sm text-text-secondary mt-1">
                      {ganttTemplates.find(t => t.id === selectedTemplate)?.description}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tips */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Project Planning Tips</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex gap-2">
                  <ChevronRight className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <p className="text-text-secondary">Break down large projects into manageable phases</p>
                </div>
                <div className="flex gap-2">
                  <ChevronRight className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <p className="text-text-secondary">Add buffer time for unexpected delays</p>
                </div>
                <div className="flex gap-2">
                  <ChevronRight className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <p className="text-text-secondary">Define clear milestones and deliverables</p>
                </div>
                <div className="flex gap-2">
                  <ChevronRight className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <p className="text-text-secondary">Assign realistic durations to each phase</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
