import { AlertCircle, Loader2, InboxIcon } from 'lucide-react'
import { Button } from '@/components/ui'

// ── LoadingSpinner ───────────────────────────────────────────────────────────
interface LoadingSpinnerProps {
  text?: string
  fullScreen?: boolean
}

export function LoadingSpinner({ text, fullScreen }: LoadingSpinnerProps) {
  const spinner = (
    <div className="flex flex-col items-center justify-center gap-3">
      <Loader2 className="h-8 w-8 animate-spin text-blue-600 dark:text-blue-400" />
      {text && <p className="text-sm text-gray-500 dark:text-gray-400">{text}</p>}
    </div>
  )

  if (fullScreen) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        {spinner}
      </div>
    )
  }

  return <div className="flex items-center justify-center py-16">{spinner}</div>
}

// ── ErrorMessage ─────────────────────────────────────────────────────────────
interface ErrorMessageProps {
  message: string
  retry?: () => void
}

export function ErrorMessage({ message, retry }: ErrorMessageProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-8">
      <AlertCircle className="h-10 w-10 text-red-500" />
      <div className="text-center">
        <h3 className="font-semibold text-red-700 dark:text-red-400">Something went wrong</h3>
        <p className="mt-1 text-sm text-red-600/80 dark:text-red-400/80">{message}</p>
      </div>
      {retry && (
        <Button variant="danger" size="sm" onClick={retry}>
          Try Again
        </Button>
      )}
    </div>
  )
}

// ── EmptyState ───────────────────────────────────────────────────────────────
interface EmptyStateProps {
  title: string
  description?: string
  action?: React.ReactNode
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-gray-300 dark:border-gray-600 p-16 text-center">
      <InboxIcon className="h-12 w-12 text-gray-300 dark:text-gray-600" />
      <div>
        <h3 className="font-semibold text-gray-700 dark:text-gray-300">{title}</h3>
        {description && (
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{description}</p>
        )}
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}

// ── PageHeader ───────────────────────────────────────────────────────────────
interface PageHeaderProps {
  title: string
  description?: string
  action?: React.ReactNode
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h1>
        {description && (
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
