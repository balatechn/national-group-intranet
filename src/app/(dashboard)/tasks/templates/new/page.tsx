'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft,
  Save,
  Clock,
  FileTemplate,
} from 'lucide-react';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Button,
  Input,
  Label,
} from '@/components/ui';
import { createTaskTemplate } from '@/actions/tasks';

export default function NewTaskTemplatePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    defaultTitle: '',
    defaultDescription: '',
    defaultPriority: 'MEDIUM' as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
    estimatedHours: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await createTaskTemplate({
        name: formData.name,
        description: formData.description || undefined,
        defaultTitle: formData.defaultTitle || undefined,
        defaultDescription: formData.defaultDescription || undefined,
        defaultPriority: formData.defaultPriority,
        estimatedHours: formData.estimatedHours ? parseFloat(formData.estimatedHours) : undefined,
      });

      if (result.success) {
        router.push('/tasks/templates');
      } else {
        setError(result.error || 'Failed to create template');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="page-header">
        <div className="flex items-center gap-4">
          <Link href="/tasks/templates">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="page-title">Create Task Template</h1>
            <p className="page-description">Create a reusable template for common tasks</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileTemplate className="h-5 w-5" />
                  Template Information
                </CardTitle>
                <CardDescription>Basic information about this template</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Template Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Bug Fix Template"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Template Description</Label>
                  <textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe when to use this template..."
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Default Task Values</CardTitle>
                <CardDescription>Values that will be pre-filled when using this template</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="defaultTitle">Default Task Title</Label>
                  <Input
                    id="defaultTitle"
                    value={formData.defaultTitle}
                    onChange={(e) => setFormData({ ...formData, defaultTitle: e.target.value })}
                    placeholder="e.g., [BUG] - "
                  />
                  <p className="text-xs text-text-muted">Leave empty to let users enter their own title</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="defaultDescription">Default Task Description</Label>
                  <textarea
                    id="defaultDescription"
                    value={formData.defaultDescription}
                    onChange={(e) => setFormData({ ...formData, defaultDescription: e.target.value })}
                    placeholder="Enter a default description template..."
                    className="flex min-h-[120px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 font-mono"
                  />
                  <p className="text-xs text-text-muted">You can include placeholders like [DESCRIBE ISSUE HERE]</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Template Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="defaultPriority">Default Priority</Label>
                  <select
                    id="defaultPriority"
                    value={formData.defaultPriority}
                    onChange={(e) => setFormData({ ...formData, defaultPriority: e.target.value as typeof formData.defaultPriority })}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="estimatedHours">
                    <Clock className="h-4 w-4 inline mr-1" />
                    Estimated Hours
                  </Label>
                  <Input
                    id="estimatedHours"
                    type="number"
                    step="0.5"
                    min="0"
                    value={formData.estimatedHours}
                    onChange={(e) => setFormData({ ...formData, estimatedHours: e.target.value })}
                    placeholder="e.g., 4"
                  />
                </div>
              </CardContent>
            </Card>

            {error && (
              <Card className="border-danger">
                <CardContent className="pt-6">
                  <p className="text-sm text-danger">{error}</p>
                </CardContent>
              </Card>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Creating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Create Template
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
