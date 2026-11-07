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
import { libraryApi } from '../services/library.api';
import { toast } from '@/components/ui/toast';
import type {
  SubjectDto,
  DepartmentDto,
  ElectiveGroupDto,
  SubjectType,
  RoomType,
} from '@slotly/contracts';

interface SubjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subject?: SubjectDto | null;
  departments: DepartmentDto[];
  electiveGroups: ElectiveGroupDto[];
  defaultDepartmentId?: string | null;
  onSuccess: () => void;
}

export function SubjectDialog({
  open,
  onOpenChange,
  subject,
  departments,
  electiveGroups,
  defaultDepartmentId,
  onSuccess,
}: SubjectDialogProps) {
  const [code, setCode] = useState(subject?.code || '');
  const [name, setName] = useState(subject?.name || '');
  const [departmentId, setDepartmentId] = useState(
    subject?.departmentId || defaultDepartmentId || departments[0]?.id || '',
  );
  const [credits, setCredits] = useState(subject?.credits ?? 3);
  const [type, setType] = useState<SubjectType>(subject?.type || 'theory');
  const [weeklyHours, setWeeklyHours] = useState(subject?.weeklyHours ?? 3);
  const [labHours, setLabHours] = useState(subject?.labHours ?? 0);
  const [consecutivePeriods, setConsecutivePeriods] = useState(
    subject?.consecutivePeriods ?? 1,
  );
  const [isElective, setIsElective] = useState(subject?.isElective || false);
  const [electiveGroupId, setElectiveGroupId] = useState(
    subject?.electiveGroupId || '',
  );
  const [roomType, setRoomType] = useState<RoomType>(
    subject?.requirements?.roomType || 'lecture',
  );
  const [minCapacity, setMinCapacity] = useState(
    subject?.requirements?.minCapacity ?? 30,
  );
  const [equipmentInput, setEquipmentInput] = useState(
    subject?.requirements?.equipment?.join(', ') || '',
  );
  const [loading, setLoading] = useState(false);
  const [prevSubject, setPrevSubject] = useState(subject);
  const [prevOpen, setPrevOpen] = useState(open);

  // React 19 render-phase state adjustment
  if (subject !== prevSubject || open !== prevOpen) {
    setPrevSubject(subject);
    setPrevOpen(open);
    if (subject) {
      setCode(subject.code);
      setName(subject.name);
      setDepartmentId(subject.departmentId);
      setCredits(subject.credits);
      setType(subject.type);
      setWeeklyHours(subject.weeklyHours);
      setLabHours(subject.labHours);
      setConsecutivePeriods(subject.consecutivePeriods);
      setIsElective(subject.isElective);
      setElectiveGroupId(subject.electiveGroupId || '');
      setRoomType(subject.requirements?.roomType || 'lecture');
      setMinCapacity(subject.requirements?.minCapacity ?? 30);
      setEquipmentInput(subject.requirements?.equipment?.join(', ') || '');
    } else {
      setCode('');
      setName('');
      setDepartmentId(defaultDepartmentId || departments[0]?.id || '');
      setCredits(3);
      setType('theory');
      setWeeklyHours(3);
      setLabHours(0);
      setConsecutivePeriods(1);
      setIsElective(false);
      setElectiveGroupId('');
      setRoomType('lecture');
      setMinCapacity(30);
      setEquipmentInput('');
    }
  }

  const handleTypeChange = (newType: string) => {
    const t = newType as SubjectType;
    setType(t);
    if (t === 'lab') {
      setConsecutivePeriods(3);
      setRoomType('lab');
      if (labHours === 0) setLabHours(3);
    } else {
      setConsecutivePeriods(1);
      setRoomType('lecture');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !name.trim() || !departmentId) {
      toast.error('Validation Error', 'Please fill in code, name, and department.');
      return;
    }

    const equipment = equipmentInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    setLoading(true);
    try {
      if (subject) {
        await libraryApi.updateSubject(subject.id, {
          code: code.toUpperCase().trim(),
          name: name.trim(),
          departmentId,
          credits: Number(credits),
          type,
          weeklyHours: Number(weeklyHours),
          labHours: Number(labHours),
          consecutivePeriods: Number(consecutivePeriods),
          isElective,
          electiveGroupId: isElective && electiveGroupId ? electiveGroupId : null,
          requirements: {
            roomType,
            minCapacity: Number(minCapacity),
            equipment,
          },
        });
        toast.success('Subject Updated', `Subject ${code} updated.`);
      } else {
        await libraryApi.createSubject({
          code: code.toUpperCase().trim(),
          name: name.trim(),
          departmentId,
          credits: Number(credits),
          type,
          weeklyHours: Number(weeklyHours),
          labHours: Number(labHours),
          consecutivePeriods: Number(consecutivePeriods),
          isElective,
          electiveGroupId: isElective && electiveGroupId ? electiveGroupId : null,
          requirements: {
            roomType,
            minCapacity: Number(minCapacity),
            equipment,
          },
          preferredDays: [],
          enrollment: 0,
          dependsOn: [],
          programIds: [],
          facultyIds: [],
          archived: false,
        });
        toast.success('Subject Created', `Subject ${code} created.`);
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
            {subject ? `Edit Subject: ${subject.code}` : 'Add New Subject'}
          </DialogTitle>
          <DialogDescription>
            Configure academic course info, lab settings, elective group, and room
            resource requirements.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-mono text-[#8A8A8A]">Subject Code *</label>
            <Input
              placeholder="e.g. CS201"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-mono text-[#8A8A8A]">Subject Name *</label>
            <Input
              placeholder="e.g. Data Structures & Algorithms"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
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
          <div className="space-y-1.5">
            <label className="text-xs font-mono text-[#8A8A8A]">Subject Type</label>
            <Select
              value={type}
              onChange={(e) => handleTypeChange(e.target.value)}
            >
              <option value="theory">Theory Lecture</option>
              <option value="lab">Laboratory</option>
              <option value="tutorial">Tutorial</option>
              <option value="seminar">Seminar</option>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-mono text-[#8A8A8A]">Credits</label>
            <Input
              type="number"
              min={0}
              value={credits}
              onChange={(e) => setCredits(Number(e.target.value))}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-mono text-[#8A8A8A]">Weekly Hrs</label>
            <Input
              type="number"
              min={1}
              value={weeklyHours}
              onChange={(e) => setWeeklyHours(Number(e.target.value))}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-mono text-[#8A8A8A]">Lab Hrs</label>
            <Input
              type="number"
              min={0}
              value={labHours}
              onChange={(e) => setLabHours(Number(e.target.value))}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-mono text-[#8A8A8A]">Consecutive</label>
            <Input
              type="number"
              min={1}
              max={6}
              value={consecutivePeriods}
              onChange={(e) => setConsecutivePeriods(Number(e.target.value))}
            />
          </div>
        </div>

        {/* Elective Group settings */}
        <div className="p-3 border border-[#232323] rounded-md bg-[#0A0A0A] space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-mono text-[#FAFAFA]">
                Elective Subject
              </span>
              <p className="text-[10px] text-[#8A8A8A]">
                Group with other electives running in parallel
              </p>
            </div>
            <Switch checked={isElective} onCheckedChange={setIsElective} />
          </div>

          {isElective && (
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-[#8A8A8A]">Elective Group</label>
              <Select
                value={electiveGroupId}
                onChange={(e) => setElectiveGroupId(e.target.value)}
              >
                <option value="">-- None (Standalone Elective) --</option>
                {electiveGroups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </Select>
            </div>
          )}
        </div>

        {/* Requirements: Room Type, Capacity, Equipment */}
        <div className="p-3 border border-[#232323] rounded-md bg-[#0A0A0A] space-y-3">
          <span className="text-xs font-mono text-[#FAFAFA]">
            Room & Resource Requirements
          </span>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-[#8A8A8A]">Required Room Type</label>
              <Select
                value={roomType}
                onChange={(e) => setRoomType(e.target.value as RoomType)}
              >
                <option value="lecture">Classroom / Lecture Hall</option>
                <option value="lab">Specialized Laboratory</option>
                <option value="seminar">Seminar Room</option>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-[#8A8A8A]">Min Room Capacity</label>
              <Input
                type="number"
                min={1}
                value={minCapacity}
                onChange={(e) => setMinCapacity(Number(e.target.value))}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-mono text-[#8A8A8A]">Required Equipment (comma separated)</label>
            <Input
              placeholder="e.g. Computers, Projector, Smartboard"
              value={equipmentInput}
              onChange={(e) => setEquipmentInput(e.target.value)}
            />
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
            {subject ? 'Save Changes' : 'Create Subject'}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
