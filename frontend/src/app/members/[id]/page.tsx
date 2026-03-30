'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Pencil, Phone, Mail, MapPin, Users, Calendar, UserRound } from 'lucide-react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useApiData } from '@/lib/hooks/useApiData'
import { membersApi } from '@/lib/api/members'
import { attendanceApi } from '@/lib/api/attendance'
import { LoadingSpinner, ErrorMessage, PageHeader } from '@/components/shared'
import { Button, Card, Badge } from '@/components/ui'
import { formatDate } from '@/lib/utils'

export default function ViewMemberPage() {
  const { id } = useParams<{ id: string }>()

  const { data: member, isLoading, error } = useApiData(() => membersApi.getById(id))
  const { data: history } = useApiData(() => attendanceApi.getHistory(id))

  if (isLoading) return (
    <DashboardLayout>
      <LoadingSpinner text="Loading member..." />
    </DashboardLayout>
  )

  if (error || !member) return (
    <DashboardLayout>
      <ErrorMessage message={error?.message ?? 'Member not found'} />
    </DashboardLayout>
  )

  const attendanceEntries = history ? Object.entries(history) : []
  const presentCount = attendanceEntries.filter(([, v]) => v === 'P').length

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/members" className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Members
          </Link>
        </div>

        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-2xl font-bold text-blue-700 dark:text-blue-400">
              {member.first_name[0]}{member.surname[0]}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {member.first_name} {member.surname}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="info">{member.unit}</Badge>
                <Badge variant={member.sex === 'Male' ? 'default' : 'warning'}>{member.sex}</Badge>
              </div>
            </div>
          </div>
          <Link href={`/members/${id}/edit`}>
            <Button variant="outline" size="sm">
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Details */}
          <Card className="lg:col-span-2 p-6">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Member Details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { icon: Phone, label: 'Phone', value: member.phone },
                { icon: Mail, label: 'Email', value: member.email ?? '—' },
                { icon: MapPin, label: 'Location', value: member.location },
                { icon: Users, label: 'Unit', value: member.unit },
                { icon: UserRound, label: 'Role', value: member.role },
                { icon: Calendar, label: 'Date Joined', value: formatDate(member.date) },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center shrink-0">
                    <Icon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 dark:text-gray-500">{label}</p>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{value}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Attendance summary */}
          <Card className="p-6">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Attendance Summary</h2>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Total Records</span>
                <span className="font-semibold text-gray-800 dark:text-gray-200">{attendanceEntries.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Present</span>
                <span className="font-semibold text-green-600 dark:text-green-400">{presentCount}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Absent</span>
                <span className="font-semibold text-red-500">{attendanceEntries.length - presentCount}</span>
              </div>
              {attendanceEntries.length > 0 && (
                <div className="pt-2">
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>Attendance Rate</span>
                    <span>{Math.round((presentCount / attendanceEntries.length) * 100)}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-green-500 transition-all"
                      style={{ width: `${(presentCount / attendanceEntries.length) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Recent attendance */}
            {attendanceEntries.length > 0 && (
              <div className="mt-5">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Recent</p>
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {attendanceEntries.slice(-10).reverse().map(([date, status]) => (
                    <div key={date} className="flex items-center justify-between text-xs">
                      <span className="text-gray-500 dark:text-gray-400">{formatDate(date)}</span>
                      <Badge variant={status === 'P' ? 'success' : 'error'}>
                        {status === 'P' ? 'Present' : 'Absent'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
