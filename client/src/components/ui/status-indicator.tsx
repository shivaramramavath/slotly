// Status indicator component combining progress bars with monospace status label.
'use client';

import { ProgressBars, getIndicatorConfig } from './progress-bars';
import type { ProjectLifecycleStatus } from '@slotly/contracts';

/** Props for StatusIndicator component. */
export interface StatusIndicatorProps {
  status: ProjectLifecycleStatus;
  blueprintProgress?: number | null | undefined;
  className?: string | undefined;
}

/** Formats lifecycle status and optional blueprint completion into standard label. */
export function formatStatusLabel(
  status: ProjectLifecycleStatus,
  blueprintProgress?: number | null | undefined,
): string {
  const statusMap: Record<ProjectLifecycleStatus, string> = {
    draft: 'Draft',
    building: 'Building',
    ready: 'Ready',
    pending_approval: 'Pending Approval',
    published: 'Published',
    archived: 'Archived',
  };

  const base = statusMap[status] || status;

  if (typeof blueprintProgress === 'number') {
    return `${base} · ${blueprintProgress}% set up`;
  }

  return base;
}

/** React component rendering three-bar status glyph paired with monospace text label. */
export function StatusIndicator({
  status,
  blueprintProgress,
  className = '',
}: StatusIndicatorProps) {
  const label = formatStatusLabel(status, blueprintProgress);

  return (
    <div className={`inline-flex items-center gap-2 min-w-0 ${className}`}>
      <ProgressBars status={status} />
      <span
        title={label}
        className="font-mono text-xs text-[#8A8A8A] capitalize whitespace-nowrap truncate"
      >
        {label}
      </span>
    </div>
  );
}

export { getIndicatorConfig };
