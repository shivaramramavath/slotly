import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './schemas/user.schema';
import {
  MongoUserRepository,
  USER_REPOSITORY,
} from './repositories/user.repository';
import { CachedUserRepository } from './repositories/cached-user.repository';
import { DefaultUsersService, USERS_SERVICE } from './users.service';
import { UsersSecurityController } from './users.controller';
import { CACHE_SERVICE } from '../../common/cache/cache.interface';
import type { CacheService } from '../../common/cache/cache.interface';
import { AuditLog, AuditLogSchema } from '../../common/audit/audit-log.schema';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: AuditLog.name, schema: AuditLogSchema },
    ]),
    forwardRef(() => AuthModule),
  ],
  controllers: [UsersSecurityController],
  providers: [
    MongoUserRepository,
    {
      provide: USER_REPOSITORY,
      useFactory: (mongoRepo: MongoUserRepository, cache: CacheService) => {
        return new CachedUserRepository(mongoRepo, cache);
      },
      inject: [MongoUserRepository, CACHE_SERVICE],
    },
    {
      provide: USERS_SERVICE,
      useClass: DefaultUsersService,
    },
  ],
  exports: [USER_REPOSITORY, USERS_SERVICE],
})
export class UsersModule {}
