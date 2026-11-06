import {
  Controller,
  Get,
  Delete,
  Param,
  UseGuards,
  Req,
  Inject,
} from '@nestjs/common';
import { USERS_SERVICE } from './users.service';
import type { UsersService } from './users.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import type { RequestUser } from '../auth/guards/auth.guard';
import type { Request } from 'express';

@Controller('users/me/security')
@UseGuards(AuthGuard)
export class UsersSecurityController {
  constructor(
    @Inject(USERS_SERVICE) private readonly usersService: UsersService,
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
}
