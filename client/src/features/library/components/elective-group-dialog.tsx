// React component for elective-group-dialog.
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
import { Switch } from '@/components/ui/switch';
import { libraryApi } from '../services/library.api';
import { toast } from '@/components/ui/toast';
import type { ElectiveGroupDto, SubjectDto } from '@slotly/contracts';

interface ElectiveGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group?: ElectiveGroupDto | null;
  subjects: SubjectDto[];
  onSuccess: () => void;
}

/** React component rendering elective group dialog. */
export function ElectiveGroupDialog({
  open,
  onOpenChange,
  group,
  subjects,
  onSuccess,
}: ElectiveGroupDialogProps) {
  const [name, setName] = useState(group?.name || '');
  const [mustBeSimultaneous, setMustBeSimultaneous] = useState(
    group?.mustBeSimultaneous ?? true,
  );
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(
    group?.subjectIds || [],
  );
  const [loading, setLoading] = useState(false);
  const [prevGroup, setPrevGroup] = useState(group);
  const [prevOpen, setPrevOpen] = useState(open);

  if (group !== prevGroup || open !== prevOpen) {
    setPrevGroup(group);
    setPrevOpen(open);
    if (group) {
      setName(group.name);
      setMustBeSimultaneous(group.mustBeSimultaneous);
      setSelectedSubjects(group.subjectIds || []);
    } else {
      setName('');
      setMustBeSimultaneous(true);
      setSelectedSubjects([]);
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
    if (!name.trim()) {
      toast.error('Validation Error', 'Group name is required.');
      return;
    }

    setLoading(true);
    try {
      if (group) {
        await libraryApi.updateElectiveGroup(group.id, {
          name: name.trim(),
          mustBeSimultaneous,
          subjectIds: selectedSubjects,
        });
        toast.success('Elective Group Updated', `Group ${name} updated.`);
      } else {
        await libraryApi.createElectiveGroup({
          name: name.trim(),
          mustBeSimultaneous,
          subjectIds: selectedSubjects,
        });
        toast.success('Elective Group Created', `Group ${name} created.`);
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
      <form onSubmit={handleSubmit} className="space-y-4">
        <DialogHeader>
          <DialogTitle>
            {group ? `Edit Elective Group: ${group.name}` : 'New Elective Group'}
          </DialogTitle>
          <DialogDescription>
            Group elective subjects together. Timetable solver will schedule
            simultaneous slots for parallel student enrollment.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-1.5">
          <label className="text-xs font-mono text-[#8A8A8A]">Group Name *</label>
          <Input
            placeholder="e.g. Professional Elective I (Semester 5)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div className="flex items-center justify-between p-3 border border-[#232323] rounded-md bg-[#0A0A0A]">
          <div>
            <span className="text-xs font-mono text-[#FAFAFA]">
              Must Run Simultaneously
            </span>
            <p className="text-[10px] text-[#8A8A8A]">
              All subjects in this group must be scheduled at the exact same period
            </p>
          </div>
          <Switch
            checked={mustBeSimultaneous}
            onCheckedChange={setMustBeSimultaneous}
          />
        </div>

        <div className="space-y-1.5 font-sans">
          <label className="text-xs font-mono text-[#8A8A8A]">
            Included Subjects ({selectedSubjects.length} selected)
          </label>
          <div className="max-h-48 overflow-y-auto border border-[#232323] rounded-md p-2 bg-[#0A0A0A] space-y-1">
            {subjects.length === 0 ? (
              <p className="text-xs text-[#8A8A8A] font-mono">
                No subjects available.
              </p>
            ) : (
              subjects.map((sub) => {
                const isSelected = selectedSubjects.includes(sub.id);
                return (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => toggleSubject(sub.id)}
                    className={`w-full flex items-center justify-between text-left px-2 py-1.5 rounded text-xs transition-colors ${
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
                      {sub.credits} credits
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={loading}>
            {group ? 'Save Changes' : 'Create Group'}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
