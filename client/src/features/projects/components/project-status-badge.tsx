import { Badge } from '@/components/ui/badge';
import type { ProjectLifecycleStatus } from '@slotly/contracts';

export interface ProjectStatusBadgeProps {
  status: ProjectLifecycleStatus;
}

export function ProjectStatusBadge({ status }: ProjectStatusBadgeProps) {
  switch (status) {
    case 'draft':
      return <Badge variant="neutral">Draft</Badge>;
    case 'building':
      return <Badge variant="yellow">Building</Badge>;
    case 'ready':
      return <Badge variant="green">Ready</Badge>;
    case 'pending_approval':
      return <Badge variant="yellow">Pending Approval</Badge>;
    case 'published':
      return <Badge variant="green">Published</Badge>;
    case 'archived':
      return <Badge variant="neutral">Archived</Badge>;
    default:
      return <Badge variant="neutral">{status}</Badge>;
  }
}
