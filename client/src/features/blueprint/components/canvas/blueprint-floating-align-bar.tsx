// React component for blueprint-floating-align-bar.
'use client';

import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignStartVertical,
  AlignCenterVertical,
  AlignEndVertical,
  AlignHorizontalDistributeCenter,
  AlignVerticalDistributeCenter,
  Grid,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useBlueprintStore } from '../../store/blueprint.store';

/** React component rendering blueprint floating align bar. */
export function BlueprintFloatingAlignBar() {
  const selectedNodeIds = useBlueprintStore((s) => s.selectedNodeIds);
  const alignSelectedNodes = useBlueprintStore((s) => s.alignSelectedNodes);
  const distributeSelectedNodes = useBlueprintStore((s) => s.distributeSelectedNodes);
  const gridSize = useBlueprintStore((s) => s.gridSize);
  const setGridSize = useBlueprintStore((s) => s.setGridSize);

  if (selectedNodeIds.length < 2) return null;

  return (
    <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 bg-[#111111]/95 border border-[#232323] shadow-xl rounded-md px-2 py-1 flex items-center gap-1 backdrop-blur-xs text-xs animate-in fade-in-0 slide-in-from-top-2">
      <span className="font-mono text-[10px] text-[#8A8A8A] px-1 border-r border-[#232323]">
        {selectedNodeIds.length} selected
      </span>

      {/* Horizontal Alignments */}
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 text-[#8A8A8A] hover:text-[#FAFAFA]"
        onClick={() => alignSelectedNodes('left')}
        title="Align Left"
      >
        <AlignLeft className="h-3.5 w-3.5" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 text-[#8A8A8A] hover:text-[#FAFAFA]"
        onClick={() => alignSelectedNodes('center')}
        title="Align Center"
      >
        <AlignCenter className="h-3.5 w-3.5" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 text-[#8A8A8A] hover:text-[#FAFAFA]"
        onClick={() => alignSelectedNodes('right')}
        title="Align Right"
      >
        <AlignRight className="h-3.5 w-3.5" />
      </Button>

      <div className="h-4 w-px bg-[#232323] mx-0.5" />

      {/* Vertical Alignments */}
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 text-[#8A8A8A] hover:text-[#FAFAFA]"
        onClick={() => alignSelectedNodes('top')}
        title="Align Top"
      >
        <AlignStartVertical className="h-3.5 w-3.5" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 text-[#8A8A8A] hover:text-[#FAFAFA]"
        onClick={() => alignSelectedNodes('middle')}
        title="Align Middle"
      >
        <AlignCenterVertical className="h-3.5 w-3.5" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 text-[#8A8A8A] hover:text-[#FAFAFA]"
        onClick={() => alignSelectedNodes('bottom')}
        title="Align Bottom"
      >
        <AlignEndVertical className="h-3.5 w-3.5" />
      </Button>

      {/* Distribution (enabled for 3+ nodes) */}
      {selectedNodeIds.length >= 3 && (
        <>
          <div className="h-4 w-px bg-[#232323] mx-0.5" />
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-[#8A8A8A] hover:text-[#FAFAFA]"
            onClick={() => distributeSelectedNodes('horizontal')}
            title="Distribute Horizontally"
          >
            <AlignHorizontalDistributeCenter className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-[#8A8A8A] hover:text-[#FAFAFA]"
            onClick={() => distributeSelectedNodes('vertical')}
            title="Distribute Vertically"
          >
            <AlignVerticalDistributeCenter className="h-3.5 w-3.5" />
          </Button>
        </>
      )}

      <div className="h-4 w-px bg-[#232323] mx-0.5" />

      {/* Grid Size selector */}
      <div className="flex items-center gap-1 font-mono text-[10px] text-[#8A8A8A] ml-1">
        <Grid className="h-3 w-3" />
        <select
          value={gridSize}
          onChange={(e) => setGridSize(Number(e.target.value))}
          className="bg-transparent text-[#FAFAFA] border-0 focus:outline-none cursor-pointer"
        >
          <option value={10}>10px</option>
          <option value={15}>15px</option>
          <option value={20}>20px</option>
          <option value={25}>25px</option>
        </select>
      </div>
    </div>
  );
}
