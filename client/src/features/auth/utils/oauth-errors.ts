// Plain-language user-facing error message mapping for OAuth error codes per CLIENT_UX specifications.

const ERROR_MESSAGES: Record<string, string> = {
  oauth_denied: 'Access was denied by the identity provider.',
  oauth_state_invalid:
    'Your sign-in session expired or was invalid. Please try again.',
  oauth_email_unverified:
    'Your email with this provider is not verified. Please verify it with your provider first.',
  oauth_account_conflict:
    'An account already exists with this email address using a different sign-in method.',
  oauth_provider_error:
    'The authentication provider returned an error. Please try again later.',
  oauth_disabled:
    'This sign-in method is currently disabled by administrators.',
  account_suspended:
    'Your account has been suspended. Please contact your administrator.',
  link_conflict:
    'This social account is already linked to another Slotly user.',
};

/** Translates an OAuth error code into a user-friendly error message. */
export function getOAuthErrorMessage(
  code: string | null | undefined,
): string | null {
  if (!code) return null;
  return (
    ERROR_MESSAGES[code] ||
    'Failed to authenticate with the provider. Please try again.'
  );
}
