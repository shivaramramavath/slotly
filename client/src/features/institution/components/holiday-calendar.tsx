// React component for holiday-calendar.
'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { HolidayDto } from '@slotly/contracts';
import { Calendar, Plus, Trash2 } from 'lucide-react';

interface HolidayCalendarProps {
  holidays: HolidayDto[];
  onAddHoliday: () => void;
  onDeleteHoliday: (id: string, name: string) => void;
}

/** React component rendering holiday calendar. */
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
        return <Badge variant="yellow">Examination</Badge>;
      case 'break':
        return <Badge variant="green">Academic Break</Badge>;
      case 'event':
        return <Badge variant="neutral">Institution Event</Badge>;
      default:
        return <Badge variant="neutral">{type}</Badge>;
    }
  };

  return (
    <div className="space-y-4 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-[#FAFAFA]">
            Calendar Events &amp; Holidays
          </h2>
          <p className="text-xs font-mono text-[#8A8A8A]">
            Define dates when standard teaching periods are paused for holidays, breaks, or exam blocks.
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={onAddHoliday}>
          <Plus className="h-3.5 w-3.5 mr-1" />
          Add Event
        </Button>
      </div>

      {holidays.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center space-y-3">
            <Calendar className="h-10 w-10 text-[#8A8A8A] mx-auto" />
            <h3 className="text-sm font-semibold text-[#FAFAFA]">No Events Configured</h3>
            <p className="text-xs font-mono text-[#8A8A8A] max-w-sm mx-auto">
              Add campus holidays, midterm examination weeks, or term breaks.
            </p>
            <Button variant="outline" size="sm" onClick={onAddHoliday}>
              <Plus className="h-3.5 w-3.5 mr-1" />
              Add First Event
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {holidays.map((h) => (
            <Card key={h.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-sm font-semibold text-[#FAFAFA]">
                      {h.name}
                    </CardTitle>
                    <CardDescription className="font-mono text-xs">
                      {h.startDate} {h.startDate !== h.endDate && `to ${h.endDate}`}
                    </CardDescription>
                  </div>
                  {getTypeBadge(h.type)}
                </div>
              </CardHeader>
              <CardContent className="pt-2 flex justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDeleteHoliday(h.id, h.name)}
                  className="text-[#EF4444] hover:bg-[#EF4444]/10 h-7 text-xs"
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Remove
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
