'use client';

interface WorkloadBarProps {
  assignedHours: number;
  maxHours: number;
  minHours?: number;
  showDetails?: boolean;
}

export function WorkloadBar({
  assignedHours,
  maxHours,
  minHours = 0,
  showDetails = true,
}: WorkloadBarProps) {
  const percentage = maxHours > 0 ? Math.round((assignedHours / maxHours) * 100) : 0;

  // Strict tokens: green within limit, yellow near, red over
  let color = '#22C55E'; // green
  let statusText = 'Normal';

  if (assignedHours > maxHours) {
    color = '#EF4444'; // red
    statusText = 'Overloaded';
  } else if (percentage >= 85) {
    color = '#FACC15'; // yellow
    statusText = 'Near Capacity';
  } else if (minHours > 0 && assignedHours < minHours) {
    color = '#8A8A8A'; // under minimum
    statusText = 'Underloaded';
  }

  const fillWidth = Math.min(100, percentage);

  return (
    <div className="space-y-1 font-mono">
      {showDetails && (
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-[#8A8A8A]">
            {assignedHours} / {maxHours} hrs
          </span>
          <span style={{ color }} className="font-medium text-[10px]">
            {percentage}% ({statusText})
          </span>
        </div>
      )}
      <div className="h-1.5 w-full bg-[#1A1A1A] rounded-full overflow-hidden border border-[#232323]">
        <div
          className="h-full transition-all duration-300 rounded-full"
          style={{
            width: `${fillWidth}%`,
            backgroundColor: color,
          }}
        />
      </div>
    </div>
  );
}
