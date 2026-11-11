// Popover modal for server-side searchable, paginated pool candidate selection.
'use client';

import * as React from 'react';
import {
  Search,
  Check,
  X,
  Loader2,
  Users,
  BookOpen,
  DoorOpen,
  Copy,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { blueprintApi } from '../../services/blueprint.api';
import type {
  PoolCandidateItemDto,
  PoolCandidatesResponseDto,
} from '@slotly/contracts';
import { cn } from '@/lib/utils';

/** Props for PoolPicker component. */
export interface PoolPickerProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  nodeId: string;
  resourceType: 'faculty' | 'subject' | 'room';
  title: string;
  onAddCandidates: (items: PoolCandidateItemDto[]) => Promise<void> | void;
  onCopyPoolFromAnotherNode?: () => void;
  className?: string | undefined;
}

/** React component rendering server-side paginated candidate picker with multi-select. */
export function PoolPicker({
  isOpen,
  onClose,
  projectId,
  nodeId,
  resourceType,
  title,
  onAddCandidates,
  onCopyPoolFromAnotherNode,
  className = '',
}: PoolPickerProps) {
  const [search, setSearch] = React.useState('');
  const [departmentFilter, setDepartmentFilter] = React.useState('');
  const [candidateTypeFilter, setCandidateTypeFilter] = React.useState('');
  const [candidates, setCandidates] = React.useState<PoolCandidateItemDto[]>([]);
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const [cursor, setCursor] = React.useState<string | undefined>(undefined);
  const [hasMore, setHasMore] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const searchInputRef = React.useRef<HTMLInputElement>(null);

  // Fetch candidates from server
  const fetchCandidates = React.useCallback(
    async (nextCursor?: string, append = false) => {
      setIsLoading(true);
      try {
        const res: PoolCandidatesResponseDto = await blueprintApi.getPoolCandidates(
          projectId,
          nodeId,
          {
            type: resourceType,
            q: search || undefined,
            department: departmentFilter || undefined,
            roomType: resourceType === 'room' && candidateTypeFilter ? candidateTypeFilter : undefined,
            subjectType: resourceType === 'subject' && candidateTypeFilter ? candidateTypeFilter : undefined,
            cursor: nextCursor,
            limit: 20,
          },
        );
        setCandidates((prev) => (append ? [...prev, ...res.items] : res.items));
        setHasMore(Boolean(res.nextCursor));
        setCursor(res.nextCursor || undefined);
      } catch {
        // error handled gracefully
      } finally {
        setIsLoading(false);
      }
    },
    [projectId, nodeId, resourceType, search, departmentFilter, candidateTypeFilter],
  );

  React.useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      searchInputRef.current?.focus();
    }, 50);
    return () => clearTimeout(timer);
  }, [isOpen]);

  // Debounced search
  React.useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      void fetchCandidates(undefined, false);
    }, 250);
    return () => clearTimeout(timer);
  }, [isOpen, search, departmentFilter, candidateTypeFilter, fetchCandidates]);

  // Escape key closes modal
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const toggleSelect = (id: string, alreadyInPool?: boolean) => {
    if (alreadyInPool) return;
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const handleAddAllFromDepartment = () => {
    const selectable = candidates.filter((c) => !c.alreadyInPool && !c.doNotLend);
    setSelectedIds(Array.from(new Set([...selectedIds, ...selectable.map((c) => c.id)])));
  };

  const handleSubmit = async () => {
    if (selectedIds.length === 0) return;
    setIsSubmitting(true);
    try {
      const selectedItems = candidates.filter((c) => selectedIds.includes(c.id));
      await onAddCandidates(selectedItems);
      setSelectedIds([]);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Add ${title}`}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in-0"
    >
      <div
        className={cn(
          'w-full max-w-lg rounded-[14px] bg-[#0E0E0E] border border-[#232323] shadow-2xl flex flex-col max-h-[85vh] overflow-hidden text-xs text-[#FAFAFA]',
          className,
        )}
      >
        {/* Header */}
        <div className="h-13 px-4 border-b border-[#232323] flex items-center justify-between gap-3 shrink-0 bg-[#0A0A0A]">
          <div className="flex items-center gap-2">
            {resourceType === 'faculty' && <Users className="h-4 w-4 text-[#FAFAFA]" />}
            {resourceType === 'subject' && <BookOpen className="h-4 w-4 text-[#FAFAFA]" />}
            {resourceType === 'room' && <DoorOpen className="h-4 w-4 text-[#FAFAFA]" />}
            <h3 className="font-medium text-sm text-[#FAFAFA]">Add {title} to Pool</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="h-8 w-8 rounded-[8px] text-[#8A8A8A] hover:text-[#FAFAFA] hover:bg-[#1A1A1A] flex items-center justify-center transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Toolbar / Search & Filters */}
        <div className="p-3 border-b border-[#232323] bg-[#0E0E0E] space-y-2 shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#8A8A8A]" />
            <input
              ref={searchInputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Search ${resourceType} by name, code...`}
              className="w-full h-8 pl-8 pr-3 rounded-[8px] bg-[#141414] border border-[#232323] hover:border-[#333333] focus:border-[#FAFAFA] text-xs text-[#FAFAFA] placeholder-[#8A8A8A] focus-visible:outline-none transition-colors"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              placeholder="Filter by dept..."
              className="h-6 px-2 rounded bg-[#141414] border border-[#232323] text-[11px] text-[#FAFAFA] placeholder-[#8A8A8A] focus:border-[#FAFAFA] focus-visible:outline-none"
            />
            {resourceType !== 'faculty' && (
              <input
                type="text"
                value={candidateTypeFilter}
                onChange={(e) => setCandidateTypeFilter(e.target.value)}
                placeholder="Filter by type..."
                className="h-6 px-2 rounded bg-[#141414] border border-[#232323] text-[11px] text-[#FAFAFA] placeholder-[#8A8A8A] focus:border-[#FAFAFA] focus-visible:outline-none"
              />
            )}
          </div>

          <div className="flex items-center justify-between gap-2 text-[11px] font-mono">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleAddAllFromDepartment}
                className="text-[#8A8A8A] hover:text-[#FAFAFA] underline underline-offset-2 transition-colors"
              >
                Add all selectable
              </button>
              {onCopyPoolFromAnotherNode && (
                <>
                  <span className="text-[#333333]">•</span>
                  <button
                    type="button"
                    onClick={onCopyPoolFromAnotherNode}
                    className="text-[#8A8A8A] hover:text-[#FAFAFA] inline-flex items-center gap-1 transition-colors"
                  >
                    <Copy className="h-3 w-3" />
                    <span>Copy pool from node</span>
                  </button>
                </>
              )}
            </div>

            <div className="text-[#8A8A8A]">
              {selectedIds.length} selected
            </div>
          </div>
        </div>

        {/* Candidate List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5 divide-y divide-[#1A1A1A]">
          {isLoading && candidates.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-[#8A8A8A] gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Searching library candidates...</span>
            </div>
          ) : candidates.length === 0 ? (
            <div className="py-12 text-center text-[#8A8A8A]">
              No matching {resourceType} candidates found.
            </div>
          ) : (
            candidates.map((cand) => {
              const isSelected = selectedIds.includes(cand.id);
              const isDisabled = cand.alreadyInPool || cand.doNotLend;

              return (
                <div
                  key={cand.id}
                  onClick={() => toggleSelect(cand.id, isDisabled)}
                  className={cn(
                    'pt-2 first:pt-0 flex items-center justify-between gap-3 p-2 rounded-[8px] transition-colors cursor-pointer select-none',
                    isDisabled
                      ? 'opacity-40 cursor-not-allowed bg-transparent'
                      : isSelected
                        ? 'bg-[#181818] border border-[#383838]'
                        : 'hover:bg-[#141414] border border-transparent',
                  )}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={cn(
                        'h-4 w-4 rounded border flex items-center justify-center shrink-0 transition-colors',
                        isDisabled
                          ? 'border-[#333333] bg-[#1A1A1A]'
                          : isSelected
                            ? 'bg-[#FAFAFA] border-[#FAFAFA] text-black'
                            : 'border-[#383838] bg-transparent',
                      )}
                    >
                      {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-xs text-[#FAFAFA] truncate">
                          {cand.name}
                        </span>
                        {cand.code && (
                          <span className="font-mono text-[10px] text-[#8A8A8A] px-1.5 py-0.2 rounded bg-[#181818] border border-[#232323]">
                            {cand.code}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] font-mono text-[#8A8A8A] truncate mt-0.5">
                        {cand.departmentName && <span>{cand.departmentName}</span>}
                        {cand.details && typeof cand.details['designation'] === 'string' && (
                          <span>• {cand.details['designation']}</span>
                        )}
                        {cand.details && typeof cand.details['roomType'] === 'string' && (
                          <span>• {cand.details['roomType']}</span>
                        )}
                        {cand.details && typeof cand.details['subjectType'] === 'string' && (
                          <span>• {cand.details['subjectType']}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 text-[10px] font-mono">
                    {cand.alreadyInPool && (
                      <span className="px-1.5 py-0.5 rounded bg-[#1C1C1C] text-[#8A8A8A] border border-[#282828]">
                        In pool
                      </span>
                    )}
                    {cand.doNotLend && (
                      <span className="px-1.5 py-0.5 rounded bg-[#2A1414] text-[#EF4444] border border-[#4A2020] inline-flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        <span>Do not lend</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}

          {hasMore && (
            <div className="pt-3 text-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => void fetchCandidates(cursor, true)}
                disabled={isLoading}
                className="h-7 text-xs font-mono"
              >
                {isLoading ? (
                  <Loader2 className="h-3 w-3 animate-spin mr-1.5" />
                ) : null}
                Load more candidates
              </Button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="h-13 px-4 border-t border-[#232323] bg-[#0A0A0A] flex items-center justify-between shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="h-8 text-xs font-mono"
          >
            Cancel
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleSubmit}
            disabled={selectedIds.length === 0 || isSubmitting}
            className="h-8 px-4 text-xs font-mono bg-[#FAFAFA] text-black hover:bg-white"
          >
            {isSubmitting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
            ) : null}
            Add {selectedIds.length > 0 ? selectedIds.length : ''} to Pool
          </Button>
        </div>
      </div>
    </div>
  );
}
