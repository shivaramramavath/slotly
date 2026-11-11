// Sidebar entry point rendering InspectorPanel for the blueprint designer canvas.
'use client';

import { InspectorPanel } from './inspector-panel';

interface BlueprintSidebarProps {
  projectId: string;
  onUpdateConfig: (nodeId: string, data: Record<string, unknown>) => void;
  className?: string | undefined;
}

/** React component rendering redesigned blueprint inspector sidebar. */
export function BlueprintSidebar({
  projectId,
  onUpdateConfig,
  className,
}: BlueprintSidebarProps) {
  return (
    <InspectorPanel
      projectId={projectId}
      onUpdateConfig={onUpdateConfig}
      className={className}
    />
  );
}
