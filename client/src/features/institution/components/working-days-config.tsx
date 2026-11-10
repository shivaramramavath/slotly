// Working days and timing matrix configuration form with monochrome pill selection and sys0 styling.
'use client';

import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { institutionApi } from '../services/institution.api';
import { institutionKeys } from '../hooks/use-institution';
import { toast } from '@/components/ui/toast';
import type { InstitutionDto, PeriodConfig } from '@slotly/contracts';

/** Props for WorkingDaysConfig component. */
export interface WorkingDaysConfigProps {
  institution: InstitutionDto;
  onSuccess: () => void;
}

const DAYS_OF_WEEK = [
  { index: 1, label: 'Mon', full: 'Monday' },
  { index: 2, label: 'Tue', full: 'Tuesday' },
  { index: 3, label: 'Wed', full: 'Wednesday' },
  { index: 4, label: 'Thu', full: 'Thursday' },
  { index: 5, label: 'Fri', full: 'Friday' },
  { index: 6, label: 'Sat', full: 'Saturday' },
  { index: 0, label: 'Sun', full: 'Sunday' },
];

/** React component rendering working days and period timing configuration form. */
export function WorkingDaysConfig({ institution, onSuccess }: WorkingDaysConfigProps) {
  const [workingDays, setWorkingDays] = useState<number[]>(institution.workingDays || [1, 2, 3, 4, 5]);
  const [startTime, setStartTime] = useState(institution.defaultPeriodConfig?.startTime || '09:00');
  const [periodDuration, setPeriodDuration] = useState(institution.defaultPeriodConfig?.periodDuration || 50);
  const [periodsPerDay, setPeriodsPerDay] = useState(institution.defaultPeriodConfig?.periodsPerDay || 7);
  const [breakName, setBreakName] = useState(institution.defaultPeriodConfig?.breaks?.[0]?.name || 'Lunch Break');
  const [afterPeriod, setAfterPeriod] = useState(institution.defaultPeriodConfig?.breaks?.[0]?.afterPeriod || 4);
  const [breakDuration, setBreakDuration] = useState(institution.defaultPeriodConfig?.breaks?.[0]?.durationMinutes || 45);
  const [loading, setLoading] = useState(false);
  const [prevInstitution, setPrevInstitution] = useState(institution);

  if (institution !== prevInstitution) {
    setPrevInstitution(institution);
    setWorkingDays(institution.workingDays || [1, 2, 3, 4, 5]);
    setStartTime(institution.defaultPeriodConfig?.startTime || '09:00');
    setPeriodDuration(institution.defaultPeriodConfig?.periodDuration || 50);
    setPeriodsPerDay(institution.defaultPeriodConfig?.periodsPerDay || 7);
    if (institution.defaultPeriodConfig?.breaks?.[0]) {
      setBreakName(institution.defaultPeriodConfig.breaks[0].name);
      setAfterPeriod(institution.defaultPeriodConfig.breaks[0].afterPeriod);
      setBreakDuration(institution.defaultPeriodConfig.breaks[0].durationMinutes);
    }
  }

  const toggleDay = (dayIndex: number) => {
    if (workingDays.includes(dayIndex)) {
      if (workingDays.length === 1) {
        toast.error('Selection Error', 'At least one working day must be selected.');
        return;
      }
      setWorkingDays(workingDays.filter((d) => d !== dayIndex));
    } else {
      setWorkingDays([...workingDays, dayIndex].sort());
    }
  };

  const queryClient = useQueryClient();

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const defaultPeriodConfig: PeriodConfig = {
      startTime,
      periodDuration,
      periodsPerDay,
      breaks: [
        {
          name: breakName.trim() || 'Break',
          afterPeriod,
          durationMinutes: breakDuration,
        },
      ],
    };

    try {
      await institutionApi.updateInstitution(
        {
          workingDays,
          defaultPeriodConfig,
        },
        institution.id,
      );
      await queryClient.invalidateQueries({ queryKey: institutionKeys.all });
      toast.success('Configuration Saved', 'Institutional calendar and period timing updated.');
      onSuccess();
    } catch {
      // error handled by apiClient
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-6 max-w-3xl">
      {/* Working Days Card */}
      <div className="rounded-[16px] border border-[#232323] bg-[#111111] p-6 space-y-4">
        <div>
          <h3 className="text-base font-semibold text-[#FAFAFA]">Institutional Working Days</h3>
          <p className="text-xs font-mono text-[#8A8A8A] mt-1">
            Select days of the week when classes, labs, and faculty teaching sessions take place.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 pt-2">
          {DAYS_OF_WEEK.map((day) => {
            const active = workingDays.includes(day.index);
            return (
              <button
                type="button"
                key={day.index}
                onClick={() => toggleDay(day.index)}
                className={`px-4 py-2 rounded-[10px] border text-xs font-mono transition-colors cursor-pointer ${
                  active
                    ? 'border-[#FAFAFA] bg-[#1C1C1C] text-[#FAFAFA] font-medium'
                    : 'border-[#232323] bg-[#111111] text-[#8A8A8A] hover:text-[#FAFAFA] hover:bg-[#161616]'
                }`}
              >
                {day.full}
              </button>
            );
          })}
        </div>
      </div>

      {/* Period Schedule Configuration Card */}
      <div className="rounded-[16px] border border-[#232323] bg-[#111111] p-6 space-y-5">
        <div>
          <h3 className="text-base font-semibold text-[#FAFAFA]">Default Period Matrix</h3>
          <p className="text-xs font-mono text-[#8A8A8A] mt-1">
            Define instructional session lengths, start times, and daily break offsets.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="space-y-1.5">
            <label className="text-xs font-mono uppercase text-[#8A8A8A]">
              Start Time (HH:MM)
            </label>
            <Input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-mono uppercase text-[#8A8A8A]">
              Period Length (mins)
            </label>
            <Input
              type="number"
              min={30}
              max={120}
              value={periodDuration}
              onChange={(e) => setPeriodDuration(parseInt(e.target.value, 10) || 50)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-mono uppercase text-[#8A8A8A]">
              Periods Per Day
            </label>
            <Input
              type="number"
              min={1}
              max={12}
              value={periodsPerDay}
              onChange={(e) => setPeriodsPerDay(parseInt(e.target.value, 10) || 7)}
              required
            />
          </div>
        </div>

        <div className="pt-4 border-t border-[#232323]">
          <span className="text-xs font-mono uppercase text-[#FAFAFA] font-medium block mb-3">
            Standard Daily Break
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-mono uppercase text-[#8A8A8A]">
                Break Label
              </label>
              <Input
                value={breakName}
                onChange={(e) => setBreakName(e.target.value)}
                placeholder="Lunch Break"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono uppercase text-[#8A8A8A]">
                Occurs After Period #
              </label>
              <Input
                type="number"
                min={1}
                max={periodsPerDay - 1}
                value={afterPeriod}
                onChange={(e) => setAfterPeriod(parseInt(e.target.value, 10) || 4)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono uppercase text-[#8A8A8A]">
                Duration (mins)
              </label>
              <Input
                type="number"
                min={15}
                max={120}
                value={breakDuration}
                onChange={(e) => setBreakDuration(parseInt(e.target.value, 10) || 45)}
                required
              />
            </div>
          </div>
        </div>

        <div className="pt-4 flex justify-end">
          <Button
            type="submit"
            variant="primary"
            disabled={loading}
            className="h-10 px-5 rounded-[12px] font-medium"
          >
            {loading ? 'Saving...' : 'Save Configuration'}
          </Button>
        </div>
      </div>
    </form>
  );
}
