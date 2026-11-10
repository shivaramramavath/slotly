// React component for first-run-hint.
'use client';

import { useState, useSyncExternalStore } from 'react';
import { X, CornerRightDown } from 'lucide-react';
import { useBlueprintStore } from '../../store/blueprint.store';

function subscribe(callback: () => void) {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener('storage', callback);
  return () => window.removeEventListener('storage', callback);
}

function getSnapshot() {
  if (typeof window === 'undefined') return true;
  return localStorage.getItem('slotly:blueprint:hint-dismissed') === 'true';
}

function getServerSnapshot() {
  return true;
}

/** React component rendering first-run onboarding hint for empty canvas */
export function FirstRunHint() {
  const nodes = useBlueprintStore((s) => s.nodes);
  const isStoredDismissed = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [manuallyDismissed, setManuallyDismissed] = useState<boolean>(false);

  const dismissed = isStoredDismissed || manuallyDismissed;

  // Show only when there is exactly 1 node (institution root) and not dismissed
  if (nodes.length !== 1 || dismissed) {
    return null;
  }

  const handleDismiss = () => {
    setManuallyDismissed(true);
    if (typeof window !== 'undefined') {
      localStorage.setItem('slotly:blueprint:hint-dismissed', 'true');
    }
  };

  return (
    <div
      role="note"
      aria-label="First-run suggestion"
      className="absolute top-20 left-1/2 -translate-x-1/2 z-20 flex items-start gap-2 bg-[#161616] border border-[#232323] p-3 rounded-[12px] shadow-xl text-xs select-none max-w-xs animate-in fade-in duration-300"
    >
      <div className="flex-1">
        <div className="flex items-center gap-1.5 font-medium text-[#FAFAFA]">
          <span>Get Started</span>
          <CornerRightDown className="h-3.5 w-3.5 text-[#FACC15]" />
        </div>
        <p className="text-[11px] font-mono text-[#8A8A8A] mt-1 leading-snug">
          Click the <strong className="text-[#FAFAFA] font-bold">+</strong> button on the Institution node below to add your first Department.
        </p>
      </div>

      <button
        type="button"
        aria-label="Dismiss hint"
        onClick={handleDismiss}
        className="text-[#8A8A8A] hover:text-[#FAFAFA] p-0.5 rounded transition-colors"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
