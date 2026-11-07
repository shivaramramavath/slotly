// Domain service orchestrating auth.api business logic.
import { apiClient, setAccessToken } from '@/lib/api-client';
import type {
  RegisterDto,
  LoginDto,
  AuthResponse,
  VerifyEmailDto,
  ResendEmailDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  ChangePasswordDto,
  MfaEnrollResponse,
  MfaVerifyDto,
  MfaRecoveryDto,
  StepUpDto,
  SessionDto,
  DeviceDto,
  SecurityActivityDto,
} from '@slotly/contracts';

/** Interface defining structure for security overview. */
export interface SecurityOverview {
  email: string;
  isEmailVerified: boolean;
  mfaEnabled: boolean;
  activeSessionsCount: number;
  devicesCount: number;
}

/** Constant representing auth api. */
export const authApi = {
  async register(dto: RegisterDto): Promise<AuthResponse> {
    const res = await apiClient<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
    if (res.accessToken) {
      setAccessToken(res.accessToken);
    }
    return res;
  },

  async login(dto: LoginDto): Promise<AuthResponse> {
    const res = await apiClient<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
    if (res.accessToken) {
      setAccessToken(res.accessToken);
    }
    return res;
  },

  async logout(): Promise<{ message: string }> {
    const res = await apiClient<{ message: string }>('/auth/logout', {
      method: 'POST',
    });
    setAccessToken(null);
    return res;
  },

  async logoutAll(): Promise<{ message: string }> {
    const res = await apiClient<{ message: string }>('/auth/logout-all', {
      method: 'POST',
    });
    setAccessToken(null);
    return res;
  },

  async refresh(): Promise<AuthResponse> {
    const res = await apiClient<AuthResponse>('/auth/refresh', {
      method: 'POST',
    });
    if (res.accessToken) {
      setAccessToken(res.accessToken);
    }
    return res;
  },

  async verifyEmail(dto: VerifyEmailDto): Promise<{ message: string }> {
    return apiClient<{ message: string }>('/auth/email/verify', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  },

  async resendEmail(dto: ResendEmailDto): Promise<{ message: string }> {
    return apiClient<{ message: string }>('/auth/email/resend', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  },

  async forgotPassword(dto: ForgotPasswordDto): Promise<{ message: string }> {
    return apiClient<{ message: string }>('/auth/password/forgot', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  },

  async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
    return apiClient<{ message: string }>('/auth/password/reset', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  },

  async changePassword(dto: ChangePasswordDto): Promise<{ message: string }> {
    return apiClient<{ message: string }>('/auth/password', {
      method: 'PATCH',
      body: JSON.stringify(dto),
    });
  },

  async getSessions(): Promise<SessionDto[]> {
    return apiClient<SessionDto[]>('/auth/sessions');
  },

  async revokeSession(sessionId: string): Promise<{ message: string }> {
    return apiClient<{ message: string }>(`/auth/sessions/${sessionId}`, {
      method: 'DELETE',
    });
  },

  async enrollMfa(): Promise<MfaEnrollResponse> {
    return apiClient<MfaEnrollResponse>('/auth/mfa/enroll', {
      method: 'POST',
    });
  },

  async verifyMfa(dto: MfaVerifyDto): Promise<{ message?: string; accessToken?: string; user?: AuthResponse['user'] }> {
    const res = await apiClient<{ message?: string; accessToken?: string; user?: AuthResponse['user'] }>(
      '/auth/mfa/verify',
      {
        method: 'POST',
        body: JSON.stringify(dto),
      },
    );
    if (res.accessToken) {
      setAccessToken(res.accessToken);
    }
    return res;
  },

  async recoveryMfa(dto: MfaRecoveryDto): Promise<{ accessToken: string; user: AuthResponse['user'] }> {
    const res = await apiClient<{ accessToken: string; user: AuthResponse['user'] }>('/auth/mfa/recovery', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
    if (res.accessToken) {
      setAccessToken(res.accessToken);
    }
    return res;
  },

  async disableMfa(): Promise<{ message: string }> {
    return apiClient<{ message: string }>('/auth/mfa', {
      method: 'DELETE',
    });
  },

  async stepUp(dto: StepUpDto): Promise<{ success: boolean; validUntil: string }> {
    return apiClient<{ success: boolean; validUntil: string }>('/auth/step-up', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  },

  async getSecurityOverview(): Promise<SecurityOverview> {
    return apiClient<SecurityOverview>('/users/me/security');
  },

  async getSecurityActivity(): Promise<SecurityActivityDto[]> {
    return apiClient<SecurityActivityDto[]>('/users/me/security/activity');
  },

  async getDevices(): Promise<DeviceDto[]> {
    return apiClient<DeviceDto[]>('/users/me/security/devices');
  },

  async removeDevice(deviceId: string): Promise<{ message: string }> {
    return apiClient<{ message: string }>(`/users/me/security/devices/${deviceId}`, {
      method: 'DELETE',
    });
  },
};
