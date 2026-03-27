"use client"

import { useEffect, useState, useCallback } from "react"
import { format } from "date-fns"
import {
  Search,
  Check,
  X,
  Clock,
  Users,
  TrendingUp,
  Loader2,
  LayoutGrid,
  List,
} from "lucide-react"
import { toast } from "sonner"

import { DashboardHeader } from "@/components/layout/dashboard-header"
import { PageHeader } from "@/components/layout/page-header"
import { StatCard } from "@/components/dashboard/stat-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Empty } from "@/components/ui/empty"
import { Toggle } from "@/components/ui/toggle"
import { membersApi } from "@/lib/api/members"
import { attendanceApi } from "@/lib/api/attendance"
import type { Member, AttendanceWithMember } from "@/lib/types"

type ViewMode = "grid" | "list"
type FilterMode = "all" | "present" | "absent"

export default function AttendancePage() {
  const [members, setMembers] = useState<Member[]>([])
  const [attendance, setAttendance] = useState<AttendanceWithMember[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [viewMode, setViewMode] = useState<ViewMode>("grid")
  const [filterMode, setFilterMode] = useState<FilterMode>("all")
  const [markingIds, setMarkingIds] = useState<Set<string>>(new Set())

  const fetchData = useCallback(async () => {
    try {
      const [membersData, attendanceData] = await Promise.all([
        membersApi.getAll({ limit: 1000 }),
        attendanceApi.getCurrent(),
      ])
      setMembers(membersData.items)
      setAttendance(attendanceData)
    } catch (error) {
      toast.error("Failed to load data")
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const getAttendanceForMember = (memberId: string) => {
    return attendance.find((a) => a.member_id === memberId)
  }

  const handleMarkAttendance = async (memberId: string) => {
    setMarkingIds((prev) => new Set(prev).add(memberId))
    try {
      const record = await attendanceApi.markAttendance(memberId, "P")
      // Update local state
      setAttendance((prev) => {
        const existing = prev.findIndex((a) => a.member_id === memberId)
        const member = members.find((m) => m.id === memberId)
        const newRecord: AttendanceWithMember = {
          ...record,
          member: member!,
        }
        if (existing >= 0) {
          const updated = [...prev]
          updated[existing] = newRecord
          return updated
        }
        return [...prev, newRecord]
      })
      toast.success("Attendance marked")
    } catch (error) {
      toast.error("Failed to mark attendance")
      console.error(error)
    } finally {
      setMarkingIds((prev) => {
        const next = new Set(prev)
        next.delete(memberId)
        return next
      })
    }
  }

  const handleCheckOut = async (attendanceId: string, memberId: string) => {
    setMarkingIds((prev) => new Set(prev).add(memberId))
    try {
      const record = await attendanceApi.checkOut(attendanceId)
      // Update local state
      setAttendance((prev) =>
        prev.map((a) =>
          a.id === attendanceId ? { ...a, ...record } : a
        )
      )
      toast.success("Check-out recorded")
    } catch (error) {
      toast.error("Failed to record check-out")
      console.error(error)
    } finally {
      setMarkingIds((prev) => {
        const next = new Set(prev)
        next.delete(memberId)
        return next
      })
    }
  }

  // Filter and search members
  const filteredMembers = members.filter((member) => {
    const matchesSearch =
      !search ||
      `${member.first_name} ${member.surname}`.toLowerCase().includes(search.toLowerCase()) ||
      member.phone.includes(search)

    if (!matchesSearch) return false

    const record = getAttendanceForMember(member.id)
    if (filterMode === "present") return record?.status === "P"
    if (filterMode === "absent") return !record || record.status !== "P"
    return true
  })

  const presentCount = attendance.filter((a) => a.status === "P").length
  const totalMembers = members.length
  const attendanceRate = totalMembers > 0 ? Math.round((presentCount / totalMembers) * 100) : 0
  const today = format(new Date(), "EEEE, MMMM d, yyyy")

  return (
    <>
      <DashboardHeader breadcrumbs={[{ label: "Attendance" }]} />
      <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
        <PageHeader
          title="Mark Attendance"
          description={today}
        />

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard
            title="Total Members"
            value={totalMembers}
            description="Registered members"
            icon={Users}
          />
          <StatCard
            title="Present Today"
            value={presentCount}
            description="Checked in"
            icon={Check}
          />
          <StatCard
            title="Attendance Rate"
            value={`${attendanceRate}%`}
            description="Today's rate"
            icon={TrendingUp}
          />
        </div>

        {/* Controls */}
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Members</CardTitle>
                <CardDescription>Click to mark attendance</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Toggle
                  pressed={viewMode === "grid"}
                  onPressedChange={() => setViewMode("grid")}
                  aria-label="Grid view"
                >
                  <LayoutGrid className="h-4 w-4" />
                </Toggle>
                <Toggle
                  pressed={viewMode === "list"}
                  onPressedChange={() => setViewMode("list")}
                  aria-label="List view"
                >
                  <List className="h-4 w-4" />
                </Toggle>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by name or phone..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Tabs value={filterMode} onValueChange={(v) => setFilterMode(v as FilterMode)}>
                <TabsList>
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="present">Present</TabsTrigger>
                  <TabsTrigger value="absent">Absent</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {isLoading ? (
              viewMode === "grid" ? (
                <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                  {[...Array(12)].map((_, i) => (
                    <Skeleton key={i} className="h-24 rounded-lg" />
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {[...Array(10)].map((_, i) => (
                    <Skeleton key={i} className="h-14" />
                  ))}
                </div>
              )
            ) : filteredMembers.length === 0 ? (
              <Empty className="py-12">
                <Empty.Icon />
                <Empty.Title>No members found</Empty.Title>
                <Empty.Description>
                  {search ? "Try adjusting your search" : "No members match the current filter"}
                </Empty.Description>
              </Empty>
            ) : viewMode === "grid" ? (
              <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {filteredMembers.map((member) => {
                  const record = getAttendanceForMember(member.id)
                  const isPresent = record?.status === "P"
                  const isMarking = markingIds.has(member.id)

                  return (
                    <button
                      key={member.id}
                      onClick={() => {
                        if (!isPresent) {
                          handleMarkAttendance(member.id)
                        } else if (record && !record.check_out_time) {
                          handleCheckOut(record.id, member.id)
                        }
                      }}
                      disabled={isMarking || (isPresent && !!record?.check_out_time)}
                      className={`flex flex-col items-center gap-2 rounded-lg border p-4 text-center transition-all ${
                        isPresent
                          ? "border-green-500 bg-green-50"
                          : "border-border bg-background hover:border-primary hover:bg-accent"
                      } ${isMarking ? "opacity-70" : ""} ${
                        isPresent && record?.check_out_time ? "cursor-default" : "cursor-pointer"
                      }`}
                    >
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium ${
                          isPresent
                            ? "bg-green-500 text-white"
                            : "bg-primary/10 text-primary"
                        }`}
                      >
                        {isMarking ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : isPresent ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          `${member.first_name[0]}${member.surname[0]}`
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-sm">
                          {member.first_name} {member.surname}
                        </p>
                        <p className="text-xs text-muted-foreground">{member.unit}</p>
                      </div>
                      {isPresent && record?.check_in_time && (
                        <div className="flex items-center gap-1 text-xs text-green-600">
                          <Clock className="h-3 w-3" />
                          {format(new Date(record.check_in_time), "h:mm a")}
                          {record.check_out_time && (
                            <span> - {format(new Date(record.check_out_time), "h:mm a")}</span>
                          )}
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead className="hidden sm:table-cell">Unit</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden sm:table-cell">Time</TableHead>
                    <TableHead className="w-[100px]">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMembers.map((member) => {
                    const record = getAttendanceForMember(member.id)
                    const isPresent = record?.status === "P"
                    const isMarking = markingIds.has(member.id)

                    return (
                      <TableRow key={member.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div
                              className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium ${
                                isPresent
                                  ? "bg-green-500 text-white"
                                  : "bg-primary/10 text-primary"
                              }`}
                            >
                              {isPresent ? (
                                <Check className="h-3 w-3" />
                              ) : (
                                `${member.first_name[0]}${member.surname[0]}`
                              )}
                            </div>
                            <div>
                              <p className="font-medium">
                                {member.first_name} {member.surname}
                              </p>
                              <p className="text-sm text-muted-foreground sm:hidden">
                                {member.unit}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <Badge variant="secondary">{member.unit}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={isPresent ? "default" : "outline"}>
                            {isPresent ? "Present" : "Absent"}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          {record?.check_in_time ? (
                            <span className="text-sm">
                              {format(new Date(record.check_in_time), "h:mm a")}
                              {record.check_out_time && (
                                <span className="text-muted-foreground">
                                  {" "}- {format(new Date(record.check_out_time), "h:mm a")}
                                </span>
                              )}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {!isPresent ? (
                            <Button
                              size="sm"
                              onClick={() => handleMarkAttendance(member.id)}
                              disabled={isMarking}
                            >
                              {isMarking ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Check className="h-3 w-3" />
                              )}
                              Check In
                            </Button>
                          ) : record && !record.check_out_time ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCheckOut(record.id, member.id)}
                              disabled={isMarking}
                            >
                              {isMarking ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <X className="h-3 w-3" />
                              )}
                              Check Out
                            </Button>
                          ) : (
                            <Badge variant="secondary">Done</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  )
}
