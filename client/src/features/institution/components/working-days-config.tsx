'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { institutionApi } from '../services/institution.api';
import { toast } from '@/components/ui/toast';
import type { InstitutionDto, PeriodConfig } from '@slotly/contracts';

interface WorkingDaysConfigProps {
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
      await institutionApi.updateInstitution({
        workingDays,
        defaultPeriodConfig,
      });
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
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Institutional Working Days</CardTitle>
          <CardDescription>
            Select days of the week when classes, labs, and faculty teaching sessions take place.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {DAYS_OF_WEEK.map((day) => {
              const active = workingDays.includes(day.index);
              return (
                <button
                  type="button"
                  key={day.index}
                  onClick={() => toggleDay(day.index)}
                  className={`px-4 py-2.5 rounded border text-xs font-mono transition-colors cursor-pointer ${
                    active
                      ? 'border-[#FACC15] bg-[#FACC15] text-black font-bold'
                      : 'border-[#232323] bg-[#111111] text-[#8A8A8A] hover:text-[#FAFAFA]'
                  }`}
                >
                  {day.full}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Period Schedule Configuration Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Default Period Matrix</CardTitle>
          <CardDescription>
            Define instructional session lengths, start times, and daily break offsets.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
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
            <div className="grid grid-cols-3 gap-4">
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
              className="font-mono uppercase tracking-wider"
            >
              {loading ? 'Saving...' : 'Save Configuration'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
