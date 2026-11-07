// React component for faculty-dialog.
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
import { AvailabilityGrid } from './availability-grid';
import { libraryApi } from '../services/library.api';
import { toast } from '@/components/ui/toast';
import type { FacultyDto, SubjectDto, DepartmentDto } from '@slotly/contracts';

interface FacultyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  faculty?: FacultyDto | null;
  departments: DepartmentDto[];
  subjects: SubjectDto[];
  defaultDepartmentId?: string | null;
  onSuccess: () => void;
}

/** React component rendering faculty dialog. */
export function FacultyDialog({
  open,
  onOpenChange,
  faculty,
  departments,
  subjects,
  defaultDepartmentId,
  onSuccess,
}: FacultyDialogProps) {
  const [name, setName] = useState(faculty?.name || '');
  const [code, setCode] = useState(faculty?.code || '');
  const [email, setEmail] = useState(faculty?.email || '');
  const [departmentId, setDepartmentId] = useState(
    faculty?.departmentId || defaultDepartmentId || departments[0]?.id || '',
  );
  const [designation, setDesignation] = useState(
    faculty?.designation || 'Assistant Professor',
  );
  const [minHoursPerWeek, setMinHoursPerWeek] = useState(
    faculty?.minHoursPerWeek ?? 4,
  );
  const [maxHoursPerDay, setMaxHoursPerDay] = useState(
    faculty?.maxHoursPerDay ?? 6,
  );
  const [maxHoursPerWeek, setMaxHoursPerWeek] = useState(
    faculty?.maxHoursPerWeek ?? 18,
  );
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(
    faculty?.subjectIds || [],
  );
  const [availability, setAvailability] = useState<boolean[][]>(
    faculty?.availability ||
      Array.from({ length: 7 }, () => Array(8).fill(true)),
  );
  const [loading, setLoading] = useState(false);
  const [prevFaculty, setPrevFaculty] = useState(faculty);
  const [prevOpen, setPrevOpen] = useState(open);

  // React 19 render-phase state adjustment
  if (faculty !== prevFaculty || open !== prevOpen) {
    setPrevFaculty(faculty);
    setPrevOpen(open);
    if (faculty) {
      setName(faculty.name);
      setCode(faculty.code);
      setEmail(faculty.email);
      setDepartmentId(faculty.departmentId);
      setDesignation(faculty.designation);
      setMinHoursPerWeek(faculty.minHoursPerWeek);
      setMaxHoursPerDay(faculty.maxHoursPerDay);
      setMaxHoursPerWeek(faculty.maxHoursPerWeek);
      setSelectedSubjects(faculty.subjectIds || []);
      setAvailability(
        faculty.availability ||
          Array.from({ length: 7 }, () => Array(8).fill(true)),
      );
    } else {
      setName('');
      setCode('');
      setEmail('');
      setDepartmentId(defaultDepartmentId || departments[0]?.id || '');
      setDesignation('Assistant Professor');
      setMinHoursPerWeek(4);
      setMaxHoursPerDay(6);
      setMaxHoursPerWeek(18);
      setSelectedSubjects([]);
      setAvailability(Array.from({ length: 7 }, () => Array(8).fill(true)));
    }
  }

  const toggleSubject = (subId: string) => {
    if (selectedSubjects.includes(subId)) {
      setSelectedSubjects(selectedSubjects.filter((id) => id !== subId));
    } else {
      setSelectedSubjects([...selectedSubjects, subId]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim() || !email.trim() || !departmentId) {
      toast.error('Validation Error', 'Please fill in all required fields.');
      return;
    }

    setLoading(true);
    try {
      if (faculty) {
        await libraryApi.updateFaculty(faculty.id, {
          name: name.trim(),
          code: code.toUpperCase().trim(),
          email: email.toLowerCase().trim(),
          departmentId,
          designation: designation.trim(),
          minHoursPerWeek: Number(minHoursPerWeek),
          maxHoursPerDay: Number(maxHoursPerDay),
          maxHoursPerWeek: Number(maxHoursPerWeek),
          subjectIds: selectedSubjects,
          availability,
        });
        toast.success(
          'Faculty Updated',
          `Faculty ${name} (${code}) has been updated.`,
        );
      } else {
        await libraryApi.createFaculty({
          name: name.trim(),
          code: code.toUpperCase().trim(),
          email: email.toLowerCase().trim(),
          departmentId,
          designation: designation.trim(),
          minHoursPerWeek: Number(minHoursPerWeek),
          maxHoursPerDay: Number(maxHoursPerDay),
          maxHoursPerWeek: Number(maxHoursPerWeek),
          subjectIds: selectedSubjects,
          availability,
          archived: false,
        });
        toast.success(
          'Faculty Created',
          `Faculty ${name} (${code}) has been created.`,
        );
      }
      onSuccess();
      onOpenChange(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Operation failed';
      toast.error('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <form onSubmit={handleSubmit} className="space-y-4 max-h-[85vh] overflow-y-auto pr-1">
        <DialogHeader>
          <DialogTitle>
            {faculty ? `Edit Faculty: ${faculty.code}` : 'Add New Faculty'}
          </DialogTitle>
          <DialogDescription>
            Configure profile, weekly workload parameters, qualified subjects,
            and slot availability.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-mono text-[#8A8A8A]">Faculty Name *</label>
            <Input
              placeholder="e.g. Dr. Alan Turing"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-mono text-[#8A8A8A]">Short Code / ID *</label>
            <Input
              placeholder="e.g. TUR"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-mono text-[#8A8A8A]">Email Address *</label>
            <Input
              type="email"
              placeholder="e.g. turing@slotly.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-mono text-[#8A8A8A]">Designation</label>
            <Input
              placeholder="e.g. Associate Professor"
              value={designation}
              onChange={(e) => setDesignation(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-mono text-[#8A8A8A]">Department *</label>
          <Select
            value={departmentId}
            onChange={(e) => setDepartmentId(e.target.value)}
            required
          >
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} ({d.code})
              </option>
            ))}
          </Select>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-mono text-[#8A8A8A]">Min Hrs / Wk</label>
            <Input
              type="number"
              min={0}
              value={minHoursPerWeek}
              onChange={(e) => setMinHoursPerWeek(Number(e.target.value))}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-mono text-[#8A8A8A]">Max Hrs / Day</label>
            <Input
              type="number"
              min={1}
              max={12}
              value={maxHoursPerDay}
              onChange={(e) => setMaxHoursPerDay(Number(e.target.value))}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-mono text-[#8A8A8A]">Max Hrs / Wk</label>
            <Input
              type="number"
              min={1}
              max={40}
              value={maxHoursPerWeek}
              onChange={(e) => setMaxHoursPerWeek(Number(e.target.value))}
            />
          </div>
        </div>

        {/* Qualification Picker */}
        <div className="space-y-1.5 font-sans">
          <label className="text-xs font-mono text-[#8A8A8A]">
            Qualified Subjects ({selectedSubjects.length} selected)
          </label>
          <div className="max-h-32 overflow-y-auto border border-[#232323] rounded-md p-2 bg-[#0A0A0A] space-y-1">
            {subjects.length === 0 ? (
              <p className="text-xs text-[#8A8A8A] font-mono">
                No subjects created yet.
              </p>
            ) : (
              subjects.map((sub) => {
                const isSelected = selectedSubjects.includes(sub.id);
                return (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => toggleSubject(sub.id)}
                    className={`w-full flex items-center justify-between text-left px-2 py-1 rounded text-xs transition-colors ${
                      isSelected
                        ? 'bg-[#1A1A1A] text-[#FAFAFA] border border-[#FACC15]'
                        : 'text-[#8A8A8A] hover:bg-[#111] hover:text-[#FAFAFA]'
                    }`}
                  >
                    <span>
                      <strong className="font-mono text-[#FAFAFA]">
                        {sub.code}
                      </strong>{' '}
                      - {sub.name}
                    </span>
                    <span className="text-[10px] font-mono text-[#8A8A8A]">
                      {sub.type}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Weekly Availability Grid */}
        <AvailabilityGrid
          value={availability}
          onChange={setAvailability}
          periodsCount={8}
        />

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={loading}>
            {faculty ? 'Save Changes' : 'Create Faculty'}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
