// Strategy implementation analyzing timetable density and period-by-period load distribution.
import { Injectable } from '@nestjs/common';
import type {
  PeriodUtilizationDto,
  PeriodUtilizationItem,
  AnalyticsMetricKey,
} from '@slotly/contracts';
import type {
  IAnalyticsMetric,
  MetricContext,
} from '../../interfaces/analytics-metric.interface';

/** Measures distribution of scheduled classes across teaching periods throughout the day. */
@Injectable()
export class PeriodUtilizationMetric implements IAnalyticsMetric<PeriodUtilizationDto> {
  readonly key: AnalyticsMetricKey = 'period_utilization';

  calculate(context: MetricContext): PeriodUtilizationDto {
    const items: PeriodUtilizationItem[] = [];
    const periodsPerDay = context.settings.periodsPerDay || 7;
    const days = context.settings.days || [1, 2, 3, 4, 5];
    const totalPossiblePerPeriod = days.length * (context.sections.length || 1);

    let maxOccupied = -1;
    let peakPeriod: number | undefined;

    for (let p = 1; p <= periodsPerDay; p++) {
      const activeEntries = context.entries.filter(
        (e) => e.startPeriod <= p && e.startPeriod + (e.span || 1) > p,
      );
      const totalOccupied = activeEntries.length;

      if (totalOccupied > maxOccupied) {
        maxOccupied = totalOccupied;
        peakPeriod = p;
      }

      const dayBreakdown: Record<string, number> = {};
      for (const d of days) {
        dayBreakdown[String(d)] = activeEntries.filter(
          (e) => e.day === d,
        ).length;
      }

      const utilizationPercentage =
        totalPossiblePerPeriod > 0
          ? Math.round((totalOccupied / totalPossiblePerPeriod) * 1000) / 10
          : 0;

      items.push({
        periodNumber: p,
        periodName: `Period ${p}`,
        totalOccupied,
        utilizationPercentage,
        dayBreakdown,
      });
    }

    return {
      items,
      peakPeriod,
    };
  }
}
