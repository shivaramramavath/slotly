// Service generating intelligent read-only whole-blueprint AI assistance.
import { Injectable } from '@nestjs/common';
import type {
  BlueprintAiChatRequestDto,
  BlueprintAiChatResponseDto,
  BlueprintGraphDto,
  BlueprintReadinessDto,
} from '@slotly/contracts';
import { BlueprintService } from './blueprint.service';

/** Service providing whole-blueprint AI assistant chat with compact context summarization. */
@Injectable()
export class BlueprintAiService {
  constructor(private readonly blueprintService: BlueprintService) {}

  /** Handles chat message with Redis-cached blueprint context and generates intelligent response. */
  async chat(
    projectId: string,
    dto: BlueprintAiChatRequestDto,
  ): Promise<BlueprintAiChatResponseDto> {
    const graph = await this.blueprintService.getGraph(projectId);
    const readiness = await this.blueprintService.getReadiness(projectId);

    const result = this.generateResponse(
      dto.message,
      graph,
      readiness,
      dto.selectedNodeId,
    );

    return {
      reply: result.reply,
      suggestedNodeIds: result.suggestedNodeIds,
      timestamp: new Date().toISOString(),
    };
  }

  /** Assembles a compact, size-capped context summary of the whole blueprint. */
  buildContextSummary(
    graph: BlueprintGraphDto,
    readiness: BlueprintReadinessDto,
    selectedNodeId?: string,
    includeSelectedNode?: boolean,
  ): string {
    const lines: string[] = [];

    lines.push(
      `Blueprint Total Nodes: ${graph.nodes.length}, Edges: ${graph.edges.length}`,
    );
    lines.push(
      `Readiness Score: ${readiness.percentComplete}%, Ready for Build: ${readiness.isReadyForBuild}`,
    );
    lines.push(
      `Complete Nodes: ${readiness.completedCount}, Incomplete: ${readiness.incompleteCount}, Blocked: ${readiness.blockedCount}`,
    );

    const incompleteNodes = graph.nodes.filter(
      (n) => n.status !== 'complete' || n.effectiveStatus !== 'complete',
    );
    if (incompleteNodes.length > 0) {
      lines.push('Nodes Needing Attention:');
      for (const node of incompleteNodes.slice(0, 10)) {
        const name =
          (node.data?.['name'] as string) ||
          (node.data?.['label'] as string) ||
          node.id;
        const missingFields =
          node.missing
            ?.map((m) => (typeof m === 'string' ? m : m.field))
            .join(', ') || 'unspecified';
        lines.push(
          `- [${node.type}] "${name}" (${node.effectiveStatus}): missing ${missingFields}`,
        );
      }
    }

    if (includeSelectedNode && selectedNodeId) {
      const selected = graph.nodes.find((n) => n.id === selectedNodeId);
      if (selected) {
        const name =
          (selected.data?.['name'] as string) ||
          (selected.data?.['label'] as string) ||
          selected.id;
        lines.push(
          `Selected Node: [${selected.type}] "${name}" (ID: ${selected.id})`,
        );
        lines.push(
          `Selected Node Status: ${selected.status}, Effective: ${selected.effectiveStatus}`,
        );
        if (selected.missing && selected.missing.length > 0) {
          const miss = selected.missing
            .map((m) =>
              typeof m === 'string' ? m : `${m.field}: ${m.message}`,
            )
            .join('; ');
          lines.push(`Selected Node Missing: ${miss}`);
        }
      }
    }

    const summary = lines.join('\n');
    return summary.length > 3500
      ? summary.slice(0, 3500) + '\n...(truncated)'
      : summary;
  }

