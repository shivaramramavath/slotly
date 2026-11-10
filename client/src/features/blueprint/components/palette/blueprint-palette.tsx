// React component for blueprint-palette.
'use client';

import React from 'react';
import {
  Building2,
  FolderTree,
  GraduationCap,
  CalendarDays,
  Calendar,
  Users2,
  Users,
  BookOpen,
  Boxes,
  UserCheck,
  DoorOpen,
  HelpCircle,
} from 'lucide-react';
import type { BlueprintNodeType } from '@slotly/contracts';
import { useBlueprintStore } from '../../store/blueprint.store';
import { useGateValidation } from '../../hooks/use-gate-validation';
import { Tooltip } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export interface PaletteItem {
  type: BlueprintNodeType;
  label: string;
  icon: React.ElementType;
  description: string;
  category: 'structure' | 'resource';
}

export const PALETTE_ITEMS: PaletteItem[] = [
  // Structure
  {
    type: 'institution',
    label: 'Institution',
    icon: Building2,
    description: 'Root campus node with working days & timing',
    category: 'structure',
  },
  {
    type: 'department',
    label: 'Department',
    icon: FolderTree,
    description: 'Academic department under Institution',
    category: 'structure',
  },
  {
    type: 'program',
    label: 'Program',
    icon: GraduationCap,
    description: 'Degree program (e.g. B.Tech CSE, MBA)',
    category: 'structure',
  },
  {
    type: 'academicYear',
    label: 'Academic Year',
    icon: CalendarDays,
    description: 'Year cohort within a degree program',
    category: 'structure',
  },
  {
    type: 'semester',
    label: 'Semester',
    icon: Calendar,
    description: 'Active term with start and end dates',
    category: 'structure',
  },
  {
    type: 'section',
    label: 'Section',
    icon: Users2,
    description: 'Class division with student capacity',
    category: 'structure',
  },
  {
    type: 'batch',
    label: 'Batch',
    icon: Users,
    description: 'Lab subgroup within a section',
    category: 'structure',
  },
  {
    type: 'subjectAssignment',
    label: 'Subject Assignment',
    icon: BookOpen,
    description: 'Subject course hours and faculty linkage',
    category: 'structure',
  },
  {
    type: 'electiveGroup',
    label: 'Elective Group',
    icon: Boxes,
    description: 'Group of mutually elective subjects',
    category: 'structure',
  },

  // Resources
  {
    type: 'faculty',
    label: 'Faculty',
    icon: UserCheck,
    description: 'Instructor with availability & workload',
    category: 'resource',
  },
  {
    type: 'room',
    label: 'Room',
    icon: DoorOpen,
    description: 'Classroom or Lab with capacity',
    category: 'resource',
  },
];

interface BlueprintPaletteProps {
  onAddNode: (type: BlueprintNodeType, parentId?: string) => Promise<{ success: boolean }>;
}

/** React component rendering blueprint palette. */
export function BlueprintPalette({ onAddNode }: BlueprintPaletteProps) {
  const nodes = useBlueprintStore((s) => s.nodes);
  const edges = useBlueprintStore((s) => s.edges);
  const selectedNodeId = useBlueprintStore((s) => s.selectedNodeId);

  const { canAddNodeType, getNodeById } = useGateValidation(nodes, edges);
  const selectedParent = getNodeById(selectedNodeId);

  const handleDragStart = (e: React.DragEvent, type: BlueprintNodeType, allowed: boolean) => {
    if (!allowed) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.setData('application/slotly-node-type', type);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleItemClick = (type: BlueprintNodeType, allowed: boolean) => {
    if (!allowed) return;
    void onAddNode(type, selectedParent?.id);
  };

  const renderCategory = (category: 'structure' | 'resource', title: string) => {
    const items = PALETTE_ITEMS.filter((i) => i.category === category);

    return (
      <div className="mb-4">
        <h4 className="font-mono text-[10px] uppercase tracking-wider text-[#8A8A8A] px-2 mb-2">
          {title}
        </h4>
        <div className="space-y-1">
          {items.map((item) => {
            const check = canAddNodeType(item.type, selectedParent);
            const isAllowed = check.allowed;
            const Icon = item.icon;

            const buttonContent = (
              <div
                draggable={isAllowed}
                onDragStart={(e) => handleDragStart(e, item.type, isAllowed)}
                onClick={() => handleItemClick(item.type, isAllowed)}
                className={cn(
                  'w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md border text-left text-xs transition-colors select-none',
                  isAllowed
                    ? 'bg-[#111111] hover:bg-[#181818] border-[#232323] text-[#FAFAFA] cursor-grab active:cursor-grabbing'
                    : 'bg-[#0E0E0E] border-[#1A1A1A] text-[#555555] cursor-not-allowed opacity-60',
                )}
              >
                <div
                  className={cn(
                    'p-1 rounded shrink-0',
                    isAllowed ? 'bg-[#161616] text-[#FAFAFA]' : 'bg-[#141414] text-[#444444]',
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-xs leading-none truncate">{item.label}</div>
                  <div className="font-mono text-[10px] text-[#8A8A8A] truncate mt-0.5">
                    {item.description}
                  </div>
                </div>
              </div>
            );

            if (!isAllowed && check.reason) {
              return (
                <Tooltip
                  key={item.type}
                  content={
                    <div className="flex items-center gap-1.5 text-[#FACC15]">
                      <HelpCircle className="h-3.5 w-3.5 shrink-0" />
                      <span>{check.reason}</span>
                    </div>
                  }
                >
                  {buttonContent}
                </Tooltip>
              );
            }

            return <div key={item.type}>{buttonContent}</div>;
          })}
        </div>
      </div>
    );
  };

  return (
    <aside className="w-56 h-full border-r border-[#232323] bg-[#0A0A0A] p-2.5 flex flex-col overflow-y-auto">
      <div className="mb-3 px-2">
        <h3 className="text-xs font-semibold text-[#FAFAFA]">Node Library</h3>
        <p className="text-[10px] text-[#8A8A8A] font-mono mt-0.5">
          Drag onto canvas or click to insert
        </p>
      </div>

      {renderCategory('structure', 'Academic Structure')}
      {renderCategory('resource', 'Scheduling Resources')}
    </aside>
  );
}
