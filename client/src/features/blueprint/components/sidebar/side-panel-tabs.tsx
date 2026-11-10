// React component for side-panel-tabs.
'use client';

import type { SidebarTab } from '../../types/canvas.types';
import { cn } from '@/lib/utils';

export interface SidePanelTabsProps {
  activeTab: SidebarTab;
  onTabChange: (tab: SidebarTab) => void;
}

/** React component rendering underlined text tabs matching the reference spec */
export function SidePanelTabs({ activeTab, onTabChange }: SidePanelTabsProps) {
  const tabs: Array<{ id: SidebarTab; label: string }> = [
    { id: 'config', label: 'Config' },
    { id: 'constraints', label: 'Constraints' },
    { id: 'ai', label: 'Slotly AI' },
  ];

  return (
    <div
      role="tablist"
      aria-label="Sidebar Sections"
      className="h-11 border-b border-[#232323] px-4 flex items-center gap-6 bg-[#0A0A0A] shrink-0"
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              'h-full text-xs font-medium border-b-2 transition-all flex items-center focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white',
              isActive
                ? 'text-[#FAFAFA] border-[#FAFAFA]'
                : 'text-[#8A8A8A] hover:text-[#FAFAFA] border-transparent',
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
