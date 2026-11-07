'use client';

import { create } from 'zustand';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ToastVariant = 'success' | 'error' | 'info' | 'warning';

export interface ToastItem {
  id: string;
  title: string;
  description?: string | undefined;
  variant?: ToastVariant | undefined;
  action?: { label: string; onClick: () => void } | undefined;
}

interface ToastStore {
  toasts: ToastItem[];
  addToast: (toast: Omit<ToastItem, 'id'>) => void;
  removeToast: (id: string) => void;
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  addToast: (toast) => {
    const id = Math.random().toString(36).substring(2, 9);
    set((state) => ({ toasts: [...state.toasts, { ...toast, id }] }));
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    }, 4000);
  },
  removeToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));

export const toast = {
  success: (title: string, description?: string) =>
    useToastStore.getState().addToast({ title, description, variant: 'success' }),
  error: (title: string, description?: string, action?: { label: string; onClick: () => void }) =>
    useToastStore.getState().addToast({ title, description, variant: 'error', action }),
  info: (title: string, description?: string) =>
    useToastStore.getState().addToast({ title, description, variant: 'info' }),
  warning: (title: string, description?: string) =>
    useToastStore.getState().addToast({ title, description, variant: 'warning' }),
  fromErrorCode: (code: string, fallbackMessage?: string) => {
    const errorMap: Record<string, string> = {
      PARENT_MISSING: 'Parent node is required before this item can be created.',
      PARENT_INCOMPLETE: 'Please complete all required fields on the parent node first.',
      PARENT_TYPE_NOT_ALLOWED: 'Connection between these types is not allowed in the hierarchy.',
      DUPLICATE_NAME: 'An item with this name or code already exists.',
      CAPACITY_EXCEEDED: 'The combined student count exceeds parent capacity.',
      CYCLE: 'Circular dependency detected.',
      ENDPOINT_INCOMPLETE: 'Both connected items must be fully configured.',
      NOT_QUALIFIED: 'Faculty lacks the required qualifications for this subject.',
      PROJECT_LOCKED: 'Project is locked or currently being built.',
      PERMISSION_DENIED: 'You do not have permission to perform this action.',
      REVISION_CONFLICT: 'The document was updated elsewhere. Please refresh to see latest changes.',
    };
    const message = errorMap[code] || fallbackMessage || `Operation failed (${code})`;
    useToastStore.getState().addToast({ title: 'Action Failed', description: message, variant: 'error' });
  },
};

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div
      role="region"
      aria-live="polite"
      aria-label="Notifications"
      className="fixed bottom-4 right-4 z-50 flex flex-col space-y-2 max-w-sm w-full"
    >
      {toasts.map((t) => {
        const icons = {
          success: <CheckCircle2 className="h-4 w-4 text-[#22C55E] shrink-0" />,
          error: <AlertCircle className="h-4 w-4 text-[#EF4444] shrink-0" />,
          info: <Info className="h-4 w-4 text-[#3B82F6] shrink-0" />,
          warning: <AlertCircle className="h-4 w-4 text-[#FACC15] shrink-0" />,
        };

        const borders = {
          success: 'border-[#22C55E]/30',
          error: 'border-[#EF4444]/30',
          info: 'border-[#3B82F6]/30',
          warning: 'border-[#FACC15]/30',
        };

        return (
          <div
            key={t.id}
            role="status"
            className={cn(
              'flex items-start justify-between rounded-lg border bg-[#111111] p-3 shadow-lg text-[#FAFAFA]',
              borders[t.variant || 'info'],
            )}
          >
            <div className="flex items-start gap-2.5">
              {icons[t.variant || 'info']}
              <div className="space-y-0.5">
                <p className="text-xs font-semibold">{t.title}</p>
                {t.description && <p className="text-xs text-[#8A8A8A]">{t.description}</p>}
                {t.action && (
                  <button
                    type="button"
                    onClick={() => {
                      t.action?.onClick();
                      removeToast(t.id);
                    }}
                    className="mt-1.5 inline-block text-[11px] font-mono font-medium underline text-[#FAFAFA] hover:text-[#FACC15] cursor-pointer"
                  >
                    {t.action.label}
                  </button>
                )}
              </div>
            </div>
            <button
              onClick={() => removeToast(t.id)}
              className="text-[#8A8A8A] hover:text-[#FAFAFA] ml-2"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
