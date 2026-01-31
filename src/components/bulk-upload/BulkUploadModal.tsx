'use client';

import { useState, useCallback, useRef } from 'react';
import {
  Upload,
  Download,
  FileSpreadsheet,
  X,
  CheckCircle,
  AlertCircle,
  Loader2,
  FileUp,
  Trash2,
} from 'lucide-react';
import {
  parseExcelFile,
  validateExcelData,
  generateExcelTemplate,
  ExcelTemplate,
  ExcelColumn,
} from '@/lib/excel';

interface BulkUploadProps {
  title: string;
  template: ExcelTemplate;
  onUpload: (data: Record<string, any>[]) => Promise<{ success: boolean; message: string; count?: number }>;
  onClose: () => void;
}

export function BulkUploadModal({ title, template, onUpload, onClose }: BulkUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<Record<string, any>[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(async (selectedFile: File) => {
    if (!selectedFile.name.match(/\.(xlsx|xls)$/i)) {
      setErrors(['Please select a valid Excel file (.xlsx or .xls)']);
      return;
    }

    setFile(selectedFile);
    setErrors([]);
    setResult(null);

    try {
      const buffer = await selectedFile.arrayBuffer();
      const data = parseExcelFile(buffer);
      
      if (data.length === 0) {
        setErrors(['The Excel file is empty or has no data rows']);
        return;
      }

      const validation = validateExcelData(data, template.columns);
      
      if (!validation.valid) {
        setErrors(validation.errors);
      }
      
      setPreview(validation.validRows.slice(0, 10));
    } catch (err) {
      setErrors(['Failed to parse Excel file. Please check the file format.']);
    }
  }, [template.columns]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const downloadTemplate = useCallback(() => {
    const blob = generateExcelTemplate(template);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${template.sheetName.replace(/\s+/g, '_')}_Template.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [template]);

  const handleUpload = async () => {
    if (!file || preview.length === 0) return;

    setUploading(true);
    setResult(null);

    try {
      const buffer = await file.arrayBuffer();
      const data = parseExcelFile(buffer);
      const validation = validateExcelData(data, template.columns);
      
      if (validation.validRows.length === 0) {
        setResult({ success: false, message: 'No valid rows to upload' });
        return;
      }

      const response = await onUpload(validation.validRows);
      setResult(response);
      
      if (response.success) {
        setFile(null);
        setPreview([]);
      }
    } catch (err) {
      setResult({ success: false, message: 'Upload failed. Please try again.' });
    } finally {
      setUploading(false);
    }
  };

  const clearFile = () => {
    setFile(null);
    setPreview([]);
    setErrors([]);
    setResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-surface-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-text-primary">{title}</h2>
              <p className="text-sm text-text-secondary">Upload Excel file to import data</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-surface-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-text-secondary" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {/* Download Template */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-blue-900">Download Sample Template</h3>
                <p className="text-sm text-blue-700 mt-1">
                  Download the template file to see the required format and columns
                </p>
              </div>
              <button
                onClick={downloadTemplate}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                Download Template
              </button>
            </div>
          </div>

          {/* Required Fields Info */}
          <div className="mb-6 p-4 bg-amber-50 rounded-lg border border-amber-200">
            <h3 className="font-medium text-amber-900 mb-2">Required Fields</h3>
            <div className="flex flex-wrap gap-2">
              {template.columns
                .filter(col => col.required)
                .map(col => (
                  <span
                    key={col.key}
                    className="px-2 py-1 bg-amber-100 text-amber-800 text-sm rounded"
                  >
                    {col.header}
                  </span>
                ))}
            </div>
          </div>

          {/* Drop Zone */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
              dragOver
                ? 'border-primary bg-primary/5'
                : 'border-surface-300 hover:border-primary/50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            
            {file ? (
              <div className="flex items-center justify-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                  <FileSpreadsheet className="w-6 h-6 text-green-600" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-text-primary">{file.name}</p>
                  <p className="text-sm text-text-secondary">
                    {(file.size / 1024).toFixed(1)} KB • {preview.length} valid rows
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    clearFile();
                  }}
                  className="p-2 hover:bg-red-100 rounded-lg transition-colors text-red-600"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <>
                <FileUp className="w-12 h-12 mx-auto text-text-secondary mb-4" />
                <p className="text-text-primary font-medium mb-1">
                  Drag and drop your Excel file here
                </p>
                <p className="text-sm text-text-secondary">
                  or click to browse • Supports .xlsx, .xls
                </p>
              </>
            )}
          </div>

          {/* Errors */}
          {errors.length > 0 && (
            <div className="mt-4 p-4 bg-red-50 rounded-lg border border-red-200">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-red-900">Validation Errors</h4>
                  <ul className="mt-2 space-y-1 text-sm text-red-700">
                    {errors.map((error, i) => (
                      <li key={i}>• {error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Result */}
          {result && (
            <div
              className={`mt-4 p-4 rounded-lg border ${
                result.success
                  ? 'bg-green-50 border-green-200'
                  : 'bg-red-50 border-red-200'
              }`}
            >
              <div className="flex items-center gap-2">
                {result.success ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600" />
                )}
                <p
                  className={`font-medium ${
                    result.success ? 'text-green-900' : 'text-red-900'
                  }`}
                >
                  {result.message}
                </p>
              </div>
            </div>
          )}

          {/* Preview Table */}
          {preview.length > 0 && (
            <div className="mt-6">
              <h3 className="font-medium text-text-primary mb-3">
                Preview (First 10 rows)
              </h3>
              <div className="border border-surface-200 rounded-lg overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-surface-50">
                    <tr>
                      {template.columns.slice(0, 6).map(col => (
                        <th
                          key={col.key}
                          className="px-3 py-2 text-left font-medium text-text-secondary whitespace-nowrap"
                        >
                          {col.header}
                          {col.required && <span className="text-red-500 ml-1">*</span>}
                        </th>
                      ))}
                      {template.columns.length > 6 && (
                        <th className="px-3 py-2 text-left font-medium text-text-secondary">
                          ...
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-100">
                    {preview.map((row, i) => (
                      <tr key={i} className="hover:bg-surface-50">
                        {template.columns.slice(0, 6).map(col => (
                          <td key={col.key} className="px-3 py-2 text-text-primary whitespace-nowrap">
                            {row[col.key] ?? '-'}
                          </td>
                        ))}
                        {template.columns.length > 6 && (
                          <td className="px-3 py-2 text-text-secondary">...</td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-surface-200 flex items-center justify-between bg-surface-50">
          <p className="text-sm text-text-secondary">
            {preview.length > 0
              ? `${preview.length} row${preview.length !== 1 ? 's' : ''} ready to upload`
              : 'Select an Excel file to upload'}
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-surface-300 text-text-primary rounded-lg hover:bg-surface-100 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleUpload}
              disabled={!file || preview.length === 0 || uploading}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Upload Data
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Trigger button component
interface BulkUploadButtonProps {
  onClick: () => void;
  label?: string;
}

export function BulkUploadButton({ onClick, label = 'Bulk Upload' }: BulkUploadButtonProps) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
    >
      <Upload className="w-4 h-4" />
      {label}
    </button>
  );
}

// Download template button
interface DownloadTemplateButtonProps {
  template: ExcelTemplate;
  label?: string;
}

export function DownloadTemplateButton({ template, label = 'Download Template' }: DownloadTemplateButtonProps) {
  const handleDownload = () => {
    const blob = generateExcelTemplate(template);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${template.sheetName.replace(/\s+/g, '_')}_Template.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <button
      onClick={handleDownload}
      className="flex items-center gap-2 px-4 py-2 border border-surface-300 text-text-primary rounded-lg hover:bg-surface-100 transition-colors"
    >
      <Download className="w-4 h-4" />
      {label}
    </button>
  );
}
