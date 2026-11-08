// NestJS module configuring timetable public sharing and resolution.
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Share, ShareSchema } from './schemas/share.schema';
import { ShareRepository } from './repositories/share.repository';
import { SharesService } from './services/shares.service';
import { SharesController } from './controllers/shares.controller';
import { PublicSharesController } from './controllers/public-shares.controller';
import { ViewerModule } from '../viewer/viewer.module';
import { ProjectsModule } from '../projects/projects.module';
import { AuthModule } from '../auth/auth.module';
import { AuditModule } from '../../common/audit/audit.module';

/** Module providing share links, token hashing, and public timetable viewing. */
@Module({
  imports: [
    MongooseModule.forFeature([{ name: Share.name, schema: ShareSchema }]),
    ViewerModule,
    ProjectsModule,
    AuthModule,
    AuditModule,
  ],
  controllers: [SharesController, PublicSharesController],
  providers: [ShareRepository, SharesService],
  exports: [SharesService, ShareRepository],
})
export class SharesModule {}
