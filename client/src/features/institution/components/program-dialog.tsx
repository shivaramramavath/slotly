// React component for program-dialog.
'use client';

import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
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
import { institutionKeys } from '../hooks/use-institution';
import { toast } from '@/components/ui/toast';
import type { ProgramDto, DepartmentDto } from '@slotly/contracts';

interface ProgramDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  program?: ProgramDto | null;
  departments: DepartmentDto[];
  defaultDepartmentId?: string | null;
  institutionId?: string | undefined;
  onSuccess?: () => void;
}

/** React component rendering program dialog. */
export function ProgramDialog({
  open,
  onOpenChange,
  program,
  departments,
  defaultDepartmentId,
  institutionId,
  onSuccess,
}: ProgramDialogProps) {
  const [departmentId, setDepartmentId] = useState(
    program ? program.departmentId : defaultDepartmentId || departments[0]?.id || '',
  );
  const [name, setName] = useState(program ? program.name : '');
  const [code, setCode] = useState(program ? program.code : '');
  const [durationYears, setDurationYears] = useState(program ? program.durationYears : 4);
  const [loading, setLoading] = useState(false);
  const [prevProg, setPrevProg] = useState(program);
  const [prevOpen, setPrevOpen] = useState(open);
  const queryClient = useQueryClient();

  if (program !== prevProg || open !== prevOpen) {
    setPrevProg(program);
    setPrevOpen(open);
    setDepartmentId(program ? program.departmentId : defaultDepartmentId || departments[0]?.id || '');
    setName(program ? program.name : '');
    setCode(program ? program.code : '');
    setDurationYears(program ? program.durationYears : 4);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim() || !departmentId) return;

    setLoading(true);
    try {
      if (program) {
        await institutionApi.updateProgram(program.id, {
          name: name.trim(),
          code: code.toUpperCase().trim(),
          durationYears,
        });
        await queryClient.invalidateQueries({ queryKey: institutionKeys.all });
        toast.success('Program Updated', `Program '${code}' has been updated.`);
      } else {
        await institutionApi.createProgram(
          {
            departmentId,
            name: name.trim(),
            code: code.toUpperCase().trim(),
            durationYears,
            institutionId,
          },
          institutionId,
        );
        await queryClient.invalidateQueries({ queryKey: institutionKeys.all });
        toast.success('Program Created', `Program '${code}' has been created.`);
      }
      onSuccess?.();
      onOpenChange(false);
    } catch {
      // Keep dialog open on failure; error feedback handled by apiClient/toast
    } finally {
      setLoading(false);
    }
  };

  const hasDepartments = departments.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <form onSubmit={handleSubmit}>
        <DialogHeader>
          <DialogTitle>
            {program ? 'Edit Academic Program' : 'Create Academic Program'}
          </DialogTitle>
          <DialogDescription>
            Programs belong to a department and define degree tracks (e.g. B.Tech Computer Science, M.S. Data Science).
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {!hasDepartments ? (
            <div className="p-3 rounded border border-[#EF4444]/30 bg-[#EF4444]/10 text-xs font-mono text-[#EF4444]">
              ⚠ Cannot create a Program: No active departments exist. Please create a Department first.
            </div>
          ) : (
            <div className="space-y-1.5">
              <label className="text-xs font-mono uppercase text-[#8A8A8A]">
                Parent Department
              </label>
              <Select
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                disabled={Boolean(program)}
                required
              >
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.code})
                  </option>
                ))}
              </Select>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-mono uppercase text-[#8A8A8A]">
              Program Name
            </label>
            <Input
              placeholder="Bachelor of Technology in CSE"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={!hasDepartments}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-mono uppercase text-[#8A8A8A]">
                Program Code
              </label>
              <Input
                placeholder="BTECH-CSE"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                maxLength={10}
                disabled={!hasDepartments}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono uppercase text-[#8A8A8A]">
                Duration (Years)
              </label>
              <Input
                type="number"
                min={1}
                max={6}
                value={durationYears}
                onChange={(e) => setDurationYears(parseInt(e.target.value, 10) || 1)}
                disabled={!hasDepartments}
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
            disabled={loading || !hasDepartments || !name.trim() || !code.trim()}
          >
            {loading ? 'Saving...' : program ? 'Save Changes' : 'Create Program'}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
