'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Search, Plus, RefreshCw, Eye, Pencil } from 'lucide-react'
import { toast } from 'sonner'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useApiData } from '@/lib/hooks/useApiData'
import { membersApi } from '@/lib/api/members'
import { LoadingSpinner, ErrorMessage, EmptyState, PageHeader } from '@/components/shared'
import { Button, Card, Badge } from '@/components/ui'
import { cn } from '@/lib/utils'
import type { Member } from '@/lib/types'

export default function MembersPage() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [refreshing, setRefreshing] = useState(false)

  const { data: members, isLoading, error, refetch } = useApiData(membersApi.getAll)

  const handleRefreshCache = async () => {
    setRefreshing(true)
    try {
      await membersApi.refreshCache()
      await refetch()
      toast.success('Cache refreshed successfully')
    } catch {
      toast.error('Failed to refresh cache')
    } finally {
      setRefreshing(false)
    }
  }

  const filtered = members?.filter((m: Member) => {
    const q = search.toLowerCase().trim()
    const fullName = `${m.first_name} ${m.surname}`.toLowerCase()
    const fullNameReversed = `${m.surname} ${m.first_name}`.toLowerCase()
    return (
      fullName.includes(q) ||
      fullNameReversed.includes(q) ||
      m.first_name.toLowerCase().includes(q) ||
      m.surname.toLowerCase().includes(q) ||
      m.phone.toLowerCase().includes(q) ||
      m.unit.toLowerCase().includes(q) ||
      m.location.toLowerCase().includes(q)
    )
  }) ?? []

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title="Members"
          description={`${members?.length ?? 0} total members`}
          action={
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefreshCache}
                loading={refreshing}
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Refresh Cache
              </Button>
              <Link href="/members/new">
                <Button size="sm">
                  <Plus className="h-3.5 w-3.5" />
                  Add Member
                </Button>
              </Link>
            </div>
          }
        />

        <Card className="p-5">
          {/* Search */}
          <div className="relative mb-5">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, phone, unit…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {isLoading ? (
            <LoadingSpinner text="Loading members..." />
          ) : error ? (
            <ErrorMessage message={error.message} retry={refetch} />
          ) : filtered.length === 0 ? (
            <EmptyState
              title={search ? 'No members match your search' : 'No members yet'}
              description={search ? 'Try a different search term' : 'Add your first member to get started'}
              action={
                !search && (
                  <Link href="/members/new">
                    <Button size="sm">
                      <Plus className="h-3.5 w-3.5" />
                      Add Member
                    </Button>
                  </Link>
                )
              }
            />
          ) : (
            <div className="overflow-x-auto -mx-1">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-700">
                    {[
                      { label: 'Name', cls: '' },
                      { label: 'Phone', cls: 'hidden md:table-cell' },
                      { label: 'Unit', cls: 'hidden sm:table-cell' },
                      { label: 'Location', cls: 'hidden lg:table-cell' },
                      { label: 'Sex', cls: 'hidden lg:table-cell' },
                      { label: 'Joined', cls: 'hidden xl:table-cell' },
                      { label: '', cls: '' },
                    ].map(({ label: h, cls }) => (
                      <th
                        key={h}
                        className={`text-left py-2 px-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap ${cls}`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                  {filtered.map((m: Member) => (
                    <tr
                      key={m.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/30 cursor-pointer"
                      onClick={() => router.push(`/members/${m.id}`)}
                    >
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-xs font-semibold text-blue-700 dark:text-blue-400 shrink-0">
                            {m.first_name[0]}{m.surname[0]}
                          </div>
                          <span className="font-medium text-gray-800 dark:text-gray-200 whitespace-nowrap">
                            {m.first_name} {m.surname}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-gray-500 dark:text-gray-400 whitespace-nowrap hidden md:table-cell">{m.phone}</td>
                      <td className="py-3 px-3 whitespace-nowrap hidden sm:table-cell">
                        <Badge variant="info">{m.unit}</Badge>
                      </td>
                      <td className="py-3 px-3 text-gray-500 dark:text-gray-400 whitespace-nowrap hidden lg:table-cell">{m.location}</td>
                      <td className="py-3 px-3 hidden lg:table-cell">
                        <Badge variant={m.sex === 'Male' ? 'default' : 'warning'}>{m.sex}</Badge>
                      </td>
                      <td className="py-3 px-3 text-gray-500 dark:text-gray-400 whitespace-nowrap hidden xl:table-cell">
                        {m.date ? new Date(m.date).toLocaleDateString() : '—'}
                      </td>
                      <td className="py-3 px-3" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-1">
                          <Link href={`/members/${m.id}`}>
                            <button className="p-1.5 rounded-md text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors">
                              <Eye className="h-3.5 w-3.5" />
                            </button>
                          </Link>
                          <Link href={`/members/${m.id}/edit`}>
                            <button className="p-1.5 rounded-md text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 transition-colors">
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  )
}
