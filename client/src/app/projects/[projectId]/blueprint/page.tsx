import { BlueprintWorkspace } from '@/features/blueprint/components/blueprint-workspace';

export default async function BlueprintPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  return <BlueprintWorkspace projectId={projectId} />;
}
