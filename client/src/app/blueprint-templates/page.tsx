import { AppLayout } from '@/components/layouts/app-layout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function BlueprintTemplatesPage() {
  const templates = [
    {
      id: 'tpl_engineering_semester',
      name: 'Engineering Standard Semester',
      category: 'Higher Education',
      nodeCount: 16,
    },
    {
      id: 'tpl_lab_heavy',
      name: 'Polytechnic Lab-Centric Subtree',
      category: 'Technical',
      nodeCount: 12,
    },
  ];

  return (
    <AppLayout activePath="/blueprint-templates">
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Blueprint Templates</h1>
          <p className="text-xs text-[#8A8A8A]">
            Reusable subtrees and academic structures to bootstrap projects without manual graphing.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {templates.map((tpl) => (
            <Card key={tpl.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Badge variant="neutral">{tpl.category}</Badge>
                  <span className="font-mono text-xs text-[#8A8A8A]">{tpl.nodeCount} Nodes</span>
                </div>
                <CardTitle className="text-sm mt-2">{tpl.name}</CardTitle>
                <CardDescription>Ready to instantiate under a matching parent node.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" size="sm">
                  Preview Template
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
