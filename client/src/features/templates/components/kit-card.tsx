// Kit card component implementing sys0 visual language, stretched link overlay, and outline action triggers.
'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  GraduationCap,
  Landmark,
  FlaskConical,
  Layers,
  MoreHorizontal,
  Copy,
  Eye,
  ArrowRight,
} from 'lucide-react';
import { SurfaceCard } from '@/components/ui/surface-card';
import { Skeleton } from '@/components/ui/skeleton';
import type { GraphTemplateDto } from '@slotly/contracts';

/** Props for KitCard component. */
export interface KitCardProps {
  template: GraphTemplateDto;
  onInspect: (template: GraphTemplateDto) => void;
  onDuplicate?: (template: GraphTemplateDto) => void;
  onUseKit?: (template: GraphTemplateDto) => void;
  isDuplicatePending?: boolean;
  className?: string;
}

/** Returns the appropriate monochrome category glyph component. */
export function getCategoryGlyph(category: string): React.ReactNode {
  const norm = category.toLowerCase().trim();
  if (norm.includes('k-12') || norm.includes('school')) {
    return <GraduationCap className="h-4 w-4" aria-hidden="true" />;
  }
  if (norm.includes('university') || norm.includes('college') || norm.includes('higher ed')) {
    return <Landmark className="h-4 w-4" aria-hidden="true" />;
  }
  if (norm.includes('vocational') || norm.includes('stem') || norm.includes('lab') || norm.includes('tech')) {
    return <FlaskConical className="h-4 w-4" aria-hidden="true" />;
  }
  return <Layers className="h-4 w-4" aria-hidden="true" />;
}

/** Formats category label cleanly, standardizing ampersand to and. */
export function formatCategoryLabel(category: string): string {
  if (!category) return 'Kit';
  return category.replace('&', 'and');
}

/** Formats subtitle line with lowercase unit words: "Subtree · 7 nodes · 6 connections". */
export function formatSubtitle(nodeCount: number, edgeCount: number): string {
  return `Subtree · ${nodeCount} nodes · ${edgeCount} connections`;
}

/** Generates clean fallback description text from subtree nodes when custom description is absent. */
export function getKitDescription(template: GraphTemplateDto): string {
  const customDesc = (template as unknown as { description?: string }).description;
  if (customDesc && customDesc.trim().length > 0) {
    return customDesc.trim();
  }

  const nodes = template.subtree?.nodes || [];
  const names = nodes
    .map((n) => (n.data?.['name'] as string) || n.type)
    .filter((name): name is string => Boolean(name && name.trim().length > 0));

  if (names.length === 0) {
    return 'Pre-configured curricular kit with modular timetable subtree structure.';
  }

  if (names.length <= 2) {
    return `Includes ${names.join(' and ')}.`;
  }

  const firstTwo = names.slice(0, 2).join(', ');
  const remaining = names.length - 2;
  return `Includes ${firstTwo} and ${remaining} more.`;
}

