// Core implementation for engine.module in server/src/modules/engine.
import { Module, forwardRef } from '@nestjs/common';
import { CacheModule } from '../../common/cache/cache.module';
import { BlueprintModule } from '../blueprint/blueprint.module';
import { ProjectsModule } from '../projects/projects.module';
import { UsersModule } from '../users/users.module';
import { EngineValidationService } from './services/engine-validation.service';
import { EngineController } from './controllers/engine.controller';

/** Class implementing engine module. */
@Module({
  imports: [
    CacheModule,
    forwardRef(() => BlueprintModule),
    forwardRef(() => ProjectsModule),
    forwardRef(() => UsersModule),
  ],
  controllers: [EngineController],
  providers: [EngineValidationService],
  exports: [EngineValidationService],
})
export class EngineModule {}
