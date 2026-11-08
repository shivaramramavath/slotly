// Core implementation for projects.module in server/src/modules/projects.
import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Project, ProjectSchema } from './schemas/project.schema';
import { MongoProjectRepository } from './repositories/mongo-project.repository';
import { CachedProjectRepository } from './repositories/cached-project.repository';
import { ProjectsService } from './services/projects.service';
import { ProjectsController } from './controllers/projects.controller';
import { BlueprintModule } from '../blueprint/blueprint.module';
import { InstitutionsModule } from '../institutions/institutions.module';
import { CacheModule } from '../../common/cache/cache.module';
import { AppQueueModule } from '../../common/queue/queue.module';
import { AuditModule } from '../../common/audit/audit.module';
import { UsersModule } from '../users/users.module';

/** Class implementing projects module. */
@Module({
  imports: [
    MongooseModule.forFeature([{ name: Project.name, schema: ProjectSchema }]),
    CacheModule,
    AppQueueModule,
    AuditModule,
    forwardRef(() => BlueprintModule),
    InstitutionsModule,
    forwardRef(() => UsersModule),
  ],
  controllers: [ProjectsController],
  providers: [MongoProjectRepository, CachedProjectRepository, ProjectsService],
  exports: [CachedProjectRepository, ProjectsService],
})
export class ProjectsModule {}
