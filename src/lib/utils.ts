// lib/utils.ts

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility: cn (Class Name Merge)
 * --------------------------------
 * Combines multiple class name inputs into a single string,
 * merging Tailwind CSS classes intelligently to avoid conflicts.
 *
 * - Uses `clsx` to conditionally join class names
 * - Uses `twMerge` to dedupe and merge Tailwind utility classes
 *
 * @param inputs - A list of class values (strings, arrays, objects)
 * @returns A single merged className string
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}