// Custom React hook for use-blueprint-commands.
import { useCallback } from 'react';
import { useBlueprintStore } from '../store/blueprint.store';
import type { Command } from '../types/canvas.types';

/** Custom React hook for use blueprint commands. */
export function useBlueprintCommands() {
  const pushCommand = useBlueprintStore((s) => s.pushCommand);
  const undo = useBlueprintStore((s) => s.undo);
  const redo = useBlueprintStore((s) => s.redo);
  const undoStack = useBlueprintStore((s) => s.undoStack);
  const redoStack = useBlueprintStore((s) => s.redoStack);

  const executeCommand = useCallback(
    async (command: Command) => {
      await command.execute();
      pushCommand(command);
    },
    [pushCommand],
  );

  return {
    executeCommand,
    undo,
    redo,
    canUndo: undoStack.length > 0,
    canRedo: redoStack.length > 0,
  };
}
