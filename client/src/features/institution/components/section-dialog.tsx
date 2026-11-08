// React component for section-dialog.
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
import type { SectionDto, SemesterDto, BatchDto } from '@slotly/contracts';
import { Plus, Trash2 } from 'lucide-react';

interface SectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  section?: SectionDto | null;
  semesters: SemesterDto[];
  defaultSemesterId?: string | null;
  onSuccess: () => void;
}

/** React component rendering section dialog. */
export function SectionDialog({
  open,
  onOpenChange,
  section,
  semesters,
  defaultSemesterId,
  onSuccess,
}: SectionDialogProps) {
  const [semesterId, setSemesterId] = useState(
    section ? section.semesterId : defaultSemesterId || semesters[0]?.id || '',
  );
  const [name, setName] = useState(section ? section.name : 'Section A');
  const [strength, setStrength] = useState(section ? section.strength : 60);
  const [batches, setBatches] = useState<BatchDto[]>(
    section
      ? section.batches || []
      : [
          { name: 'Batch 1', size: 30 },
          { name: 'Batch 2', size: 30 },
        ],
  );
  const [loading, setLoading] = useState(false);
  const [prevSection, setPrevSection] = useState(section);
  const [prevOpen, setPrevOpen] = useState(open);

  if (section !== prevSection || open !== prevOpen) {
    setPrevSection(section);
    setPrevOpen(open);
    if (section) {
      setSemesterId(section.semesterId);
      setName(section.name);
      setStrength(section.strength);
      setBatches(section.batches || []);
    } else {
      setSemesterId(defaultSemesterId || semesters[0]?.id || '');
      setName('Section A');
      setStrength(60);
      setBatches([
        { name: 'Batch 1', size: 30 },
        { name: 'Batch 2', size: 30 },
      ]);
    }
  }

  const handleAddBatch = () => {
    const nextNum = batches.length + 1;
    setBatches([...batches, { name: `Batch ${nextNum}`, size: 20 }]);
  };

  const handleRemoveBatch = (index: number) => {
    setBatches(batches.filter((_, idx) => idx !== index));
  };

  const handleBatchChange = (
    index: number,
    field: keyof BatchDto,
    value: string | number,
  ) => {
    const updated = [...batches];
    const current = updated[index];
    if (current) {
      if (field === 'size') {
        current.size = typeof value === 'number' ? value : parseInt(value, 10) || 0;
      } else if (field === 'name') {
        current.name = String(value);
      }
      setBatches(updated);
    }
  };

  const totalBatchSize = batches.reduce((acc, b) => acc + b.size, 0);
  const isOverCapacity = totalBatchSize > strength;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!semesterId || !name.trim() || strength <= 0) return;

    if (isOverCapacity) {
      toast.error(
        'Capacity Exceeded',
        `Combined batch sizes (${totalBatchSize}) exceed section strength (${strength}).`,
      );
      return;
    }

    setLoading(true);
    try {
      if (section) {
        await institutionApi.updateSection(section.id, {
          name: name.trim(),
          strength,
          batches,
        });
        toast.success('Section Updated', `Updated '${name}'.`);
      } else {
        await institutionApi.createSection({
          semesterId,
          name: name.trim(),
          strength,
          batches,
        });
        toast.success('Section Created', `Created '${name}'.`);
      }
      onSuccess();
      onOpenChange(false);
    } catch {
      // error handled by apiClient
    } finally {
      setLoading(false);
    }
  };

  const hasSemesters = semesters.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <form onSubmit={handleSubmit}>
        <DialogHeader>
          <DialogTitle>
            {section ? 'Edit Section & Batches' : 'Create Section & Batches'}
          </DialogTitle>
          <DialogDescription>
            Sections represent student groups assigned to a semester. Batches divide a section for laboratory and tutorial sessions.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          {!hasSemesters ? (
            <div className="p-3 rounded border border-[#EF4444]/30 bg-[#EF4444]/10 text-xs font-mono text-[#EF4444]">
              ⚠ Cannot create a Section: No semesters exist. Please create a Semester first.
            </div>
          ) : (
            <div className="space-y-1.5">
              <label className="text-xs font-mono uppercase text-[#8A8A8A]">
                Parent Semester
              </label>
              <Select
                value={semesterId}
                onChange={(e) => setSemesterId(e.target.value)}
                disabled={Boolean(section)}
                required
              >
                {semesters.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.academicYearLabel})
                  </option>
                ))}
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-mono uppercase text-[#8A8A8A]">
                Section Name
              </label>
              <Input
                placeholder="Section A"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={!hasSemesters}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono uppercase text-[#8A8A8A]">
                Total Student Strength
              </label>
              <Input
                type="number"
                min={1}
                value={strength}
                onChange={(e) => setStrength(parseInt(e.target.value, 10) || 1)}
                disabled={!hasSemesters}
                required
              />
            </div>
          </div>

          {/* Batches Section */}
          <div className="space-y-3 pt-3 border-t border-[#232323]">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-mono uppercase text-[#FAFAFA] font-medium">
                  Laboratory / Tutorial Batches
                </span>
                <p className="text-[11px] font-mono text-[#8A8A8A]">
                  Sum: {totalBatchSize} / {strength} students
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddBatch}
                disabled={!hasSemesters}
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Batch
              </Button>
            </div>

            {isOverCapacity && (
              <div className="p-2.5 rounded border border-[#EF4444]/30 bg-[#EF4444]/10 text-xs font-mono text-[#EF4444]">
                ⚠ Capacity exceeded: Combined batch sizes ({totalBatchSize}) cannot exceed section strength ({strength}).
              </div>
            )}

            {batches.length === 0 ? (
              <p className="text-xs font-mono text-[#8A8A8A] italic">
                No sub-batches defined. Entire section attends all sessions together.
              </p>
            ) : (
              <div className="space-y-2">
                {batches.map((batch, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Input
                      placeholder="Batch Name"
                      value={batch.name}
                      onChange={(e) => handleBatchChange(idx, 'name', e.target.value)}
                      className="flex-1"
                      required
                    />
                    <Input
                      type="number"
                      min={1}
                      placeholder="Size"
                      value={batch.size}
                      onChange={(e) => handleBatchChange(idx, 'size', e.target.value)}
                      className="w-24 text-center font-mono"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveBatch(idx)}
                      className="text-[#EF4444] hover:bg-[#EF4444]/10 shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
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
            disabled={loading || !hasSemesters || !name.trim() || isOverCapacity}
          >
            {loading ? 'Saving...' : section ? 'Save Changes' : 'Create Section'}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
