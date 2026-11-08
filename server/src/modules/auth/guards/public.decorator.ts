// Route guard controlling access for public.decorator.
import { SetMetadata } from '@nestjs/common';

/** Constant representing s public key. */
export const IS_PUBLIC_KEY = 'isPublic';
/** React component rendering public. */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
