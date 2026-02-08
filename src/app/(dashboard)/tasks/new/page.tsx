'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, CheckSquare, Send, Calendar, User, Briefcase, Mail, Search, Users } from 'lucide-react';
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
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui';
import { createTaskSchema, type CreateTaskInput } from '@/validations';
import { createTask } from '@/actions/tasks';
import { getInitials } from '@/lib/utils';

const priorities = [
  { value: 'LOW', label: 'Low', description: 'No urgency, can be done when time permits', color: 'bg-gray-100 text-gray-700' },
  { value: 'MEDIUM', label: 'Medium', description: 'Normal priority, complete within normal timeframe', color: 'bg-blue-100 text-blue-700' },
  { value: 'HIGH', label: 'High', description: 'Important task, should be prioritized', color: 'bg-orange-100 text-orange-700' },
  { value: 'CRITICAL', label: 'Critical', description: 'Urgent, requires immediate attention', color: 'bg-red-100 text-red-700' },
];

const statuses = [
  { value: 'TODO', label: 'To Do' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'ON_HOLD', label: 'On Hold' },
];

interface UserOption {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar: string | null;
  department: { name: string } | null;
}

export default function CreateTaskPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);

  // Fetch users for assignment
  useEffect(() => {
    async function fetchData() {
      try {
        const [usersRes, projectsRes, deptsRes] = await Promise.all([
          fetch('/api/employees?limit=100'),
          fetch('/api/projects?limit=100'),
          fetch('/api/departments?limit=100'),
        ]);
        
        if (usersRes.ok) {
          const data = await usersRes.json();
          setUsers(data.employees || []);
        }
        if (projectsRes.ok) {
          const data = await projectsRes.json();
          setProjects(data.projects || []);
        }
        if (deptsRes.ok) {
          const data = await deptsRes.json();
          setDepartments(data.departments || []);
        }
      } catch (err) {
        console.error('Failed to fetch data:', err);
      } finally {
        setIsLoadingUsers(false);
      }
    }
    fetchData();
  }, []);

  // Filter users based on search
  const filteredUsers = users.filter(user => {
    const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
    const email = user.email.toLowerCase();
    const search = userSearch.toLowerCase();
    return fullName.includes(search) || email.includes(search);
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateTaskInput>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: {
      priority: 'MEDIUM',
      status: 'TODO',
    },
  });

  const selectedPriority = watch('priority');
  const selectedStatus = watch('status');
  const selectedAssigneeId = watch('assigneeId');
  const selectedProjectId = watch('projectId');
  const selectedDepartmentId = watch('departmentId');

  // Get selected user details for display
  const selectedUser = users.find(u => u.id === selectedAssigneeId);

  const onSubmit = async (data: CreateTaskInput) => {
    if (!session?.user?.id) {
      setError('You must be logged in to create a task');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await createTask(data, session.user.id);
      
      if (result) {
        router.push('/tasks');
        router.refresh();
      } else {
        setError('Failed to create task. Please try again.');
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
            <Link href="/tasks">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="page-title">Create New Task</h1>
            <p className="page-description">Add a new task to track your work</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckSquare className="h-5 w-5 text-primary" />
                Task Details
              </CardTitle>
              <CardDescription>
                Provide details about the task you want to create
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {error && (
                  <div className="rounded-md bg-danger-light p-3 text-sm text-danger-dark">
                    {error}
                  </div>
                )}

                {/* Title */}
                <div className="form-group">
                  <Label htmlFor="title" required>
                    Task Title
                  </Label>
                  <Input
                    id="title"
                    placeholder="Enter a clear, descriptive title"
                    error={errors.title?.message}
                    {...register('title')}
                  />
                </div>

                {/* Description */}
                <div className="form-group">
                  <Label htmlFor="description">
                    Description
                  </Label>
                  <textarea
                    id="description"
                    rows={4}
                    className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="Describe the task in detail, including any specific requirements or acceptance criteria"
                    {...register('description')}
                  />
                </div>

                {/* Assign To Section */}
                <div className="form-group">
                  <Label className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Assign To
                  </Label>
                  <p className="text-xs text-text-muted mb-2">
                    Select an employee to assign this task. They will receive an email notification.
                  </p>
                  <Select
                    value={selectedAssigneeId || 'none'}
                    onValueChange={(value) => setValue('assigneeId', value === 'none' ? undefined : value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Search and select assignee...">
                        {selectedUser && (
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={selectedUser.avatar || ''} />
                              <AvatarFallback className="text-xs">
                                {getInitials(`${selectedUser.firstName} ${selectedUser.lastName}`)}
                              </AvatarFallback>
                            </Avatar>
                            <span>{selectedUser.firstName} {selectedUser.lastName}</span>
                            <span className="text-text-muted text-xs">({selectedUser.email})</span>
                          </div>
                        )}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <div className="px-2 py-1.5">
                        <div className="relative">
                          <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                          <input
                            type="text"
                            placeholder="Search by name or email..."
                            className="w-full rounded border border-border bg-white py-1.5 pl-8 pr-2 text-sm focus:border-primary focus:outline-none"
                            value={userSearch}
                            onChange={(e) => setUserSearch(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      </div>
                      <SelectItem value="none">
                        <span className="text-text-muted">Unassigned</span>
                      </SelectItem>
                      {isLoadingUsers ? (
                        <div className="p-2 text-center text-sm text-text-muted">Loading employees...</div>
                      ) : filteredUsers.length === 0 ? (
                        <div className="p-2 text-center text-sm text-text-muted">No employees found</div>
                      ) : (
                        filteredUsers.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                <AvatarImage src={user.avatar || ''} />
                                <AvatarFallback className="text-xs">
                                  {getInitials(`${user.firstName} ${user.lastName}`)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex flex-col">
                                <span className="font-medium">{user.firstName} {user.lastName}</span>
                                <span className="text-xs text-text-muted">{user.email}</span>
                              </div>
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {selectedUser && (
                    <div className="mt-2 flex items-center gap-2 rounded-md bg-primary-50 p-2 text-sm">
                      <Mail className="h-4 w-4 text-primary" />
                      <span>Email notification will be sent to: <strong>{selectedUser.email}</strong></span>
                    </div>
                  )}
                </div>

                {/* Project and Department Row */}
                <div className="grid gap-4 sm:grid-cols-2">
                  {/* Project */}
                  <div className="form-group">
                    <Label className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4" />
                      Project
                    </Label>
                    <Select
                      value={selectedProjectId || 'none'}
                      onValueChange={(value) => setValue('projectId', value === 'none' ? undefined : value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select project (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No project</SelectItem>
                        {projects.map((project) => (
                          <SelectItem key={project.id} value={project.id}>
                            {project.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Department */}
                  <div className="form-group">
                    <Label className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Department
                    </Label>
                    <Select
                      value={selectedDepartmentId || 'none'}
                      onValueChange={(value) => setValue('departmentId', value === 'none' ? undefined : value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select department (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No department</SelectItem>
                        {departments.map((dept) => (
                          <SelectItem key={dept.id} value={dept.id}>
                            {dept.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Priority and Status Row */}
                <div className="grid gap-4 sm:grid-cols-2">
                  {/* Priority */}
                  <div className="form-group">
                    <Label required>Priority</Label>
                    <Select
                      value={selectedPriority}
                      onValueChange={(value) => setValue('priority', value as any)}
                    >
                      <SelectTrigger className={errors.priority ? 'border-danger' : ''}>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        {priorities.map((priority) => (
                          <SelectItem key={priority.value} value={priority.value}>
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 rounded text-xs font-medium ${priority.color}`}>
                                {priority.label}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.priority && (
                      <p className="text-sm text-danger">{errors.priority.message}</p>
                    )}
                  </div>

                  {/* Status */}
                  <div className="form-group">
                    <Label>Initial Status</Label>
                    <Select
                      value={selectedStatus}
                      onValueChange={(value) => setValue('status', value as any)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        {statuses.map((status) => (
                          <SelectItem key={status.value} value={status.value}>
                            {status.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Due Date and Estimated Hours Row */}
                <div className="grid gap-4 sm:grid-cols-2">
                  {/* Due Date */}
                  <div className="form-group">
                    <Label htmlFor="dueDate">
                      Due Date
                    </Label>
                    <Input
                      id="dueDate"
                      type="date"
                      {...register('dueDate')}
                    />
                  </div>

                  {/* Estimated Hours */}
                  <div className="form-group">
                    <Label htmlFor="estimatedHours">
                      Estimated Hours
                    </Label>
                    <Input
                      id="estimatedHours"
                      type="number"
                      min="0"
                      step="0.5"
                      placeholder="e.g., 4"
                      {...register('estimatedHours')}
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button type="button" variant="outline" asChild>
                    <Link href="/tasks">Cancel</Link>
                  </Button>
                  <Button type="submit" isLoading={isSubmitting}>
                    <Send className="mr-2 h-4 w-4" />
                    Create Task
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Priority Guide */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Priority Guide</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {priorities.map((priority) => (
                <div key={priority.value} className="flex items-start gap-3">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium shrink-0 ${priority.color}`}>
                    {priority.label}
                  </span>
                  <p className="text-xs text-text-secondary">{priority.description}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Tips */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Tips for Good Tasks</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex gap-2">
                <span className="text-primary font-bold">1.</span>
                <p className="text-text-secondary">Use clear, action-oriented titles</p>
              </div>
              <div className="flex gap-2">
                <span className="text-primary font-bold">2.</span>
                <p className="text-text-secondary">Break large tasks into smaller subtasks</p>
              </div>
              <div className="flex gap-2">
                <span className="text-primary font-bold">3.</span>
                <p className="text-text-secondary">Set realistic due dates and estimates</p>
              </div>
              <div className="flex gap-2">
                <span className="text-primary font-bold">4.</span>
                <p className="text-text-secondary">Include acceptance criteria in description</p>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="pt-6">
              <div className="text-center">
                <CheckSquare className="h-8 w-8 text-primary mx-auto mb-2" />
                <p className="text-sm text-text-secondary">
                  Tasks help you stay organized and track progress on your work.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
