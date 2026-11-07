'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface AvailabilityGridProps {
  value: boolean[][];
  onChange: (value: boolean[][]) => void;
  daysCount?: number;
  periodsCount?: number;
  readOnly?: boolean;
}

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function AvailabilityGrid({
  value,
  onChange,
  daysCount = 7,
  periodsCount = 8,
  readOnly = false,
}: AvailabilityGridProps) {
  // Normalize matrix dimensions
  const matrix: boolean[][] = Array.from({ length: daysCount }, (_, d) => {
    return Array.from({ length: periodsCount }, (_, p) => {
      if (value && value[d] && value[d][p] !== undefined) {
        return value[d][p];
      }
      return true;
    });
  });

  const handleCellClick = (d: number, p: number) => {
    if (readOnly) return;
    const next = matrix.map((row) => [...row]);
    next[d]![p] = !next[d]![p];
    onChange(next);
  };

  const handleToggleDay = (d: number) => {
    if (readOnly) return;
    const allActive = matrix[d]!.every(Boolean);
    const next = matrix.map((row) => [...row]);
    next[d] = Array(periodsCount).fill(!allActive);
    onChange(next);
  };

  const handleSetAll = (val: boolean) => {
    if (readOnly) return;
    const next = Array.from({ length: daysCount }, () =>
      Array(periodsCount).fill(val),
    );
    onChange(next);
  };

  const handleWeekdaysOnly = () => {
    if (readOnly) return;
    const next = Array.from({ length: daysCount }, (_, d) =>
      Array(periodsCount).fill(d < 5),
    );
    onChange(next);
  };

  const totalSlots = daysCount * periodsCount;
  const availableSlots = matrix.reduce(
    (acc, row) => acc + row.filter(Boolean).length,
    0,
  );

  return (
    <div className="space-y-3 font-sans">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-[#FAFAFA]">Availability</span>
          <Badge variant={availableSlots === totalSlots ? 'green' : 'neutral'}>
            {availableSlots}/{totalSlots} slots
          </Badge>
        </div>
        {!readOnly && (
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-6 text-[10px] px-2 py-0 border-[#232323] text-[#8A8A8A] hover:text-[#FAFAFA]"
              onClick={() => handleSetAll(true)}
            >
              All Free
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-6 text-[10px] px-2 py-0 border-[#232323] text-[#8A8A8A] hover:text-[#FAFAFA]"
              onClick={() => handleSetAll(false)}
            >
              All Busy
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-6 text-[10px] px-2 py-0 border-[#232323] text-[#8A8A8A] hover:text-[#FAFAFA]"
              onClick={handleWeekdaysOnly}
            >
              Mon-Fri
            </Button>
          </div>
        )}
      </div>

      <div className="overflow-x-auto border border-[#232323] rounded-md bg-[#0A0A0A] p-2">
        <table className="w-full border-collapse select-none">
          <thead>
            <tr>
              <th className="w-12 pb-1 text-left text-[10px] font-mono text-[#8A8A8A] uppercase">
                Day
              </th>
              {Array.from({ length: periodsCount }).map((_, p) => (
                <th
                  key={p}
                  className="pb-1 text-center text-[10px] font-mono text-[#8A8A8A]"
                >
                  P{p + 1}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matrix.map((row, d) => (
              <tr key={d} className="group">
                <td className="py-0.5 pr-2">
                  <button
                    type="button"
                    onClick={() => handleToggleDay(d)}
                    disabled={readOnly}
                    className="text-[10px] font-mono text-[#8A8A8A] hover:text-[#FAFAFA] text-left uppercase transition-colors"
                  >
                    {DAY_LABELS[d] || `D${d + 1}`}
                  </button>
                </td>
                {row.map((isAvail, p) => (
                  <td key={p} className="p-0.5">
                    <button
                      type="button"
                      disabled={readOnly}
                      onClick={() => handleCellClick(d, p)}
                      title={`${DAY_LABELS[d] || `Day ${d + 1}`} Period ${p + 1}: ${
                        isAvail ? 'Available' : 'Unavailable'
                      }`}
                      className={`w-full h-7 rounded border transition-all ${
                        isAvail
                          ? 'bg-[#111] border-[#232323] hover:border-[#22C55E]/60 text-[#22C55E]'
                          : 'bg-[#1A1A1A] border-[#EF4444]/40 text-[#EF4444]'
                      } flex items-center justify-center text-[10px] font-mono`}
                    >
                      {isAvail ? '✓' : '×'}
                    </button>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center gap-4 text-[10px] font-mono text-[#8A8A8A]">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded bg-[#111] border border-[#232323]" />
          <span>Available</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded bg-[#1A1A1A] border border-[#EF4444]/40" />
          <span>Unavailable</span>
        </div>
      </div>
    </div>
  );
}
