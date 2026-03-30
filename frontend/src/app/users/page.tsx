'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Trash2, ShieldCheck, Shield, X } from 'lucide-react'
import { toast } from 'sonner'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useAuth } from '@/contexts/AuthContext'
import { useApiData } from '@/lib/hooks/useApiData'
import { usersApi } from '@/lib/api/users'
import { LoadingSpinner, ErrorMessage, EmptyState, PageHeader } from '@/components/shared'
import { Button, Card, Badge, Input, Select } from '@/components/ui'
import { formatDate } from '@/lib/utils'
import type { User } from '@/lib/types'

const createSchema = z.object({
  email: z.string().email('Valid email required'),
  password: z.string().min(8, 'Min 8 characters'),
  role: z.enum(['admin', 'usher']),
})

type CreateFormData = z.infer<typeof createSchema>

const ROLE_OPTIONS = [
  { value: 'usher', label: 'Usher' },
  { value: 'admin', label: 'Admin' },
]

export default function UsersPage() {
  const { user: currentUser, isAdmin } = useAuth()
  const [showForm, setShowForm] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [togglingId, setTogglingId] = useState<number | null>(null)

  const { data: users, isLoading, error, refetch } = useApiData(usersApi.getAll)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateFormData>({
    resolver: zodResolver(createSchema),
    defaultValues: { role: 'usher' },
  })

  if (!isAdmin) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
          <ShieldCheck className="h-16 w-16 text-gray-300 dark:text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300">Admin access required</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">You don't have permission to view this page.</p>
        </div>
      </DashboardLayout>
    )
  }

  const handleCreate = async (data: CreateFormData) => {
    try {
      await usersApi.create(data)
      await refetch()
      toast.success('User created successfully')
      reset()
      setShowForm(false)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create user'
      toast.error(msg)
    }
  }

  const handleToggleActive = async (user: User) => {
    setTogglingId(user.id)
    try {
      await usersApi.update(user.id, { is_active: !user.is_active })
      await refetch()
      toast.success(`User ${user.is_active ? 'deactivated' : 'activated'}`)
    } catch {
      toast.error('Failed to update user')
    } finally {
      setTogglingId(null)
    }
  }

  const handleDelete = async (userId: number) => {
    if (!confirm('Are you sure you want to delete this user? This cannot be undone.')) return
    setDeletingId(userId)
    try {
      await usersApi.delete(userId)
      await refetch()
      toast.success('User deleted')
    } catch {
      toast.error('Failed to delete user')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-5xl">
        <PageHeader
          title="Users"
          description={`${users?.length ?? 0} system users`}
          action={
            <Button size="sm" onClick={() => setShowForm(!showForm)}>
              {showForm ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
              {showForm ? 'Cancel' : 'Add User'}
            </Button>
          }
        />

        {/* Create form */}
        {showForm && (
          <Card className="p-6">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Create New User</h3>
            <form onSubmit={handleSubmit(handleCreate)} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-1">
                  <Input
                    label="Email"
                    type="email"
                    placeholder="user@example.com"
                    error={errors.email?.message}
                    required
                    {...register('email')}
                  />
                </div>
                <div className="sm:col-span-1">
                  <Input
                    label="Password"
                    type="password"
                    placeholder="Min. 8 characters"
                    error={errors.password?.message}
                    required
                    {...register('password')}
                  />
                </div>
                <div className="sm:col-span-1">
                  <Select
                    label="Role"
                    options={ROLE_OPTIONS}
                    error={errors.role?.message}
                    required
                    {...register('role')}
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <Button type="submit" loading={isSubmitting} size="sm">
                  Create User
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => { setShowForm(false); reset() }}>
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* Users table */}
        <Card className="p-5">
          {isLoading ? (
            <LoadingSpinner text="Loading users…" />
          ) : error ? (
            <ErrorMessage message={error.message} retry={refetch} />
          ) : !users || users.length === 0 ? (
            <EmptyState title="No users yet" description="Create the first user above" />
          ) : (
            <div className="overflow-x-auto -mx-1">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-700">
                    {['User', 'Role', 'Status', 'Last Login', 'Joined', 'Actions'].map((h) => (
                      <th
                        key={h}
                        className="text-left py-2 px-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                  {users.map((u: User) => {
                    const isSelf = u.id === currentUser?.id
                    return (
                      <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2.5">
                            <div className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-xs font-semibold text-indigo-700 dark:text-indigo-400 shrink-0">
                              {u.email[0].toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium text-gray-800 dark:text-gray-200">{u.email}</p>
                              {isSelf && (
                                <p className="text-xs text-blue-500">You</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-1.5">
                            {u.role === 'admin' ? (
                              <ShieldCheck className="h-3.5 w-3.5 text-purple-500" />
                            ) : (
                              <Shield className="h-3.5 w-3.5 text-gray-400" />
                            )}
                            <Badge variant={u.role === 'admin' ? 'info' : 'default'} className="capitalize">
                              {u.role}
                            </Badge>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <Badge variant={u.is_active ? 'success' : 'error'}>
                            {u.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td className="py-3 px-3 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                          {u.last_login ? formatDate(u.last_login) : '—'}
                        </td>
                        <td className="py-3 px-3 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                          {u.created_at ? formatDate(u.created_at) : '—'}
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-1">
                            {!isSelf && (
                              <>
                                <button
                                  onClick={() => handleToggleActive(u)}
                                  disabled={togglingId === u.id}
                                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors disabled:opacity-50 ${
                                    u.is_active
                                      ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400'
                                      : 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400'
                                  }`}
                                >
                                  {togglingId === u.id ? '…' : u.is_active ? 'Deactivate' : 'Activate'}
                                </button>
                                <button
                                  onClick={() => handleDelete(u.id)}
                                  disabled={deletingId === u.id}
                                  className="p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  )
}
