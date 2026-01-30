import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatTime(date: Date | string | null | undefined): string {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function generateTicketNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `TKT-${timestamp}-${random}`;
}

export function generateRequestNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `REQ-${timestamp}-${random}`;
}

export function generateAssetTag(prefix: string = 'AST'): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function getStatusColor(status: string): string {
  const statusColors: Record<string, string> = {
    // General
    active: 'bg-success-light text-success-dark',
    completed: 'bg-success-light text-success-dark',
    resolved: 'bg-success-light text-success-dark',
    approved: 'bg-success-light text-success-dark',
    
    pending: 'bg-warning-light text-warning-dark',
    in_progress: 'bg-warning-light text-warning-dark',
    waiting_for_user: 'bg-warning-light text-warning-dark',
    on_hold: 'bg-warning-light text-warning-dark',
    
    open: 'bg-primary-100 text-primary',
    todo: 'bg-primary-100 text-primary',
    planned: 'bg-primary-100 text-primary',
    draft: 'bg-secondary-100 text-secondary-600',
    
    closed: 'bg-gray-100 text-gray-600',
    cancelled: 'bg-gray-100 text-gray-600',
    inactive: 'bg-gray-100 text-gray-600',
    
    critical: 'bg-danger-light text-danger-dark',
    overdue: 'bg-danger-light text-danger-dark',
    rejected: 'bg-danger-light text-danger-dark',
  };

  const key = status.toLowerCase().replace(/-/g, '_');
  return statusColors[key] || 'bg-gray-100 text-gray-600';
}

export function getPriorityColor(priority: string): string {
  const priorityColors: Record<string, string> = {
    low: 'bg-gray-100 text-gray-600',
    medium: 'bg-primary-100 text-primary',
    high: 'bg-warning-light text-warning-dark',
    critical: 'bg-danger-light text-danger-dark',
  };

  return priorityColors[priority.toLowerCase()] || 'bg-gray-100 text-gray-600';
}

export function calculateSLAStatus(deadline: Date | null): {
  status: 'on-track' | 'warning' | 'breached';
  hoursRemaining: number | null;
} {
  if (!deadline) return { status: 'on-track', hoursRemaining: null };

  const now = new Date();
  const diff = deadline.getTime() - now.getTime();
  const hoursRemaining = Math.floor(diff / (1000 * 60 * 60));

  if (diff < 0) {
    return { status: 'breached', hoursRemaining };
  } else if (hoursRemaining <= 4) {
    return { status: 'warning', hoursRemaining };
  }

  return { status: 'on-track', hoursRemaining };
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => func(...args), wait);
  };
}

export function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce((result, item) => {
    const groupKey = String(item[key]);
    if (!result[groupKey]) {
      result[groupKey] = [];
    }
    result[groupKey].push(item);
    return result;
  }, {} as Record<string, T[]>);
}

export function formatFileSize(bytes: number | null | undefined): string {
  if (bytes === null || bytes === undefined || bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function getFileExtension(filename: string): string {
  const parts = filename.split('.');
  return parts.length > 1 ? parts.pop()?.toLowerCase() || '' : '';
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function generateUniqueId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 9)}`;
}