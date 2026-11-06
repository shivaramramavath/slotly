import { AppLayout } from '@/components/layouts/app-layout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function NewProjectPage() {
  return (
    <AppLayout activePath="/dashboard">
      <div className="max-w-xl mx-auto space-y-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Create Academic Project</h1>
          <p className="text-xs text-[#8A8A8A]">
            Initialize a new term timetable. A draft visual blueprint will be provisioned.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Project Details</CardTitle>
            <CardDescription>Specify the academic term and target institution.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#8A8A8A]">Term / Project Name</label>
              <Input placeholder="e.g. Spring 2027 Schedule" required />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#8A8A8A]">Academic Year Label</label>
              <Input placeholder="2026-2027" required />
            </div>
          </CardContent>
          <CardFooter className="justify-end gap-2">
            <Button variant="outline" size="sm">
              Cancel
            </Button>
            <Button variant="primary" size="sm">
              Create &amp; Launch Designer
            </Button>
          </CardFooter>
        </Card>
      </div>
    </AppLayout>
  );
}
