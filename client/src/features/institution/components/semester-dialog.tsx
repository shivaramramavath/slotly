// React component for semester-dialog.
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
import { Switch } from '@/components/ui/switch';
import { institutionApi } from '../services/institution.api';
import { toast } from '@/components/ui/toast';
import type { SemesterDto, AcademicYearDto } from '@slotly/contracts';

interface SemesterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  semester?: SemesterDto | null;
  academicYears: AcademicYearDto[];
  defaultAcademicYearId?: string | null;
  onSuccess: () => void;
}

/** React component rendering semester dialog. */
export function SemesterDialog({
  open,
  onOpenChange,
  semester,
  academicYears,
  defaultAcademicYearId,
  onSuccess,
}: SemesterDialogProps) {
  const [academicYearId, setAcademicYearId] = useState(
    semester ? semester.academicYearId : defaultAcademicYearId || academicYears[0]?.id || '',
  );
  const [name, setName] = useState(semester ? semester.name : 'Semester 1');
  const [number, setNumber] = useState(semester ? semester.number : 1);
  const [startDate, setStartDate] = useState(semester ? semester.startDate : '2026-09-01');
  const [endDate, setEndDate] = useState(semester ? semester.endDate : '2026-12-20');
  const [active, setActive] = useState(semester ? semester.active : true);
  const [loading, setLoading] = useState(false);
  const [prevSemester, setPrevSemester] = useState(semester);
  const [prevOpen, setPrevOpen] = useState(open);

  if (semester !== prevSemester || open !== prevOpen) {
    setPrevSemester(semester);
    setPrevOpen(open);
    if (semester) {
      setAcademicYearId(semester.academicYearId);
      setName(semester.name);
      setNumber(semester.number);
      setStartDate(semester.startDate);
      setEndDate(semester.endDate);
      setActive(semester.active);
    } else {
      setAcademicYearId(defaultAcademicYearId || academicYears[0]?.id || '');
      setName('Semester 1');
      setNumber(1);
      setStartDate('2026-09-01');
      setEndDate('2026-12-20');
      setActive(true);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!academicYearId || !name.trim() || !startDate || !endDate) return;

    setLoading(true);
    try {
      if (semester) {
        await institutionApi.updateSemester(semester.id, {
          name: name.trim(),
          number,
          startDate,
          endDate,
          active,
        });
        toast.success('Semester Updated', `Updated '${name}'.`);
      } else {
        await institutionApi.createSemester({
          academicYearId,
          name: name.trim(),
          number,
          startDate,
          endDate,
          active,
        });
        toast.success('Semester Created', `Created '${name}'.`);
      }
      onSuccess();
      onOpenChange(false);
    } catch {
      // error handled by apiClient
    } finally {
      setLoading(false);
    }
  };

  const hasAcademicYears = academicYears.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <form onSubmit={handleSubmit}>
        <DialogHeader>
          <DialogTitle>
            {semester ? 'Edit Semester' : 'Create Semester'}
          </DialogTitle>
          <DialogDescription>
            Semesters define instructional scheduling periods under an academic year.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {!hasAcademicYears ? (
            <div className="p-3 rounded border border-[#EF4444]/30 bg-[#EF4444]/10 text-xs font-mono text-[#EF4444]">
              ⚠ Cannot create a Semester: No academic years exist. Please create an Academic Year first.
            </div>
          ) : (
            <div className="space-y-1.5">
              <label className="text-xs font-mono uppercase text-[#8A8A8A]">
                Parent Academic Year
              </label>
              <Select
                value={academicYearId}
                onChange={(e) => setAcademicYearId(e.target.value)}
                disabled={Boolean(semester)}
                required
              >
                {academicYears.map((ay) => (
                  <option key={ay.id} value={ay.id}>
                    {ay.label} (Year {ay.yearNumber})
                  </option>
                ))}
              </Select>
            </div>
          )}

          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2 space-y-1.5">
              <label className="text-xs font-mono uppercase text-[#8A8A8A]">
                Semester Name
              </label>
              <Input
                placeholder="e.g. Fall 2026 / Semester 1"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={!hasAcademicYears}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono uppercase text-[#8A8A8A]">
                Number
              </label>
              <Input
                type="number"
                min={1}
                max={12}
                value={number}
                onChange={(e) => setNumber(parseInt(e.target.value, 10) || 1)}
                disabled={!hasAcademicYears}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-mono uppercase text-[#8A8A8A]">
                Start Date
              </label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                disabled={!hasAcademicYears}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono uppercase text-[#8A8A8A]">
                End Date
              </label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                disabled={!hasAcademicYears}
                required
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-[#232323]">
            <span className="text-xs font-mono uppercase text-[#8A8A8A]">
              Active Term
            </span>
            <Switch
              checked={active}
              onCheckedChange={setActive}
              disabled={!hasAcademicYears}
            />
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
            disabled={loading || !hasAcademicYears || !name.trim()}
          >
            {loading ? 'Saving...' : semester ? 'Save Changes' : 'Create Semester'}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