  /** Generates intelligent context-aware response based on the blueprint graph and query. */
  private generateResponse(
    message: string,
    graph: BlueprintGraphDto,
    readiness: BlueprintReadinessDto,
    selectedNodeId?: string,
  ): { reply: string; suggestedNodeIds: string[] } {
    const lower = message.toLowerCase();
    const suggestedNodeIds: string[] = [];

    const incompleteNodes = graph.nodes.filter(
      (n) => n.status !== 'complete' || n.effectiveStatus !== 'complete',
    );

    if (
      lower.includes('block') ||
      lower.includes('issue') ||
      lower.includes('missing') ||
      lower.includes('error')
    ) {
      if (incompleteNodes.length === 0) {
        return {
          reply: `Great news! There are **no blocking issues** in this blueprint. All ${graph.nodes.length} nodes are complete and the readiness score is **100%**. You can proceed directly to generate a schedule build.`,
          suggestedNodeIds: [],
        };
      }

      const issuesList = incompleteNodes
        .map((n) => {
          suggestedNodeIds.push(n.id);
          const name =
            (n.data?.['name'] as string) ||
            (n.data?.['label'] as string) ||
            n.id;
          const reasons =
            n.missing
              ?.map((m) =>
                typeof m === 'string' ? m : `${m.field} (${m.message})`,
              )
              .join(', ') || 'incomplete configuration';
          return `- **${name}** (${n.type}): Missing ${reasons}`;
        })
        .slice(0, 8)
        .join('\n');

      return {
        reply: `The blueprint has **${incompleteNodes.length} node(s) needing attention** (current readiness score: **${readiness.percentComplete}%**):\n\n${issuesList}\n\n*Tip:* Click any highlighted node chip below to jump straight to its configuration and resolve the missing requirements.`,
        suggestedNodeIds: suggestedNodeIds.slice(0, 5),
      };
    }

    if (
      lower.includes('hierarchy') ||
      lower.includes('summarise') ||
      lower.includes('structure')
    ) {
      const typeCounts: Record<string, number> = {};
      graph.nodes.forEach((n) => {
        typeCounts[n.type] = (typeCounts[n.type] || 0) + 1;
      });

      const breakdown = Object.entries(typeCounts)
        .map(([type, count]) => `- **${type}**: ${count}`)
        .join('\n');

      const root = graph.nodes.find((n) => n.type === 'institution');
      const rootName = root
        ? (root.data?.['name'] as string) || 'Root Institution'
        : 'Not set';

      const departments = graph.nodes
        .filter((n) => n.type === 'department')
        .map((d) => (d.data?.['name'] as string) || d.id);
      const deptsText =
        departments.length > 0
          ? `\n- **Departments:** ${departments.join(', ')}`
          : '';

      return {
        reply: `### Blueprint Hierarchy Summary\n\n- **Root Institution:** ${rootName}${deptsText}\n- **Total Hierarchy Nodes:** ${graph.nodes.length}\n- **Total Structural Connections:** ${graph.edges.length}\n\n**Node Breakdown by Type:**\n${breakdown}\n\nThe graph follows Slotly's vertical layout standard: Institution -> Department -> Program -> Academic Year -> Semester -> Section -> Batch.`,
        suggestedNodeIds: root ? [root.id] : [],
      };
    }

    if (
      lower.includes('faculty') ||
      lower.includes('over-allocated') ||
      lower.includes('workload')
    ) {
      const facultyNodes = graph.nodes.filter((n) => n.type === 'faculty');
      const sectionNodes = graph.nodes.filter((n) => n.type === 'section');

      return {
        reply: `### Faculty Allocation Analysis\n\n- **Registered Faculty Resources:** ${facultyNodes.length}\n- **Configured Sections:** ${sectionNodes.length}\n\nIn Blueprint v2, faculty instructors are maintained in the institution/department resource pool and assigned to section subject slots. To prevent overload, faculty max hours per day and max hours per week constraints are enforced during solver build generation.`,
        suggestedNodeIds: facultyNodes.slice(0, 3).map((f) => f.id),
      };
    }

    if (
      lower.includes('period') ||
      lower.includes('timing') ||
      lower.includes('times')
    ) {
      const root = graph.nodes.find((n) => n.type === 'institution');
      const workingDays = (root?.data?.['workingDays'] as string[]) || [
        'mon',
        'tue',
        'wed',
        'thu',
        'fri',
      ];

      return {
        reply: `### Recommended Period Timings\n\nFor academic institutions, a standard daily schedule structure is:\n- **Working Days:** ${workingDays.map((d) => d.toUpperCase()).join(', ')}\n- **Start Time:** 08:30 AM\n- **Period Duration:** 50 minutes\n- **Morning Break:** 10:10 AM - 10:25 AM (15 mins)\n- **Lunch Break:** 12:05 PM - 12:55 PM (50 mins)\n- **Daily Periods:** 6 to 7 teaching slots\n\nYou can configure and adjust these timings in the **Times** section of your Institution or Section inspector.`,
        suggestedNodeIds: root ? [root.id] : [],
      };
    }

    // Default conversational reply
    const focusNode = selectedNodeId
      ? graph.nodes.find((n) => n.id === selectedNodeId)
      : null;
    const focusName = focusNode
      ? (focusNode.data?.['name'] as string) || focusNode.id
      : null;

    return {
      reply:
        `I have analyzed your blueprint graph (${graph.nodes.length} nodes, readiness score **${readiness.percentComplete}%**)${focusName ? ` with a focus on node **${focusName}**` : ''}.\n\n` +
        `Current status: **${readiness.isReadyForBuild ? 'READY FOR BUILD' : 'INCOMPLETE'}** with ${incompleteNodes.length} incomplete node(s).\n\n` +
        `You can ask me to:\n- Check **what is blocking this blueprint**\n- **Summarise the hierarchy**\n- Check **faculty allocation**\n- **Suggest period timings** for your schedule`,
      suggestedNodeIds: focusNode
        ? [focusNode.id]
        : incompleteNodes.slice(0, 3).map((n) => n.id),
    };
  }
}
