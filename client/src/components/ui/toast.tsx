// React component for toast.
'use client';

import { create } from 'zustand';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { normalizeReasonCode, REASON_CODE_MESSAGES } from '@slotly/contracts';

/** Type alias for toast variant. */
export type ToastVariant = 'success' | 'error' | 'info' | 'warning';

/** Interface defining structure for toast item. */
export interface ToastItem {
  id: string;
  title: string;
  description?: string | undefined;
  variant?: ToastVariant | undefined;
}

interface ToastStore {
  toasts: ToastItem[];
  addToast: (toast: Omit<ToastItem, 'id'>) => void;
  removeToast: (id: string) => void;
}

/** Zustand store managing use toast store state. */
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

/** Constant representing toast. */
export const toast = {
  success: (title: string, description?: string) =>
    useToastStore.getState().addToast({ title, description, variant: 'success' }),
  error: (title: string, description?: string) =>
    useToastStore.getState().addToast({ title, description, variant: 'error' }),
  info: (title: string, description?: string) =>
    useToastStore.getState().addToast({ title, description, variant: 'info' }),
  warning: (title: string, description?: string) =>
    useToastStore.getState().addToast({ title, description, variant: 'warning' }),
  fromErrorCode: (code: string, fallbackMessage?: string) => {
    let message = fallbackMessage;
    if (!message) {
      const canonical = normalizeReasonCode(code);
      message =
        REASON_CODE_MESSAGES[canonical] ||
        (code ? `Operation failed (${code})` : 'An unexpected error occurred.');
    }
    useToastStore
      .getState()
      .addToast({ title: 'Action Failed', description: message, variant: 'error' });
  },
};

/** React component rendering toast container. */
export function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col space-y-2 max-w-sm w-full">
      {toasts.map((t) => {
        const icons = {
          success: <CheckCircle2 className="w-4 h-4 text-[#22C55E]" />,
          error: <AlertCircle className="w-4 h-4 text-[#EF4444]" />,
          warning: <AlertCircle className="w-4 h-4 text-[#FACC15]" />,
          info: <Info className="w-4 h-4 text-[#3B82F6]" />,
        };

        const borders = {
          success: 'border-[#22C55E]/20 bg-[#111111]',
          error: 'border-[#EF4444]/20 bg-[#111111]',
          warning: 'border-[#FACC15]/20 bg-[#111111]',
          info: 'border-[#3B82F6]/20 bg-[#111111]',
        };

        return (
          <div
            key={t.id}
            className={cn(
              'flex items-start gap-3 p-3 rounded-lg border text-sm shadow-lg text-[#FAFAFA]',
              borders[t.variant || 'info']
            )}
          >
            {icons[t.variant || 'info']}
            <div className="flex-1">
              <div className="font-medium text-xs font-mono">{t.title}</div>
              {t.description && (
                <div className="text-xs text-[#8A8A8A] mt-0.5">
                  {t.description}
                </div>
              )}
            </div>
            <button
              onClick={() => removeToast(t.id)}
              className="text-[#8A8A8A] hover:text-[#FAFAFA] p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
