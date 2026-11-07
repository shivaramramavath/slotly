'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { libraryApi } from '../services/library.api';
import { toast } from '@/components/ui/toast';
import type { ImportEntity, ImportValidationReport } from '@slotly/contracts';
import { UploadCloud, CheckCircle2, AlertTriangle, FileSpreadsheet } from 'lucide-react';

interface ImportWizardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultEntity?: ImportEntity;
  onSuccess: () => void;
}

export function ImportWizardDialog({
  open,
  onOpenChange,
  defaultEntity = 'faculty',
  onSuccess,
}: ImportWizardDialogProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [entity, setEntity] = useState<ImportEntity>(defaultEntity);
  const [file, setFile] = useState<File | null>(null);
  const [validationReport, setValidationReport] =
    useState<ImportValidationReport | null>(null);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [importSummary, setImportSummary] = useState<{
    inserted: number;
    errors: number;
  } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleValidate = async () => {
    if (!file) {
      toast.error('File Required', 'Please select a CSV or Excel file to upload.');
      return;
    }

    setLoading(true);
    try {
      const report = await libraryApi.previewImportFile(entity, file);
      setValidationReport(report);
      setStep(2);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Validation failed';
      toast.error('Validation Error', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteImport = async () => {
    if (!validationReport || validationReport.preview.length === 0) {
      toast.error('No Data', 'No valid rows available to import.');
      return;
    }

    setStep(3);
    setProgress(30);

    try {
      setProgress(60);
      const res = await libraryApi.executeImport(
        entity,
        validationReport.preview,
      );
      setProgress(100);
      setImportSummary(res);
      setStep(4);
      toast.success(
        'Import Completed',
        `Successfully imported ${res.inserted} ${entity} records.`,
      );
      onSuccess();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Import failed';
      toast.error('Import Error', msg);
      setStep(2);
    }
  };

  const reset = () => {
    setStep(1);
    setFile(null);
    setValidationReport(null);
    setProgress(0);
    setImportSummary(null);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset();
        onOpenChange(v);
      }}
    >
      <div className="space-y-4 max-h-[85vh] overflow-y-auto pr-1">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Import Wizard: {entity.toUpperCase()}</DialogTitle>
            <Badge variant="neutral">Step {step} of 4</Badge>
          </div>
          <DialogDescription>
            Bulk import resources via CSV or Excel (.xlsx) with automated schema
            validation.
          </DialogDescription>
        </DialogHeader>

        {/* STEP 1: UPLOAD */}
        {step === 1 && (
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-[#8A8A8A]">Select Target Resource Type</label>
              <Select
                value={entity}
                onChange={(e) => setEntity(e.target.value as ImportEntity)}
              >
                <option value="faculty">Faculty Members</option>
                <option value="subjects">Academic Subjects</option>
                <option value="rooms">Classrooms & Labs</option>
              </Select>
            </div>

            <div className="border-2 border-dashed border-[#232323] hover:border-[#FACC15] transition-colors rounded-lg p-6 text-center bg-[#0A0A0A] space-y-2">
              <UploadCloud className="w-10 h-10 mx-auto text-[#8A8A8A]" />
              <div>
                <p className="text-sm font-medium text-[#FAFAFA]">
                  {file ? file.name : 'Click to select or drag and drop file'}
                </p>
                <p className="text-xs text-[#8A8A8A]">
                  Supported formats: CSV (.csv), Excel (.xlsx, .xls)
                </p>
              </div>
              <input
                type="file"
                accept=".csv, .xlsx, .xls"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload-input"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  document.getElementById('file-upload-input')?.click()
                }
              >
                Choose File
              </Button>
            </div>
          </div>
        )}

        {/* STEP 2: VALIDATION REPORT & ROW ERRORS */}
        {step === 2 && validationReport && (
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 border border-[#232323] rounded-md bg-[#0A0A0A]">
                <span className="text-[10px] font-mono text-[#8A8A8A] uppercase">
                  Total Rows
                </span>
                <p className="text-xl font-mono text-[#FAFAFA]">
                  {validationReport.totalRows}
                </p>
              </div>
              <div className="p-3 border border-[#232323] rounded-md bg-[#0A0A0A]">
                <span className="text-[10px] font-mono text-[#22C55E] uppercase">
                  Valid Rows
                </span>
                <p className="text-xl font-mono text-[#22C55E]">
                  {validationReport.validRows}
                </p>
              </div>
              <div className="p-3 border border-[#232323] rounded-md bg-[#0A0A0A]">
                <span className="text-[10px] font-mono text-[#EF4444] uppercase">
                  Invalid Rows
                </span>
                <p className="text-xl font-mono text-[#EF4444]">
                  {validationReport.invalidRows}
                </p>
              </div>
            </div>

            {/* Error table */}
            {validationReport.errors.length > 0 && (
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs text-[#EF4444] font-mono">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Validation Issues Detected:</span>
                </div>
                <div className="max-h-48 overflow-y-auto border border-[#232323] rounded-md bg-[#0A0A0A]">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-[#111] border-b border-[#232323]">
                      <tr>
                        <th className="p-2 text-[#8A8A8A]">Row</th>
                        <th className="p-2 text-[#8A8A8A]">Field</th>
                        <th className="p-2 text-[#8A8A8A]">Error Message</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#232323]">
                      {validationReport.errors.map((err, i) => (
                        <tr key={i} className="hover:bg-[#111]">
                          <td className="p-2 text-[#FAFAFA]">#{err.row}</td>
                          <td className="p-2 text-[#FACC15]">{err.field}</td>
                          <td className="p-2 text-[#EF4444]">{err.message}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Preview table */}
            <div className="space-y-1.5">
              <span className="text-xs font-mono text-[#8A8A8A]">
                Preview (First {validationReport.preview.length} Rows):
              </span>
              <div className="max-h-36 overflow-x-auto overflow-y-auto border border-[#232323] rounded-md bg-[#0A0A0A]">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-[#111] border-b border-[#232323]">
                    <tr>
                      {Object.keys(validationReport.preview[0] || {}).map((k) => (
                        <th key={k} className="p-2 text-[#8A8A8A] whitespace-nowrap">
                          {k}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#232323]">
                    {validationReport.preview.map((row, idx) => (
                      <tr key={idx}>
                        {Object.values(row).map((v, c) => (
                          <td
                            key={c}
                            className="p-2 text-[#FAFAFA] whitespace-nowrap"
                          >
                            {String(v)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: PROGRESS */}
        {step === 3 && (
          <div className="py-8 space-y-4 text-center font-mono">
            <FileSpreadsheet className="w-12 h-12 mx-auto text-[#FACC15] animate-pulse" />
            <p className="text-sm text-[#FAFAFA]">
              Importing records into MongoDB & refreshing Redis cache...
            </p>
            <div className="h-2 w-full bg-[#1A1A1A] rounded-full overflow-hidden border border-[#232323]">
              <div
                className="h-full bg-[#FACC15] transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-[#8A8A8A]">{progress}% Complete</p>
          </div>
        )}

        {/* STEP 4: SUMMARY & COMPLETE */}
        {step === 4 && importSummary && (
          <div className="py-6 space-y-4 text-center font-sans">
            <CheckCircle2 className="w-12 h-12 mx-auto text-[#22C55E]" />
            <div>
              <p className="text-base font-medium text-[#FAFAFA]">
                Import Completed Successfully
              </p>
              <p className="text-xs text-[#8A8A8A] mt-1 font-mono">
                {importSummary.inserted} records created/updated,{' '}
                {importSummary.errors} failed.
              </p>
            </div>
          </div>
        )}

        <DialogFooter>
          {step === 1 && (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                disabled={loading || !file}
                onClick={handleValidate}
              >
                Inspect & Validate File
              </Button>
            </>
          )}

          {step === 2 && (
            <>
              <Button type="button" variant="outline" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={handleExecuteImport}
                disabled={validationReport?.validRows === 0}
              >
                Proceed with Import ({validationReport?.validRows} rows)
              </Button>
            </>
          )}

          {step === 4 && (
            <Button
              type="button"
              variant="primary"
              onClick={() => {
                reset();
                onOpenChange(false);
              }}
            >
              Done
            </Button>
          )}
        </DialogFooter>
      </div>
    </Dialog>
  );
}
