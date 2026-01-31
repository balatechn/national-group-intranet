import Link from 'next/link';
import { Plus, FileTemplate, Clock, Users } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Button,
  Badge,
} from '@/components/ui';
import { getTaskTemplates } from '@/actions/tasks';
import { getPriorityColor } from '@/lib/utils';

export const revalidate = 60;

export default async function TaskTemplatesPage() {
  const templates = await getTaskTemplates({ isActive: true });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Task Templates</h1>
          <p className="page-description">Create tasks quickly from pre-defined templates</p>
        </div>
        <Button asChild>
          <Link href="/tasks/templates/new">
            <Plus className="mr-2 h-4 w-4" />
            Create Template
          </Link>
        </Button>
      </div>

      {/* Templates Grid */}
      {templates.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileTemplate className="h-12 w-12 text-text-muted" />
            <h3 className="mt-4 text-lg font-semibold">No templates yet</h3>
            <p className="mt-2 text-text-secondary text-center max-w-md">
              Create task templates for common work patterns. Templates save time and ensure consistency.
            </p>
            <Button className="mt-4" asChild>
              <Link href="/tasks/templates/new">
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Template
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <Card key={template.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <FileTemplate className="h-5 w-5 text-primary" />
                  </div>
                  <Badge className={getPriorityColor(template.priority)}>
                    {template.priority}
                  </Badge>
                </div>
                <CardTitle className="mt-3">{template.name}</CardTitle>
                {template.description && (
                  <CardDescription className="line-clamp-2">{template.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-text-muted">
                  <div className="flex items-center gap-2">
                    <FileTemplate className="h-4 w-4" />
                    <span className="truncate">Task: {template.title}</span>
                  </div>
                  {template.estimatedHours && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>{template.estimatedHours}h estimated</span>
                    </div>
                  )}
                  {template.department && (
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <span>{template.department.name}</span>
                    </div>
                  )}
                  <div className="text-xs">
                    Used {template._count.tasks} times
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <Button size="sm" className="flex-1" asChild>
                    <Link href={`/tasks/new?template=${template.id}`}>
                      Use Template
                    </Link>
                  </Button>
                  <Button size="sm" variant="outline" asChild>
                    <Link href={`/tasks/templates/${template.id}/edit`}>
                      Edit
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
