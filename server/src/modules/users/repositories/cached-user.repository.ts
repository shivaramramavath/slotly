import { Injectable, Inject } from '@nestjs/common';
import { CACHE_SERVICE } from '../../../common/cache/cache.interface';
import type { CacheService } from '../../../common/cache/cache.interface';
import { CachedRepository } from '../../../common/database/cached.repository';
import type { User } from '../schemas/user.schema';
import type { UserRepository } from './user.repository';

@Injectable()
export class CachedUserRepository
  extends CachedRepository<User>
  implements UserRepository
{
  constructor(
    private readonly userRepo: UserRepository,
    @Inject(CACHE_SERVICE) cache: CacheService,
  ) {
    super(userRepo, cache, 'user', 3600);
  }

  async findByEmail(email: string): Promise<User | null> {
    const key = `slotly:user:email:${email.toLowerCase().trim()}`;
    return this.cache.remember<User | null>(
      key,
      3600,
      () => this.userRepo.findByEmail(email),
      ['user:all', `user:email:${email}`],
    );
  }

  async countByInstitution(institutionId?: string): Promise<number> {
    return this.userRepo.countByInstitution(institutionId);
  }

  override async update(
    id: string,
    update: Partial<User>,
  ): Promise<User | null> {
    const updated = await super.update(id, update);
    if (updated?.email) {
      await this.cache.del(
        `slotly:user:email:${updated.email.toLowerCase().trim()}`,
      );
    }
    return updated;
  }
}
