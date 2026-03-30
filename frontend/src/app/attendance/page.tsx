'use client'

import { useState, useMemo } from 'react'
import { RefreshCw, Search, CheckCheck, X, Users, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useApiData } from '@/lib/hooks/useApiData'
import { attendanceApi } from '@/lib/api/attendance'
import { membersApi } from '@/lib/api/members'
import { LoadingSpinner, ErrorMessage, EmptyState, PageHeader } from '@/components/shared'
import { Button, Card, Badge } from '@/components/ui'
import { cn, getInitials } from '@/lib/utils'
import type { Member } from '@/lib/types'

export default function AttendancePage() {
  const [search, setSearch] = useState('')
  const [markingId, setMarkingId] = useState<string | null>(null)
  const [bulkLoading, setBulkLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const {
    data: attendance,
    isLoading: attendanceLoading,
    error: attendanceError,
    refetch: refetchAttendance,
  } = useApiData(attendanceApi.getCurrent)

  const {
    data: members,
    isLoading: membersLoading,
    error: membersError,
    refetch: refetchMembers,
  } = useApiData(membersApi.getAll)

  const isLoading = attendanceLoading || membersLoading
  const error = attendanceError || membersError

  // Build a quick lookup: memberId → status
  const attendanceMap = useMemo(() => {
    const map: Record<string, 'P' | ''> = {}
    const list = Array.isArray(attendance) ? attendance : Object.values(attendance ?? {})
    list.forEach((rec) => {
      map[rec.member_id] = rec.status
    })
    return map
  }, [attendance])

  const presentCount = Object.values(attendanceMap).filter((s) => s === 'P').length
  const totalCount = members?.length ?? 0

  const filtered = useMemo(() => {
    if (!members) return []
    const q = search.toLowerCase()
    return members.filter(
      (m: Member) =>
        m.first_name.toLowerCase().includes(q) ||
        m.surname.toLowerCase().includes(q) ||
        m.unit.toLowerCase().includes(q) ||
        m.phone.includes(q)
    )
  }, [members, search])

  const handleMark = async (memberId: string, current: 'P' | '' | undefined) => {
    const newStatus: 'P' | '' = current === 'P' ? '' : 'P'
    setMarkingId(memberId)
    try {
      await attendanceApi.markAttendance(memberId, newStatus)
      await refetchAttendance()
      toast.success(newStatus === 'P' ? 'Marked present' : 'Marked absent')
    } catch {
      toast.error('Failed to update attendance')
    } finally {
      setMarkingId(null)
    }
  }

  const handleBulkPresent = async () => {
    if (selectedIds.size === 0) return
    setBulkLoading(true)
    try {
      await attendanceApi.bulkMark(Array.from(selectedIds), 'P')
      await refetchAttendance()
      setSelectedIds(new Set())
      toast.success(`Marked ${selectedIds.size} members present`)
    } catch {
      toast.error('Bulk mark failed')
    } finally {
      setBulkLoading(false)
    }
  }

  const handleBulkAbsent = async () => {
    if (selectedIds.size === 0) return
    setBulkLoading(true)
    try {
      await attendanceApi.bulkMark(Array.from(selectedIds), '')
      await refetchAttendance()
      setSelectedIds(new Set())
      toast.success(`Marked ${selectedIds.size} members absent`)
    } catch {
      toast.error('Bulk mark failed')
    } finally {
      setBulkLoading(false)
    }
  }

  const handleRefreshCache = async () => {
    setRefreshing(true)
    try {
      await membersApi.refreshCache()
      await refetchMembers()
      await refetchAttendance()
      toast.success('Cache refreshed')
    } catch {
      toast.error('Failed to refresh cache')
    } finally {
      setRefreshing(false)
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const selectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filtered.map((m) => m.id)))
    }
  }

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title="Attendance"
          description={today}
          action={
            <Button variant="outline" size="sm" onClick={handleRefreshCache} loading={refreshing}>
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh Cache
            </Button>
          }
        />

        {/* Stats strip */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total Members', value: totalCount, icon: Users, color: 'bg-blue-500' },
            { label: 'Present', value: presentCount, icon: CheckCircle, color: 'bg-green-500' },
            {
              label: 'Absent',
              value: totalCount - presentCount,
              icon: X,
              color: 'bg-red-500',
            },
          ].map(({ label, value, icon: Icon, color }) => (
            <Card key={label} className="p-4 flex items-center gap-3">
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${color} shrink-0`}>
                <Icon className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{value}</p>
              </div>
            </Card>
          ))}
        </div>

        <Card className="p-5">
          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row gap-3 mb-5">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search members…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            {selectedIds.size > 0 && (
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {selectedIds.size} selected
                </span>
                <Button size="sm" variant="primary" onClick={handleBulkPresent} loading={bulkLoading}>
                  <CheckCheck className="h-3.5 w-3.5" />
                  Mark Present
                </Button>
                <Button size="sm" variant="outline" onClick={handleBulkAbsent} loading={bulkLoading}>
                  <X className="h-3.5 w-3.5" />
                  Mark Absent
                </Button>
              </div>
            )}
          </div>

          {isLoading ? (
            <LoadingSpinner text="Loading attendance…" />
          ) : error ? (
            <ErrorMessage message={error.message} retry={() => { refetchAttendance(); refetchMembers() }} />
          ) : filtered.length === 0 ? (
            <EmptyState title="No members found" description="Try a different search" />
          ) : (
            <div className="overflow-x-auto -mx-1">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-700">
                    <th className="py-2 px-3 w-10">
                      <input
                        type="checkbox"
                        checked={selectedIds.size === filtered.length && filtered.length > 0}
                        onChange={selectAll}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </th>
                    {['Member', 'Unit', 'Phone', 'Status', 'Action'].map((h) => (
                      <th
                        key={h}
                        className="text-left py-2 px-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                  {filtered.map((m: Member) => {
                    const status = attendanceMap[m.id]
                    const isPresent = status === 'P'
                    const isMarking = markingId === m.id
                    const isSelected = selectedIds.has(m.id)

                    return (
                      <tr
                        key={m.id}
                        className={cn(
                          'transition-colors',
                          isPresent
                            ? 'bg-green-50/50 dark:bg-green-900/10'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-700/30',
                          isSelected && 'bg-blue-50 dark:bg-blue-900/20'
                        )}
                      >
                        <td className="py-3 px-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelect(m.id)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2.5">
                            <div
                              className={cn(
                                'h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0',
                                isPresent
                                  ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400'
                                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                              )}
                            >
                              {getInitials(m.first_name, m.surname)}
                            </div>
                            <span className="font-medium text-gray-800 dark:text-gray-200 whitespace-nowrap">
                              {m.first_name} {m.surname}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <Badge variant="info">{m.unit}</Badge>
                        </td>
                        <td className="py-3 px-3 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                          {m.phone}
                        </td>
                        <td className="py-3 px-3">
                          <Badge variant={isPresent ? 'success' : 'default'}>
                            {isPresent ? 'Present' : 'Absent'}
                          </Badge>
                        </td>
                        <td className="py-3 px-3">
                          <button
                            onClick={() => handleMark(m.id, status)}
                            disabled={isMarking}
                            className={cn(
                              'px-3 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-50',
                              isPresent
                                ? 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50'
                                : 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50'
                            )}
                          >
                            {isMarking ? '…' : isPresent ? 'Mark Absent' : 'Mark Present'}
                          </button>
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
