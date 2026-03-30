'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Church, ArrowLeft, Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react'
import { passwordApi } from '@/lib/api/password'
import { Button, Input } from '@/components/ui'
import { ThemeToggle } from '@/components/shared/ThemeToggle'
import { LoadingSpinner } from '@/components/shared'
import { getErrorMessage } from '@/lib/utils'

const schema = z
  .object({
    new_password: z.string().min(8, 'Password must be at least 8 characters'),
    confirm_password: z.string(),
  })
  .refine((d) => d.new_password === d.confirm_password, {
    message: "Passwords don't match",
    path: ['confirm_password'],
  })

type FormData = z.infer<typeof schema>

export default function ResetPasswordPage() {
  const { token } = useParams<{ token: string }>()
  const router = useRouter()
  const [tokenValid, setTokenValid] = useState<boolean | null>(null)
  const [success, setSuccess] = useState(false)
  const [showPw, setShowPw] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  useEffect(() => {
    const verify = async () => {
      try {
        const res = await passwordApi.verifyResetToken(token)
        setTokenValid(res.valid)
      } catch {
        setTokenValid(false)
      }
    }
    if (token) verify()
  }, [token])

  const onSubmit = async (data: FormData) => {
    try {
      await passwordApi.resetPassword(token, data.new_password)
      setSuccess(true)
      toast.success('Password reset successfully!')
      setTimeout(() => router.push('/login'), 3000)
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  if (tokenValid === null) return <LoadingSpinner fullScreen text="Verifying link..." />

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex h-14 w-14 rounded-2xl bg-blue-600 items-center justify-center mb-4 shadow-lg">
            <Church className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reset password</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Enter your new password below</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
          {!tokenValid ? (
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <div className="h-16 w-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <XCircle className="h-8 w-8 text-red-500" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">Invalid or expired link</p>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  This password reset link is no longer valid.
                </p>
              </div>
              <Link href="/forgot-password">
                <Button variant="primary">Request new link</Button>
              </Link>
            </div>
          ) : success ? (
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">Password reset!</p>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Redirecting you to login…
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* New password */}
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">New password</label>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'}
                    placeholder="Min. 8 characters"
                    className={`w-full rounded-lg border px-3 py-2 text-sm pr-10 transition-colors bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.new_password ? 'border-red-400' : 'border-gray-300 dark:border-gray-600'}`}
                    {...register('new_password')}
                  />
                  <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.new_password && <p className="text-xs text-red-500">{errors.new_password.message}</p>}
              </div>

              {/* Confirm password */}
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Confirm password</label>
                <div className="relative">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="Repeat new password"
                    className={`w-full rounded-lg border px-3 py-2 text-sm pr-10 transition-colors bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.confirm_password ? 'border-red-400' : 'border-gray-300 dark:border-gray-600'}`}
                    {...register('confirm_password')}
                  />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.confirm_password && <p className="text-xs text-red-500">{errors.confirm_password.message}</p>}
              </div>

              <Button type="submit" className="w-full" size="lg" loading={isSubmitting}>
                Reset password
              </Button>
            </form>
          )}
        </div>

        <div className="text-center mt-6">
          <Link href="/login" className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to login
          </Link>
        </div>
      </div>
    </div>
  )
}
