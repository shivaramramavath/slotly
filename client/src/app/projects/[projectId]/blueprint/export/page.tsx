import Link from 'next/link';
import { ArrowLeft, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

export default async function BlueprintExportPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#FAFAFA] p-8">
      <div className="max-w-xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link href={`/projects/${projectId}/blueprint`}>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Export Blueprint</h1>
            <p className="text-xs text-[#8A8A8A]">Export graph architecture for {projectId}</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Available Formats</CardTitle>
            <CardDescription>Select export format for blueprint data</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-start gap-2 text-xs">
              <Download className="h-4 w-4" /> Export as JSON Schema
            </Button>
            <Button variant="outline" className="w-full justify-start gap-2 text-xs">
              <Download className="h-4 w-4" /> Export as SVG Vector Diagram
            </Button>
            <Button variant="outline" className="w-full justify-start gap-2 text-xs">
              <Download className="h-4 w-4" /> Export as PNG Image
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
