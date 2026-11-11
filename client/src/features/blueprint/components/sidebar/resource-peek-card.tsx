// Hover peek summary card displaying lightweight details for library resources.
'use client';

import * as React from 'react';
import { Loader2, Users, BookOpen, DoorOpen, Award, Clock } from 'lucide-react';
import { blueprintApi } from '../../services/blueprint.api';
import type { LibraryPeekDto } from '@slotly/contracts';
import { cn } from '@/lib/utils';

/** Props for ResourcePeekCard component. */
export interface ResourcePeekCardProps {
  type: 'faculty' | 'subjects' | 'rooms';
  resourceId: string;
  children: React.ReactNode;
  className?: string | undefined;
}

const peekCache = new Map<string, LibraryPeekDto>();

/** React component rendering hover peek popover for faculty, subjects, and rooms. */
export function ResourcePeekCard({
  type,
  resourceId,
  children,
  className = '',
}: ResourcePeekCardProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [peekData, setPeekData] = React.useState<LibraryPeekDto | null>(() => {
    return peekCache.get(`${type}:${resourceId}`) || null;
  });
  const [loading, setLoading] = React.useState(false);
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    timeoutRef.current = setTimeout(() => {
      setIsOpen(true);
      const cacheKey = `${type}:${resourceId}`;
      const cached = peekCache.get(cacheKey);
      if (cached) {
        setPeekData(cached);
        return;
      }
      setLoading(true);
      blueprintApi
        .getLibraryPeek(type, resourceId)
        .then((res) => {
          peekCache.set(cacheKey, res);
          setPeekData(res);
        })
        .catch(() => {
          // ignore peek error
        })
        .finally(() => setLoading(false));
    }, 200);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsOpen(false);
  };

  return (
    <div
      className={cn('relative inline-flex items-center', className)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleMouseEnter}
      onBlur={handleMouseLeave}
    >
      {children}

      {isOpen && (
        <div
          role="tooltip"
          className="absolute left-0 bottom-full mb-2 z-50 w-64 p-3 rounded-[10px] bg-[#141414] border border-[#2B2B2B] shadow-2xl text-xs text-[#FAFAFA] animate-in fade-in-0 zoom-in-95 pointer-events-none select-none"
        >
          {loading ? (
            <div className="flex items-center justify-center py-2 text-[#8A8A8A] gap-2">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span className="font-mono text-[11px]">Loading preview...</span>
            </div>
          ) : peekData ? (
            <div className="space-y-2">
              {peekData.type === 'faculty' && (
                <>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-[#8A8A8A] shrink-0" />
                    <div className="truncate font-medium">{peekData.name}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-[11px] font-mono text-[#8A8A8A]">
                    {peekData.departmentName && (
                      <div className="truncate">Dept: {peekData.departmentName}</div>
                    )}
                    {peekData.designation && (
                      <div className="truncate">Role: {peekData.designation}</div>
                    )}
                    <div className="col-span-2 flex items-center justify-between pt-1 border-t border-[#232323]">
                      <span>Workload:</span>
                      <span className="text-[#FAFAFA]">
                        {peekData.workloadUsed}/{peekData.maxWorkload} hrs
                      </span>
                    </div>
                  </div>
                </>
              )}

              {peekData.type === 'subject' && (
                <>
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-[#8A8A8A] shrink-0" />
                    <div className="truncate font-medium">{peekData.name}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-[11px] font-mono text-[#8A8A8A]">
                    <div>Code: {peekData.code}</div>
                    <div>Type: {peekData.subjectType}</div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{peekData.weeklyHours} hrs/wk</span>
                    </div>
                    {peekData.credits !== undefined && <div>Credits: {peekData.credits}</div>}
                    <div className="col-span-2 pt-1 border-t border-[#232323] flex items-center gap-1 text-[10px]">
                      <Award className="h-3 w-3 text-[#FACC15]" />
                      <span>{peekData.qualifiedFacultyCount} qualified faculty</span>
                    </div>
                  </div>
                </>
              )}

              {peekData.type === 'room' && (
                <>
                  <div className="flex items-center gap-2">
                    <DoorOpen className="h-4 w-4 text-[#8A8A8A] shrink-0" />
                    <div className="truncate font-medium">{peekData.name}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-[11px] font-mono text-[#8A8A8A]">
                    <div>Type: {peekData.roomType}</div>
                    <div>Cap: {peekData.capacity}</div>
                    {peekData.equipment && peekData.equipment.length > 0 && (
                      <div className="col-span-2 pt-1 border-t border-[#232323]">
                        <span className="text-[10px] text-[#8A8A8A] block mb-0.5">Equipment:</span>
                        <div className="flex flex-wrap gap-1">
                          {peekData.equipment.map((eq) => (
                            <span
                              key={eq}
                              className="px-1.5 py-0.5 rounded bg-[#1C1C1C] text-[10px] text-[#FAFAFA]"
                            >
                              {eq}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="text-[#8A8A8A] text-center text-[11px]">No preview available</div>
          )}
        </div>
      )}
    </div>
  );
}
