// Error boundary component for Semesters route.
'use client';

import { Button } from '@/components/ui/button';
import { AlertCircle, RotateCcw } from 'lucide-react';

/** React error boundary component for semesters view. */
export default function SemestersError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="rounded-[20px] border border-[#232323] bg-[#111111] p-8 text-center flex flex-col items-center justify-center min-h-[260px]">
      <AlertCircle className="w-8 h-8 text-[#EF4444] mb-3" />
      <h3 className="text-base font-semibold text-[#FAFAFA] mb-1">
        Failed to Load Semesters
      </h3>
      <p className="text-sm font-sans text-[#8A8A8A] max-w-md mx-auto mb-6">
        {error.message || 'An error occurred while loading instructional semesters.'}
      </p>
      <Button
        variant="outline"
        size="sm"
        onClick={() => reset()}
        className="h-9 px-4 rounded-[12px] border-[#232323] text-[#FAFAFA] hover:bg-[#161616]"
      >
        <RotateCcw className="w-4 h-4 mr-1.5" />
        Retry
      </Button>
    </div>
  );
}
