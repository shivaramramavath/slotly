import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Blueprint, BlueprintSchema } from './schemas/blueprint.schema';
import {
  BlueprintTemplate,
  BlueprintTemplateSchema,
} from './schemas/blueprint-template.schema';
import {
  BlueprintHistory,
  BlueprintHistorySchema,
} from './schemas/blueprint-history.schema';
import {
  BlueprintSnapshot,
  BlueprintSnapshotSchema,
} from './schemas/blueprint-snapshot.schema';
import {
  BlueprintComment,
  BlueprintCommentSchema,
} from './schemas/blueprint-comment.schema';
import { MongoBlueprintRepository } from './repositories/mongo-blueprint.repository';
import { CachedBlueprintRepository } from './repositories/cached-blueprint.repository';
import {
  BlueprintCommentRepository,
  BlueprintHistoryRepository,
  BlueprintSnapshotRepository,
  BlueprintTemplateRepository,
} from './repositories/blueprint-auxiliary.repositories';
import { NodeTypeRegistry } from './model/node-type.registry';
import { GateChain } from './gates/gate-chain';
import { CompletionService } from './services/completion.service';
import { OperationService } from './services/operation.service';
import { ImpactAnalyzerService } from './services/impact-analyzer.service';
import { ConstraintResolverService } from './services/constraint-resolver.service';
import { ReadinessService } from './services/readiness.service';
import { RecommendationsService } from './services/recommendations.service';
import { GraphFromInstitutionBuilder } from './services/graph-from-institution.builder';
import { TemplateService } from './services/template.service';
import { BlueprintService } from './services/blueprint.service';
import { BlueprintController } from './controllers/blueprint.controller';
import { TemplateController } from './controllers/template.controller';
import { ProjectsModule } from '../projects/projects.module';
import { CacheModule } from '../../common/cache/cache.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Blueprint.name, schema: BlueprintSchema },
      { name: BlueprintTemplate.name, schema: BlueprintTemplateSchema },
      { name: BlueprintHistory.name, schema: BlueprintHistorySchema },
      { name: BlueprintSnapshot.name, schema: BlueprintSnapshotSchema },
      { name: BlueprintComment.name, schema: BlueprintCommentSchema },
    ]),
    CacheModule,
    forwardRef(() => ProjectsModule),
    forwardRef(() => UsersModule),
  ],
  controllers: [BlueprintController, TemplateController],
  providers: [
    MongoBlueprintRepository,
    CachedBlueprintRepository,
    BlueprintTemplateRepository,
    BlueprintHistoryRepository,
    BlueprintSnapshotRepository,
    BlueprintCommentRepository,
    NodeTypeRegistry,
    GateChain,
    CompletionService,
    OperationService,
    ImpactAnalyzerService,
    ConstraintResolverService,
    ReadinessService,
    RecommendationsService,
    GraphFromInstitutionBuilder,
    TemplateService,
    BlueprintService,
  ],
  exports: [
    CachedBlueprintRepository,
    NodeTypeRegistry,
    GateChain,
    CompletionService,
    OperationService,
    ImpactAnalyzerService,
    ConstraintResolverService,
    ReadinessService,
    RecommendationsService,
    GraphFromInstitutionBuilder,
    TemplateService,
    BlueprintService,
  ],
})
export class BlueprintModule {}
