// Core implementation for utils in client/src/lib.
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Function performing cn. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
