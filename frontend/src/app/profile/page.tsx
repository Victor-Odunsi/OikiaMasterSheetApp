'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState } from 'react'
import { toast } from 'sonner'
import { ShieldCheck, Shield, CheckCircle, Eye, EyeOff } from 'lucide-react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useAuth } from '@/contexts/AuthContext'
import { authApi } from '@/lib/api/auth'
import { Button, Card, Badge, Input } from '@/components/ui'
import { PageHeader } from '@/components/shared'
import { formatDate, getErrorMessage } from '@/lib/utils'

const schema = z
  .object({
    current_password: z.string().min(1, 'Current password is required'),
    new_password: z.string().min(8, 'New password must be at least 8 characters'),
    confirm_password: z.string(),
  })
  .refine((d) => d.new_password === d.confirm_password, {
    message: "Passwords don't match",
    path: ['confirm_password'],
  })

type FormData = z.infer<typeof schema>

export default function ProfilePage() {
  const { user } = useAuth()
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormData) => {
    try {
      await authApi.changePassword(data.current_password, data.new_password)
      toast.success('Password changed successfully')
      setSuccess(true)
      reset()
      setTimeout(() => setSuccess(false), 4000)
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  const PasswordField = ({
    label,
    name,
    show,
    toggle,
    placeholder,
    error,
  }: {
    label: string
    name: keyof FormData
    show: boolean
    toggle: () => void
    placeholder: string
    error?: string
  }) => (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          placeholder={placeholder}
          className={`w-full rounded-lg border px-3 py-2 text-sm pr-10 transition-colors
            bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
            placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
            ${error ? 'border-red-400' : 'border-gray-300 dark:border-gray-600'}`}
          {...register(name)}
        />
        <button
          type="button"
          onClick={toggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-2xl">
        <PageHeader title="Profile" description="Manage your account settings" />

        {/* User info card */}
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-xl font-bold text-blue-700 dark:text-blue-300 shrink-0">
              {user?.email?.[0].toUpperCase()}
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white truncate">{user?.email}</h2>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {user?.role === 'admin' ? (
                  <div className="flex items-center gap-1">
                    <ShieldCheck className="h-3.5 w-3.5 text-purple-500" />
                    <Badge variant="info">Admin</Badge>
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <Shield className="h-3.5 w-3.5 text-gray-400" />
                    <Badge variant="default">Usher</Badge>
                  </div>
                )}
                <Badge variant={user?.is_active ? 'success' : 'error'}>
                  {user?.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </div>
          </div>

          {(user?.created_at || user?.last_login) && (
            <div className="mt-5 pt-5 border-t border-gray-100 dark:border-gray-700 grid grid-cols-2 gap-4">
              {user.created_at && (
                <div>
                  <p className="text-xs text-gray-400 dark:text-gray-500">Account created</p>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mt-0.5">
                    {formatDate(user.created_at)}
                  </p>
                </div>
              )}
              {user.last_login && (
                <div>
                  <p className="text-xs text-gray-400 dark:text-gray-500">Last login</p>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mt-0.5">
                    {formatDate(user.last_login)}
                  </p>
                </div>
              )}
            </div>
          )}
        </Card>

        {/* Change password */}
        <Card className="p-6">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">Change Password</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
            Use a strong password with at least 8 characters.
          </p>

          {success && (
            <div className="flex items-center gap-2 p-3 mb-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 text-sm">
              <CheckCircle className="h-4 w-4 shrink-0" />
              Password changed successfully!
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <PasswordField
              label="Current Password"
              name="current_password"
              show={showCurrent}
              toggle={() => setShowCurrent(!showCurrent)}
              placeholder="Enter your current password"
              error={errors.current_password?.message}
            />
            <PasswordField
              label="New Password"
              name="new_password"
              show={showNew}
              toggle={() => setShowNew(!showNew)}
              placeholder="Min. 8 characters"
              error={errors.new_password?.message}
            />
            <PasswordField
              label="Confirm New Password"
              name="confirm_password"
              show={showConfirm}
              toggle={() => setShowConfirm(!showConfirm)}
              placeholder="Repeat new password"
              error={errors.confirm_password?.message}
            />

            <div className="pt-1">
              <Button type="submit" loading={isSubmitting}>
                Update Password
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </DashboardLayout>
  )
}
