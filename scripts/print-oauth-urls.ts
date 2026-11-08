// CLI script to print exact OAuth callback redirect URLs for Google and GitHub provider registration.

/**
 * Main execution function printing configured OAuth callback URLs.
 */
function main(): void {
  const baseUrl = (process.env['OAUTH_CALLBACK_BASE_URL'] || 'http://localhost:4000').replace(
    /\/+$/,
    '',
  );

  console.log('========================================================');
  console.log(' Slotly OAuth Callback URLs');
  console.log('========================================================\n');
  console.log(`Base URL: ${baseUrl}\n`);

  console.log('1. Google Cloud Console (Authorized redirect URIs):');
  console.log(`   ${baseUrl}/auth/oauth/google/callback\n`);

  console.log('2. GitHub Developer Settings (Authorization callback URL):');
  console.log(`   ${baseUrl}/auth/oauth/github/callback\n`);

  console.log('========================================================');
  console.log('Register these exact URLs in your provider developer dashboards.');
  console.log('Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GITHUB_CLIENT_ID,');
  console.log('and GITHUB_CLIENT_SECRET in your server environment to enable them.');
  console.log('========================================================');
}

main();
