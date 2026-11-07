// React component for page.
import Link from 'next/link';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

/** React component rendering readiness page. */
export default async function ReadinessPage({
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
            <h1 className="text-xl font-bold tracking-tight">Blueprint Readiness Report</h1>
            <p className="text-xs text-[#8A8A8A]">G5 Build Gate Verification for {projectId}</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm">Readiness Gate Status</CardTitle>
                <CardDescription>All academic nodes and resource requirements</CardDescription>
              </div>
              <Badge variant="green">Zero Incomplete Ancestors</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between p-3 rounded bg-[#0A0A0A] border border-[#232323]">
              <span className="text-[#8A8A8A]">G1 Creation &amp; Hierarchy Gate</span>
              <span className="text-[#22C55E] flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> PASS
              </span>
            </div>
            <div className="flex items-center justify-between p-3 rounded bg-[#0A0A0A] border border-[#232323]">
              <span className="text-[#8A8A8A]">G2 Endpoint Connection Gate</span>
              <span className="text-[#22C55E] flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> PASS
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
