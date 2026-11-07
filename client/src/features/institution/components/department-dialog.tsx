// React component for department-dialog.
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
import { institutionApi } from '../services/institution.api';
import { toast } from '@/components/ui/toast';
import type { DepartmentDto } from '@slotly/contracts';

interface DepartmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  department?: DepartmentDto | null;
  onSuccess: () => void;
}

/** React component rendering department dialog. */
export function DepartmentDialog({
  open,
  onOpenChange,
  department,
  onSuccess,
}: DepartmentDialogProps) {
  const [name, setName] = useState(department ? department.name : '');
  const [code, setCode] = useState(department ? department.code : '');
  const [loading, setLoading] = useState(false);
  const [prevDept, setPrevDept] = useState(department);

  if (department !== prevDept) {
    setPrevDept(department);
    setName(department ? department.name : '');
    setCode(department ? department.code : '');
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) return;

    setLoading(true);
    try {
      if (department) {
        await institutionApi.updateDepartment(department.id, {
          name: name.trim(),
          code: code.toUpperCase().trim(),
        });
        toast.success('Department Updated', `Department '${code}' has been updated.`);
      } else {
        await institutionApi.createDepartment({
          name: name.trim(),
          code: code.toUpperCase().trim(),
        });
        toast.success('Department Created', `Department '${code}' has been created.`);
      }
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
          <DialogTitle>
            {department ? 'Edit Department' : 'Create Department'}
          </DialogTitle>
          <DialogDescription>
            Departments represent academic divisions (e.g. Computer Science, Mechanical Engineering).
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-mono uppercase text-[#8A8A8A]">
              Department Name
            </label>
            <Input
              placeholder="Computer Science & Engineering"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-mono uppercase text-[#8A8A8A]">
              Department Code
            </label>
            <Input
              placeholder="CSE"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              maxLength={10}
              required
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
            disabled={loading || !name.trim() || !code.trim()}
          >
            {loading ? 'Saving...' : department ? 'Save Changes' : 'Create Department'}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
