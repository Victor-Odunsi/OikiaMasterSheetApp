"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { DashboardHeader } from "@/components/layout/dashboard-header"
import { PageHeader } from "@/components/layout/page-header"
import { MemberForm } from "@/components/members/member-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { membersApi } from "@/lib/api/members"
import type { Member, MemberCreateData } from "@/lib/types"

export default function EditMemberPage() {
  const params = useParams()
  const router = useRouter()
  const memberId = params.id as string

  const [member, setMember] = useState<Member | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const fetchMember = async () => {
      try {
        const data = await membersApi.getById(memberId)
        setMember(data)
      } catch (error) {
        toast.error("Failed to load member")
        console.error(error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchMember()
  }, [memberId])

  const handleSubmit = async (data: MemberCreateData) => {
    setIsSubmitting(true)
    try {
      await membersApi.update(memberId, data)
      toast.success("Member updated successfully")
      router.push(`/members/${memberId}`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update member")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <>
        <DashboardHeader
          breadcrumbs={[
            { label: "Members", href: "/members" },
            { label: "Loading..." },
          ]}
        />
        <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <Card className="mx-auto w-full max-w-2xl">
            <CardHeader>
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-60" />
            </CardHeader>
            <CardContent className="space-y-4">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </CardContent>
          </Card>
        </div>
      </>
    )
  }

  if (!member) {
    return (
      <>
        <DashboardHeader
          breadcrumbs={[
            { label: "Members", href: "/members" },
            { label: "Not Found" },
          ]}
        />
        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-4">
          <p className="text-muted-foreground">Member not found</p>
          <Button asChild>
            <Link href="/members">Back to Members</Link>
          </Button>
        </div>
      </>
    )
  }

  return (
    <>
      <DashboardHeader
        breadcrumbs={[
          { label: "Members", href: "/members" },
          { label: `${member.first_name} ${member.surname}`, href: `/members/${memberId}` },
          { label: "Edit" },
        ]}
      />
      <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
        <PageHeader
          title={`Edit ${member.first_name} ${member.surname}`}
          description="Update member information"
          actions={
            <Button variant="ghost" asChild>
              <Link href={`/members/${memberId}`}>
                <ArrowLeft className="h-4 w-4" />
                Cancel
              </Link>
            </Button>
          }
        />

        <Card className="mx-auto w-full max-w-2xl">
          <CardHeader>
            <CardTitle>Member Information</CardTitle>
            <CardDescription>Update the details for this member</CardDescription>
          </CardHeader>
          <CardContent>
            <MemberForm member={member} onSubmit={handleSubmit} isSubmitting={isSubmitting} />
          </CardContent>
        </Card>
      </div>
    </>
  )
}
