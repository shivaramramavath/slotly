// Core implementation for totp.adapter in server/src/modules/auth/adapters.
import { Injectable } from '@nestjs/common';
import * as QRCode from 'qrcode';
import { randomBytes, createHash, createHmac } from 'crypto';

/** Constant representing totp adapter. */
export const TOTP_ADAPTER = Symbol('TOTP_ADAPTER');

/** Interface defining structure for totp enrollment. */
export interface TotpEnrollment {
  secret: string;
  qrCodeUrl: string;
  recoveryCodes: string[];
}

/** Interface defining structure for totp adapter. */
export interface TotpAdapter {
  generateEnrollment(email: string, issuer?: string): Promise<TotpEnrollment>;
  generateCode(secret: string, timestampMs?: number): string;
  verifyCode(token: string, secret: string): boolean;
  hashRecoveryCode(code: string): string;
  verifyRecoveryCode(code: string, hashedCode: string): boolean;
  generateRecoveryCodes(count?: number): string[];
}

// RFC 4648 Base32 alphabet
const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function base32Encode(buffer: Buffer): string {
  let bits = 0;
  let value = 0;
  let output = '';

  for (let i = 0; i < buffer.length; i++) {
    const byte = buffer[i]!;
    value = (value << 8) | byte;
    bits += 8;

    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }

  return output;
}

function base32Decode(base32: string): Buffer {
  const clean = base32.toUpperCase().replace(/=+$/, '').replace(/\s+/g, '');
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];

  for (let i = 0; i < clean.length; i++) {
    const char = clean[i]!;
    const val = BASE32_ALPHABET.indexOf(char);
    if (val === -1) continue;

    value = (value << 5) | val;
    bits += 5;

    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }

  return Buffer.from(bytes);
}

/** Injectable service providing otplib totp adapter logic. */
@Injectable()
export class OtplibTotpAdapter implements TotpAdapter {
  async generateEnrollment(
    email: string,
    issuer: string = 'Slotly',
  ): Promise<TotpEnrollment> {
    const rawSecret = randomBytes(20);
    const secret = base32Encode(rawSecret);
    const label = encodeURIComponent(email);
    const encodedIssuer = encodeURIComponent(issuer);
    const otpauth = `otpauth://totp/${encodedIssuer}:${label}?secret=${secret}&issuer=${encodedIssuer}&algorithm=SHA1&digits=6&period=30`;
    const qrCodeUrl = await QRCode.toDataURL(otpauth);
    const recoveryCodes = this.generateRecoveryCodes(8);

    return {
      secret,
      qrCodeUrl,
      recoveryCodes,
    };
  }

  generateCode(secret: string, timestampMs: number = Date.now()): string {
    const key = base32Decode(secret);
    const epoch = Math.floor(timestampMs / 1000);
    const counter = Math.floor(epoch / 30);

    const buf = Buffer.alloc(8);
    buf.writeBigInt64BE(BigInt(counter));

    const hmac = createHmac('sha1', key).update(buf).digest();
    const offset = hmac[hmac.length - 1]! & 0x0f;
    const binary =
      ((hmac[offset]! & 0x7f) << 24) |
      ((hmac[offset + 1]! & 0xff) << 16) |
      ((hmac[offset + 2]! & 0xff) << 8) |
      (hmac[offset + 3]! & 0xff);

    const otp = binary % 1000000;
    return otp.toString().padStart(6, '0');
  }

  verifyCode(token: string, secret: string): boolean {
    const cleanToken = token.trim();
    if (!/^\d{6}$/.test(cleanToken)) return false;

    const now = Date.now();
    // Check current period, -30s, and +30s to tolerate 1-step clock drift (RFC 6238)
    for (const offset of [-30000, 0, 30000]) {
      if (this.generateCode(secret, now + offset) === cleanToken) {
        return true;
      }
    }
    return false;
  }

  generateRecoveryCodes(count: number = 8): string[] {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      const code = randomBytes(5).toString('hex').toUpperCase(); // 10 chars
      codes.push(`${code.slice(0, 5)}-${code.slice(5)}`);
    }
    return codes;
  }

  hashRecoveryCode(code: string): string {
    const normalized = code.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    return createHash('sha256').update(normalized).digest('hex');
  }

  verifyRecoveryCode(code: string, hashedCode: string): boolean {
    const hash = this.hashRecoveryCode(code);
    return hash === hashedCode;
  }
}
