'use client';

import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Keyboard } from 'lucide-react';
import { Kbd } from '@/components/ui/kbd';
import { useBlueprintStore } from '../../store/blueprint.store';

const SHORTCUTS = [
  { keys: ['Ctrl', 'A'], description: 'Select all nodes' },
  { keys: ['Ctrl', 'C'], description: 'Copy selected subtree' },
  { keys: ['Ctrl', 'V'], description: 'Paste copied subtree under complete parent' },
  { keys: ['Ctrl', 'D'], description: 'Duplicate subtree' },
  { keys: ['Delete'], description: 'Cascade delete with impact preview' },
  { keys: ['Ctrl', 'Z'], description: 'Undo last operation' },
  { keys: ['Ctrl', 'Y'], description: 'Redo last operation' },
  { keys: ['F'], description: 'Focus Mode (dim unrelated nodes)' },
  { keys: ['L'], description: 'Lock / Unlock node' },
  { keys: ['H'], description: 'Hide / Show node' },
  { keys: ['F11'], description: 'Toggle fullscreen canvas' },
  { keys: ['Space', 'Drag'], description: 'Pan viewport' },
  { keys: ['?'], description: 'Open shortcuts cheat sheet' },
];

export function ShortcutsDialog() {
  const isShortcutsOpen = useBlueprintStore((s) => s.isShortcutsOpen);
  const setIsShortcutsOpen = useBlueprintStore((s) => s.setIsShortcutsOpen);

  if (!isShortcutsOpen) return null;

  return (
    <Dialog open={isShortcutsOpen} onOpenChange={setIsShortcutsOpen}>
      <DialogHeader>
        <div className="flex items-center gap-2 text-[#FACC15] mb-1">
          <Keyboard className="h-5 w-5" />
          <DialogTitle className="text-sm font-semibold text-[#FAFAFA]">
            Keyboard Shortcuts
          </DialogTitle>
        </div>
        <DialogDescription className="text-xs text-[#8A8A8A]">
          High-velocity controls for the visual timetable blueprint designer.
        </DialogDescription>
      </DialogHeader>

      <div className="my-3 max-h-72 overflow-y-auto divide-y divide-[#232323] border border-[#232323] rounded-md bg-[#0A0A0A]">
        {SHORTCUTS.map((item, idx) => (
          <div key={idx} className="px-3 py-2 flex items-center justify-between text-xs">
            <span className="text-[#8A8A8A]">{item.description}</span>
            <div className="flex items-center gap-1">
              {item.keys.map((k) => (
                <Kbd key={k}>{k}</Kbd>
              ))}
            </div>
          </div>
        ))}
      </div>

      <DialogFooter className="flex items-center justify-end">
        <Button variant="ghost" size="sm" onClick={() => setIsShortcutsOpen(false)}>
          Close
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
