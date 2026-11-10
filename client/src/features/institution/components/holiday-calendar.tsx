// Component rendering calendar events and holidays list matching sys0 styling.
'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { HolidayDto } from '@slotly/contracts';
import { Calendar, Trash2 } from 'lucide-react';
import { InstitutionEmptyState } from './institution-empty-state';

/** Props for HolidayCalendar component. */
export interface HolidayCalendarProps {
  holidays: HolidayDto[];
  onAddHoliday: () => void;
  onDeleteHoliday: (id: string, name: string) => void;
}

/** React component rendering calendar events and holidays grid. */
export function HolidayCalendar({
  holidays,
  onAddHoliday,
  onDeleteHoliday,
}: HolidayCalendarProps) {
  const getTypeBadge = (type: HolidayDto['type']) => {
    switch (type) {
      case 'holiday':
        return <Badge variant="red">Campus Closed</Badge>;
      case 'exam':
        return <Badge variant="neutral">Examination</Badge>;
      case 'break':
        return <Badge variant="green">Academic Break</Badge>;
      case 'event':
        return <Badge variant="neutral">Institution Event</Badge>;
      default:
        return <Badge variant="neutral">{type}</Badge>;
    }
  };

  if (holidays.length === 0) {
    return (
      <InstitutionEmptyState
        icon={Calendar}
        title="No holidays or events configured"
        description="Define dates when standard teaching periods are paused for holidays, breaks, or examination weeks."
        actionLabel="Add first holiday / event"
        onAction={onAddHoliday}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {holidays.map((h) => (
        <div
          key={h.id}
          className="rounded-[16px] border border-[#232323] bg-[#111111] p-5 flex flex-col justify-between min-h-[140px] transition-colors hover:border-[#333333]"
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2.5">
                <Calendar className="h-4 w-4 text-[#FAFAFA]" />
                <h3 className="text-base font-semibold text-[#FAFAFA]">{h.name}</h3>
              </div>
              {getTypeBadge(h.type)}
            </div>
            <p className="text-xs font-mono text-[#8A8A8A]">
              {h.startDate} {h.startDate !== h.endDate && `to ${h.endDate}`}
            </p>
          </div>

          <div className="pt-3 flex items-center justify-end border-t border-[#232323]/40 mt-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDeleteHoliday(h.id, h.name)}
              className="text-[#8A8A8A] hover:text-[#EF4444] hover:bg-[#EF4444]/10 h-8 px-2 rounded-[8px] text-xs"
              aria-label={`Remove holiday ${h.name}`}
            >
              <Trash2 className="h-3.5 w-3.5 mr-1" />
              Remove
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
