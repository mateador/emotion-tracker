import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

// Standard shadcn/ui helper -- merges Tailwind classes, letting later
// classes correctly override earlier ones instead of both applying.
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
