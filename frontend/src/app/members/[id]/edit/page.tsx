'use client'

import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useApiData } from '@/lib/hooks/useApiData'
import { membersApi } from '@/lib/api/members'
import { MemberForm } from '@/components/forms/MemberForm'
import { LoadingSpinner, ErrorMessage, PageHeader } from '@/components/shared'
import { Card } from '@/components/ui'
import { getErrorMessage } from '@/lib/utils'
import type { MemberFormData } from '@/lib/types'

export default function EditMemberPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const { data: member, isLoading, error } = useApiData(() => membersApi.getById(id))

  const handleSubmit = async (data: MemberFormData) => {
    try {
      await membersApi.update(id, data)
      toast.success('Member updated successfully')
      router.push(`/members/${id}`)
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Link href={`/members/${id}`} className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Member
          </Link>
        </div>

        <PageHeader title="Edit Member" description="Update member information" />

        <Card className="p-6">
          {isLoading ? (
            <LoadingSpinner text="Loading member..." />
          ) : error || !member ? (
            <ErrorMessage message={error?.message ?? 'Member not found'} />
          ) : (
            <MemberForm defaultValues={member} onSubmit={handleSubmit} submitLabel="Save Changes" />
          )}
        </Card>
      </div>
    </DashboardLayout>
  )
}
