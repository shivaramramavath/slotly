'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Copy,
  ArrowRight,
  Eye,
  Check,
} from 'lucide-react';
import { AppLayout } from '@/components/layouts/app-layout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { blueprintApi } from '@/features/projects/services/blueprint.api';
import type { GraphTemplateDto } from '@slotly/contracts';

export default function BlueprintTemplatesPage() {
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [previewTemplate, setPreviewTemplate] = useState<GraphTemplateDto | null>(null);

  const { data: templates, isLoading } = useQuery({
    queryKey: ['blueprint-templates'],
    queryFn: () => blueprintApi.listTemplates(),
  });

  const duplicateMutation = useMutation({
    mutationFn: (templateId: string) => blueprintApi.duplicateTemplate(templateId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blueprint-templates'] });
    },
  });

  const allTemplates = templates || [];
  const categories = Array.from(new Set(allTemplates.map((t) => t.category)));

  const filteredTemplates =
    selectedCategory === 'all'
      ? allTemplates
      : allTemplates.filter((t) => t.category === selectedCategory);

  return (
    <AppLayout activePath="/blueprint-templates">
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-[#FAFAFA]">
              Blueprint Templates & Kits
            </h1>
            <p className="text-xs text-[#8A8A8A] font-mono">
              Pre-configured curricular kits and reusable subtrees to bootstrap academic projects instantly.
            </p>
          </div>

          <Link href="/projects/new">
            <Button variant="primary" size="sm" className="gap-1.5 font-mono text-xs">
              <Plus className="w-3.5 h-3.5" />
              <span>New Project</span>
            </Button>
          </Link>
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap items-center gap-2 p-1 bg-[#0A0A0A] border border-[#232323] rounded-md">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded text-xs font-mono transition-colors ${
              selectedCategory === 'all'
                ? 'bg-[#181818] text-[#FAFAFA] font-medium'
                : 'text-[#8A8A8A] hover:text-[#FAFAFA]'
            }`}
          >
            All Kits ({allTemplates.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded text-xs font-mono transition-colors ${
                selectedCategory === cat
                  ? 'bg-[#181818] text-[#FAFAFA] font-medium'
                  : 'text-[#8A8A8A] hover:text-[#FAFAFA]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Template Cards Grid */}
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-52 rounded-md border border-[#232323] bg-[#111] animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredTemplates.map((tpl) => {
              const nodeCount = tpl.subtree?.nodes?.length || 0;
              const edgeCount = tpl.subtree?.edges?.length || 0;

              return (
                <Card
                  key={tpl.id}
                  className="bg-[#0A0A0A] border border-[#232323] hover:border-[#8A8A8A]/40 transition-colors flex flex-col justify-between"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <Badge variant="neutral">{tpl.category}</Badge>
                      <span className="font-mono text-[11px] text-[#8A8A8A]">v{tpl.version}</span>
                    </div>
                    <CardTitle className="text-sm font-semibold text-[#FAFAFA] mt-2">
                      {tpl.name}
                    </CardTitle>
                    <CardDescription className="text-xs font-mono text-[#8A8A8A]">
                      Subtree: {nodeCount} Nodes &bull; {edgeCount} Connections
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="pt-0 space-y-4">
                    <div className="flex flex-wrap gap-1.5 py-2 border-y border-[#181818]">
                      {(tpl.subtree?.nodes || []).slice(0, 4).map((n, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#111] border border-[#232323] text-[#FAFAFA]"
                        >
                          {(n.data?.['name'] as string) || n.type}
                        </span>
                      ))}
                      {nodeCount > 4 && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono text-[#8A8A8A]">
                          +{nodeCount - 4} more
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 gap-1.5 font-mono text-xs"
                        onClick={() => setPreviewTemplate(tpl)}
                      >
                        <Eye className="w-3.5 h-3.5 text-[#FAFAFA]" />
                        <span>Inspect Subtree</span>
                      </Button>

                      <div className="flex items-center gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0"
                          title="Duplicate Kit"
                          disabled={duplicateMutation.isPending}
                          onClick={() => duplicateMutation.mutate(tpl.id)}
                        >
                          <Copy className="w-3.5 h-3.5 text-[#8A8A8A]" />
                        </Button>

                        <Link href="/projects/new">
                          <Button variant="primary" size="sm" className="h-8 gap-1 font-mono text-xs">
                            <span>Use Kit</span>
                            <ArrowRight className="w-3 h-3" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Inspect Subtree Dialog */}
        <Dialog
          open={!!previewTemplate}
          onOpenChange={(open) => {
            if (!open) setPreviewTemplate(null);
          }}
        >
          <DialogHeader>
            <DialogTitle>{previewTemplate?.name}</DialogTitle>
            <DialogDescription>
              Category: {previewTemplate?.category} &bull; Subtree Hierarchy Inspection
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 max-h-[60vh] overflow-y-auto">
            <div className="space-y-2">
              <label className="text-xs font-mono text-[#8A8A8A]">Subtree Nodes</label>
              <div className="space-y-1.5">
                {(previewTemplate?.subtree?.nodes || []).map((node, i) => (
                  <div
                    key={i}
                    className="p-2 rounded bg-[#111] border border-[#232323] flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <Badge variant="neutral" className="text-[10px] font-mono">
                        {node.type}
                      </Badge>
                      <span className="text-[#FAFAFA] font-medium">
                        {(node.data?.['name'] as string) || node.id}
                      </span>
                    </div>

                    <span className="font-mono text-[10px] text-[#8A8A8A]">
                      {node.parentId ? `Parent: ${node.parentId}` : 'Subtree Root'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-mono text-[#8A8A8A]">Subtree Connections</label>
              <div className="space-y-1.5">
                {(previewTemplate?.subtree?.edges || []).map((edge, i) => (
                  <div
                    key={i}
                    className="p-2 rounded bg-[#111] border border-[#232323] flex items-center justify-between text-xs font-mono text-[#8A8A8A]"
                  >
                    <span>{edge.source}</span>
                    <span>&rarr;</span>
                    <span className="text-[#FAFAFA]">{edge.target}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setPreviewTemplate(null)}>
              Close
            </Button>
            <Link href="/projects/new">
              <Button variant="primary" size="sm" className="gap-1.5 font-mono text-xs">
                <span>Instantiate Kit</span>
                <Check className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </DialogFooter>
        </Dialog>
      </div>
    </AppLayout>
  );
}
