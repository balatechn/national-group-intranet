'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Ticket, Send } from 'lucide-react';
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
import { createTicketSchema, type CreateTicketInput } from '@/validations';
import { createTicket } from '@/actions/tickets';

const categories = [
  { value: 'HARDWARE', label: 'Hardware Issue' },
  { value: 'SOFTWARE', label: 'Software Issue' },
  { value: 'NETWORK', label: 'Network Issue' },
  { value: 'ACCESS', label: 'Access Request' },
  { value: 'EMAIL', label: 'Email Issue' },
  { value: 'OTHER', label: 'Other' },
];

const priorities = [
  { value: 'LOW', label: 'Low', description: 'SLA: 48 hours' },
  { value: 'MEDIUM', label: 'Medium', description: 'SLA: 24 hours' },
  { value: 'HIGH', label: 'High', description: 'SLA: 8 hours' },
  { value: 'CRITICAL', label: 'Critical', description: 'SLA: 4 hours' },
];

export default function CreateTicketPage() {
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
  } = useForm<CreateTicketInput>({
    resolver: zodResolver(createTicketSchema),
    defaultValues: {
      priority: 'MEDIUM',
    },
  });

  const selectedCategory = watch('category');
  const selectedPriority = watch('priority');

  const onSubmit = async (data: CreateTicketInput) => {
    if (!session?.user?.id) {
      setError('You must be logged in to create a ticket');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await createTicket(data, session.user.id);
      
      if (result.success) {
        router.push('/it/tickets');
        router.refresh();
      } else {
        setError('Failed to create ticket. Please try again.');
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
            <Link href="/it/tickets">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="page-title">Create IT Ticket</h1>
            <p className="page-description">Submit a new IT support request</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ticket className="h-5 w-5 text-primary" />
                Ticket Details
              </CardTitle>
              <CardDescription>
                Provide details about your IT issue or request
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {error && (
                  <div className="rounded-md bg-danger-light p-3 text-sm text-danger-dark">
                    {error}
                  </div>
                )}

                {/* Subject */}
                <div className="form-group">
                  <Label htmlFor="subject" required>
                    Subject
                  </Label>
                  <Input
                    id="subject"
                    placeholder="Brief description of your issue"
                    error={errors.subject?.message}
                    {...register('subject')}
                  />
                </div>

                {/* Category */}
                <div className="form-group">
                  <Label required>Category</Label>
                  <Select
                    value={selectedCategory}
                    onValueChange={(value) => setValue('category', value as any)}
                  >
                    <SelectTrigger className={errors.category ? 'border-danger' : ''}>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.category && (
                    <p className="text-sm text-danger">{errors.category.message}</p>
                  )}
                </div>

                {/* Priority */}
                <div className="form-group">
                  <Label required>Priority</Label>
                  <Select
                    value={selectedPriority}
                    onValueChange={(value) => setValue('priority', value as any)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      {priorities.map((pri) => (
                        <SelectItem key={pri.value} value={pri.value}>
                          <div className="flex items-center justify-between gap-4">
                            <span>{pri.label}</span>
                            <span className="text-xs text-text-muted">{pri.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Description */}
                <div className="form-group">
                  <Label htmlFor="description" required>
                    Description
                  </Label>
                  <textarea
                    id="description"
                    rows={6}
                    className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="Please describe your issue in detail. Include any error messages, steps to reproduce, and what you've already tried."
                    {...register('description')}
                  />
                  {errors.description && (
                    <p className="text-sm text-danger">{errors.description.message}</p>
                  )}
                </div>

                {/* Submit Button */}
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button type="button" variant="outline" asChild>
                    <Link href="/it/tickets">Cancel</Link>
                  </Button>
                  <Button type="submit" isLoading={isSubmitting}>
                    <Send className="mr-2 h-4 w-4" />
                    Submit Ticket
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Tips Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Tips for Faster Resolution</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-medium text-primary">
                  1
                </span>
                <p className="text-text-secondary">
                  Be specific about the problem - include error messages if any
                </p>
              </div>
              <div className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-medium text-primary">
                  2
                </span>
                <p className="text-text-secondary">
                  Describe what you were doing when the issue occurred
                </p>
              </div>
              <div className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-medium text-primary">
                  3
                </span>
                <p className="text-text-secondary">
                  Include your computer name or asset tag if applicable
                </p>
              </div>
              <div className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-medium text-primary">
                  4
                </span>
                <p className="text-text-secondary">
                  Set the correct priority based on impact to your work
                </p>
              </div>
            </CardContent>
          </Card>

          {/* SLA Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">SLA Response Times</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-danger">Critical</span>
                  <span className="text-sm text-text-secondary">4 hours</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-warning-dark">High</span>
                  <span className="text-sm text-text-secondary">8 hours</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-primary">Medium</span>
                  <span className="text-sm text-text-secondary">24 hours</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-text-muted">Low</span>
                  <span className="text-sm text-text-secondary">48 hours</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Need Urgent Help?</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-text-secondary">
              <p>For critical issues that require immediate attention:</p>
              <p className="mt-2 font-medium text-text-primary">
                IT Helpdesk: +91 XXX-XXX-XXXX
              </p>
              <p className="text-xs mt-1">Available 9 AM - 6 PM IST</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
