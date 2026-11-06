import {
  RegisterDto,
  LoginDto,
  AuthResponse,
  VerifyEmailDto,
  ResetPasswordDto,
  ChangePasswordDto,
  MfaEnrollResponse,
  MfaVerifyDto,
  MfaRecoveryDto,
  StepUpDto,
  UserDto,
} from '@slotly/contracts';

export const AUTH_SERVICE = Symbol('AUTH_SERVICE');

export interface ClientMeta {
  ip?: string | undefined;
  device?: string | undefined;
  browser?: string | undefined;
}

export interface AuthService {
  register(
    dto: RegisterDto,
    meta: ClientMeta,
  ): Promise<{ user: UserDto; accessToken: string; refreshToken: string }>;
  login(
    dto: LoginDto,
    meta: ClientMeta,
  ): Promise<{ response: AuthResponse; refreshToken?: string | undefined }>;
  logout(sessionId: string): Promise<void>;
  logoutAll(userId: string): Promise<void>;
  refresh(
    sessionId: string,
    refreshToken: string,
  ): Promise<{ accessToken: string; refreshToken: string; user: UserDto }>;
  revokeSession(sessionIdToRevoke: string, actorUserId: string): Promise<void>;
  verifyEmail(dto: VerifyEmailDto): Promise<{ message: string }>;
  resendEmailVerification(email: string): Promise<{ message: string }>;
  forgotPassword(email: string): Promise<{ message: string }>;
  resetPassword(dto: ResetPasswordDto): Promise<{ message: string }>;
  changePassword(
    userId: string,
    dto: ChangePasswordDto,
    currentSessionId?: string,
  ): Promise<{ message: string }>;
  enrollMfa(userId: string): Promise<MfaEnrollResponse>;
  verifyMfa(userId: string, dto: MfaVerifyDto): Promise<{ message: string }>;
  disableMfa(userId: string): Promise<{ message: string }>;
  recoverMfa(
    dto: MfaRecoveryDto,
    meta: ClientMeta,
  ): Promise<{ response: AuthResponse; refreshToken?: string | undefined }>;
  stepUp(
    sessionId: string,
    userId: string,
    dto: StepUpDto,
  ): Promise<{ success: boolean; validUntil: string }>;
  googleOAuth(
    idToken: string,
    meta: ClientMeta,
  ): Promise<{ response: AuthResponse; refreshToken?: string | undefined }>;
}
