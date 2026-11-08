// Unit tests for OAuth user-facing error message mapping and resolution.
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { getOAuthErrorMessage } from './oauth-errors';

describe('getOAuthErrorMessage', () => {
  it('returns null when error code is null or undefined', () => {
    assert.strictEqual(getOAuthErrorMessage(null), null);
    assert.strictEqual(getOAuthErrorMessage(undefined), null);
    assert.strictEqual(getOAuthErrorMessage(''), null);
  });

  it('translates known OAuth error codes to friendly messages', () => {
    assert.strictEqual(
      getOAuthErrorMessage('oauth_denied'),
      'Access was denied by the identity provider.',
    );
    assert.strictEqual(
      getOAuthErrorMessage('oauth_state_invalid'),
      'Your sign-in session expired or was invalid. Please try again.',
    );
    assert.strictEqual(
      getOAuthErrorMessage('oauth_email_unverified'),
      'Your email with this provider is not verified. Please verify it with your provider first.',
    );
    assert.strictEqual(
      getOAuthErrorMessage('oauth_account_conflict'),
      'An account already exists with this email address using a different sign-in method.',
    );
    assert.strictEqual(
      getOAuthErrorMessage('oauth_disabled'),
      'This sign-in method is currently disabled by administrators.',
    );
    assert.strictEqual(
      getOAuthErrorMessage('account_suspended'),
      'Your account has been suspended. Please contact your administrator.',
    );
    assert.strictEqual(
      getOAuthErrorMessage('link_conflict'),
      'This social account is already linked to another Slotly user.',
    );
  });

  it('returns a fallback message for unknown error codes', () => {
    assert.strictEqual(
      getOAuthErrorMessage('unknown_error_code'),
      'Failed to authenticate with the provider. Please try again.',
    );
  });
});
