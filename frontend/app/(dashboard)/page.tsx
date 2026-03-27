"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { format } from "date-fns"
import { Users, ClipboardCheck, UserPlus, TrendingUp, ArrowRight, Clock } from "lucide-react"
import { toast } from "sonner"

import { DashboardHeader } from "@/components/layout/dashboard-header"
import { PageHeader } from "@/components/layout/page-header"
import { StatCard } from "@/components/dashboard/stat-card"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { dashboardApi } from "@/lib/api/dashboard"
import type { DashboardStats, Member, AttendanceWithMember } from "@/lib/types"

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentMembers, setRecentMembers] = useState<Member[]>([])
  const [recentAttendance, setRecentAttendance] = useState<AttendanceWithMember[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsData, membersData, attendanceData] = await Promise.all([
          dashboardApi.getStats(),
          dashboardApi.getRecentMembers(5),
          dashboardApi.getRecentAttendance(5),
        ])
        setStats(statsData)
        setRecentMembers(membersData)
        setRecentAttendance(attendanceData)
      } catch (error) {
        toast.error("Failed to load dashboard data")
        console.error(error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  const today = new Date()
  const formattedDate = format(today, "EEEE, MMMM d, yyyy")

  return (
    <>
      <DashboardHeader />
      <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
        <PageHeader
          title="Dashboard"
          description={formattedDate}
          actions={
            <div className="flex gap-2">
              <Button asChild variant="outline">
                <Link href="/members/new">
                  <UserPlus className="h-4 w-4" />
                  Add Member
                </Link>
              </Button>
              <Button asChild>
                <Link href="/attendance">
                  <ClipboardCheck className="h-4 w-4" />
                  Mark Attendance
                </Link>
              </Button>
            </div>
          }
        />

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {isLoading ? (
            <>
              {[...Array(4)].map((_, i) => (
                <Card key={i}>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-4" />
                  </CardHeader>
                  <CardContent className="pt-0">
                    <Skeleton className="h-8 w-16" />
                    <Skeleton className="mt-1 h-3 w-32" />
                  </CardContent>
                </Card>
              ))}
            </>
          ) : (
            <>
              <StatCard
                title="Total Members"
                value={stats?.total_members ?? 0}
                description="Registered church members"
                icon={Users}
              />
              <StatCard
                title="Today's Attendance"
                value={stats?.todays_attendance ?? 0}
                description="Members present today"
                icon={ClipboardCheck}
              />
              <StatCard
                title="Attendance Rate"
                value={`${stats?.attendance_rate ?? 0}%`}
                description="Average attendance"
                icon={TrendingUp}
              />
              <StatCard
                title="New Members"
                value={stats?.recent_registrations ?? 0}
                description="Registered this month"
                icon={UserPlus}
              />
            </>
          )}
        </div>

        {/* Recent Activity */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent Members */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Members</CardTitle>
                <CardDescription>Latest member registrations</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/members">
                  View all
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="flex-1 space-y-1">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : recentMembers.length > 0 ? (
                <div className="space-y-4">
                  {recentMembers.map((member) => (
                    <Link
                      key={member.id}
                      href={`/members/${member.id}`}
                      className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-muted"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                        {member.first_name[0]}{member.surname[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="truncate font-medium">
                          {member.first_name} {member.surname}
                        </p>
                        <p className="truncate text-sm text-muted-foreground">
                          {member.unit} - {member.location}
                        </p>
                      </div>
                      <Badge variant="secondary" className="shrink-0">
                        {member.role}
                      </Badge>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  No recent members
                </p>
              )}
            </CardContent>
          </Card>

          {/* Recent Attendance */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Attendance</CardTitle>
                <CardDescription>Latest check-ins today</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/attendance">
                  View all
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="flex-1 space-y-1">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : recentAttendance.length > 0 ? (
                <div className="space-y-4">
                  {recentAttendance.map((record) => (
                    <div
                      key={record.id}
                      className="flex items-center gap-3 rounded-lg p-2"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-sm font-medium text-green-700">
                        {record.member.first_name[0]}{record.member.surname[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="truncate font-medium">
                          {record.member.first_name} {record.member.surname}
                        </p>
                        <p className="truncate text-sm text-muted-foreground">
                          {record.member.unit}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {record.check_in_time
                          ? format(new Date(record.check_in_time), "h:mm a")
                          : "Present"}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  No attendance records today
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}
