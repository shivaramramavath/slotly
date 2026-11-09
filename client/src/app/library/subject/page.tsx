// Server component redirecting singular /library/subject route to /library/subjects.
import { redirect } from 'next/navigation';

/** Server component redirecting /library/subject to /library/subjects. */
export default function LibrarySubjectRedirectPage() {
  redirect('/library/subjects');
}
