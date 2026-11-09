// Templates and kits page component implementing sys0 layout, segmented category filter, and subtree preview.
'use client';

import * as React from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  ArrowLeft,
  AlertCircle,
  RefreshCw,
  Layers,
  Check,
} from 'lucide-react';
import { AppLayout } from '@/components/layouts/app-layout';
import { PageHeader } from '@/components/layouts/page-header';
import { SurfaceCard } from '@/components/ui/surface-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { KitCard, KitCardSkeleton } from './kit-card';
import { CategoryFilter, matchCategory } from './category-filter';
import { blueprintApi } from '@/features/projects/services/blueprint.api';
import type { GraphTemplateDto } from '@slotly/contracts';

/** React component rendering the Blueprint Templates and Kits catalog with sys0 visual styling. */
export function TemplatesPage() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Category filter state derived directly from URL search parameter
  const selectedCategory = searchParams.get('category') || 'all';
  const [previewTemplate, setPreviewTemplate] = React.useState<GraphTemplateDto | null>(null);

  const { data: templates, isLoading, isError, error, refetch } = useQuery({
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
  const rawCategories = Array.from(new Set(allTemplates.map((t) => t.category).filter(Boolean)));

  // Calculate counts per category
  const categoryCounts: Record<string, number> = {};
  for (const tpl of allTemplates) {
    categoryCounts[tpl.category] = (categoryCounts[tpl.category] || 0) + 1;
  }

  // Filter templates based on selected category
  const filteredTemplates = allTemplates.filter((t) => matchCategory(t.category, selectedCategory));

  const handleCategoryChange = (newCat: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (newCat === 'all') {
      params.delete('category');
    } else {
      params.set('category', newCat);
    }
    const queryString = params.toString();
    const newPath = queryString ? `?${queryString}` : window.location.pathname;
    router.replace(newPath, { scroll: false });
  };

  return (
    <AppLayout activePath="/blueprint-templates">
      <div className="pb-16">
        {/* Page Header: Sys0 typography and actions matching Projects */}
        <PageHeader
          title="Blueprint Templates and Kits"
          description="Pre-configured curricular kits and reusable subtrees to bootstrap academic projects instantly."
          actions={
            <>
              <Link
                href="/projects"
                className="text-xs text-[#8A8A8A] hover:text-[#FAFAFA] transition-colors inline-flex items-center gap-1.5 font-mono py-1.5 px-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Projects</span>
              </Link>
              <Link href="/projects/new">
                <Button variant="primary" size="sm" className="gap-1.5 font-mono text-xs">
                  <Plus className="h-3.5 w-3.5" />
                  <span>New project</span>
                </Button>
              </Link>
            </>
          }
          className="mb-10"
        />

        {/* Toolbar Row: 40px high segmented category filter */}
        <div className="mb-4">
          <CategoryFilter
            categories={rawCategories}
            selectedCategory={selectedCategory}
            onChange={handleCategoryChange}
            totalCount={allTemplates.length}
            categoryCounts={categoryCounts}
          />
        </div>

        {/* Templates Grid Viewport */}
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <KitCardSkeleton key={i} />
            ))}
          </div>
        ) : isError ? (
          <SurfaceCard className="p-8 text-center items-center justify-center min-h-[300px]">
            <AlertCircle className="w-10 h-10 text-[#EF4444] mb-3" />
            <h3 className="text-base font-semibold text-[#FAFAFA] mb-1">
              Failed to load blueprint templates
            </h3>
            <p className="text-xs font-mono text-[#8A8A8A] max-w-md mb-6">
              {(error as Error)?.message || 'An unexpected error occurred while communicating with the server.'}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="gap-1.5 font-mono text-xs"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </Button>
          </SurfaceCard>
        ) : filteredTemplates.length === 0 ? (
          <SurfaceCard className="p-10 text-center items-center justify-center min-h-[300px]">
            <div className="h-12 w-12 rounded-2xl bg-[#181818] border border-[#232323] flex items-center justify-center text-[#8A8A8A] mb-4">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-medium text-[#FAFAFA] mb-1.5 tracking-tight">
              No template kits found
            </h3>
            <p className="text-xs font-mono text-[#8A8A8A] max-w-md mb-2">
              No curricular kits match the selected category filter.
            </p>
            {selectedCategory !== 'all' && (
              <button
                type="button"
                onClick={() => handleCategoryChange('all')}
                className="text-xs font-mono text-[#8A8A8A] hover:text-[#FAFAFA] underline cursor-pointer mt-2"
              >
                Clear filter
              </button>
            )}
          </SurfaceCard>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredTemplates.map((tpl) => (
              <KitCard
                key={tpl.id}
                template={tpl}
                onInspect={(t) => setPreviewTemplate(t)}
                onDuplicate={(t) => duplicateMutation.mutate(t.id)}
                isDuplicatePending={duplicateMutation.isPending}
              />
            ))}
          </div>
        )}

        {/* Inspect Subtree Dialog */}
        <Dialog
          open={!!previewTemplate}
          onOpenChange={(open) => {
            if (!open) setPreviewTemplate(null);
          }}
        >
          <div className="p-1">
            <DialogHeader>
              <DialogTitle className="text-lg font-medium text-[#FAFAFA]">
                {previewTemplate?.name}
              </DialogTitle>
              <DialogDescription className="text-xs font-mono text-[#8A8A8A]">
                Category: {previewTemplate?.category} &bull; Subtree Hierarchy Inspection
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
              <div className="space-y-2">
                <label className="text-xs font-mono text-[#8A8A8A]">Subtree Nodes</label>
                <div className="space-y-1.5">
                  {(previewTemplate?.subtree?.nodes || []).map((node, i) => (
                    <div
                      key={i}
                      className="p-2.5 rounded-[12px] bg-[#111111] border border-[#232323] flex items-center justify-between text-xs"
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
                      className="p-2.5 rounded-[12px] bg-[#111111] border border-[#232323] flex items-center justify-between text-xs font-mono text-[#8A8A8A]"
                    >
                      <span>{edge.source}</span>
                      <span>&rarr;</span>
                      <span className="text-[#FAFAFA]">{edge.target}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                variant="outline"
                size="sm"
                className="rounded-[12px] h-8 font-mono text-xs"
                onClick={() => setPreviewTemplate(null)}
              >
                Close
              </Button>
              <Link href={previewTemplate ? `/projects/new?templateId=${encodeURIComponent(previewTemplate.id)}` : '/projects/new'}>
                <Button variant="outline" size="sm" className="rounded-[12px] h-8 gap-1.5 font-mono text-xs text-[#FAFAFA] border-[#232323] hover:border-[#383838]">
                  <span>Instantiate Kit</span>
                  <Check className="w-3.5 h-3.5 text-[#22C55E]" />
                </Button>
              </Link>
            </DialogFooter>
          </div>
        </Dialog>
      </div>
    </AppLayout>
  );
}
