// Core implementation for alternatives-generator in server/src/modules/engine/core/solver.
import type { EngineInput } from '../types';
import type { SolverOptions, AlternativeResult } from './types';
import { TimetableSolver } from './timetable-solver';
import type { BuildProfile } from '@slotly/contracts';

const PROFILE_CONFIGS: Array<{
  profile: BuildProfile;
  seedOffset: number;
  labelSuffix: string;
}> = [
  { profile: 'standard', seedOffset: 0, labelSuffix: 'Standard' },
  {
    profile: 'workload-balanced',
    seedOffset: 137,
    labelSuffix: 'Workload-Balanced',
  },
  {
    profile: 'preference-first',
    seedOffset: 251,
    labelSuffix: 'Preference-First',
  },
  { profile: 'room-efficient', seedOffset: 389, labelSuffix: 'Room-Efficient' },
  { profile: 'standard', seedOffset: 509, labelSuffix: 'Optimized' },
];

/**
 * Generates n distinct, ranked alternative timetable solutions.
 * Deduplicates identical allocations and applies different weight profiles.
 */
export function generateAlternatives(
  input: EngineInput,
  n: number = 3,
  options: SolverOptions = {},
): AlternativeResult[] {
  const count = Math.max(1, Math.min(5, n));
  const baseSeed = options.seed ?? 1001;
  const alternatives: AlternativeResult[] = [];
  const seenFingerprints = new Set<string>();

  for (let i = 0; i < count; i++) {
    const config = PROFILE_CONFIGS[i % PROFILE_CONFIGS.length]!;
    const profile =
      options.profile && i === 0 ? options.profile : config.profile;

    let seed = baseSeed + config.seedOffset;
    let solverResult = null;
    let fingerprint = '';

    // Up to 3 attempts to generate a unique alternative
    for (let attempt = 0; attempt < 3; attempt++) {
      const solver = new TimetableSolver({
        ...options,
        seed,
        profile,
      });

      const res = solver.solve(input);
      fingerprint = computeFingerprint(res.slots);

      if (!seenFingerprints.has(fingerprint) || attempt === 2) {
        solverResult = res;
        seenFingerprints.add(fingerprint);
        break;
      }
      seed += 77;
    }

    if (!solverResult) continue;

    alternatives.push({
      id: `alt_${i + 1}_${Math.random().toString(36).slice(2, 9)}`,
      versionNo: i + 1,
      label: `Alternative ${i + 1} (${config.labelSuffix})`,
      slots: solverResult.slots,
      conflicts: solverResult.violations,
      stats: solverResult.stats,
      score: solverResult.score,
      kind: 'auto',
      revision: 1,
      status: 'ready',
      profile,
    });
  }

  // Rank alternatives by score descending
  alternatives.sort((a, b) => b.score - a.score);

  // Update labels to reflect ranking
  alternatives.forEach((alt, idx) => {
    if (idx === 0) {
      alt.label = `Alternative 1 (Recommended)`;
    } else {
      alt.label = `Alternative ${idx + 1} (${alt.profile})`;
    }
    alt.versionNo = idx + 1;
  });

  return alternatives;
}

function computeFingerprint(
  slots: Array<{
    sectionId: string;
    day: number;
    period: number;
    subjectId?: string | undefined;
  }>,
): string {
  return slots
    .map((s) => `${s.sectionId}:${s.day}:${s.period}:${s.subjectId || ''}`)
    .sort()
    .join('|');
}
