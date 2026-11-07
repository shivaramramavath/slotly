'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  Calendar,
  Plus,
  Layout,
  Building2,
  Users,
  ArrowRight,
  Clock,
  Sparkles,
} from 'lucide-react';
import { AppLayout } from '@/components/layouts/app-layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ProjectStatusBadge } from '@/features/projects/components/project-status-badge';
import { projectsApi } from '@/features/projects/services/projects.api';
import { blueprintApi } from '@/features/projects/services/blueprint.api';

export default function HomeShellPage() {
  const { data: projectsData, isLoading: projectsLoading } = useQuery({
    queryKey: ['projects', 'home'],
    queryFn: () => projectsApi.listProjects({ limit: 4 }),
  });

  const { data: templates } = useQuery({
    queryKey: ['blueprint-templates', 'home'],
    queryFn: () => blueprintApi.listTemplates(),
  });

  const recentProjects = projectsData?.items || [];
  const totalProjects = projectsData?.total || 0;

  return (
    <AppLayout activePath="/dashboard">
      <div className="space-y-8 max-w-7xl mx-auto py-2">
        {/* Welcome Hero Banner */}
        <div className="p-6 rounded-lg bg-gradient-to-r from-[#111] to-[#0A0A0A] border border-[#232323] flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-1.5 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-[#181818] border border-[#232323] text-[#FACC15]">
              <Sparkles className="w-3 h-3 text-[#FACC15]" />
              <span>Slotly Timetable Platform</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-[#FAFAFA]">
              Academic Timetable & Blueprint Studio
            </h1>
            <p className="text-xs text-[#8A8A8A] font-mono leading-relaxed">
              Design hierarchical institution graphs, configure scheduling constraints, and run solver engines to generate conflict-free academic schedules.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/blueprint-templates">
              <Button variant="outline" size="sm" className="gap-1.5 font-mono text-xs">
                <Layout className="w-3.5 h-3.5 text-[#FAFAFA]" />
                <span>Explore Kits</span>
              </Button>
            </Link>
            <Link href="/projects/new">
              <Button variant="primary" size="sm" className="gap-1.5 font-mono text-xs">
                <Plus className="w-3.5 h-3.5" />
                <span>Create Project</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Quick Hub Navigation Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link href="/dashboard" className="block">
            <Card className="p-4 bg-[#0A0A0A] border border-[#232323] hover:border-[#FACC15]/40 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <Calendar className="w-5 h-5 text-[#FACC15]" />
                <span className="text-lg font-mono font-bold text-[#FAFAFA]">{totalProjects}</span>
              </div>
              <div className="text-xs font-semibold text-[#FAFAFA]">Projects</div>
              <div className="text-[10px] font-mono text-[#8A8A8A]">Active terms & revisions</div>
            </Card>
          </Link>

          <Link href="/institutions" className="block">
            <Card className="p-4 bg-[#0A0A0A] border border-[#232323] hover:border-[#FACC15]/40 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <Building2 className="w-5 h-5 text-[#FAFAFA]" />
                <span className="text-xs font-mono text-[#8A8A8A]">Tree</span>
              </div>
              <div className="text-xs font-semibold text-[#FAFAFA]">Institution</div>
              <div className="text-[10px] font-mono text-[#8A8A8A]">Departments & Programs</div>
            </Card>
          </Link>

          <Link href="/library" className="block">
            <Card className="p-4 bg-[#0A0A0A] border border-[#232323] hover:border-[#FACC15]/40 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <Users className="w-5 h-5 text-[#22C55E]" />
                <span className="text-xs font-mono text-[#8A8A8A]">Roster</span>
              </div>
              <div className="text-xs font-semibold text-[#FAFAFA]">Faculty & Subjects</div>
              <div className="text-[10px] font-mono text-[#8A8A8A]">Qualifications & Workload</div>
            </Card>
          </Link>

          <Link href="/blueprint-templates" className="block">
            <Card className="p-4 bg-[#0A0A0A] border border-[#232323] hover:border-[#FACC15]/40 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <Layout className="w-5 h-5 text-[#3B82F6]" />
                <span className="text-xs font-mono text-[#8A8A8A]">{templates?.length || 3} Kits</span>
              </div>
              <div className="text-xs font-semibold text-[#FAFAFA]">Starter Kits</div>
              <div className="text-[10px] font-mono text-[#8A8A8A]">School & College Subtrees</div>
            </Card>
          </Link>
        </div>

        {/* Recent Projects Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-[#FAFAFA]">Recent Academic Projects</h2>
              <p className="text-xs text-[#8A8A8A] font-mono">Terms currently in draft, ready, or building status.</p>
            </div>
            <Link href="/dashboard" className="text-xs font-mono text-[#FACC15] hover:underline flex items-center gap-1">
              <span>View All</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {projectsLoading ? (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="h-36 rounded border border-[#232323] bg-[#111] animate-pulse" />
              <div className="h-36 rounded border border-[#232323] bg-[#111] animate-pulse" />
            </div>
          ) : recentProjects.length === 0 ? (
            <Card className="p-6 bg-[#0A0A0A] border border-[#232323] text-center space-y-3">
              <Calendar className="w-8 h-8 mx-auto text-[#8A8A8A]" />
              <div className="text-xs font-mono text-[#8A8A8A]">No academic projects registered yet.</div>
              <Link href="/projects/new">
                <Button variant="primary" size="sm" className="gap-1.5 font-mono text-xs">
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Your First Project</span>
                </Button>
              </Link>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {recentProjects.map((p) => (
                <Card
                  key={p.id}
                  className="bg-[#0A0A0A] border border-[#232323] hover:border-[#8A8A8A]/40 transition-colors p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <ProjectStatusBadge status={p.status} />
                    <span className="text-[11px] font-mono text-[#8A8A8A]">
                      Rev {p.revision} &bull; {p.settings?.days?.length || 5} Days
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-[#FAFAFA]">{p.name}</h3>
                    <p className="text-xs font-mono text-[#8A8A8A]">
                      Term: {p.term?.kind?.toUpperCase()} ({p.term?.startDate} &rarr; {p.term?.endDate})
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-[#181818]">
                    <span className="text-[11px] font-mono text-[#8A8A8A] flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {p.lastOpenedAt
                        ? `Last opened ${new Date(p.lastOpenedAt).toLocaleDateString()}`
                        : 'New project'}
                    </span>

                    <div className="flex items-center gap-2">
                      <Link href={`/projects/${p.id}/settings`}>
                        <Button variant="outline" size="sm" className="h-7 text-xs font-mono">
                          Settings
                        </Button>
                      </Link>
                      <Link href={`/projects/${p.id}/blueprint`}>
                        <Button variant="primary" size="sm" className="h-7 text-xs font-mono">
                          Blueprint
                        </Button>
                      </Link>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
