// Server component redirecting base /library route to default /library/faculty route.
import { redirect } from 'next/navigation';

/** Server component redirecting /library to /library/faculty. */
export default function LibraryIndexPage() {
  redirect('/library/faculty');
}
