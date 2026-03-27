"use client"

import { useEffect, useState, useCallback } from "react"
import { format, subDays } from "date-fns"
import { Calendar as CalendarIcon, Download } from "lucide-react"
import { toast } from "sonner"

import { DashboardHeader } from "@/components/layout/dashboard-header"
import { PageHeader } from "@/components/layout/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Skeleton } from "@/components/ui/skeleton"
import { Empty } from "@/components/ui/empty"
import { attendanceApi } from "@/lib/api/attendance"
import type { AttendanceSummary } from "@/lib/types"

export default function AttendanceHistoryPage() {
  const [summaries, setSummaries] = useState<AttendanceSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [startDate, setStartDate] = useState<Date>(subDays(new Date(), 30))
  const [endDate, setEndDate] = useState<Date>(new Date())

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await attendanceApi.getSummary(
        format(startDate, "yyyy-MM-dd"),
        format(endDate, "yyyy-MM-dd")
      )
      setSummaries(data)
    } catch (error) {
      toast.error("Failed to load attendance history")
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }, [startDate, endDate])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleExport = () => {
    const csvContent = [
      ["Date", "Total Members", "Present", "Absent", "Attendance Rate"],
      ...summaries.map((s) => [
        s.date,
        s.total_members,
        s.present,
        s.absent,
        `${s.attendance_rate}%`,
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `attendance-history-${format(startDate, "yyyy-MM-dd")}-to-${format(endDate, "yyyy-MM-dd")}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <>
      <DashboardHeader
        breadcrumbs={[
          { label: "Attendance", href: "/attendance" },
          { label: "History" },
        ]}
      />
      <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
        <PageHeader
          title="Attendance History"
          description="View historical attendance records"
          actions={
            <Button variant="outline" onClick={handleExport} disabled={summaries.length === 0}>
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          }
        />

        {/* Date Range Filter */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">From:</span>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-[200px] justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(startDate, "PPP")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={(date) => date && setStartDate(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">To:</span>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-[200px] justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(endDate, "PPP")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={(date) => date && setEndDate(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Summary Cards */}
        {!isLoading && summaries.length > 0 && (
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Services
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{summaries.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Average Attendance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {Math.round(summaries.reduce((acc, s) => acc + s.present, 0) / summaries.length)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Highest Attendance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {Math.max(...summaries.map((s) => s.present))}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Average Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {Math.round(summaries.reduce((acc, s) => acc + s.attendance_rate, 0) / summaries.length)}%
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* History Table */}
        <Card>
          <CardHeader>
            <CardTitle>Daily Records</CardTitle>
            <CardDescription>
              Attendance records from {format(startDate, "MMM d, yyyy")} to {format(endDate, "MMM d, yyyy")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {[...Array(10)].map((_, i) => (
                  <Skeleton key={i} className="h-12" />
                ))}
              </div>
            ) : summaries.length === 0 ? (
              <Empty className="py-12">
                <Empty.Icon />
                <Empty.Title>No records found</Empty.Title>
                <Empty.Description>
                  No attendance records exist for the selected date range
                </Empty.Description>
              </Empty>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Total Members</TableHead>
                    <TableHead className="text-right">Present</TableHead>
                    <TableHead className="text-right">Absent</TableHead>
                    <TableHead className="text-right">Attendance Rate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {summaries.map((summary) => (
                    <TableRow key={summary.date}>
                      <TableCell className="font-medium">
                        {format(new Date(summary.date), "EEEE, MMM d, yyyy")}
                      </TableCell>
                      <TableCell className="text-right">{summary.total_members}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant="default">{summary.present}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="secondary">{summary.absent}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge
                          variant={
                            summary.attendance_rate >= 70
                              ? "default"
                              : summary.attendance_rate >= 50
                              ? "secondary"
                              : "outline"
                          }
                        >
                          {summary.attendance_rate}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  )
}
