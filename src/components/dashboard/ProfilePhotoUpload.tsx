'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { Camera, Loader2 } from 'lucide-react';

interface ProfilePhotoUploadProps {
  currentAvatar: string | null;
  userInitials: string;
  userName: string;
}

export default function ProfilePhotoUpload({ currentAvatar, userInitials, userName }: ProfilePhotoUploadProps) {
  const [avatar, setAvatar] = useState<string | null>(currentAvatar);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate on client side
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      alert('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      alert('File too large. Maximum size is 2MB.');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const res = await fetch('/api/profile/avatar', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (data.success && data.avatar) {
        setAvatar(data.avatar);
      } else {
        alert(data.error || 'Failed to upload photo');
      }
    } catch {
      alert('Failed to upload photo');
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="relative mb-4 group cursor-pointer" onClick={() => !uploading && fileInputRef.current?.click()}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        className="hidden"
        onChange={handleUpload}
        disabled={uploading}
      />
      <div className="absolute -inset-1 rounded-full bg-gradient-to-br from-[#DAA520] to-[#FFD700] opacity-20 blur-sm" />
      {avatar ? (
        <Image
          src={avatar}
          alt={userName}
          width={72}
          height={72}
          className="relative rounded-full border-2 border-[#DAA520]/30 object-cover shadow-md w-[72px] h-[72px]"
        />
      ) : (
        <div className="relative h-[72px] w-[72px] rounded-full bg-gradient-to-br from-[#DAA520] to-[#B8860B] flex items-center justify-center text-2xl font-bold text-white border-2 border-[#DAA520]/30 shadow-md">
          {userInitials}
        </div>
      )}
      {/* Camera overlay */}
      <div className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
        {uploading ? (
          <Loader2 className="h-6 w-6 text-white animate-spin" />
        ) : (
          <Camera className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
        )}
      </div>
      {/* Online indicator */}
      <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-emerald-500 border-2 border-white shadow-sm z-10" />
    </div>
  );
}
