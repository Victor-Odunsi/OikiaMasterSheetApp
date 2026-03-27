"use client"

import { useEffect, useState, useCallback } from "react"
import { format } from "date-fns"
import {
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Shield,
  ShieldOff,
  Key,
  Loader2,
} from "lucide-react"
import { toast } from "sonner"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

import { DashboardHeader } from "@/components/layout/dashboard-header"
import { PageHeader } from "@/components/layout/page-header"
import { ProtectedRoute } from "@/components/auth/protected-route"
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Empty } from "@/components/ui/empty"
import { FieldGroup, Field, FieldLabel, FieldError } from "@/components/ui/field"
import { usersApi } from "@/lib/api/users"
import type { User, UserCreateData } from "@/lib/types"

const userSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["admin", "usher"], { required_error: "Please select a role" }),
})

type UserFormData = z.infer<typeof userSchema>

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [resetPasswordId, setResetPasswordId] = useState<string | null>(null)
  const [newPassword, setNewPassword] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      email: "",
      password: "",
      role: undefined,
    },
  })

  const selectedRole = watch("role")

  const fetchUsers = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await usersApi.getAll()
      setUsers(response.items)
    } catch (error) {
      toast.error("Failed to load users")
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const handleCreateUser = async (data: UserFormData) => {
    setIsSubmitting(true)
    try {
      await usersApi.create(data as UserCreateData)
      toast.success("User created successfully")
      setCreateDialogOpen(false)
      reset()
      fetchUsers()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create user")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteUser = async () => {
    if (!deleteId) return

    setIsSubmitting(true)
    try {
      await usersApi.delete(deleteId)
      toast.success("User deleted successfully")
      setDeleteId(null)
      fetchUsers()
    } catch (error) {
      toast.error("Failed to delete user")
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleToggleActive = async (user: User) => {
    try {
      if (user.is_active) {
        await usersApi.deactivate(user.id)
        toast.success("User deactivated")
      } else {
        await usersApi.activate(user.id)
        toast.success("User activated")
      }
      fetchUsers()
    } catch (error) {
      toast.error("Failed to update user status")
      console.error(error)
    }
  }

  const handleResetPassword = async () => {
    if (!resetPasswordId || !newPassword) return

    setIsSubmitting(true)
    try {
      await usersApi.resetPassword(resetPasswordId, newPassword)
      toast.success("Password reset successfully")
      setResetPasswordId(null)
      setNewPassword("")
    } catch (error) {
      toast.error("Failed to reset password")
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <ProtectedRoute requireAdmin>
      <DashboardHeader breadcrumbs={[{ label: "User Management" }]} />
      <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
        <PageHeader
          title="User Management"
          description="Manage system users and their permissions"
          actions={
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-4 w-4" />
              Add User
            </Button>
          }
        />

        {/* Users Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Created</TableHead>
                <TableHead className="w-[70px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton className="h-4 w-48" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-16" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-16" />
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-8 w-8" />
                    </TableCell>
                  </TableRow>
                ))
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5}>
                    <Empty className="py-12">
                      <Empty.Icon />
                      <Empty.Title>No users found</Empty.Title>
                      <Empty.Description>
                        Get started by adding your first user
                      </Empty.Description>
                      <Empty.Actions>
                        <Button onClick={() => setCreateDialogOpen(true)}>
                          <Plus className="h-4 w-4" />
                          Add User
                        </Button>
                      </Empty.Actions>
                    </Empty>
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.is_active ? "default" : "outline"}>
                        {user.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {format(new Date(user.created_at), "MMM d, yyyy")}
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
                          <DropdownMenuItem onClick={() => setResetPasswordId(user.id)}>
                            <Key className="mr-2 h-4 w-4" />
                            Reset Password
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggleActive(user)}>
                            {user.is_active ? (
                              <>
                                <ShieldOff className="mr-2 h-4 w-4" />
                                Deactivate
                              </>
                            ) : (
                              <>
                                <Shield className="mr-2 h-4 w-4" />
                                Activate
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => setDeleteId(user.id)}
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
      </div>

      {/* Create User Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
            <DialogDescription>
              Add a new user to the system. They will receive login credentials.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(handleCreateUser)}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="user@example.com"
                  aria-invalid={!!errors.email}
                  {...register("email")}
                />
                {errors.email && <FieldError>{errors.email.message}</FieldError>}
              </Field>

              <Field>
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <Input
                  id="password"
                  type="password"
                  placeholder="Minimum 8 characters"
                  aria-invalid={!!errors.password}
                  {...register("password")}
                />
                {errors.password && <FieldError>{errors.password.message}</FieldError>}
              </Field>

              <Field>
                <FieldLabel htmlFor="role">Role</FieldLabel>
                <Select
                  value={selectedRole}
                  onValueChange={(value: "admin" | "usher") => setValue("role", value)}
                >
                  <SelectTrigger id="role" className="w-full" aria-invalid={!!errors.role}>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="usher">Usher</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
                {errors.role && <FieldError>{errors.role.message}</FieldError>}
              </Field>
            </FieldGroup>
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create User"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={!!resetPasswordId} onOpenChange={() => setResetPasswordId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Enter a new password for this user.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Field>
              <FieldLabel htmlFor="newPassword">New Password</FieldLabel>
              <Input
                id="newPassword"
                type="password"
                placeholder="Minimum 8 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </Field>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetPasswordId(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleResetPassword}
              disabled={isSubmitting || newPassword.length < 8}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Resetting...
                </>
              ) : (
                "Reset Password"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this user? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              disabled={isSubmitting}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {isSubmitting ? (
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
    </ProtectedRoute>
  )
}
