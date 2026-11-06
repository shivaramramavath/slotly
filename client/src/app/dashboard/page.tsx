import Link from 'next/link';
import { Calendar, Plus } from 'lucide-react';
import { AppLayout } from '@/components/layouts/app-layout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';

export default function DashboardPage() {
  const projects = [
    {
      id: 'proj_fall_2026',
      name: 'Fall 2026 Academic Term',
      institution: 'Metropolitan Institute of Technology',
      status: 'draft' as const,
      nodesCount: 42,
    },
  ];

  return (
    <AppLayout activePath="/dashboard">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Academic Projects</h1>
            <p className="text-xs text-[#8A8A8A]">
              Timetable terms, visual blueprint models, and schedule revisions.
            </p>
          </div>
          <Link href="/projects/new">
            <Button variant="primary" size="sm" className="gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              <span>New Project</span>
            </Button>
          </Link>
        </div>

        {projects.length === 0 ? (
          <EmptyState
            icon={<Calendar className="h-8 w-8" />}
            title="No projects created yet"
            description="Create your first academic term to begin designing the structure in the visual canvas."
            action={
              <Link href="/projects/new">
                <Button variant="primary" size="sm">
                  Create Project
                </Button>
              </Link>
            }
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((proj) => (
              <Card key={proj.id} className="hover:border-[#8A8A8A]/30 transition-colors">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <Badge variant="yellow">{proj.status.toUpperCase()}</Badge>
                    <span className="font-mono text-[11px] text-[#8A8A8A]">
                      {proj.nodesCount} Nodes
                    </span>
                  </div>
                  <CardTitle className="text-base mt-2">{proj.name}</CardTitle>
                  <CardDescription>{proj.institution}</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center gap-2 pt-0">
                  <Link href={`/projects/${proj.id}/blueprint`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full">
                      Blueprint Canvas
                    </Button>
                  </Link>
                  <Link href={`/projects/${proj.id}/editor`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full">
                      Studio Grid
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
