'use client';

import { useState } from 'react';
import { Upload, Download } from 'lucide-react';
import { Button } from '@/components/ui';
import { BulkUploadModal, DownloadTemplateButton } from '@/components/bulk-upload/BulkUploadModal';
import { EXCEL_TEMPLATES } from '@/lib/excel';

export function EmployeeActions() {
  const [showUploadModal, setShowUploadModal] = useState(false);

  const handleUpload = async (data: Record<string, any>[]) => {
    const response = await fetch('/api/employees/bulk', {
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
      <div className="flex items-center gap-2">
        <DownloadTemplateButton 
          template={EXCEL_TEMPLATES.employees} 
          label="Sample Template"
        />
        <Button variant="outline" onClick={() => setShowUploadModal(true)}>
          <Upload className="mr-2 h-4 w-4" />
          Bulk Upload
        </Button>
      </div>

      {showUploadModal && (
        <BulkUploadModal
          title="Bulk Upload Employees"
          template={EXCEL_TEMPLATES.employees}
          onUpload={handleUpload}
          onClose={() => setShowUploadModal(false)}
        />
      )}
    </>
  );
}
