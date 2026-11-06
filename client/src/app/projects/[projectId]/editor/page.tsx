import Link from 'next/link';
import { ArrowLeft, Table, Sliders } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default async function StudioEditorPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;

  return (
    <div className="min-h-screen flex flex-col bg-[#0A0A0A] text-[#FAFAFA]">
      <header className="h-12 border-b border-[#232323] px-4 flex items-center justify-between bg-[#111111]">
        <div className="flex items-center gap-3">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-semibold text-[#FAFAFA]">{projectId}</span>
            <span className="text-[#8A8A8A]">/</span>
            <span className="text-xs text-[#8A8A8A]">Timetable Studio Grid</span>
          </div>
          <Badge variant="yellow">REVISION 1</Badge>
        </div>

        <div className="flex items-center gap-2">
          <Link href={`/projects/${projectId}/blueprint`}>
            <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5">
              <Sliders className="h-3.5 w-3.5" />
              <span>Blueprint Graph</span>
            </Button>
          </Link>
          <Button variant="primary" size="sm" className="h-7 text-xs">
            Publish Version
          </Button>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center p-8">
        <div className="max-w-md w-full border border-dashed border-[#232323] rounded-lg p-8 text-center bg-[#111111]/40">
          <Table className="h-8 w-8 text-[#8A8A8A] mx-auto mb-3" />
          <h2 className="text-sm font-semibold text-[#FAFAFA]">Timetable Grid Studio</h2>
          <p className="mt-1 text-xs text-[#8A8A8A] leading-relaxed">
            Phase 10/11 will mount the interactive dnd-kit timetable matrix with write-behind persistence.
          </p>
        </div>
      </div>
    </div>
  );
}
