'use client';

import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, FileJson, Image as ImageIcon } from 'lucide-react';
import { useBlueprintStore } from '../../store/blueprint.store';
import { toast } from '@/components/ui/toast';

export function ExportDialog() {
  const isExportOpen = useBlueprintStore((s) => s.isExportOpen);
  const setIsExportOpen = useBlueprintStore((s) => s.setIsExportOpen);
  const projectId = useBlueprintStore((s) => s.projectId);
  const nodes = useBlueprintStore((s) => s.nodes);
  const edges = useBlueprintStore((s) => s.edges);
  const revision = useBlueprintStore((s) => s.revision);

  if (!isExportOpen) return null;

  const handleDownloadJson = () => {
    const payload = {
      projectId,
      revision,
      exportedAt: new Date().toISOString(),
      nodes: nodes.map((n) => ({
        id: n.id,
        type: n.data.nodeType,
        position: n.position,
        data: n.data.config,
        parentId: n.data.parentId,
      })),
      edges: edges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        type: 'hierarchy',
      })),
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `slotly-blueprint-${projectId}-rev${revision}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('JSON export downloaded');
    setIsExportOpen(false);
  };

  const handleExportSvg = () => {
    // Generate clean SVG representation of the graph
    const minX = Math.min(...nodes.map((n) => n.position.x), 0) - 50;
    const minY = Math.min(...nodes.map((n) => n.position.y), 0) - 50;
    const maxX = Math.max(...nodes.map((n) => n.position.x + 240), 800) + 50;
    const maxY = Math.max(...nodes.map((n) => n.position.y + 130), 600) + 50;

    const width = maxX - minX;
    const height = maxY - minY;

    let svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${minX} ${minY} ${width} ${height}" width="${width}" height="${height}" style="background:#0A0A0A; font-family:sans-serif;">\n`;

    // Draw edges
    edges.forEach((edge) => {
      const s = nodes.find((n) => n.id === edge.source);
      const t = nodes.find((n) => n.id === edge.target);
      if (s && t) {
        const x1 = s.position.x + 120;
        const y1 = s.position.y + 130;
        const x2 = t.position.x + 120;
        const y2 = t.position.y;
        svgContent += `  <path d="M ${x1} ${y1} C ${x1} ${(y1 + y2) / 2}, ${x2} ${(y1 + y2) / 2}, ${x2} ${y2}" stroke="#8A8A8A" stroke-width="2" fill="none" />\n`;
      }
    });

    // Draw nodes
    nodes.forEach((node) => {
      const isComplete = node.data.effectiveStatus === 'complete';
      const stroke = isComplete ? '#22C55E' : '#FACC15';
      svgContent += `  <g transform="translate(${node.position.x}, ${node.position.y})">\n`;
      svgContent += `    <rect width="240" height="130" rx="6" fill="#111111" stroke="${stroke}" stroke-width="1.5" />\n`;
      svgContent += `    <text x="15" y="25" fill="#8A8A8A" font-size="10" font-family="monospace">${node.data.nodeType.toUpperCase()}</text>\n`;
      svgContent += `    <text x="15" y="55" fill="#FAFAFA" font-size="13" font-weight="bold">${node.data.label.replace(/&/g, '&amp;')}</text>\n`;
      svgContent += `    <text x="15" y="85" fill="#8A8A8A" font-size="11" font-family="monospace">${node.data.effectiveStatus.toUpperCase()}</text>\n`;
      svgContent += `  </g>\n`;
    });

    svgContent += `</svg>`;

    const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `slotly-blueprint-${projectId}.svg`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('SVG diagram downloaded');
    setIsExportOpen(false);
  };

  return (
    <Dialog open={isExportOpen} onOpenChange={setIsExportOpen}>
      <DialogHeader>
        <div className="flex items-center gap-2 text-[#FACC15] mb-1">
          <Download className="h-5 w-5" />
          <DialogTitle className="text-sm font-semibold text-[#FAFAFA]">
            Export Blueprint Graph
          </DialogTitle>
        </div>
        <DialogDescription className="text-xs text-[#8A8A8A]">
          Download a standalone backup or vector diagram of your timetable blueprint.
        </DialogDescription>
      </DialogHeader>

      <div className="my-3 grid grid-cols-2 gap-3">
        {/* JSON Export */}
        <button
          type="button"
          onClick={handleDownloadJson}
          className="p-3 rounded-md bg-[#161616] border border-[#232323] hover:border-[#FACC15] transition-all text-left flex flex-col gap-1.5"
        >
          <div className="flex items-center gap-2 text-[#FACC15]">
            <FileJson className="h-4 w-4" />
            <span className="font-semibold text-xs text-[#FAFAFA]">JSON Definition</span>
          </div>
          <p className="text-[11px] text-[#8A8A8A]">
            Complete structure with positions and config. Ideal for version backups or re-importing.
          </p>
        </button>

        {/* SVG Vector Export */}
        <button
          type="button"
          onClick={handleExportSvg}
          className="p-3 rounded-md bg-[#161616] border border-[#232323] hover:border-[#FACC15] transition-all text-left flex flex-col gap-1.5"
        >
          <div className="flex items-center gap-2 text-[#3B82F6]">
            <ImageIcon className="h-4 w-4" />
            <span className="font-semibold text-xs text-[#FAFAFA]">SVG Vector Diagram</span>
          </div>
          <p className="text-[11px] text-[#8A8A8A]">
            Scalable vector graphic representation of the hierarchy canvas for presentations.
          </p>
        </button>
      </div>

      <DialogFooter className="flex items-center justify-end">
        <Button variant="ghost" size="sm" onClick={() => setIsExportOpen(false)}>
          Close
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
