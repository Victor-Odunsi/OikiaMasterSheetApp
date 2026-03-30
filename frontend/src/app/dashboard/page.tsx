'use client'

import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useApiData } from '@/lib/hooks/useApiData'
import { dashboardApi } from '@/lib/api/dashboard'
import { LoadingSpinner, ErrorMessage, PageHeader } from '@/components/shared'
import { Card, Badge } from '@/components/ui'
import { Users, CalendarCheck, TrendingUp, UserPlus } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  sub,
}: {
  label: string
  value: string | number
  icon: React.ElementType
  color: string
  sub?: string
}) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
          <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
          {sub && <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">{sub}</p>}
        </div>
        <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </Card>
  )
}

export default function DashboardPage() {
  const { data: stats, isLoading, error, refetch } = useApiData(dashboardApi.getStats)
  const { data: trend } = useApiData(() => dashboardApi.getAttendanceTrend(7))
  const { data: recentMembers } = useApiData(() => dashboardApi.getRecentMembers(5))
  const { data: recentAttendance } = useApiData(() => dashboardApi.getRecentAttendance(5))

  if (isLoading) return (
    <DashboardLayout>
      <LoadingSpinner text="Loading dashboard..." />
    </DashboardLayout>
  )

  if (error) return (
    <DashboardLayout>
      <ErrorMessage message={error.message} retry={refetch} />
    </DashboardLayout>
  )

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title="Dashboard"
          description={`Today is ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`}
        />

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard
            label="Total Members"
            value={stats?.total_members ?? 0}
            icon={Users}
            color="bg-blue-600"
          />
          <StatCard
            label="Today's Attendance"
            value={stats?.todays_attendance ?? 0}
            icon={CalendarCheck}
            color="bg-green-600"
          />
          <StatCard
            label="Attendance Rate"
            value={`${stats?.attendance_rate ?? 0}%`}
            icon={TrendingUp}
            color="bg-purple-600"
            sub="This week"
          />
          <StatCard
            label="New Registrations"
            value={stats?.recent_registrations ?? 0}
            icon={UserPlus}
            color="bg-orange-500"
            sub="Last 30 days"
          />
        </div>

        {/* Chart + Recent */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Trend chart */}
          <Card className="xl:col-span-2 p-5">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
              Attendance Trend (Last 7 Days)
            </h2>
            {trend && trend.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={trend} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                  <XAxis dataKey="day" tick={{ fontSize: 12 }} className="fill-gray-500" />
                  <YAxis tick={{ fontSize: 12 }} className="fill-gray-500" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--tooltip-bg, white)',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    fill="url(#colorCount)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[220px] text-sm text-gray-400">
                No trend data available
              </div>
            )}
          </Card>

          {/* Recent members */}
          <Card className="p-5">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
              Recent Members
            </h2>
            <div className="space-y-3">
              {recentMembers && recentMembers.length > 0 ? (
                recentMembers.map((m) => (
                  <div key={m.id} className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-xs font-semibold text-blue-700 dark:text-blue-400 shrink-0">
                      {m.first_name[0]}{m.surname[0]}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                        {m.first_name} {m.surname}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">{m.unit}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-400 py-4 text-center">No recent members</p>
              )}
            </div>
          </Card>
        </div>

        {/* Recent attendance */}
        <Card className="p-5">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
            Recent Attendance
          </h2>
          {recentAttendance && recentAttendance.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-700">
                    <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Member</th>
                    <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                    <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                    <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Check-in</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                  {recentAttendance.map((record) => (
                    <tr key={record.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                      <td className="py-2.5 px-3 text-gray-800 dark:text-gray-200">
                        {record.member
                          ? `${record.member.first_name} ${record.member.surname}`
                          : record.member_id}
                      </td>
                      <td className="py-2.5 px-3 text-gray-500 dark:text-gray-400">{formatDate(record.date)}</td>
                      <td className="py-2.5 px-3">
                        <Badge variant={record.status === 'P' ? 'success' : 'default'}>
                          {record.status === 'P' ? 'Present' : 'Absent'}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-3 text-gray-500 dark:text-gray-400">
                        {record.check_in_time ?? '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-gray-400 py-4 text-center">No recent attendance records</p>
          )}
        </Card>
      </div>
    </DashboardLayout>
  )
}
