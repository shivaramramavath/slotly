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
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { institutionApi } from '../services/institution.api';
import { toast } from '@/components/ui/toast';
import type { AcademicYearDto, ProgramDto } from '@slotly/contracts';

interface AcademicYearDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  academicYear?: AcademicYearDto | null;
  programs: ProgramDto[];
  defaultProgramId?: string | null;
  onSuccess: () => void;
}

export function AcademicYearDialog({
  open,
  onOpenChange,
  academicYear,
  programs,
  defaultProgramId,
  onSuccess,
}: AcademicYearDialogProps) {
  const [programId, setProgramId] = useState(
    academicYear
      ? academicYear.programId
      : defaultProgramId || programs[0]?.id || '',
  );
  const [yearNumber, setYearNumber] = useState(academicYear ? academicYear.yearNumber : 1);
  const [label, setLabel] = useState(academicYear ? academicYear.label : 'First Year');
  const [loading, setLoading] = useState(false);
  const [prevYear, setPrevYear] = useState(academicYear);
  const [prevOpen, setPrevOpen] = useState(open);

  if (academicYear !== prevYear || open !== prevOpen) {
    setPrevYear(academicYear);
    setPrevOpen(open);
    if (academicYear) {
      setProgramId(academicYear.programId);
      setYearNumber(academicYear.yearNumber);
      setLabel(academicYear.label);
    } else {
      setProgramId(defaultProgramId || programs[0]?.id || '');
      setYearNumber(1);
      setLabel('First Year');
    }
  }

  const handleYearChange = (val: number) => {
    setYearNumber(val);
    const labels: Record<number, string> = {
      1: 'First Year',
      2: 'Second Year',
      3: 'Third Year',
      4: 'Fourth Year',
      5: 'Fifth Year',
      6: 'Sixth Year',
    };
    if (labels[val]) setLabel(labels[val] || `Year ${val}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!programId || !label.trim()) return;

    setLoading(true);
    try {
      if (academicYear) {
        await institutionApi.updateAcademicYear(academicYear.id, {
          yearNumber,
          label: label.trim(),
        });
        toast.success('Academic Year Updated', `Updated '${label}'.`);
      } else {
        await institutionApi.createAcademicYear({
          programId,
          yearNumber,
          label: label.trim(),
        });
        toast.success('Academic Year Created', `Created '${label}'.`);
      }
      onSuccess();
      onOpenChange(false);
    } catch {
      // error handled by apiClient
    } finally {
      setLoading(false);
    }
  };

  const hasPrograms = programs.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <form onSubmit={handleSubmit}>
        <DialogHeader>
          <DialogTitle>
            {academicYear ? 'Edit Academic Year' : 'Create Academic Year'}
          </DialogTitle>
          <DialogDescription>
            Academic years represent cohorts (e.g. Year 1 / Freshman, Year 2 / Sophomore) under a degree program.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {!hasPrograms ? (
            <div className="p-3 rounded border border-[#EF4444]/30 bg-[#EF4444]/10 text-xs font-mono text-[#EF4444]">
              ⚠ Cannot create an Academic Year: No degree programs exist. Please create a Program first.
            </div>
          ) : (
            <div className="space-y-1.5">
              <label className="text-xs font-mono uppercase text-[#8A8A8A]">
                Parent Program
              </label>
              <Select
                value={programId}
                onChange={(e) => setProgramId(e.target.value)}
                disabled={Boolean(academicYear)}
                required
              >
                {programs.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.code})
                  </option>
                ))}
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-mono uppercase text-[#8A8A8A]">
                Year Number
              </label>
              <Input
                type="number"
                min={1}
                max={6}
                value={yearNumber}
                onChange={(e) => handleYearChange(parseInt(e.target.value, 10) || 1)}
                disabled={!hasPrograms}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono uppercase text-[#8A8A8A]">
                Label
              </label>
              <Input
                placeholder="e.g. First Year"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                disabled={!hasPrograms}
                required
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={loading || !hasPrograms || !label.trim()}
          >
            {loading ? 'Saving...' : academicYear ? 'Save Changes' : 'Create Year'}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
