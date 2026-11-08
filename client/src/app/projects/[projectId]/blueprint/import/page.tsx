// React component for page.
import Link from 'next/link';
import { ArrowLeft, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

/** React component rendering blueprint import page. */
export default async function BlueprintImportPage({
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
            <h1 className="text-xl font-bold tracking-tight">Import Academic Structure</h1>
            <p className="text-xs text-[#8A8A8A]">Bulk import structure for {projectId}</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Upload File</CardTitle>
            <CardDescription>Upload a JSON template or CSV structure</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border border-dashed border-[#232323] rounded-lg p-6 text-center cursor-pointer hover:bg-[#181818]/50">
              <Upload className="h-6 w-6 text-[#8A8A8A] mx-auto mb-2" />
              <p className="text-xs text-[#FAFAFA]">Drag and drop JSON / CSV files here</p>
              <p className="text-[11px] text-[#8A8A8A] mt-1">Must conform to topological gating rules</p>
            </div>
            <Button variant="primary" className="w-full text-xs">
              Validate &amp; Import
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
