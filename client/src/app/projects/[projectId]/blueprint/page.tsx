// React component for page.
import { BlueprintWorkspace } from '@/features/blueprint/components/blueprint-workspace';

/** React component rendering blueprint page. */
export default async function BlueprintPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  return <BlueprintWorkspace projectId={projectId} />;
}
