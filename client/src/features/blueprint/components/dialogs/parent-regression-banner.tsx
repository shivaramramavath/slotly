'use client';

import { AlertTriangle, X } from 'lucide-react';
import { useBlueprintStore } from '../../store/blueprint.store';
import { Button } from '@/components/ui/button';

export function ParentRegressionBanner() {
  const regression = useBlueprintStore((s) => s.regressionBanner);
  const setRegressionBanner = useBlueprintStore((s) => s.setRegressionBanner);

  if (!regression || regression.count === 0) return null;

  return (
    <div className="bg-[#1A1500] border-b border-[#FACC15]/30 px-4 py-2 flex items-center justify-between z-30">
      <div className="flex items-center gap-2.5">
        <AlertTriangle className="h-4 w-4 text-[#FACC15] shrink-0" />
        <div className="text-xs text-[#FAFAFA]">
          <span className="font-semibold text-[#FACC15]">Parent Regression: </span>
          <span>
            {regression.count} descendant node{regression.count > 1 ? 's' : ''} (e.g.{' '}
            <span className="font-mono">{regression.nodeNames.join(', ')}</span>) became blocked
            because an ancestor node is now incomplete.
          </span>
        </div>
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 text-[#8A8A8A] hover:text-[#FAFAFA]"
        onClick={() => setRegressionBanner(null)}
      >
        <X className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
