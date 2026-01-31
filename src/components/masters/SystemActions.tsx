'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, Upload, Download } from 'lucide-react';
import { Button } from '@/components/ui';
import { BulkUploadModal, DownloadTemplateButton } from '@/components/bulk-upload/BulkUploadModal';
import { EXCEL_TEMPLATES } from '@/lib/excel';

export function SystemActions() {
  const [showUploadModal, setShowUploadModal] = useState(false);

  const handleUpload = async (data: Record<string, any>[]) => {
    const response = await fetch('/api/it/masters/systems/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data }),
    });

    const result = await response.json();
    
    if (response.ok && result.success) {
      window.location.reload();
    }
    
    return result;
  };

  return (
    <>
      <div className="flex items-center gap-3">
        <DownloadTemplateButton 
          template={EXCEL_TEMPLATES.systems} 
          label="Sample Template"
        />
        <Button variant="outline" onClick={() => setShowUploadModal(true)}>
          <Upload className="mr-2 h-4 w-4" />
          Bulk Upload
        </Button>
        <Button asChild>
          <Link href="/it/masters/systems/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Asset
          </Link>
        </Button>
      </div>

      {showUploadModal && (
        <BulkUploadModal
          title="Bulk Upload System Assets"
          template={EXCEL_TEMPLATES.systems}
          onUpload={handleUpload}
          onClose={() => setShowUploadModal(false)}
        />
      )}
    </>
  );
}
