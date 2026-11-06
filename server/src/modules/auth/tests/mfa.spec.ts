import { OtplibTotpAdapter } from '../adapters/totp.adapter';

describe('OtplibTotpAdapter & MFA Workflow', () => {
  let totpAdapter: OtplibTotpAdapter;

  beforeEach(() => {
    totpAdapter = new OtplibTotpAdapter();
  });

  it('should generate a valid secret, QR data URL and 8 formatted recovery codes', async () => {
    const enrollment = await totpAdapter.generateEnrollment(
      'test@slotly.dev',
      'Slotly',
    );

    expect(enrollment.secret).toBeDefined();
    expect(enrollment.secret.length).toBeGreaterThan(10);
    expect(enrollment.qrCodeUrl.startsWith('data:image/png;base64,')).toBe(
      true,
    );
    expect(enrollment.recoveryCodes).toHaveLength(8);

    // Each code matches format: XXXXX-XXXXX
    enrollment.recoveryCodes.forEach((code) => {
      expect(/^[A-F0-9]{5}-[A-F0-9]{5}$/.test(code)).toBe(true);
    });
  });

  it('should verify legitimate TOTP tokens generated with matching secret', async () => {
    const enrollment = await totpAdapter.generateEnrollment('test@slotly.dev');
    const token = totpAdapter.generateCode(enrollment.secret);

    const valid = totpAdapter.verifyCode(token, enrollment.secret);
    expect(valid).toBe(true);

    const invalid = totpAdapter.verifyCode('000000', enrollment.secret);
    expect(invalid).toBe(false);
  });

  it('should hash and verify emergency recovery codes regardless of casing or hyphens', () => {
    const rawCode = 'ABCDE-12345';
    const hash = totpAdapter.hashRecoveryCode(rawCode);

    expect(totpAdapter.verifyRecoveryCode('ABCDE-12345', hash)).toBe(true);
    expect(totpAdapter.verifyRecoveryCode('abcde12345', hash)).toBe(true);
    expect(totpAdapter.verifyRecoveryCode('WRONG-CODE1', hash)).toBe(false);
  });
});
