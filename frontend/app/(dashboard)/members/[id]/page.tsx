"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { format } from "date-fns"
import { ArrowLeft, Pencil, Trash2, Phone, Mail, MapPin, Users, Calendar, Loader2, QrCode } from "lucide-react"
import { toast } from "sonner"

import { DashboardHeader } from "@/components/layout/dashboard-header"
import { PageHeader } from "@/components/layout/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { membersApi } from "@/lib/api/members"
import { attendanceApi } from "@/lib/api/attendance"
import type { Member, MemberAttendanceHistory } from "@/lib/types"

export default function MemberDetailPage() {
  const params = useParams()
  const router = useRouter()
  const memberId = params.id as string

  const [member, setMember] = useState<Member | null>(null)
  const [attendanceHistory, setAttendanceHistory] = useState<MemberAttendanceHistory | null>(null)
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [memberData, historyData] = await Promise.all([
          membersApi.getById(memberId),
          attendanceApi.getMemberHistory(memberId, { limit: 10 }),
        ])
        setMember(memberData)
        setAttendanceHistory(historyData)
      } catch (error) {
        toast.error("Failed to load member details")
        console.error(error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [memberId])

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await membersApi.delete(memberId)
      toast.success("Member deleted successfully")
      router.push("/members")
    } catch (error) {
      toast.error("Failed to delete member")
      console.error(error)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleGetQrCode = async () => {
    try {
      const data = await membersApi.getQrCode(memberId)
      setQrCode(data.qr_code)
    } catch (error) {
      toast.error("Failed to generate QR code")
      console.error(error)
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
            <Skeleton className="h-9 w-24" />
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-40" />
              </CardHeader>
              <CardContent className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-5 w-full" />
                ))}
              </CardContent>
            </Card>
          </div>
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
          { label: `${member.first_name} ${member.surname}` },
        ]}
      />
      <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
        <PageHeader
          title={`${member.first_name} ${member.surname}`}
          description={`Member since ${member.date}`}
          actions={
            <div className="flex gap-2">
              <Button variant="ghost" asChild>
                <Link href="/members">
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Link>
              </Button>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" onClick={handleGetQrCode}>
                    <QrCode className="h-4 w-4" />
                    QR Code
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Member QR Code</DialogTitle>
                    <DialogDescription>
                      Scan this code to quickly mark attendance
                    </DialogDescription>
                  </DialogHeader>
                  <div className="flex justify-center p-4">
                    {qrCode ? (
                      <img src={qrCode} alt="Member QR Code" className="h-48 w-48" />
                    ) : (
                      <div className="flex h-48 w-48 items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin" />
                      </div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
              <Button variant="outline" asChild>
                <Link href={`/members/${memberId}/edit`}>
                  <Pencil className="h-4 w-4" />
                  Edit
                </Link>
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Member</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete {member.first_name} {member.surname}? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="bg-destructive text-white hover:bg-destructive/90"
                    >
                      {isDeleting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Deleting...
                        </>
                      ) : (
                        "Delete"
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          }
        />

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Info */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Member Information</CardTitle>
              <CardDescription>Personal and contact details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-xl font-semibold text-primary">
                  {member.first_name[0]}{member.surname[0]}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">{member.first_name} {member.surname}</h3>
                  <div className="mt-1 flex flex-wrap gap-2">
                    <Badge>{member.role}</Badge>
                    <Badge variant="secondary">{member.unit}</Badge>
                    <Badge variant="outline">{member.sex}</Badge>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p className="font-medium">{member.phone}</p>
                  </div>
                </div>

                {member.email && (
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium">{member.email}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Location</p>
                    <p className="font-medium">{member.location}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Unit</p>
                    <p className="font-medium">{member.unit}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Year Joined</p>
                    <p className="font-medium">{member.date}</p>
                  </div>
                </div>
              </div>

              {member.address && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Address</p>
                    <p className="mt-1">{member.address}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Attendance Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Attendance Statistics</CardTitle>
              <CardDescription>Recent attendance history</CardDescription>
            </CardHeader>
            <CardContent>
              {attendanceHistory ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-lg bg-green-50 p-3 text-center">
                      <p className="text-2xl font-bold text-green-700">{attendanceHistory.total_present}</p>
                      <p className="text-xs text-green-600">Present</p>
                    </div>
                    <div className="rounded-lg bg-red-50 p-3 text-center">
                      <p className="text-2xl font-bold text-red-700">{attendanceHistory.total_absent}</p>
                      <p className="text-xs text-red-600">Absent</p>
                    </div>
                  </div>
                  <div className="rounded-lg bg-muted p-3 text-center">
                    <p className="text-2xl font-bold">{attendanceHistory.attendance_rate}%</p>
                    <p className="text-xs text-muted-foreground">Attendance Rate</p>
                  </div>

                  <Separator />

                  <div>
                    <p className="mb-2 text-sm font-medium">Recent Records</p>
                    {attendanceHistory.records.length > 0 ? (
                      <div className="space-y-2">
                        {attendanceHistory.records.slice(0, 5).map((record) => (
                          <div
                            key={record.id}
                            className="flex items-center justify-between rounded-lg border p-2"
                          >
                            <span className="text-sm">
                              {format(new Date(record.date), "MMM d, yyyy")}
                            </span>
                            <Badge variant={record.status === "P" ? "default" : "secondary"}>
                              {record.status === "P" ? "Present" : "Absent"}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No attendance records yet</p>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Loading attendance data...</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}
