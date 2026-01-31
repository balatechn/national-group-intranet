'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Paperclip, Upload, Trash2, Download, FileText, Image, File } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
} from '@/components/ui';
import { addTaskAttachment, deleteTaskAttachment } from '@/actions/tasks';
import { formatDate } from '@/lib/utils';

interface Attachment {
  id: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  fileType: string;
  createdAt: Date;
  uploadedBy: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

interface TaskAttachmentsProps {
  taskId: string;
  attachments: Attachment[];
}

function getFileIcon(fileType: string) {
  if (fileType.startsWith('image/')) return Image;
  if (fileType.includes('pdf') || fileType.includes('document')) return FileText;
  return File;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function TaskAttachments({ taskId, attachments }: TaskAttachmentsProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0 || !session?.user?.id) return;

    setIsUploading(true);
    
    try {
      for (const file of Array.from(files)) {
        // In a real app, you would upload to a cloud storage service
        // For now, we'll create a mock URL
        const fileUrl = URL.createObjectURL(file);
        
        await addTaskAttachment(
          taskId,
          session.user.id,
          file.name,
          fileUrl, // In production, this would be the cloud storage URL
          file.size,
          file.type
        );
      }
      router.refresh();
    } catch (error) {
      console.error('Failed to upload attachment:', error);
    } finally {
      setIsUploading(false);
      // Reset the input
      e.target.value = '';
    }
  }

  async function handleDelete(attachmentId: string) {
    if (!confirm('Are you sure you want to delete this attachment?')) return;

    try {
      await deleteTaskAttachment(attachmentId, taskId);
      router.refresh();
    } catch (error) {
      console.error('Failed to delete attachment:', error);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Paperclip className="h-5 w-5" />
            Attachments ({attachments.length})
          </CardTitle>
          <div>
            <input
              type="file"
              id="file-upload"
              multiple
              className="hidden"
              onChange={handleFileUpload}
              disabled={isUploading}
            />
            <Button
              size="sm"
              variant="outline"
              onClick={() => document.getElementById('file-upload')?.click()}
              disabled={isUploading}
            >
              <Upload className="mr-2 h-4 w-4" />
              {isUploading ? 'Uploading...' : 'Upload'}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {attachments.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed rounded-lg">
            <Paperclip className="h-8 w-8 text-text-muted mx-auto mb-2" />
            <p className="text-sm text-text-muted">No attachments yet</p>
            <p className="text-xs text-text-muted mt-1">Upload files to share with the team</p>
          </div>
        ) : (
          <div className="space-y-2">
            {attachments.map((attachment) => {
              const FileIcon = getFileIcon(attachment.fileType);
              return (
                <div
                  key={attachment.id}
                  className="flex items-center justify-between rounded-lg border p-3 hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <FileIcon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{attachment.fileName}</p>
                      <div className="flex items-center gap-2 text-xs text-text-muted">
                        <span>{formatFileSize(attachment.fileSize)}</span>
                        <span>•</span>
                        <span>{attachment.uploadedBy.firstName} {attachment.uploadedBy.lastName}</span>
                        <span>•</span>
                        <span>{formatDate(attachment.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => window.open(attachment.fileUrl, '_blank')}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    {session?.user?.id === attachment.uploadedBy.id && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-text-muted hover:text-danger"
                        onClick={() => handleDelete(attachment.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
