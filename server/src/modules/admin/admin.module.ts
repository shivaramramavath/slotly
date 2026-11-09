// NestJS module configuring administrative user management, system health, and audit endpoints.
import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AdminUsersController } from './controllers/admin-users.controller';
import { AdminRolesController } from './controllers/admin-roles.controller';
import { AdminTimetablesController } from './controllers/admin-timetables.controller';
import { AdminSystemController } from './controllers/admin-system.controller';
import { AdminAuditController } from './controllers/admin-audit.controller';
import { AdminUsersService } from './services/admin-users.service';
import { AdminTimetablesService } from './services/admin-timetables.service';
import { AdminSystemService } from './services/admin-system.service';
import { UsersModule } from '../users/users.module';
import { AuthModule } from '../auth/auth.module';
import { ProjectsModule } from '../projects/projects.module';
import { BuildsModule } from '../builds/builds.module';
import { AuditModule } from '../../common/audit/audit.module';

/** NestJS module packaging administrative features, security controls, and health monitoring. */
@Module({
  imports: [
    UsersModule,
    AuthModule,
    ProjectsModule,
    BuildsModule,
    AuditModule,
    BullModule.registerQueue(
      { name: 'builds' },
      { name: 'exports' },
      { name: 'notifications' },
      { name: 'analytics' },
      { name: 'audit' },
      { name: 'blueprint-write' },
    ),
  ],
  controllers: [
    AdminUsersController,
    AdminRolesController,
    AdminTimetablesController,
    AdminSystemController,
    AdminAuditController,
  ],
  providers: [AdminUsersService, AdminTimetablesService, AdminSystemService],
  exports: [AdminUsersService, AdminTimetablesService, AdminSystemService],
})
export class AdminModule {}
