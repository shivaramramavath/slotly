import {
  Controller,
  Post,
  Patch,
  Get,
  Delete,
  Body,
  Param,
  Req,
  Res,
  UseGuards,
  Inject,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import {
  RegisterDtoSchema,
  LoginDtoSchema,
  VerifyEmailDtoSchema,
  ResendEmailDtoSchema,
  ForgotPasswordDtoSchema,
  ResetPasswordDtoSchema,
  ChangePasswordDtoSchema,
  MfaVerifyDtoSchema,
  MfaRecoveryDtoSchema,
  StepUpDtoSchema,
} from '@slotly/contracts';
import type {
  RegisterDto,
  LoginDto,
  VerifyEmailDto,
  ResendEmailDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  ChangePasswordDto,
  MfaVerifyDto,
  MfaRecoveryDto,
  StepUpDto,
  SessionDto,
} from '@slotly/contracts';
import { AUTH_SERVICE } from './auth.interface';
import type { AuthService } from './auth.interface';
import { SESSIONS_SERVICE } from './services/sessions.service';
import type { SessionsService } from './services/sessions.service';
import { AuthGuard } from './guards/auth.guard';
import type { RequestUser } from './guards/auth.guard';
import { Public } from './guards/public.decorator';
import { StepUpGuard } from './guards/step-up.guard';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';

@Controller('auth')
export class AuthController {
  constructor(
    @Inject(AUTH_SERVICE) private readonly authService: AuthService,
    @Inject(SESSIONS_SERVICE) private readonly sessionsService: SessionsService,
  ) {}

  private extractMeta(req: Request) {
    return {
      ip:
        (req.headers['x-forwarded-for'] as string) ||
        req.socket.remoteAddress ||
        '127.0.0.1',
      device: (req.headers['sec-ch-ua-platform'] as string) || 'Desktop',
      browser: (req.headers['user-agent'] as string) || 'Browser',
    };
  }

  private setRefreshCookie(res: Response, token: string) {
    res.cookie('refreshToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 3600 * 1000, // 7 days
    });
  }

  private clearRefreshCookie(res: Response) {
    res.clearCookie('refreshToken', { path: '/' });
  }

  @Public()
  @Post('register')
  async register(
    @Body(new ZodValidationPipe(RegisterDtoSchema)) dto: RegisterDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const meta = this.extractMeta(req);
    const { user, accessToken, refreshToken } = await this.authService.register(
      dto,
      meta,
    );
    this.setRefreshCookie(res, refreshToken);
    return { user, accessToken };
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body(new ZodValidationPipe(LoginDtoSchema)) dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const meta = this.extractMeta(req);
    const { response, refreshToken } = await this.authService.login(dto, meta);
    if (refreshToken) {
      this.setRefreshCookie(res, refreshToken);
    }
    return response;
  }

  @UseGuards(AuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @Req() req: Request & { user: RequestUser },
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.logout(req.user.sessionId);
    this.clearRefreshCookie(res);
    return { message: 'Logged out successfully.' };
  }

  @UseGuards(AuthGuard)
  @Post('logout-all')
  @HttpCode(HttpStatus.OK)
  async logoutAll(
    @Req() req: Request & { user: RequestUser },
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.logoutAll(req.user.id);
    this.clearRefreshCookie(res);
    return { message: 'All sessions have been revoked.' };
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Body() body?: { sessionId?: string },
  ) {
    const cookies = req.cookies as Record<string, string> | undefined;
    const refreshToken = cookies?.['refreshToken'];
    if (!refreshToken) {
      throw new UnauthorizedException({
        code: 'MISSING_REFRESH_TOKEN',
        message: 'No refresh token provided.',
      });
    }

    // Access token or body may provide sessionId
    const authHeader = req.headers['authorization'];
    let sessionId: string | undefined = body?.sessionId;
    if (!sessionId && authHeader?.startsWith('Bearer ')) {
      try {
        const parts = authHeader.substring(7).split('.');
        if (parts[1]) {
          const payload = JSON.parse(
            Buffer.from(parts[1], 'base64url').toString('utf-8'),
          ) as { sid?: string };
          sessionId = payload.sid;
        }
      } catch {
        // ignore
      }
    }

    if (!sessionId) {
      throw new UnauthorizedException(
        'Session identifier required to rotate refresh token.',
      );
    }

    const rotated = await this.authService.refresh(sessionId, refreshToken);
    this.setRefreshCookie(res, rotated.refreshToken);
    return { accessToken: rotated.accessToken, user: rotated.user };
  }

  @UseGuards(AuthGuard)
  @Post('revoke')
  @HttpCode(HttpStatus.OK)
  async revoke(
    @Body('sessionId') sessionIdToRevoke: string,
    @Req() req: Request & { user: RequestUser },
  ) {
    await this.authService.revokeSession(sessionIdToRevoke, req.user.id);
    return { message: 'Session revoked.' };
  }

  @Public()
  @Post('email/verify')
  @HttpCode(HttpStatus.OK)
  async verifyEmail(
    @Body(new ZodValidationPipe(VerifyEmailDtoSchema)) dto: VerifyEmailDto,
  ) {
    return this.authService.verifyEmail(dto);
  }

  @Public()
  @Post('email/resend')
  @HttpCode(HttpStatus.OK)
  async resendEmail(
    @Body(new ZodValidationPipe(ResendEmailDtoSchema)) dto: ResendEmailDto,
  ) {
    return this.authService.resendEmailVerification(dto.email);
  }

  @Public()
  @Post('password/forgot')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(
    @Body(new ZodValidationPipe(ForgotPasswordDtoSchema))
    dto: ForgotPasswordDto,
  ) {
    return this.authService.forgotPassword(dto.email);
  }

  @Public()
  @Post('password/reset')
  @HttpCode(HttpStatus.OK)
  async resetPassword(
    @Body(new ZodValidationPipe(ResetPasswordDtoSchema)) dto: ResetPasswordDto,
  ) {
    return this.authService.resetPassword(dto);
  }

  @UseGuards(AuthGuard)
  @Patch('password')
  async changePassword(
    @Body(new ZodValidationPipe(ChangePasswordDtoSchema))
    dto: ChangePasswordDto,
    @Req() req: Request & { user: RequestUser },
  ) {
    return this.authService.changePassword(
      req.user.id,
      dto,
      req.user.sessionId,
    );
  }

  @UseGuards(AuthGuard)
  @Get('sessions')
  async listSessions(
    @Req() req: Request & { user: RequestUser },
  ): Promise<SessionDto[]> {
    const list = await this.sessionsService.listUserSessions(req.user.id);
    return list.map((s) => ({
      sessionId: s.sessionId,
      device: s.device,
      browser: s.browser,
      ip: s.ip,
      lastActiveAt: new Date(s.lastActiveAt).toISOString(),
      createdAt: new Date(s.createdAt).toISOString(),
      isCurrent: s.sessionId === req.user.sessionId,
    }));
  }

  @UseGuards(AuthGuard)
  @Get('sessions/:sessionId')
  async getSession(
    @Param('sessionId') sessionId: string,
    @Req() req: Request & { user: RequestUser },
  ) {
    const session = await this.sessionsService.validateSession(sessionId);
    if (session.userId !== req.user.id) {
      throw new UnauthorizedException('Access denied to session.');
    }
    return session;
  }

  @UseGuards(AuthGuard)
  @Delete('sessions/:sessionId')
  async revokeOneSession(
    @Param('sessionId') sessionId: string,
    @Req() req: Request & { user: RequestUser },
  ) {
    await this.authService.revokeSession(sessionId, req.user.id);
    return { message: 'Session terminated.' };
  }

  @UseGuards(AuthGuard)
  @Delete('sessions')
  async revokeOtherSessions(@Req() req: Request & { user: RequestUser }) {
    await this.sessionsService.revokeAllUserSessions(
      req.user.id,
      req.user.sessionId,
    );
    return { message: 'All other sessions have been terminated.' };
  }

  @UseGuards(AuthGuard)
  @Post('mfa/enroll')
  async enrollMfa(@Req() req: Request & { user: RequestUser }) {
    return this.authService.enrollMfa(req.user.id);
  }

  @UseGuards(AuthGuard)
  @Post('mfa/verify')
  async verifyMfa(
    @Body(new ZodValidationPipe(MfaVerifyDtoSchema)) dto: MfaVerifyDto,
    @Req() req: Request & { user: RequestUser },
  ) {
    return this.authService.verifyMfa(req.user.id, dto);
  }

  @UseGuards(AuthGuard)
  @Post('mfa/enable')
  async enableMfa(
    @Body(new ZodValidationPipe(MfaVerifyDtoSchema)) dto: MfaVerifyDto,
    @Req() req: Request & { user: RequestUser },
  ) {
    return this.authService.verifyMfa(req.user.id, dto);
  }

  @UseGuards(AuthGuard, StepUpGuard)
  @Post('mfa/disable')
  async disableMfa(@Req() req: Request & { user: RequestUser }) {
    return this.authService.disableMfa(req.user.id);
  }

  @UseGuards(AuthGuard, StepUpGuard)
  @Delete('mfa')
  async deleteMfa(@Req() req: Request & { user: RequestUser }) {
    return this.authService.disableMfa(req.user.id);
  }

  @Public()
  @Post('mfa/recovery')
  @HttpCode(HttpStatus.OK)
  async recoverMfa(
    @Body(new ZodValidationPipe(MfaRecoveryDtoSchema)) dto: MfaRecoveryDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const meta = this.extractMeta(req);
    const { response, refreshToken } = await this.authService.recoverMfa(
      dto,
      meta,
    );
    if (refreshToken) {
      this.setRefreshCookie(res, refreshToken);
    }
    return response;
  }

  @UseGuards(AuthGuard)
  @Post('step-up')
  @HttpCode(HttpStatus.OK)
  async stepUp(
    @Body(new ZodValidationPipe(StepUpDtoSchema)) dto: StepUpDto,
    @Req() req: Request & { user: RequestUser },
  ) {
    return this.authService.stepUp(req.user.sessionId, req.user.id, dto);
  }

  @Public()
  @Post('oauth/google')
  @HttpCode(HttpStatus.OK)
  async googleOAuth(
    @Body('idToken') idToken: string,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const meta = this.extractMeta(req);
    const { response, refreshToken } = await this.authService.googleOAuth(
      idToken,
      meta,
    );
    if (refreshToken) {
      this.setRefreshCookie(res, refreshToken);
    }
    return response;
  }
}
