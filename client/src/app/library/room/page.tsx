// Server component redirecting singular /library/room route to /library/rooms.
import { redirect } from 'next/navigation';

/** Server component redirecting /library/room to /library/rooms. */
export default function LibraryRoomRedirectPage() {
  redirect('/library/rooms');
}
