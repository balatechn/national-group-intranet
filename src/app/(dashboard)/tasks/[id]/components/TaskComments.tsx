'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { MessageSquare, Send, Trash2, AtSign } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui';
import { addTaskComment, deleteTaskComment } from '@/actions/tasks';
import { formatDate, getInitials } from '@/lib/utils';

interface Comment {
  id: string;
  content: string;
  createdAt: Date;
  author: {
    id: string;
    firstName: string;
    lastName: string;
    avatar: string | null;
  };
  mentions: {
    user: {
      id: string;
      firstName: string;
      lastName: string;
    };
  }[];
}

interface TaskCommentsProps {
  taskId: string;
  comments: Comment[];
}

export function TaskComments({ taskId, comments }: TaskCommentsProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showMentionHint, setShowMentionHint] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim() || !session?.user?.id) return;

    setIsSubmitting(true);
    try {
      await addTaskComment(taskId, content, session.user.id);
      setContent('');
      router.refresh();
    } catch (error) {
      console.error('Failed to add comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(commentId: string) {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    try {
      await deleteTaskComment(commentId, taskId);
      router.refresh();
    } catch (error) {
      console.error('Failed to delete comment:', error);
    }
  }

  // Parse and highlight mentions in content
  function renderContent(text: string) {
    const parts = text.split(/(@\[[^\]]+\]\([^)]+\))/);
    return parts.map((part, index) => {
      const mentionMatch = part.match(/@\[([^\]]+)\]\(([^)]+)\)/);
      if (mentionMatch) {
        return (
          <span key={index} className="bg-primary/10 text-primary px-1 rounded">
            @{mentionMatch[1]}
          </span>
        );
      }
      return part;
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Comments ({comments.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Comment Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="relative">
            <textarea
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                setShowMentionHint(e.target.value.includes('@'));
              }}
              placeholder="Add a comment... Use @[Name](userId) to mention someone"
              rows={3}
              className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            {showMentionHint && (
              <div className="absolute bottom-full left-0 mb-1 rounded bg-gray-800 px-2 py-1 text-xs text-white">
                <AtSign className="inline h-3 w-3 mr-1" />
                Format: @[Name](userId)
              </div>
            )}
          </div>
          <div className="flex justify-end">
            <Button type="submit" size="sm" disabled={!content.trim() || isSubmitting}>
              <Send className="mr-2 h-4 w-4" />
              {isSubmitting ? 'Posting...' : 'Post Comment'}
            </Button>
          </div>
        </form>

        {/* Comments List */}
        <div className="space-y-4 pt-4 border-t">
          {comments.length === 0 ? (
            <p className="text-center text-sm text-text-muted py-4">
              No comments yet. Be the first to comment!
            </p>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="flex gap-3">
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarImage src={comment.author.avatar || ''} />
                  <AvatarFallback>
                    {getInitials(`${comment.author.firstName} ${comment.author.lastName}`)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {comment.author.firstName} {comment.author.lastName}
                      </span>
                      <span className="text-xs text-text-muted">
                        {formatDate(comment.createdAt)}
                      </span>
                    </div>
                    {session?.user?.id === comment.author.id && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-text-muted hover:text-danger"
                        onClick={() => handleDelete(comment.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-text-secondary whitespace-pre-wrap">
                    {renderContent(comment.content)}
                  </p>
                  {comment.mentions.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {comment.mentions.map((mention) => (
                        <span key={mention.user.id} className="text-xs text-primary">
                          @{mention.user.firstName} {mention.user.lastName}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
