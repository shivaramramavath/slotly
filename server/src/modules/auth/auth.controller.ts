// HTTP controller handling auth.controller endpoints.
import {
  Controller,
  Post,
  Patch,
  Get,
  Delete,
  Body,
  Param,
  Query,
  Req,
  Res,
  UseGuards,
  Inject,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
  ForbiddenException,
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
  OnboardingDtoSchema,
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
  OnboardingDto,
  OAuthProviderKey,
} from '@slotly/contracts';
import { AUTH_SERVICE } from './auth.interface';
import type { AuthService } from './auth.interface';
import { SESSIONS_SERVICE } from './services/sessions.service';
import type { SessionsService } from './services/sessions.service';
import { OAuthService } from './services/oauth.service';
import { AuthGuard } from './guards/auth.guard';
import type { RequestUser } from './guards/auth.guard';
import { Public } from './guards/public.decorator';
import { StepUpGuard } from './guards/step-up.guard';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';

/** Controller handling auth controller HTTP endpoints. */
@Controller('auth')
export class AuthController {
  constructor(
    @Inject(AUTH_SERVICE) private readonly authService: AuthService,
    @Inject(SESSIONS_SERVICE) private readonly sessionsService: SessionsService,
    private readonly oauthService: OAuthService,
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
    await this.sessionsService.revokeSession(req.user.sessionId);
    this.clearRefreshCookie(res);
    return { message: 'Logged out successfully.' };
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const rawCookies = req.headers.cookie;
    let refreshToken: string | undefined = (
      req as unknown as { cookies?: Record<string, string> }
    ).cookies?.['refreshToken'];

    if (!refreshToken && rawCookies) {
      const match = rawCookies.match(/refreshToken=([^;]+)/);
      if (match) refreshToken = match[1];
    }

    if (!refreshToken) {
      throw new UnauthorizedException({
        code: 'MISSING_REFRESH_TOKEN',
        message: 'No refresh token provided.',
      });
    }

    // Decode session ID from refresh token (format: s_${sessionId}_${random})
    const parts = refreshToken.split('_');
    if (parts.length < 3 || parts[0] !== 's') {
      throw new UnauthorizedException({
        code: 'INVALID_REFRESH_TOKEN_FORMAT',
        message: 'Malformed refresh token.',
      });
    }
    const sessionId = parts[1] as string;

    const {
      accessToken,
      refreshToken: newRefreshToken,
      session,
    } = await this.sessionsService.rotateRefreshToken(sessionId, refreshToken);

    this.setRefreshCookie(res, newRefreshToken);
    return {
      accessToken,
      user: {
        id: session.userId,
        role: session.role,
        institutionId: session.institutionId,
      },
    };
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
  async resendVerificationEmail(
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

  @UseGuards(AuthGuard, StepUpGuard)
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
    const sessions = await this.sessionsService.listUserSessions(req.user.id);
    return sessions.map((s) => ({
      sessionId: s.sessionId,
      device: s.device,
      browser: s.browser,
      ip: s.ip,
      isCurrent: s.sessionId === req.user.sessionId,
      lastActiveAt: new Date(s.lastActiveAt).toISOString(),
      createdAt: new Date(s.createdAt).toISOString(),
    }));
  }

  @UseGuards(AuthGuard)
  @Delete('sessions/:sessionId')
  async revokeSession(
    @Req() req: Request & { user: RequestUser },
    @Param('sessionId') sessionId: string,
  ) {
    if (sessionId === req.user.sessionId) {
      await this.sessionsService.revokeSession(sessionId);
      return { message: 'Current session revoked. You must log in again.' };
    }
    const userSessions = await this.sessionsService.listUserSessions(
      req.user.id,
    );
    const belongsToUser = userSessions.some((s) => s.sessionId === sessionId);
    if (!belongsToUser) {
      throw new UnauthorizedException({
        code: 'FORBIDDEN_SESSION_ACCESS',
        message: 'Cannot revoke session belonging to another user.',
      });
    }

    await this.sessionsService.revokeSession(sessionId);
    return { message: 'Session revoked successfully.' };
  }

  @UseGuards(AuthGuard)
  @Delete('sessions')
  async revokeAllOtherSessions(@Req() req: Request & { user: RequestUser }) {
    await this.sessionsService.revokeAllUserSessions(
      req.user.id,
      req.user.sessionId,
    );
    return { message: 'All other sessions have been revoked.' };
  }

  @UseGuards(AuthGuard, StepUpGuard)
  @Post('mfa/enroll')
  async enrollMfa(@Req() req: Request & { user: RequestUser }) {
    return this.authService.enrollMfa(req.user.id);
  }

  @UseGuards(AuthGuard)
  @Post('mfa/verify')
  @HttpCode(HttpStatus.OK)
  async verifyMfa(
    @Body(new ZodValidationPipe(MfaVerifyDtoSchema)) dto: MfaVerifyDto,
    @Req() req: Request & { user: RequestUser },
  ) {
    const result = await this.authService.verifyMfa(req.user.id, dto);
    await this.sessionsService.setMfaVerified(req.user.sessionId);
    return result;
  }

  @UseGuards(AuthGuard, StepUpGuard)
  @Post('mfa/disable')
  @HttpCode(HttpStatus.OK)
  async disableMfa(@Req() req: Request & { user: RequestUser }) {
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

  @UseGuards(AuthGuard)
  @Post('step-up/email/send')
  @HttpCode(HttpStatus.OK)
  async sendStepUpEmailOtp(@Req() req: Request & { user: RequestUser }) {
    return this.authService.sendStepUpEmailOtp(req.user.id);
  }

  @Public()
  @Get('oauth/providers')
  listOAuthProviders() {
    return this.oauthService.listProviders();
  }

  @Public()
  @Get('oauth/:provider/start')
  async startOAuth(
    @Param('provider') provider: string,
    @Query('mode') mode: 'login' | 'link' | undefined,
    @Query('next') next: string | undefined,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    let linkUserId: string | undefined;

    if (mode === 'link') {
      const authHeader = req.headers['authorization'];
      if (!authHeader?.startsWith('Bearer ')) {
        throw new UnauthorizedException({
          code: 'oauth_denied',
          message: 'Authentication required for linking accounts',
        });
      }
      const token = authHeader.substring(7).trim();
      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new UnauthorizedException({
          code: 'oauth_denied',
          message: 'Invalid authorization token',
        });
      }
      let payload: { sid: string; sub: string };
      try {
        const decoded = JSON.parse(
          Buffer.from(parts[1] as string, 'base64url').toString('utf8'),
        ) as Record<string, unknown>;
        payload = {
          sid: typeof decoded['sid'] === 'string' ? decoded['sid'] : '',
          sub: typeof decoded['sub'] === 'string' ? decoded['sub'] : '',
        };
      } catch {
        throw new UnauthorizedException({
          code: 'oauth_denied',
          message: 'Malformed authorization token',
        });
      }

      const session = await this.sessionsService.validateSession(payload.sid);
      const isStepUp = await this.sessionsService.isStepUpValid(
        session.sessionId,
      );
      if (!isStepUp) {
        throw new ForbiddenException({
          code: 'STEP_UP_REQUIRED',
          message: 'Step-up authentication required to link accounts',
        });
      }
      linkUserId = session.userId;
    }

    const result = await this.oauthService.start({
      provider: provider as OAuthProviderKey,
      mode: mode ?? undefined,
      next: next ?? undefined,
      userId: linkUserId ?? undefined,
    });

    res.cookie('oauth_binding', result.bindingCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 10 * 60 * 1000,
    });

    return res.redirect(result.authorizationUrl);
  }

