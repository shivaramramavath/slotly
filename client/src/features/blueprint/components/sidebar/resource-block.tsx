// ResourceBlock managing inherited, own, and excluded faculty, subjects, and rooms with live views and peek.
'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Plus,
  Search,
  ExternalLink,
  MoreHorizontal,
  Pin,
  Lock,
  RotateCcw,
  Trash2,
  EyeOff,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ResourcePeekCard } from './resource-peek-card';
import { PoolPicker } from './pool-picker';
import { useBlueprintStore } from '../../store/blueprint.store';
import { toast } from '@/components/ui/toast';
import type { BlueprintCanvasNode } from '../../types/canvas.types';
import type { PoolCandidateItemDto } from '@slotly/contracts';
import { cn } from '@/lib/utils';

/** Interface defining a displayable pool resource entry. */
export interface PoolResourceEntry {
  id: string;
  name: string;
  code?: string | undefined;
  origin: 'inherited' | 'own' | 'excluded';
  inheritedFromNodeId?: string | undefined;
  inheritedFromName?: string | undefined;
  isRequired?: boolean | undefined;
  isPinned?: boolean | undefined;
  department?: string | undefined;
}

/** Props for ResourceBlock component. */
export interface ResourceBlockProps {
  node: BlueprintCanvasNode;
  projectId: string;
  resourceType: 'faculty' | 'subject' | 'room';
  title: string;
  onUpdatePool: (payload: {
    additions?: string[];
    exclusions?: string[];
    required?: string[];
    pinned?: string[];
  }) => void;
  onOpenImpactPreview?: ((item: PoolResourceEntry) => void) | undefined;
  className?: string | undefined;
}

type ViewFilter = 'effective' | 'own' | 'excluded';

