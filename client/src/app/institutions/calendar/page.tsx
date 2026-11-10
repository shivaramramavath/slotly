// Calendar events and holidays management route for the institution.
'use client';

import { useInstitutionContext, HolidayCalendar } from '@/features/institution';

/** React page component rendering holidays and institutional calendar events. */
export default function CalendarPage() {
  const { structure, openAddHoliday, deleteHoliday } = useInstitutionContext();
  const holidays = structure?.holidays || [];

  return (
    <div className="w-full">
      <HolidayCalendar
        holidays={holidays}
        onAddHoliday={openAddHoliday}
        onDeleteHoliday={deleteHoliday}
      />
    </div>
  );
}