  @Public()
  @Get('oauth/:provider/callback')
  async oAuthCallback(
    @Param('provider') provider: string,
    @Query('code') code: string,
    @Query('state') state: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const rawCookies = req.headers.cookie;
    let bindingCookie: string | undefined = (
      req as unknown as { cookies?: Record<string, string> }
    ).cookies?.['oauth_binding'];

    if (!bindingCookie && rawCookies) {
      const match = rawCookies.match(/oauth_binding=([^;]+)/);
      if (match) bindingCookie = match[1];
    }

    res.clearCookie('oauth_binding', { path: '/' });

    const meta = this.extractMeta(req);
    const result = await this.oauthService.handleCallback({
      provider: provider as OAuthProviderKey,
      code,
      state,
      bindingCookie: bindingCookie ?? undefined,
      meta,
    });

    if (result.refreshToken) {
      this.setRefreshCookie(res, result.refreshToken);
    }

    return res.redirect(result.redirectUrl);
  }

  @UseGuards(AuthGuard)
  @Post('onboarding')
  @HttpCode(HttpStatus.OK)
  async completeOnboarding(
    @Body(new ZodValidationPipe(OnboardingDtoSchema)) dto: OnboardingDto,
    @Req() req: Request & { user: RequestUser },
  ) {
    return this.oauthService.completeOnboarding(
      req.user.id,
      dto,
      req.user.sessionId,
    );
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
