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

interface HolidayDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function HolidayDialog({
  open,
  onOpenChange,
  onSuccess,
}: HolidayDialogProps) {
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('2026-11-26');
  const [endDate, setEndDate] = useState('2026-11-28');
  const [type, setType] = useState<'holiday' | 'exam' | 'event' | 'break'>('holiday');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !startDate || !endDate) return;

    setLoading(true);
    try {
      await institutionApi.createHoliday({
        name: name.trim(),
        startDate,
        endDate,
        type,
      });
      toast.success('Calendar Event Added', `Added '${name}'.`);
      setName('');
      onSuccess();
      onOpenChange(false);
    } catch {
      // error handled by apiClient
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <form onSubmit={handleSubmit}>
        <DialogHeader>
          <DialogTitle>Add Calendar Event or Holiday</DialogTitle>
          <DialogDescription>
            Holidays, exam weeks, and academic breaks prevent classes from being scheduled.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-mono uppercase text-[#8A8A8A]">
              Event / Holiday Name
            </label>
            <Input
              placeholder="e.g. Thanksgiving Break, Midterm Exam Week"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-mono uppercase text-[#8A8A8A]">
              Event Type
            </label>
            <Select
              value={type}
              onChange={(e) =>
                setType(e.target.value as 'holiday' | 'exam' | 'event' | 'break')
              }
            >
              <option value="holiday">Holiday (Campus Closed)</option>
              <option value="exam">Examination Period</option>
              <option value="break">Academic / Semester Break</option>
              <option value="event">Institution Event / Symposium</option>
            </Select>
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
            disabled={loading || !name.trim()}
          >
            {loading ? 'Adding...' : 'Add Event'}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
