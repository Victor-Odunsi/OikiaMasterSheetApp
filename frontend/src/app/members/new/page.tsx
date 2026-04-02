'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { MemberForm } from '@/components/forms/MemberForm'
import { Card } from '@/components/ui'
import { PageHeader } from '@/components/shared'
import { membersApi } from '@/lib/api/members'
import { getErrorMessage } from '@/lib/utils'
import type { MemberFormData } from '@/lib/types'

export default function NewMemberPage() {
  const router = useRouter()

  const handleSubmit = async (data: MemberFormData) => {
    try {
      const res = await membersApi.create(data)
      toast.success('Member added successfully')
      // Backend returns { message, member: { id, ... } }
      const member = (res as { member?: { id: string } }).member ?? (res as { id: string })
      router.push(`/members/${member.id}`)
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Link
            href="/members"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Members
          </Link>
        </div>

        <PageHeader title="Add New Member" description="Fill in the details below to register a new member" />

        <Card className="p-6">
          <MemberForm onSubmit={handleSubmit} submitLabel="Add Member" />
        </Card>
      </div>
    </DashboardLayout>
  )
}
