// Redirects root library route to the default faculty tab.
import { redirect } from 'next/navigation';

/**
 * Default entry redirecting /library to /library/faculty.
 */
export default function LibraryPage() {
  redirect('/library/faculty');
}
