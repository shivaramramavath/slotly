import { RedisOtpService } from '../services/otp.service';
import { InMemoryCacheService } from '../../../common/cache/in-memory-cache.service';
import { BadRequestException } from '@nestjs/common';

describe('RedisOtpService', () => {
  let otpService: RedisOtpService;
  let cache: InMemoryCacheService;

  beforeEach(() => {
    cache = new InMemoryCacheService();
    otpService = new RedisOtpService(cache);
  });

  afterEach(() => {
    cache.clear();
  });

  it('should generate a 6-digit OTP code and verify it successfully', async () => {
    const email = 'user@institution.edu';
    const code = await otpService.createOtp(email, 'verify_email', 600, 60);

    expect(code).toHaveLength(6);
    expect(/^\d{6}$/.test(code)).toBe(true);

    const verified = await otpService.verifyOtp(email, 'verify_email', code);
    expect(verified).toBe(true);

    // Single-use: subsequent verification attempt should fail because it was deleted
    await expect(
      otpService.verifyOtp(email, 'verify_email', code),
    ).rejects.toThrow(BadRequestException);
  });

  it('should enforce resend cooldown before allowing another code', async () => {
    const email = 'cooldown@institution.edu';
    await otpService.createOtp(email, 'verify_email', 600, 60);

    // Requesting immediately again should trigger OTP_COOLDOWN
    await expect(
      otpService.createOtp(email, 'verify_email', 600, 60),
    ).rejects.toThrow(BadRequestException);
  });

  it('should invalidate after exceeding max attempts', async () => {
    const email = 'attempts@institution.edu';
    const code = await otpService.createOtp(email, 'verify_email', 600, 0);

    // 5 bad attempts
    for (let i = 0; i < 5; i++) {
      try {
        await otpService.verifyOtp(email, 'verify_email', '000000');
      } catch (err) {
        expect(err).toBeInstanceOf(BadRequestException);
      }
    }

    // 6th attempt should fail with max attempts exceeded or expired
    await expect(
      otpService.verifyOtp(email, 'verify_email', code),
    ).rejects.toThrow(BadRequestException);
  });
});
