// React component for page.
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

/** React component rendering periods configuration page. */
export default async function PeriodsConfigurationPage({
  params,
}: {
  params: Promise<{ versionId: string }>;
}) {
  const { versionId } = await params;

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#FAFAFA] p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Period Matrix Configuration</h1>
          <p className="text-xs text-[#8A8A8A]">Timing rules for schedule version: {versionId}</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm">Daily Periods</CardTitle>
                <CardDescription>Configure lecture hours, lab intervals, and lunch breaks</CardDescription>
              </div>
              <Badge variant="green">7 Periods Configured</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 text-xs font-mono text-[#8A8A8A]">
            <p>Period 1: 09:00 - 09:50</p>
            <p>Period 2: 09:50 - 10:40</p>
            <p>Period 3: 10:50 - 11:40</p>
            <p>Lunch Break: 11:40 - 12:20</p>
            <p>Period 4: 12:20 - 13:10</p>
            <p>Period 5: 13:10 - 14:00</p>
            <p>Period 6: 14:10 - 15:00</p>
            <p>Period 7: 15:00 - 15:50</p>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm">
            Reset to Institution Default
          </Button>
          <Button variant="primary" size="sm">
            Save Period Configuration
          </Button>
        </div>
      </div>
    </div>
  );
}
