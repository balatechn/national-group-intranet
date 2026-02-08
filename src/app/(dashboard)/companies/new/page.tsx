'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Building2, Save, Loader2 } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Button,
  Input,
  Label,
  Textarea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui';
import { createCompanySchema, type CreateCompanyInput } from '@/validations';
import { createCompany } from '@/actions/companies';

interface CompanyOption {
  id: string;
  name: string;
  code: string;
}

export default function CreateCompanyPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parentCompanies, setParentCompanies] = useState<CompanyOption[]>([]);
  const [selectedParentId, setSelectedParentId] = useState<string>('');

  // Fetch parent company options
  useEffect(() => {
    async function fetchCompanies() {
      try {
        const res = await fetch('/api/companies');
        if (res.ok) {
          const data = await res.json();
          setParentCompanies(data.companies || []);
        }
      } catch (err) {
        console.error('Failed to fetch companies:', err);
      }
    }
    fetchCompanies();
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateCompanyInput>({
    resolver: zodResolver(createCompanySchema),
    defaultValues: {
      isActive: true,
    },
  });

  const onSubmit = async (data: CreateCompanyInput) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const result = await createCompany({
        ...data,
        parentId: selectedParentId || undefined,
      });

      if (result.success) {
        router.push('/companies');
        router.refresh();
      } else {
        setError('Failed to create company. Please try again.');
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
            <Link href="/companies">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="page-title">Add New Company</h1>
            <p className="page-description">Create a new company in the organization</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                Company Details
              </CardTitle>
              <CardDescription>
                Enter the basic information about the company
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {error && (
                  <div className="rounded-md bg-danger-light p-3 text-sm text-danger-dark">
                    {error}
                  </div>
                )}

                {/* Basic Information */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="form-group">
                    <Label htmlFor="code" required>
                      Company Code
                    </Label>
                    <Input
                      id="code"
                      placeholder="e.g., NGL"
                      maxLength={10}
                      error={errors.code?.message}
                      {...register('code')}
                    />
                  </div>

                  <div className="form-group">
                    <Label htmlFor="name" required>
                      Company Name
                    </Label>
                    <Input
                      id="name"
                      placeholder="e.g., National Group Limited"
                      error={errors.name?.message}
                      {...register('name')}
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="form-group">
                    <Label htmlFor="shortName">Short Name</Label>
                    <Input
                      id="shortName"
                      placeholder="e.g., NGL"
                      {...register('shortName')}
                    />
                  </div>

                  <div className="form-group">
                    <Label htmlFor="parentId">Parent Company</Label>
                    <Select
                      value={selectedParentId}
                      onValueChange={setSelectedParentId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select parent company (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">No Parent (Independent)</SelectItem>
                        {parentCompanies.map((company) => (
                          <SelectItem key={company.id} value={company.id}>
                            {company.name} ({company.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="form-group">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Brief description of the company..."
                    rows={3}
                    {...register('description')}
                  />
                </div>

                {/* Contact Information */}
                <div className="border-t pt-6">
                  <h3 className="mb-4 font-semibold text-text-primary">Contact Information</h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="form-group">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="info@company.com"
                        error={errors.email?.message}
                        {...register('email')}
                      />
                    </div>

                    <div className="form-group">
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        placeholder="+91 1234567890"
                        {...register('phone')}
                      />
                    </div>

                    <div className="form-group">
                      <Label htmlFor="website">Website</Label>
                      <Input
                        id="website"
                        type="url"
                        placeholder="https://www.company.com"
                        error={errors.website?.message}
                        {...register('website')}
                      />
                    </div>

                    <div className="form-group">
                      <Label htmlFor="taxId">Tax ID / GST</Label>
                      <Input
                        id="taxId"
                        placeholder="GSTIN"
                        {...register('taxId')}
                      />
                    </div>
                  </div>
                </div>

                {/* Address */}
                <div className="border-t pt-6">
                  <h3 className="mb-4 font-semibold text-text-primary">Address</h3>
                  <div className="space-y-4">
                    <div className="form-group">
                      <Label htmlFor="address">Street Address</Label>
                      <Textarea
                        id="address"
                        placeholder="Street address, building, floor..."
                        rows={2}
                        {...register('address')}
                      />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      <div className="form-group">
                        <Label htmlFor="city">City</Label>
                        <Input id="city" placeholder="Mumbai" {...register('city')} />
                      </div>

                      <div className="form-group">
                        <Label htmlFor="state">State</Label>
                        <Input id="state" placeholder="Maharashtra" {...register('state')} />
                      </div>

                      <div className="form-group">
                        <Label htmlFor="country">Country</Label>
                        <Input id="country" placeholder="India" {...register('country')} />
                      </div>

                      <div className="form-group">
                        <Label htmlFor="postalCode">Postal Code</Label>
                        <Input id="postalCode" placeholder="400001" {...register('postalCode')} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end gap-3 border-t pt-6">
                  <Button type="button" variant="outline" asChild>
                    <Link href="/companies">Cancel</Link>
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Create Company
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tips</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-text-secondary">
              <p>
                <strong>Company Code</strong> is a unique identifier used for internal
                reference. Keep it short (2-10 characters).
              </p>
              <p>
                <strong>Parent Company</strong> allows you to create a hierarchical
                structure for group companies and subsidiaries.
              </p>
              <p>
                All other fields are optional but help maintain a complete company
                directory.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
