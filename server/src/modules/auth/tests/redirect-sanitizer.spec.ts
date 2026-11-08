// Unit tests verifying safe sanitization of OAuth post-redirect paths.
import { sanitizeNext } from '../utils/redirect-sanitizer';

describe('sanitizeNext', () => {
  it('returns /dashboard when input is empty or null', () => {
    expect(sanitizeNext('')).toBe('/dashboard');
    expect(sanitizeNext(null)).toBe('/dashboard');
    expect(sanitizeNext(undefined)).toBe('/dashboard');
    expect(sanitizeNext('   ')).toBe('/dashboard');
  });

  it('allows safe relative paths', () => {
    expect(sanitizeNext('/dashboard')).toBe('/dashboard');
    expect(sanitizeNext('/projects/new')).toBe('/projects/new');
    expect(sanitizeNext('/users/me/security?tab=connected')).toBe(
      '/users/me/security?tab=connected',
    );
    expect(sanitizeNext('/library/faculty#profile')).toBe(
      '/library/faculty#profile',
    );
  });

  it('rejects absolute URLs with http/https schemes', () => {
    expect(sanitizeNext('http://evil.com')).toBe('/dashboard');
    expect(sanitizeNext('https://evil.com/phish')).toBe('/dashboard');
    expect(sanitizeNext('//evil.com/path')).toBe('/dashboard');
  });

  it('rejects dangerous protocols (javascript, data, vbscript)', () => {
    expect(sanitizeNext('javascript:alert(1)')).toBe('/dashboard');
    expect(sanitizeNext('data:text/html,bad')).toBe('/dashboard');
  });

  it('rejects backslashes and path traversal tricks', () => {
    expect(sanitizeNext('/\\evil.com')).toBe('/dashboard');
    expect(sanitizeNext('\\evil.com')).toBe('/dashboard');
    expect(sanitizeNext('/projects\\..\\evil')).toBe('/dashboard');
  });

  it('rejects paths with ASCII control characters and newlines', () => {
    expect(sanitizeNext('/dashboard\r\nSet-Cookie:bad')).toBe('/dashboard');
    expect(sanitizeNext('/dashboard\u0000')).toBe('/dashboard');
  });
});