/** React component rendering single curriculum kit card with stretched overlay and action triggers. */
export function KitCard({
  template,
  onInspect,
  onDuplicate,
  onUseKit,
  isDuplicatePending = false,
  className = '',
}: KitCardProps) {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setMenuOpen(false);
      }
    }

    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [menuOpen]);

  const nodeCount = template.subtree?.nodes?.length || 0;
  const edgeCount = template.subtree?.edges?.length || 0;
  const subtitle = formatSubtitle(nodeCount, edgeCount);
  const description = getKitDescription(template);
  const categoryLabel = formatCategoryLabel(template.category);
  const useKitHref = `/projects/new?templateId=${encodeURIComponent(template.id)}`;

  return (
    <SurfaceCard
      variant="link"
      className={`min-h-[270px] ${className}`}
    >
      {/* Primary Stretched Link Overlay - Covers entire card to open non-destructive Inspect */}
      <button
        type="button"
        aria-label={`Inspect ${template.name} subtree`}
        onClick={() => onInspect(template)}
        className="absolute inset-0 z-10 rounded-[20px] focus:outline-none cursor-pointer"
      />

      {/* Top Header Row */}
      <div className="flex items-center justify-between gap-3">
        {/* Glyph Icon: 32px monochrome glyph in 32px rounded box */}
        <div
          className="h-8 w-8 rounded-lg bg-[#181818] border border-[#232323] flex items-center justify-center text-[#FAFAFA]/90 shrink-0"
          aria-hidden="true"
        >
          {getCategoryGlyph(template.category)}
        </div>

        {/* Category Label + Arrow + More Options Dropdown */}
        <div className="flex items-center gap-2 relative z-20">
          <span className="flex items-center gap-1 font-mono text-xs text-[#8A8A8A] select-none">
            <span>{categoryLabel}</span>
            <span
              className="inline-block transition-transform duration-150 group-hover:translate-x-0.5 motion-reduce:transform-none"
              aria-hidden="true"
            >
              &rarr;
            </span>
          </span>

          {/* More button & dropdown */}
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              aria-label={`Options for ${template.name}`}
              aria-expanded={menuOpen}
              aria-haspopup="true"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setMenuOpen(!menuOpen);
              }}
              className="h-8 w-8 rounded-lg border border-transparent hover:border-[#232323] hover:bg-[#181818] text-[#8A8A8A] hover:text-[#FAFAFA] flex items-center justify-center transition-all cursor-pointer opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-within:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#FAFAFA]"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>

            {menuOpen && (
              <div
                role="menu"
                aria-orientation="vertical"
                className="absolute right-0 mt-1.5 w-44 rounded-xl border border-[#232323] bg-[#111111] p-1 shadow-2xl text-xs z-30 animate-in fade-in zoom-in-95 duration-100"
              >
                <button
                  type="button"
                  role="menuitem"
                  disabled={isDuplicatePending}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setMenuOpen(false);
                    onDuplicate?.(template);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 rounded-lg text-[#FAFAFA] hover:bg-[#181818] transition-colors cursor-pointer text-left disabled:opacity-50"
                >
                  <Copy className="h-3.5 w-3.5 text-[#8A8A8A]" />
                  <span>Duplicate kit</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Middle Content: Title, Subtitle, Description */}
      <div className="my-5 space-y-2">
        <h2 className="text-[20px] font-medium text-[#FAFAFA] tracking-tight leading-snug line-clamp-2">
          {template.name}
        </h2>
        <p className="font-mono text-xs text-[#8A8A8A] tracking-tight truncate">
          {subtitle}
        </p>
        <p className="text-sm leading-[22px] text-[#8A8A8A] line-clamp-3 pt-1">
          {description}
        </p>
      </div>

      {/* Pinned Footer Row */}
      <div className="flex items-center justify-between pt-2 border-t border-[#181818] text-xs font-mono text-[#8A8A8A]">
        {/* Left: Version */}
        <span className="truncate">v{template.version}</span>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 relative z-20">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onInspect(template);
            }}
            aria-label={`Inspect subtree for ${template.name}`}
            className="h-8 px-2.5 rounded-[12px] text-xs font-mono text-[#8A8A8A] hover:text-[#FAFAFA] hover:bg-[#181818] inline-flex items-center gap-1.5 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#FAFAFA]"
          >
            <Eye className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Inspect</span>
          </button>

          <Link
            href={useKitHref}
            onClick={(e) => {
              e.stopPropagation();
              onUseKit?.(template);
            }}
            aria-label={`Use kit: ${template.name}`}
            className="h-8 px-3 rounded-[12px] border border-[#232323] hover:border-[#383838] hover:bg-[#181818] text-[#FAFAFA] text-xs font-mono inline-flex items-center gap-1.5 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#FAFAFA]"
          >
            <span>Use kit</span>
            <ArrowRight className="w-3 h-3 text-[#8A8A8A]" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </SurfaceCard>
  );
}

/** Skeleton placeholder component matching KitCard structure and dimensions. */
export function KitCardSkeleton() {
  return (
    <div
      className="rounded-[20px] border border-[#232323] bg-[#111111] p-6 min-h-[270px] flex flex-col justify-between"
      aria-busy="true"
    >
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-8 rounded-lg bg-[#181818] motion-reduce:animate-none" />
        <Skeleton className="h-4 w-20 bg-[#181818] rounded motion-reduce:animate-none" />
      </div>

      <div className="my-5 space-y-2.5">
        <Skeleton className="h-6 w-3/4 bg-[#181818] rounded motion-reduce:animate-none" />
        <Skeleton className="h-3 w-1/2 bg-[#181818] rounded motion-reduce:animate-none" />
        <div className="space-y-1.5 pt-1">
          <Skeleton className="h-3.5 w-full bg-[#181818] rounded motion-reduce:animate-none" />
          <Skeleton className="h-3.5 w-5/6 bg-[#181818] rounded motion-reduce:animate-none" />
        </div>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-[#181818]">
        <Skeleton className="h-3.5 w-8 bg-[#181818] rounded motion-reduce:animate-none" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-18 bg-[#181818] rounded-[12px] motion-reduce:animate-none" />
          <Skeleton className="h-8 w-22 bg-[#181818] rounded-[12px] motion-reduce:animate-none" />
        </div>
      </div>
    </div>
  );
}
