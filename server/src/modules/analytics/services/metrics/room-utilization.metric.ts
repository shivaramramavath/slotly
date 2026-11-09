// Strategy implementation analyzing room occupancy and spatial utilization efficiency.
import { Injectable } from '@nestjs/common';
import type {
  RoomUtilizationDto,
  RoomUtilizationItem,
  AnalyticsMetricKey,
} from '@slotly/contracts';
import type {
  IAnalyticsMetric,
  MetricContext,
} from '../../interfaces/analytics-metric.interface';

/** Analyzes capacity and scheduling density for classrooms and lab facilities. */
@Injectable()
export class RoomUtilizationMetric implements IAnalyticsMetric<RoomUtilizationDto> {
  readonly key: AnalyticsMetricKey = 'room_utilization';

  calculate(context: MetricContext): RoomUtilizationDto {
    const items: RoomUtilizationItem[] = [];
    let totalUtilization = 0;

    const daysCount = context.settings.days?.length || 5;
    const periodsPerDay = context.settings.periodsPerDay || 7;
    const totalPeriodsAvailable = daysCount * periodsPerDay;

    for (const room of context.rooms) {
      const roomId =
        (room as unknown as { _id?: { toString(): string } })._id?.toString() ||
        room.id ||
        '';

      const roomEntries = context.entries.filter((e) => e.roomId === roomId);
      const occupiedPeriods = roomEntries.reduce(
        (sum, e) => sum + (e.span || 1),
        0,
      );

      const dayBreakdown: Record<string, number> = {};
      for (const d of context.settings.days || [1, 2, 3, 4, 5]) {
        dayBreakdown[String(d)] = roomEntries
          .filter((e) => e.day === d)
          .reduce((sum, e) => sum + (e.span || 1), 0);
      }

      const utilizationPercentage =
        totalPeriodsAvailable > 0
          ? Math.round((occupiedPeriods / totalPeriodsAvailable) * 1000) / 10
          : 0;

      totalUtilization += utilizationPercentage;

      items.push({
        roomId,
        roomName: room.name,
        capacity: room.capacity || 40,
        totalPeriodsAvailable,
        occupiedPeriods,
        utilizationPercentage,
        dayBreakdown,
      });
    }

    const count = items.length || 1;
    const averageUtilization = Math.round((totalUtilization / count) * 10) / 10;

    return {
      items,
      averageUtilization,
    };
  }
}
