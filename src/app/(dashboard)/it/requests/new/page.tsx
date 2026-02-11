'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession } from '@/lib/session-context';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, FileText, Send } from 'lucide-react';
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
import { createITRequestSchema, type CreateITRequestInput } from '@/validations';
import { createITRequest } from '@/actions/it-requests';

const requestTypes = [
  { value: 'NEW_HARDWARE', label: 'New Hardware', description: 'Request new computer, monitor, peripherals, etc.' },
  { value: 'NEW_SOFTWARE', label: 'New Software', description: 'Request software installation or license' },
  { value: 'ACCESS_REQUEST', label: 'Access Request', description: 'Request access to systems, folders, or applications' },
  { value: 'MODIFICATION', label: 'Modification', description: 'Changes to existing hardware/software setup' },
  { value: 'REMOVAL', label: 'Removal', description: 'Remove software, access, or return hardware' },
];

export default function CreateITRequestPage() {
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
  } = useForm<CreateITRequestInput>({
    resolver: zodResolver(createITRequestSchema),
  });

  const selectedType = watch('type');

  const onSubmit = async (data: CreateITRequestInput) => {
    if (!session?.user?.id) {
      setError('You must be logged in to create a request');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await createITRequest(data, session.user.id);
      
      if (result.success) {
        router.push('/it/requests');
        router.refresh();
      } else {
        setError('Failed to create request. Please try again.');
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
            <Link href="/it/requests">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="page-title">New IT Request</h1>
            <p className="page-description">Submit a new IT service request</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Request Details
              </CardTitle>
              <CardDescription>
                Provide details about your IT request
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {error && (
                  <div className="rounded-md bg-danger-light p-3 text-sm text-danger-dark">
                    {error}
                  </div>
                )}

                {/* Request Type */}
                <div className="form-group">
                  <Label required>Request Type</Label>
                  <Select
                    value={selectedType}
                    onValueChange={(value) => setValue('type', value as any)}
                  >
                    <SelectTrigger className={errors.type ? 'border-danger' : ''}>
                      <SelectValue placeholder="Select request type" />
                    </SelectTrigger>
                    <SelectContent>
                      {requestTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div>
                            <span className="font-medium">{type.label}</span>
                            <p className="text-xs text-text-muted">{type.description}</p>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.type && (
                    <p className="text-sm text-danger">{errors.type.message}</p>
                  )}
                </div>

                {/* Subject */}
                <div className="form-group">
                  <Label htmlFor="subject" required>
                    Subject
                  </Label>
                  <Input
                    id="subject"
                    placeholder="Brief title for your request"
                    error={errors.subject?.message}
                    {...register('subject')}
                  />
                </div>

                {/* Description */}
                <div className="form-group">
                  <Label htmlFor="description" required>
                    Description
                  </Label>
                  <textarea
                    id="description"
                    rows={4}
                    className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="Describe what you need in detail"
                    {...register('description')}
                  />
                  {errors.description && (
                    <p className="text-sm text-danger">{errors.description.message}</p>
                  )}
                </div>

                {/* Justification */}
                <div className="form-group">
                  <Label htmlFor="justification">
                    Business Justification
                  </Label>
                  <textarea
                    id="justification"
                    rows={3}
                    className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="Explain why this request is needed for your work"
                    {...register('justification')}
                  />
                </div>

                {/* Submit Button */}
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button type="button" variant="outline" asChild>
                    <Link href="/it/requests">Cancel</Link>
                  </Button>
                  <Button type="submit" isLoading={isSubmitting}>
                    <Send className="mr-2 h-4 w-4" />
                    Submit Request
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Process Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Request Process</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-medium text-primary">
                  1
                </span>
                <div>
                  <p className="font-medium">Submit Request</p>
                  <p className="text-text-secondary">Fill out the form with details</p>
                </div>
              </div>
              <div className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-medium text-primary">
                  2
                </span>
                <div>
                  <p className="font-medium">Manager Approval</p>
                  <p className="text-text-secondary">Your manager will review</p>
                </div>
              </div>
              <div className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-medium text-primary">
                  3
                </span>
                <div>
                  <p className="font-medium">IT Review</p>
                  <p className="text-text-secondary">IT team processes request</p>
                </div>
              </div>
              <div className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-medium text-primary">
                  4
                </span>
                <div>
                  <p className="font-medium">Fulfillment</p>
                  <p className="text-text-secondary">Request is completed</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Request Types Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Request Types</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="font-medium text-primary">New Hardware</p>
                <p className="text-text-secondary">Laptops, monitors, keyboards, mice, etc.</p>
              </div>
              <div>
                <p className="font-medium text-primary">New Software</p>
                <p className="text-text-secondary">Software licenses, installations</p>
              </div>
              <div>
                <p className="font-medium text-primary">Access Request</p>
                <p className="text-text-secondary">System access, folder permissions</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
