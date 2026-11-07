// Helper to compute the active top navigation section based on the current URL pathname.

/** Top navigation section identifier. */
export type NavSection = 'projects' | 'institution' | 'library' | 'templates' | null;

/**
 * Determines the active top navigation section matching the first URL path segment.
 */
export function getActiveNavSection(pathname?: string | null): NavSection {
  if (!pathname) return null;
  const clean = pathname.replace(/^\/+/, '');
  const segment = clean.split('/')[0]?.toLowerCase();

  switch (segment) {
    case 'dashboard':
    case 'projects':
      return 'projects';
    case 'institution':
    case 'institutions':
      return 'institution';
    case 'library':
      return 'library';
    case 'blueprint-templates':
    case 'templates':
      return 'templates';
    default:
      return null;
  }
}
