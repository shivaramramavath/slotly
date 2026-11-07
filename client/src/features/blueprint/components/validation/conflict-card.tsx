// React component for conflict-card.
'use client';

import { AlertTriangle, AlertCircle, Sparkles, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/toast';
import type { ViolationDto, ViolationSuggestion } from '@slotly/contracts';

interface ConflictCardProps {
  violation: ViolationDto;
  onApplySuggestion?: (suggestion: ViolationSuggestion) => void;
  className?: string;
}

/** React component rendering conflict card. */
export function ConflictCard({
  violation,
  onApplySuggestion,
  className = '',
}: ConflictCardProps) {
  const isHard = violation.type === 'hard';

  const handleApply = (suggestion: ViolationSuggestion) => {
    if (onApplySuggestion) {
      onApplySuggestion(suggestion);
    } else {
      toast.info(
        'Suggestion queued',
        `Structured move to ${suggestion.description} will be automatically applied by the solver.`,
      );
    }
  };

  return (
    <div
      className={`p-3 rounded-lg border bg-[#111111] transition-all space-y-2.5 ${
        isHard ? 'border-[#EF4444]/40 hover:border-[#EF4444]' : 'border-[#FACC15]/40 hover:border-[#FACC15]'
      } ${className}`}
    >
      {/* Header with Severity & Constraint Type */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {isHard ? (
            <AlertTriangle className="h-4 w-4 text-[#EF4444]" />
          ) : (
            <AlertCircle className="h-4 w-4 text-[#FACC15]" />
          )}
          <span className="font-mono text-[10px] uppercase font-semibold text-[#FAFAFA]">
            {violation.constraintId.replace(/-/g, ' ')}
          </span>
        </div>
        <Badge
          variant={isHard ? 'red' : 'yellow'}
          className="text-[9px] font-mono uppercase"
        >
          {isHard ? 'Hard Conflict' : 'Soft Rule'}
        </Badge>
      </div>

      {/* Conflict Message */}
      <p className="text-xs text-[#FAFAFA] font-medium leading-relaxed">
        {violation.message}
      </p>

      {/* Involved Entities Badges */}
      <div className="flex flex-wrap gap-1.5 pt-0.5">
        {violation.sectionId && (
          <span className="font-mono text-[9px] bg-[#161616] text-[#8A8A8A] px-1.5 py-0.5 rounded border border-[#232323]">
            Section: {violation.sectionId}
          </span>
        )}
        {violation.facultyId && (
          <span className="font-mono text-[9px] bg-[#161616] text-[#8A8A8A] px-1.5 py-0.5 rounded border border-[#232323]">
            Faculty: {violation.facultyId}
          </span>
        )}
        {violation.roomId && (
          <span className="font-mono text-[9px] bg-[#161616] text-[#8A8A8A] px-1.5 py-0.5 rounded border border-[#232323]">
            Room: {violation.roomId}
          </span>
        )}
        {violation.subjectId && (
          <span className="font-mono text-[9px] bg-[#161616] text-[#8A8A8A] px-1.5 py-0.5 rounded border border-[#232323]">
            Subject: {violation.subjectId}
          </span>
        )}
        {violation.slotRefs.length > 0 && (
          <span className="font-mono text-[9px] bg-[#161616] text-[#666666] px-1.5 py-0.5 rounded border border-[#232323]">
            Slots: {violation.slotRefs.join(', ')}
          </span>
        )}
      </div>

      {/* Ranked Conflict-Free Alternative Suggestions */}
      {violation.suggestions && violation.suggestions.length > 0 && (
        <div className="pt-2 border-t border-[#232323] space-y-1.5">
          <div className="flex items-center gap-1.5 text-[10px] font-semibold text-[#8A8A8A] uppercase tracking-wider">
            <Sparkles className="h-3 w-3 text-[#FACC15]" />
            <span>Recommended Conflict-Free Alternatives</span>
          </div>

          <div className="space-y-1">
            {violation.suggestions.map((sug, idx) => (
              <div
                key={idx}
                className="p-2 rounded bg-[#161616] border border-[#232323] flex items-center justify-between gap-2 hover:border-[#FACC15]/30 transition-colors"
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <span className="h-4 w-4 rounded-full bg-[#111111] text-[9px] font-mono font-bold flex items-center justify-center text-[#FAFAFA] border border-[#333333] shrink-0">
                    {idx + 1}
                  </span>
                  <div className="truncate">
                    <p className="text-[11px] text-[#FAFAFA] truncate">{sug.description}</p>
                    {sug.score !== undefined && (
                      <span className="font-mono text-[9px] text-[#22C55E]">
                        Feasibility {sug.score}%
                      </span>
                    )}
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleApply(sug)}
                  className="h-6 px-2 text-[10px] gap-1 shrink-0 border-[#232323] hover:border-[#FACC15] hover:text-[#FACC15]"
                >
                  <span>Apply</span>
                  <ArrowRight className="h-2.5 w-2.5" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
