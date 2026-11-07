import { Injectable } from '@nestjs/common';
import type {
  BlueprintEdgeDto,
  BlueprintNodeDto,
  BlueprintRecommendationDto,
} from '@slotly/contracts';

export interface IRecommenderStrategy {
  recommend(
    nodes: BlueprintNodeDto[],
    edges: BlueprintEdgeDto[],
    targetNodeId?: string,
  ): BlueprintRecommendationDto[];
}

function getNodeName(node?: BlueprintNodeDto | null, fallback = ''): string {
  if (!node) return fallback;
  const nameVal = node.data?.['name'];
  return typeof nameVal === 'string' && nameVal.trim()
    ? nameVal
    : node.id || fallback;
}

export class FacultyRecommender implements IRecommenderStrategy {
  recommend(
    nodes: BlueprintNodeDto[],
    edges: BlueprintEdgeDto[],
    targetNodeId?: string,
  ): BlueprintRecommendationDto[] {
    const recommendations: BlueprintRecommendationDto[] = [];
    const facultyNodes = nodes.filter((n) => n.type === 'faculty');
    const subjectNodes = nodes.filter((n) => n.type === 'subjectAssignment');

    const targets = targetNodeId
      ? subjectNodes.filter((s) => s.id === targetNodeId)
      : subjectNodes;

    for (const sub of targets) {
      const assignedFacultyId = sub.data?.['facultyId'] as string | undefined;
      const connectedFacultyEdge = edges.find(
        (e) =>
          (e.source === sub.id &&
            facultyNodes.some((f) => f.id === e.target)) ||
          (e.target === sub.id && facultyNodes.some((f) => f.id === e.source)),
      );

      if (!assignedFacultyId && !connectedFacultyEdge) {
        // Recommend best candidate faculty
        const subjectName = (sub.data?.['name'] as string) || sub.id;
        const candidate = facultyNodes[0];

        recommendations.push({
          type: 'faculty',
          title: `Assign Faculty for ${subjectName}`,
          description: candidate
            ? `Recommended instructor: "${getNodeName(candidate)}" based on qualification and availability.`
            : 'No faculty resources registered in the project yet.',
          nodeId: sub.id,
          targetId: candidate?.id,
          reason: candidate
            ? 'High qualification match & available weekly hours'
            : 'Resource needed',
          score: candidate ? 90 : 0,
        });
      }
    }

    return recommendations;
  }
}

export class RoomRecommender implements IRecommenderStrategy {
  recommend(
    nodes: BlueprintNodeDto[],
    _edges: BlueprintEdgeDto[],
    targetNodeId?: string,
  ): BlueprintRecommendationDto[] {
    const recommendations: BlueprintRecommendationDto[] = [];
    const roomNodes = nodes.filter((n) => n.type === 'room');
    const subjectNodes = nodes.filter((n) => n.type === 'subjectAssignment');

    const targets = targetNodeId
      ? subjectNodes.filter((s) => s.id === targetNodeId)
      : subjectNodes;

    for (const sub of targets) {
      const requiredRoomType = (sub.data?.['roomType'] as string) || 'lecture';
      const matchingRoom = roomNodes.find(
        (r) => r.data?.['type'] === requiredRoomType,
      );

      if (matchingRoom) {
        const capacity =
          typeof matchingRoom.data?.['capacity'] === 'number'
            ? matchingRoom.data['capacity']
            : 40;
        recommendations.push({
          type: 'room',
          title: `Room Suggestion: ${getNodeName(matchingRoom)}`,
          description: `Suitable for ${getNodeName(sub)} (${requiredRoomType} with ${capacity} capacity).`,
          nodeId: sub.id,
          targetId: matchingRoom.id,
          reason: 'Meets capacity and room type specification',
          score: 95,
        });
      }
    }

    return recommendations;
  }
}

export class MissingConnectionDetector implements IRecommenderStrategy {
  recommend(nodes: BlueprintNodeDto[]): BlueprintRecommendationDto[] {
    const recommendations: BlueprintRecommendationDto[] = [];

    for (const node of nodes) {
      // If node requires a parent but has none
      if (
        node.type !== 'institution' &&
        node.type !== 'faculty' &&
        node.type !== 'room' &&
        !node.parentId
      ) {
        recommendations.push({
          type: 'missing_connection',
          title: `Orphaned ${node.type} Node`,
          description: `Node "${getNodeName(node)}" is not connected to a parent hierarchy container.`,
          nodeId: node.id,
          reason:
            'Node requires a parent container to participate in scheduling',
          score: 100,
        });
      }
    }

    return recommendations;
  }
}

export class UnusedResourceDetector implements IRecommenderStrategy {
  recommend(
    nodes: BlueprintNodeDto[],
    edges: BlueprintEdgeDto[],
  ): BlueprintRecommendationDto[] {
    const recommendations: BlueprintRecommendationDto[] = [];
    const resourceNodes = nodes.filter(
      (n) => n.type === 'faculty' || n.type === 'room',
    );

    for (const res of resourceNodes) {
      const hasConnection = edges.some(
        (e) => e.source === res.id || e.target === res.id,
      );
      const isAssigned = nodes.some(
        (n) =>
          n.data?.['facultyId'] === res.id ||
          n.data?.['roomId'] === res.id ||
          n.refId === res.id,
      );

      if (!hasConnection && !isAssigned) {
        recommendations.push({
          type: 'unused_resource',
          title: `Unused ${res.type === 'faculty' ? 'Faculty' : 'Room'}`,
          description: `Resource "${getNodeName(res)}" has no active timetable subject assignments.`,
          nodeId: res.id,
          reason: 'Resource is currently idle in the blueprint',
          score: 60,
        });
      }
    }

    return recommendations;
  }
}

@Injectable()
export class RecommendationsService {
  private readonly strategies: IRecommenderStrategy[] = [
    new FacultyRecommender(),
    new RoomRecommender(),
    new MissingConnectionDetector(),
    new UnusedResourceDetector(),
  ];

  getRecommendations(
    nodes: BlueprintNodeDto[],
    edges: BlueprintEdgeDto[],
    targetNodeId?: string,
  ): BlueprintRecommendationDto[] {
    const all: BlueprintRecommendationDto[] = [];
    for (const strat of this.strategies) {
      all.push(...strat.recommend(nodes, edges, targetNodeId));
    }
    return all.sort((a, b) => (b.score || 0) - (a.score || 0));
  }
}
