"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { toast } from "sonner"

import { DashboardHeader } from "@/components/layout/dashboard-header"
import { PageHeader } from "@/components/layout/page-header"
import { MemberForm } from "@/components/members/member-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { membersApi } from "@/lib/api/members"
import type { MemberCreateData } from "@/lib/types"

export default function NewMemberPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (data: MemberCreateData) => {
    setIsSubmitting(true)
    try {
      await membersApi.create(data)
      toast.success("Member created successfully")
      router.push("/members")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create member")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <DashboardHeader
        breadcrumbs={[
          { label: "Members", href: "/members" },
          { label: "New Member" },
        ]}
      />
      <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
        <PageHeader
          title="Add New Member"
          description="Register a new church member"
          actions={
            <Button variant="ghost" asChild>
              <Link href="/members">
                <ArrowLeft className="h-4 w-4" />
                Back to Members
              </Link>
            </Button>
          }
        />

        <Card className="mx-auto w-full max-w-2xl">
          <CardHeader>
            <CardTitle>Member Information</CardTitle>
            <CardDescription>Fill in the details for the new member</CardDescription>
          </CardHeader>
          <CardContent>
            <MemberForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
          </CardContent>
        </Card>
      </div>
    </>
  )
}
