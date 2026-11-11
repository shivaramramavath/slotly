// Times editor component configuring working days, period lengths, and break slots.
'use client';

import { Plus, Trash2, Clock, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

const DAYS_OF_WEEK = [
  { key: 'mon', label: 'Mon' },
  { key: 'tue', label: 'Tue' },
  { key: 'wed', label: 'Wed' },
  { key: 'thu', label: 'Thu' },
  { key: 'fri', label: 'Fri' },
  { key: 'sat', label: 'Sat' },
  { key: 'sun', label: 'Sun' },
];

/** Break slot definition. */
export interface BreakSlot {
  id: string;
  name: string;
  afterPeriod: number;
  durationMinutes: number;
}

/** Times configuration structure. */
export interface TimesConfig {
  workingDays: string[];
  startTime: string;
  periodDurationMinutes: number;
  periodsPerDay: number;
  breaks: BreakSlot[];
}

/** Props for TimesEditor component. */
export interface TimesEditorProps {
  config: Partial<TimesConfig>;
  onChange: (updated: Partial<TimesConfig>) => void;
  className?: string | undefined;
}

/** React component rendering timetable timing inspector with day toggles and period configurations. */
export function TimesEditor({ config, onChange, className }: TimesEditorProps) {
  const workingDays = config.workingDays || ['mon', 'tue', 'wed', 'thu', 'fri'];
  const startTime = config.startTime || '08:30';
  const periodDurationMinutes = config.periodDurationMinutes ?? 50;
  const periodsPerDay = config.periodsPerDay ?? 6;
  const breaks = config.breaks || [
    { id: 'b1', name: 'Morning Break', afterPeriod: 2, durationMinutes: 15 },
    { id: 'b2', name: 'Lunch Break', afterPeriod: 4, durationMinutes: 45 },
  ];

  const handleToggleDay = (dayKey: string) => {
    let updatedDays: string[];
    if (workingDays.includes(dayKey)) {
      updatedDays = workingDays.filter((d) => d !== dayKey);
    } else {
      updatedDays = [...workingDays, dayKey];
    }
    onChange({ ...config, workingDays: updatedDays });
  };

  const handleFieldChange = (field: keyof TimesConfig, value: unknown) => {
    onChange({ ...config, [field]: value });
  };

  const handleAddBreak = () => {
    const newBreak: BreakSlot = {
      id: crypto.randomUUID(),
      name: `Break ${breaks.length + 1}`,
      afterPeriod: Math.min(periodsPerDay - 1, breaks.length + 1),
      durationMinutes: 15,
    };
    onChange({ ...config, breaks: [...breaks, newBreak] });
  };

  const handleRemoveBreak = (breakId: string) => {
    onChange({ ...config, breaks: breaks.filter((b) => b.id !== breakId) });
  };

  const handleUpdateBreak = (breakId: string, partial: Partial<BreakSlot>) => {
    const updated = breaks.map((b) => (b.id === breakId ? { ...b, ...partial } : b));
    onChange({ ...config, breaks: updated });
  };

  const hasDayError = workingDays.length === 0;
  const hasDurationError = periodDurationMinutes < 15 || periodDurationMinutes > 180;

  return (
    <div
      className={cn('space-y-4 text-xs', className)}
      onKeyDown={(e) => e.stopPropagation()}
    >
      {/* Readable Summary Chips */}
      <div className="p-2.5 rounded-[10px] bg-[#141414] border border-[#232323] space-y-2">
        <div className="flex items-center gap-1.5 text-xs text-[#8A8A8A]">
          <Calendar className="h-3.5 w-3.5 text-[#FAFAFA]" />
          <span>Active Days:</span>
          <span className="font-mono text-[#FAFAFA] font-medium uppercase">
            {workingDays.length > 0 ? workingDays.join(', ') : 'None selected'}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-[#8A8A8A]">
          <Clock className="h-3.5 w-3.5 text-[#FAFAFA]" />
          <span>Daily:</span>
          <span className="font-mono text-[#FAFAFA]">
            {startTime} ({periodsPerDay} periods Ã— {periodDurationMinutes}m, {breaks.length} breaks)
          </span>
        </div>
      </div>

      {/* 7 Working Day Toggles (40px) */}
      <div>
        <label className="block text-[13px] font-medium text-[#FAFAFA] mb-1.5 flex items-center justify-between">
          <span>Working Days</span>
          <span className="text-xs text-[#8A8A8A]">Required</span>
        </label>
        <div className="grid grid-cols-7 gap-1">
          {DAYS_OF_WEEK.map((day) => {
            const isPressed = workingDays.includes(day.key);
            return (
              <button
                key={day.key}
                type="button"
                aria-pressed={isPressed}
                onClick={() => handleToggleDay(day.key)}
                className={cn(
                  'h-10 rounded-[8px] border text-xs font-mono font-medium transition-colors flex items-center justify-center focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#FAFAFA]',
                  isPressed
                    ? 'bg-[#FAFAFA] text-[#000000] border-[#FAFAFA]'
                    : 'bg-[#111111] text-[#8A8A8A] hover:text-[#FAFAFA] border-[#232323] hover:border-[#383838]',
                )}
              >
                {day.label}
              </button>
            );
          })}
        </div>
        {hasDayError && (
          <p className="font-mono text-[11px] text-[#EF4444] mt-1.5" role="alert">
            At least one working day must be selected.
          </p>
        )}
      </div>

      {/* Timing Inputs (40px) */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[13px] font-medium text-[#FAFAFA] mb-1.5">
            Start Time
          </label>
          <input
            type="time"
            value={startTime}
            onChange={(e) => handleFieldChange('startTime', e.target.value)}
            className="w-full h-10 px-3 rounded-[12px] bg-[#111111] border border-[#232323] text-xs font-mono text-[#FAFAFA] focus:outline-none focus:ring-1 focus:ring-[#FAFAFA]"
          />
        </div>

        <div>
          <label className="block text-[13px] font-medium text-[#FAFAFA] mb-1.5">
            Period (mins)
          </label>
          <input
            type="number"
            min={15}
            max={180}
            value={periodDurationMinutes}
            onChange={(e) => handleFieldChange('periodDurationMinutes', parseInt(e.target.value, 10) || 50)}
            className="w-full h-10 px-3 rounded-[12px] bg-[#111111] border border-[#232323] text-xs font-mono text-[#FAFAFA] focus:outline-none focus:ring-1 focus:ring-[#FAFAFA]"
          />
        </div>
      </div>

      <div>
        <label className="block text-[13px] font-medium text-[#FAFAFA] mb-1.5">
          Periods Per Day
        </label>
        <input
          type="number"
          min={1}
          max={12}
          value={periodsPerDay}
          onChange={(e) => handleFieldChange('periodsPerDay', parseInt(e.target.value, 10) || 6)}
          className="w-full h-10 px-3 rounded-[12px] bg-[#111111] border border-[#232323] text-xs font-mono text-[#FAFAFA] focus:outline-none focus:ring-1 focus:ring-[#FAFAFA]"
        />
        {hasDurationError && (
          <p className="font-mono text-[11px] text-[#EF4444] mt-1" role="alert">
            Period duration must be between 15 and 180 minutes.
          </p>
        )}
      </div>

      {/* Break Slots */}
      <div className="pt-2 border-t border-[#232323] space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-[#FAFAFA]">Break Slots ({breaks.length})</span>
          <button
            type="button"
            onClick={handleAddBreak}
            aria-label="Add break slot"
            className="h-7 px-2 rounded-[6px] border border-[#232323] bg-[#141414] hover:bg-[#1F1F1F] text-[#8A8A8A] hover:text-[#FAFAFA] flex items-center gap-1 text-[11px] font-mono transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#FAFAFA]"
          >
            <Plus className="h-3 w-3" />
            <span>Add Break</span>
          </button>
        </div>

        {breaks.map((b) => (
          <div
            key={b.id}
            className="p-2 rounded-[8px] bg-[#141414] border border-[#232323] flex items-center gap-2"
          >
            <input
              type="text"
              value={b.name}
              onChange={(e) => handleUpdateBreak(b.id, { name: e.target.value })}
              className="flex-1 h-7 px-2 rounded-[6px] bg-[#0A0A0A] border border-[#232323] text-xs text-[#FAFAFA] focus:outline-none focus:ring-1 focus:ring-[#FAFAFA]"
            />
            <span className="text-[11px] text-[#8A8A8A] shrink-0 font-mono">after P{b.afterPeriod}</span>
            <input
              type="number"
              min={5}
              max={120}
              value={b.durationMinutes}
              onChange={(e) => handleUpdateBreak(b.id, { durationMinutes: parseInt(e.target.value, 10) || 15 })}
              className="w-14 h-7 px-1.5 rounded-[6px] bg-[#0A0A0A] border border-[#232323] text-xs font-mono text-[#FAFAFA] text-center focus:outline-none focus:ring-1 focus:ring-[#FAFAFA]"
              title="Duration in minutes"
            />
            <span className="text-[10px] text-[#8A8A8A] shrink-0 font-mono">min</span>
            <button
              type="button"
              onClick={() => handleRemoveBreak(b.id)}
              aria-label={`Remove ${b.name}`}
              className="h-7 w-7 rounded-[6px] text-[#8A8A8A] hover:text-[#EF4444] flex items-center justify-center transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
