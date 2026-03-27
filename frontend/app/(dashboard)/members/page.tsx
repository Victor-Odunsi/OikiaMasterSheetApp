"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Search, Plus, MoreHorizontal, Eye, Pencil, Trash2, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { DashboardHeader } from "@/components/layout/dashboard-header"
import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { Empty } from "@/components/ui/empty"
import { membersApi } from "@/lib/api/members"
import type { Member } from "@/lib/types"

const ITEMS_PER_PAGE = 20

export default function MembersPage() {
  const router = useRouter()
  const [members, setMembers] = useState<Member[]>([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [locationFilter, setLocationFilter] = useState<string>("")
  const [unitFilter, setUnitFilter] = useState<string>("")
  const [page, setPage] = useState(0)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const fetchMembers = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await membersApi.getAll({
        skip: page * ITEMS_PER_PAGE,
        limit: ITEMS_PER_PAGE,
        search: search || undefined,
        location: locationFilter || undefined,
        unit: unitFilter || undefined,
      })
      setMembers(response.items)
      setTotal(response.total)
    } catch (error) {
      toast.error("Failed to load members")
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }, [page, search, locationFilter, unitFilter])

  useEffect(() => {
    const debounce = setTimeout(fetchMembers, 300)
    return () => clearTimeout(debounce)
  }, [fetchMembers])

  const handleDelete = async () => {
    if (!deleteId) return

    setIsDeleting(true)
    try {
      await membersApi.delete(deleteId)
      toast.success("Member deleted successfully")
      setDeleteId(null)
      fetchMembers()
    } catch (error) {
      toast.error("Failed to delete member")
      console.error(error)
    } finally {
      setIsDeleting(false)
    }
  }

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE)

  return (
    <>
      <DashboardHeader breadcrumbs={[{ label: "Members" }]} />
      <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
        <PageHeader
          title="Members"
          description={`${total} total members registered`}
          actions={
            <Button asChild>
              <Link href="/members/new">
                <Plus className="h-4 w-4" />
                Add Member
              </Link>
            </Button>
          }
        />

        {/* Filters */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name, phone, or email..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(0)
              }}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Select
              value={locationFilter}
              onValueChange={(value) => {
                setLocationFilter(value === "all" ? "" : value)
                setPage(0)
              }}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                <SelectItem value="Main Branch">Main Branch</SelectItem>
                <SelectItem value="North Branch">North Branch</SelectItem>
                <SelectItem value="South Branch">South Branch</SelectItem>
                <SelectItem value="East Branch">East Branch</SelectItem>
                <SelectItem value="West Branch">West Branch</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={unitFilter}
              onValueChange={(value) => {
                setUnitFilter(value === "all" ? "" : value)
                setPage(0)
              }}
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Unit" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Units</SelectItem>
                <SelectItem value="Unit A">Unit A</SelectItem>
                <SelectItem value="Unit B">Unit B</SelectItem>
                <SelectItem value="Unit C">Unit C</SelectItem>
                <SelectItem value="Unit D">Unit D</SelectItem>
                <SelectItem value="Main">Main</SelectItem>
                <SelectItem value="Youth">Youth</SelectItem>
                <SelectItem value="Children">Children</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="hidden sm:table-cell">Phone</TableHead>
                <TableHead className="hidden md:table-cell">Unit</TableHead>
                <TableHead className="hidden lg:table-cell">Location</TableHead>
                <TableHead className="hidden md:table-cell">Role</TableHead>
                <TableHead className="w-[70px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [...Array(10)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <div className="space-y-1">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-24 sm:hidden" />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Skeleton className="h-5 w-16" />
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Skeleton className="h-5 w-16" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-8 w-8" />
                    </TableCell>
                  </TableRow>
                ))
              ) : members.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6}>
                    <Empty className="py-12">
                      <Empty.Icon />
                      <Empty.Title>No members found</Empty.Title>
                      <Empty.Description>
                        {search || locationFilter || unitFilter
                          ? "Try adjusting your search or filters"
                          : "Get started by adding your first member"}
                      </Empty.Description>
                      {!search && !locationFilter && !unitFilter && (
                        <Empty.Actions>
                          <Button asChild>
                            <Link href="/members/new">
                              <Plus className="h-4 w-4" />
                              Add Member
                            </Link>
                          </Button>
                        </Empty.Actions>
                      )}
                    </Empty>
                  </TableCell>
                </TableRow>
              ) : (
                members.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                          {member.first_name[0]}{member.surname[0]}
                        </div>
                        <div>
                          <p className="font-medium">
                            {member.first_name} {member.surname}
                          </p>
                          <p className="text-sm text-muted-foreground sm:hidden">
                            {member.phone}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">{member.phone}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge variant="secondary">{member.unit}</Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">{member.location}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge variant="outline">{member.role}</Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon-sm">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => router.push(`/members/${member.id}`)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => router.push(`/members/${member.id}/edit`)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setDeleteId(member.id)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {page * ITEMS_PER_PAGE + 1} to {Math.min((page + 1) * ITEMS_PER_PAGE, total)} of {total} members
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= totalPages - 1}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this member? This action cannot be undone.
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
    </>
  )
}
