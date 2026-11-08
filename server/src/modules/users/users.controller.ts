// HTTP controller handling users.controller endpoints.
import {
  Controller,
  Get,
  Delete,
  Param,
  UseGuards,
  Req,
  Inject,
} from '@nestjs/common';
import type { Request } from 'express';
import type { OAuthProviderKey } from '@slotly/contracts';
import { USERS_SERVICE } from './users.service';
import type { UsersService } from './users.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import type { RequestUser } from '../auth/guards/auth.guard';
import { PermissionsGuard } from '../../common/rbac/permissions.guard';
import { StepUpGuard } from '../auth/guards/step-up.guard';
import { OAuthService } from '../auth/services/oauth.service';

/** Controller handling users security controller HTTP endpoints. */
@Controller('users/me/security')
@UseGuards(AuthGuard, PermissionsGuard)
export class UsersSecurityController {
  constructor(
    @Inject(USERS_SERVICE) private readonly usersService: UsersService,
    private readonly oauthService: OAuthService,
  ) {}

  @Get()
  async getOverview(@Req() req: Request & { user: RequestUser }) {
    return this.usersService.getSecurityOverview(req.user.id);
  }

  @Get('activity')
  async getActivity(@Req() req: Request & { user: RequestUser }) {
    return this.usersService.getSecurityActivity(req.user.id);
  }

  @Get('devices')
  async getDevices(@Req() req: Request & { user: RequestUser }) {
    return this.usersService.getDevices(req.user.id);
  }

  @Delete('devices/:deviceId')
  async removeDevice(
    @Req() req: Request & { user: RequestUser },
    @Param('deviceId') deviceId: string,
  ) {
    return this.usersService.removeDevice(req.user.id, deviceId);
  }

  @Get('connections')
  async getConnections(@Req() req: Request & { user: RequestUser }) {
    return this.oauthService.getConnections(req.user.id);
  }

  @UseGuards(StepUpGuard)
  @Delete('connections/:provider')
  async unlinkConnection(
    @Req() req: Request & { user: RequestUser },
    @Param('provider') provider: string,
  ) {
    return this.oauthService.unlinkConnection(
      req.user.id,
      provider as OAuthProviderKey,
    );
  }
}
