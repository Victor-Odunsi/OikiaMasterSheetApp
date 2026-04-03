import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateString: string): string {
  if (!dateString) return 'N/A'
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return dateString
  }
}

export function getInitials(firstName: string, surname: string): string {
  return `${firstName?.[0] ?? ''}${surname?.[0] ?? ''}`.toUpperCase()
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === 'object' && error !== null) {
    const e = error as Record<string, unknown>
    if (typeof e.detail === 'string') return e.detail
    if (typeof e.message === 'string') return e.message
  }
  return 'An unexpected error occurred'
}
