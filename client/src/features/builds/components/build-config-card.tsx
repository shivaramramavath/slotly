// React component for build-config-card.
'use client';

import { Play, Sparkles, RefreshCw, Cpu } from 'lucide-react';
import type { BuildProfile, CreateBuildDto } from '@slotly/contracts';

interface BuildConfigCardProps {
  config: CreateBuildDto;
  onChange: (config: Partial<CreateBuildDto>) => void;
  onStart: () => void;
  disabled?: boolean;
  isLoading?: boolean;
}

/** React component rendering build config card. */
export function BuildConfigCard({
  config,
  onChange,
  onStart,
  disabled = false,
  isLoading = false,
}: BuildConfigCardProps) {
  const profiles: Array<{ id: BuildProfile; name: string; desc: string }> = [
    {
      id: 'standard',
      name: 'Standard',
      desc: 'Balanced academic curriculum matching normal university distributions',
    },
    {
      id: 'workload-balanced',
      name: 'Workload-Balanced',
      desc: 'Optimizes faculty teaching hours variance and spreads theory classes across days',
    },
    {
      id: 'preference-first',
      name: 'Preference-First',
      desc: 'Maximizes adherence to faculty preferred hours and afternoon lab blocks',
    },
    {
      id: 'room-efficient',
      name: 'Room-Efficient',
      desc: 'Minimizes student section movements between lecture halls during the day',
    },
  ];

  return (
    <div className="rounded-xl border border-[#232323] bg-[#0A0A0A] p-6 text-[#FAFAFA]">
      <div className="flex items-center justify-between border-b border-[#232323] pb-4 mb-6">
        <div className="flex items-center gap-2.5">
          <Cpu className="h-5 w-5 text-[#FACC15]" />
          <div>
            <h3 className="text-sm font-semibold text-[#FAFAFA]">
              Generation Engine Settings
            </h3>
            <p className="text-xs text-[#8A8A8A]">
              Configure constraint heuristics and multi-alternative candidate generation
            </p>
          </div>
        </div>

        <button
          onClick={onStart}
          disabled={disabled || isLoading}
          className="flex items-center gap-2 rounded-lg bg-[#FACC15] px-5 py-2.5 text-xs font-semibold text-black hover:bg-[#FACC15]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
        >
          {isLoading ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span>Solving Timetable...</span>
            </>
          ) : (
            <>
              <Play className="h-4 w-4 fill-current" />
              <span>Generate Timetable</span>
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Mode Selector */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-[#8A8A8A] uppercase tracking-wider font-mono">
            Generation Mode
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onChange({ mode: 'fresh' })}
              className={`flex flex-col items-start p-3 rounded-lg border text-left transition-all ${
                config.mode === 'fresh'
                  ? 'border-[#FACC15] bg-[#FACC15]/10 text-[#FAFAFA]'
                  : 'border-[#232323] bg-[#111111] text-[#8A8A8A] hover:border-[#383838]'
              }`}
            >
              <div className="flex items-center gap-1.5 font-semibold text-xs text-[#FAFAFA]">
                <Sparkles className="h-3.5 w-3.5 text-[#FACC15]" />
                <span>Fresh Solve</span>
              </div>
              <span className="text-[11px] text-[#8A8A8A] mt-1">
                Generates a brand new timetable from scratch
              </span>
            </button>

            <button
              type="button"
              onClick={() => onChange({ mode: 'regenerate' })}
              className={`flex flex-col items-start p-3 rounded-lg border text-left transition-all ${
                config.mode === 'regenerate'
                  ? 'border-[#FACC15] bg-[#FACC15]/10 text-[#FAFAFA]'
                  : 'border-[#232323] bg-[#111111] text-[#8A8A8A] hover:border-[#383838]'
              }`}
            >
              <div className="flex items-center gap-1.5 font-semibold text-xs text-[#FAFAFA]">
                <RefreshCw className="h-3.5 w-3.5 text-[#FACC15]" />
                <span>Regenerate</span>
              </div>
              <span className="text-[11px] text-[#8A8A8A] mt-1">
                Preserves locked slots from the active timetable
              </span>
            </button>
          </div>
        </div>

        {/* Number of Alternatives */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-xs font-medium text-[#8A8A8A] uppercase tracking-wider font-mono">
              Alternatives Count
            </label>
            <span className="font-mono text-xs text-[#FACC15] font-semibold">
              {config.alternatives || 3} candidates
            </span>
          </div>
          <div className="flex items-center gap-2 pt-2">
            {[1, 2, 3, 4, 5].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => onChange({ alternatives: num })}
                className={`flex-1 py-2.5 rounded-lg border font-mono text-xs font-semibold transition-all ${
                  (config.alternatives || 3) === num
                    ? 'border-[#FACC15] bg-[#FACC15] text-black'
                    : 'border-[#232323] bg-[#111111] text-[#8A8A8A] hover:text-[#FAFAFA] hover:border-[#383838]'
                }`}
              >
                {num}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-[#8A8A8A] pt-1">
            Engine tests varied random seeds and heuristic weight profiles to deliver ranked choices.
          </p>
        </div>

        {/* Random Seed (Optional / Advanced) */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-[#8A8A8A] uppercase tracking-wider font-mono">
            Deterministic Seed (PRNG)
          </label>
          <input
            type="number"
            value={config.seed ?? 1001}
            onChange={(e) =>
              onChange({
                seed: e.target.value ? parseInt(e.target.value, 10) : undefined,
              })
            }
            className="w-full rounded-lg border border-[#232323] bg-[#111111] px-3 py-2.5 font-mono text-xs text-[#FAFAFA] focus:border-[#FACC15] focus:outline-none transition-colors"
            placeholder="1001"
          />
          <p className="text-[11px] text-[#8A8A8A]">
            Mulberry32 PRNG seed for identical reproducible scheduling runs.
          </p>
        </div>
      </div>

      {/* Profile Selector */}
      <div className="mt-6 pt-5 border-t border-[#232323]">
        <label className="text-xs font-medium text-[#8A8A8A] uppercase tracking-wider font-mono block mb-3">
          Primary Weight Profile
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {profiles.map((p) => (
            <div
              key={p.id}
              onClick={() => onChange({ profile: p.id })}
              className={`cursor-pointer rounded-lg border p-3 transition-all ${
                config.profile === p.id
                  ? 'border-[#FACC15] bg-[#FACC15]/10'
                  : 'border-[#232323] bg-[#111111] hover:border-[#383838]'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-[#FAFAFA]">
                  {p.name}
                </span>
                {config.profile === p.id && (
                  <span className="h-2 w-2 rounded-full bg-[#FACC15]" />
                )}
              </div>
              <p className="text-[11px] text-[#8A8A8A] leading-relaxed">
                {p.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
