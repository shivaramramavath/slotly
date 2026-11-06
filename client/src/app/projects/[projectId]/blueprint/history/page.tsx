import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

export default async function BlueprintHistoryPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#FAFAFA] p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link href={`/projects/${projectId}/blueprint`}>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Blueprint Operation History</h1>
            <p className="text-xs text-[#8A8A8A]">Snapshot timeline and undo history for {projectId}</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Operations Timeline</CardTitle>
            <CardDescription>Topologically ordered graph changes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-xs font-mono text-[#8A8A8A]">
            <p>10:00:00 • Initial Blueprint root node created (Revision 1)</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