/** React component rendering ResourceBlock with tabs, search, and row operations. */
export function ResourceBlock({
  node,
  projectId,
  resourceType,
  title,
  onUpdatePool,
  className = '',
}: ResourceBlockProps) {
  const nodes = useBlueprintStore((s) => s.nodes);
  const selectNode = useBlueprintStore((s) => s.selectNode);

  const [viewFilter, setViewFilter] = React.useState<ViewFilter>('effective');
  const [search, setSearch] = React.useState('');
  const [isPickerOpen, setIsPickerOpen] = React.useState(false);
  const [openRowMenuId, setOpenRowMenuId] = React.useState<string | null>(null);

  // Extract own additions, exclusions, required, pinned from node.data.config
  const ownAdditionIds = React.useMemo(() => {
    const config = (node.data.config || {}) as Record<string, unknown>;
    const raw =
      (config[`${resourceType}Ids`] as string[]) ||
      (config[resourceType] as string[]) ||
      ((config['poolAdditions'] as Record<string, string[]>)?.[resourceType] ?? []);
    return Array.isArray(raw) ? raw : [];
  }, [node.data.config, resourceType]);

  const ownExclusionIds = React.useMemo(() => {
    const config = (node.data.config || {}) as Record<string, unknown>;
    const raw = (config['poolExclusions'] as Record<string, string[]>)?.[resourceType] ?? [];
    return Array.isArray(raw) ? raw : [];
  }, [node.data.config, resourceType]);

  const requiredIds = React.useMemo(() => {
    const config = (node.data.config || {}) as Record<string, unknown>;
    const raw = (config['poolRequired'] as Record<string, string[]>)?.[resourceType] ?? [];
    return Array.isArray(raw) ? raw : [];
  }, [node.data.config, resourceType]);

  const pinnedIds = React.useMemo(() => {
    const config = (node.data.config || {}) as Record<string, unknown>;
    const raw = (config['poolPinned'] as Record<string, string[]>)?.[resourceType] ?? [];
    return Array.isArray(raw) ? raw : [];
  }, [node.data.config, resourceType]);

  // Resolve inherited items from ancestors
  const parentNode = React.useMemo(() => {
    if (!node.data.parentId) return undefined;
    return nodes.find((n) => n.id === node.data.parentId);
  }, [node.data.parentId, nodes]);

  const inheritedItems = React.useMemo(() => {
    if (!parentNode) return [];
    // Traverse parent's config additions
    const pConfig = (parentNode.data.config || {}) as Record<string, unknown>;
    const pAdditions =
      (pConfig[`${resourceType}Ids`] as string[]) ||
      (pConfig[resourceType] as string[]) ||
      ((pConfig['poolAdditions'] as Record<string, string[]>)?.[resourceType] ?? []);
    if (!Array.isArray(pAdditions)) return [];

    return pAdditions.map((id) => ({
      id,
      name: id, // Will display ID/code fallback until loaded
      origin: 'inherited' as const,
      inheritedFromNodeId: parentNode.id,
      inheritedFromName: parentNode.data.label,
    }));
  }, [parentNode, resourceType]);

  // Aggregate all items
  const allEntries = React.useMemo<PoolResourceEntry[]>(() => {
    const list: PoolResourceEntry[] = [];
    const seen = new Set<string>();

    // 1. Own additions
    ownAdditionIds.forEach((id) => {
      seen.add(id);
      list.push({
        id,
        name: id,
        origin: 'own',
        isRequired: requiredIds.includes(id),
        isPinned: pinnedIds.includes(id),
      });
    });

    // 2. Inherited items
    inheritedItems.forEach((inh) => {
      if (ownExclusionIds.includes(inh.id)) {
        list.push({
          ...inh,
          origin: 'excluded',
        });
      } else if (!seen.has(inh.id)) {
        seen.add(inh.id);
        list.push(inh);
      }
    });

    return list;
  }, [ownAdditionIds, ownExclusionIds, requiredIds, pinnedIds, inheritedItems]);

  const inheritedCount = allEntries.filter((e) => e.origin === 'inherited').length;
  const effectiveCount = allEntries.filter((e) => e.origin === 'inherited' || e.origin === 'own').length;

  // Filtered by View Tab & Search
  const filteredEntries = React.useMemo(() => {
    let list = allEntries;
    if (viewFilter === 'own') {
      list = list.filter((e) => e.origin === 'own');
    } else if (viewFilter === 'excluded') {
      list = list.filter((e) => e.origin === 'excluded');
    } else {
      list = list.filter((e) => e.origin !== 'excluded');
    }

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          (e.code && e.code.toLowerCase().includes(q)) ||
          e.id.toLowerCase().includes(q),
      );
    }

    return list;
  }, [allEntries, viewFilter, search]);

  // Handlers for Add, Exclude, Remove, Restore
  const handleAddCandidates = (candidates: PoolCandidateItemDto[]) => {
    const newIds = candidates.map((c) => c.id);
    const updatedAdditions = Array.from(new Set([...ownAdditionIds, ...newIds]));
    // Also remove from exclusions if was excluded
    const updatedExclusions = ownExclusionIds.filter((id) => !newIds.includes(id));
    onUpdatePool({
      additions: updatedAdditions,
      exclusions: updatedExclusions,
    });
    toast.success('Pool updated', `Added ${candidates.length} ${resourceType}(s).`);
  };

  const handleRemoveOwn = (id: string) => {
    const updatedAdditions = ownAdditionIds.filter((item) => item !== id);
    onUpdatePool({
      additions: updatedAdditions,
    });
    toast.info('Removed from pool', `Item removed from local node pool.`);
  };

  const handleExcludeInherited = (id: string) => {
    if (requiredIds.includes(id)) {
      toast.error('Cannot exclude', 'This required resource cannot be excluded.');
      return;
    }
    const updatedExclusions = Array.from(new Set([...ownExclusionIds, id]));
    onUpdatePool({
      exclusions: updatedExclusions,
    });
    toast.info('Resource excluded', `Excluded from effective pool.`);
  };

  const handleRestoreExcluded = (id: string) => {
    const updatedExclusions = ownExclusionIds.filter((item) => item !== id);
    onUpdatePool({
      exclusions: updatedExclusions,
    });
    toast.success('Resource restored', `Restored into effective pool.`);
  };

  const handleToggleRequired = (id: string) => {
    const isReq = requiredIds.includes(id);
    const updated = isReq ? requiredIds.filter((i) => i !== id) : [...requiredIds, id];
    onUpdatePool({ required: updated });
  };

  const handleTogglePinned = (id: string) => {
    const isPin = pinnedIds.includes(id);
    const updated = isPin ? pinnedIds.filter((i) => i !== id) : [...pinnedIds, id];
    onUpdatePool({ pinned: updated });
  };

  return (
    <div className={cn('space-y-2 select-none', className)}>
      {/* Block Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="font-medium text-xs text-[#FAFAFA]">{title}</span>
          <span className="font-mono text-[11px] text-[#8A8A8A]">
            {effectiveCount}
            {inheritedCount > 0 ? `, ${inheritedCount} inherited` : ''}
          </span>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setIsPickerOpen(true)}
          className="h-6 px-2 text-[11px] font-mono gap-1 hover:border-[#FAFAFA]"
        >
          <Plus className="h-3 w-3" />
          <span>Add</span>
        </Button>
      </div>

      {/* Sub Toolbar: View Toggle & Search */}
      <div className="flex items-center gap-2">
        <div className="flex items-center p-0.5 rounded-[6px] bg-[#141414] border border-[#232323] text-[10px] font-mono">
          <button
            type="button"
            onClick={() => setViewFilter('effective')}
            className={cn(
              'px-2 py-0.5 rounded transition-colors',
              viewFilter === 'effective' ? 'bg-[#232323] text-[#FAFAFA]' : 'text-[#8A8A8A] hover:text-[#FAFAFA]',
            )}
          >
            Effective
          </button>
          <button
            type="button"
            onClick={() => setViewFilter('own')}
            className={cn(
              'px-2 py-0.5 rounded transition-colors',
              viewFilter === 'own' ? 'bg-[#232323] text-[#FAFAFA]' : 'text-[#8A8A8A] hover:text-[#FAFAFA]',
            )}
          >
            Own
          </button>
          <button
            type="button"
            onClick={() => setViewFilter('excluded')}
            className={cn(
              'px-2 py-0.5 rounded transition-colors',
              viewFilter === 'excluded' ? 'bg-[#232323] text-[#FAFAFA]' : 'text-[#8A8A8A] hover:text-[#FAFAFA]',
            )}
          >
            Excluded
          </button>
        </div>

        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-[#8A8A8A]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Filter ${resourceType}...`}
            className="w-full h-7 pl-7 pr-2 rounded-[6px] bg-[#141414] border border-[#232323] text-[11px] text-[#FAFAFA] placeholder-[#8A8A8A] focus-visible:outline-none focus:border-[#FAFAFA]"
          />
        </div>
      </div>

      {/* Resource Rows List */}
      <div className="space-y-1">
        {filteredEntries.length === 0 ? (
          <div className="py-4 px-3 rounded-[8px] border border-dashed border-[#232323] bg-[#0E0E0E] text-center space-y-1.5">
            <p className="text-[11px] text-[#8A8A8A]">
              Nothing added. Auto-fill will use the department pool when you build.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsPickerOpen(true)}
              className="h-6 text-[10px] font-mono gap-1"
            >
              <Plus className="h-3 w-3" />
              <span>Add {title}</span>
            </Button>
          </div>
        ) : (
          filteredEntries.map((entry) => (
            <div
              key={entry.id}
              className={cn(
                'h-9 px-2.5 rounded-[8px] bg-[#111111] border border-[#232323] hover:border-[#383838] flex items-center justify-between gap-2 transition-colors group text-xs',
                entry.origin === 'excluded' && 'opacity-50 border-dashed',
              )}
            >
              <ResourcePeekCard
                type={
                  resourceType === 'faculty'
                    ? 'faculty'
                    : resourceType === 'subject'
                      ? 'subjects'
                      : 'rooms'
                }
                resourceId={entry.id}
                className="min-w-0 flex-1 cursor-pointer"
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="font-medium text-[#FAFAFA] truncate text-xs">
                    {entry.name}
                  </span>

                  {/* Origin Badge */}
                  {entry.origin === 'inherited' && entry.inheritedFromName ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (entry.inheritedFromNodeId) selectNode(entry.inheritedFromNodeId);
                      }}
                      className="font-mono text-[9px] px-1.5 py-0.2 rounded bg-[#181818] text-[#8A8A8A] hover:text-[#FAFAFA] border border-[#282828] truncate max-w-[120px]"
                      title={`Inherited from ${entry.inheritedFromName}. Click to select.`}
                    >
                      From {entry.inheritedFromName}
                    </button>
                  ) : entry.origin === 'own' ? (
                    <span className="font-mono text-[9px] px-1.5 py-0.2 rounded bg-[#1A1A1A] text-[#8A8A8A] border border-[#282828]">
                      Added
                    </span>
                  ) : (
                    <span className="font-mono text-[9px] px-1.5 py-0.2 rounded bg-[#2A1414] text-[#EF4444] border border-[#4A2020]">
                      Excluded
                    </span>
                  )}
                </div>
              </ResourcePeekCard>

              {/* Action Buttons */}
              <div className="flex items-center gap-1 shrink-0">
                {entry.origin === 'own' && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleToggleRequired(entry.id)}
                      title={entry.isRequired ? 'Required (Cannot be excluded by child)' : 'Mark as required'}
                      className={cn(
                        'h-6 w-6 rounded flex items-center justify-center transition-colors',
                        entry.isRequired ? 'text-[#FACC15]' : 'text-[#555555] hover:text-[#FAFAFA]',
                      )}
                    >
                      <Lock className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTogglePinned(entry.id)}
                      title={entry.isPinned ? 'Pinned (Survives ancestor removal)' : 'Pin item'}
                      className={cn(
                        'h-6 w-6 rounded flex items-center justify-center transition-colors',
                        entry.isPinned ? 'text-[#FAFAFA]' : 'text-[#555555] hover:text-[#FAFAFA]',
                      )}
                    >
                      <Pin className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveOwn(entry.id)}
                      title="Remove from pool"
                      className="h-6 w-6 rounded text-[#8A8A8A] hover:text-[#EF4444] flex items-center justify-center transition-colors"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </>
                )}

                {entry.origin === 'inherited' && (
                  <button
                    type="button"
                    onClick={() => handleExcludeInherited(entry.id)}
                    title="Exclude from effective pool"
                    className="h-6 px-1.5 rounded text-[10px] font-mono text-[#8A8A8A] hover:text-[#EF4444] hover:bg-[#1E1414] flex items-center gap-1 transition-colors"
                  >
                    <EyeOff className="h-3 w-3" />
                    <span>Exclude</span>
                  </button>
                )}

                {entry.origin === 'excluded' && (
                  <button
                    type="button"
                    onClick={() => handleRestoreExcluded(entry.id)}
                    title="Restore into effective pool"
                    className="h-6 px-1.5 rounded text-[10px] font-mono text-[#8A8A8A] hover:text-[#FAFAFA] hover:bg-[#1C1C1C] flex items-center gap-1 transition-colors"
                  >
                    <RotateCcw className="h-3 w-3" />
                    <span>Restore</span>
                  </button>
                )}

                {/* More dropdown row trigger */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() =>
                      setOpenRowMenuId(openRowMenuId === entry.id ? null : entry.id)
                    }
                    className="h-6 w-6 rounded text-[#8A8A8A] hover:text-[#FAFAFA] flex items-center justify-center transition-colors"
                  >
                    <MoreHorizontal className="h-3 w-3" />
                  </button>

                  {openRowMenuId === entry.id && (
                    <div
                      onMouseLeave={() => setOpenRowMenuId(null)}
                      className="absolute right-0 top-full mt-1 z-30 w-36 rounded-[8px] bg-[#141414] border border-[#2B2B2B] shadow-xl p-1 text-[11px] font-mono space-y-0.5"
                    >
                      <Link
                        href={`/library?tab=${
                          resourceType === 'faculty'
                            ? 'faculty'
                            : resourceType === 'subject'
                              ? 'subjects'
                              : 'rooms'
                        }`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full px-2 py-1.5 rounded hover:bg-[#202020] text-[#FAFAFA] flex items-center justify-between"
                      >
                        <span>Open in Library</span>
                        <ExternalLink className="h-3 w-3 text-[#8A8A8A]" />
                      </Link>
                      <button
                        type="button"
                        onClick={() => {
                          setOpenRowMenuId(null);
                          toast.info('Where Used', `Item is referenced in node "${node.data.label}".`);
                        }}
                        className="w-full text-left px-2 py-1.5 rounded hover:bg-[#202020] text-[#8A8A8A] hover:text-[#FAFAFA]"
                      >
                        Where used
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pool Picker Modal */}
      <PoolPicker
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        projectId={projectId}
        nodeId={node.id}
        resourceType={resourceType}
        title={title}
        onAddCandidates={handleAddCandidates}
      />
    </div>
  );
}
