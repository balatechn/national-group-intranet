'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, CheckSquare, Send, Calendar, User, Briefcase } from 'lucide-react';
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
} from '@/components/ui';
import { createTaskSchema, type CreateTaskInput } from '@/validations';
import { createTask } from '@/actions/tasks';

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

export default function CreateTaskPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
