import { AppLayout } from '@/components/layouts/app-layout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function InstitutionsPage() {
  return (
    <AppLayout activePath="/institutions">
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Institution Architecture</h1>
          <p className="text-xs text-[#8A8A8A]">
            Root organization hierarchy, working days, and default period configurations.
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Metropolitan Institute of Technology</CardTitle>
                <CardDescription>Code: MIT • 5 Working Days (Mon - Fri)</CardDescription>
              </div>
              <Badge variant="green">Configured</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 text-xs text-[#8A8A8A]">
            <p>Periods per day: 7 periods (50 mins each) + 40 min Lunch Break</p>
            <p>Departments: Computer Science &amp; Engineering, Electrical, Mechanical</p>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
