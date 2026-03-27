"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { FieldGroup, Field, FieldLabel, FieldError } from "@/components/ui/field"
import type { Member, MemberCreateData } from "@/lib/types"

const memberSchema = z.object({
  surname: z.string().min(1, "Surname is required"),
  first_name: z.string().min(1, "First name is required"),
  phone: z.string().min(10, "Phone must be at least 10 digits"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  date: z.string().min(4, "Year joined is required"),
  role: z.string().min(1, "Role is required"),
  location: z.string().min(1, "Location is required"),
  unit: z.string().min(1, "Unit is required"),
  sex: z.enum(["Male", "Female"], { required_error: "Gender is required" }),
  address: z.string().optional(),
})

type MemberFormData = z.infer<typeof memberSchema>

interface MemberFormProps {
  member?: Member
  onSubmit: (data: MemberCreateData) => Promise<void>
  isSubmitting: boolean
}

const roles = ["Member", "Usher", "Deacon", "Deaconess", "Elder", "Pastor", "Choir", "Worker"]
const units = ["Unit A", "Unit B", "Unit C", "Unit D", "Unit E", "Main", "Youth", "Children"]
const locations = ["Main Branch", "North Branch", "South Branch", "East Branch", "West Branch"]

export function MemberForm({ member, onSubmit, isSubmitting }: MemberFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<MemberFormData>({
    resolver: zodResolver(memberSchema),
    defaultValues: member
      ? {
          surname: member.surname,
          first_name: member.first_name,
          phone: member.phone,
          email: member.email || "",
          date: member.date,
          role: member.role,
          location: member.location,
          unit: member.unit,
          sex: member.sex,
          address: member.address || "",
        }
      : {
          surname: "",
          first_name: "",
          phone: "",
          email: "",
          date: new Date().getFullYear().toString(),
          role: "",
          location: "",
          unit: "",
          sex: undefined,
          address: "",
        },
  })

  const selectedSex = watch("sex")
  const selectedRole = watch("role")
  const selectedUnit = watch("unit")
  const selectedLocation = watch("location")

  const handleFormSubmit = async (data: MemberFormData) => {
    const submitData: MemberCreateData = {
      ...data,
      email: data.email || undefined,
      address: data.address || undefined,
    }
    await onSubmit(submitData)
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <FieldGroup>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="first_name">First Name</FieldLabel>
            <Input
              id="first_name"
              placeholder="Enter first name"
              aria-invalid={!!errors.first_name}
              {...register("first_name")}
            />
            {errors.first_name && <FieldError>{errors.first_name.message}</FieldError>}
          </Field>

          <Field>
            <FieldLabel htmlFor="surname">Surname</FieldLabel>
            <Input
              id="surname"
              placeholder="Enter surname"
              aria-invalid={!!errors.surname}
              {...register("surname")}
            />
            {errors.surname && <FieldError>{errors.surname.message}</FieldError>}
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="phone">Phone Number</FieldLabel>
            <Input
              id="phone"
              type="tel"
              placeholder="Enter phone number"
              aria-invalid={!!errors.phone}
              {...register("phone")}
            />
            {errors.phone && <FieldError>{errors.phone.message}</FieldError>}
          </Field>

          <Field>
            <FieldLabel htmlFor="email">Email (Optional)</FieldLabel>
            <Input
              id="email"
              type="email"
              placeholder="Enter email address"
              aria-invalid={!!errors.email}
              {...register("email")}
            />
            {errors.email && <FieldError>{errors.email.message}</FieldError>}
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="sex">Gender</FieldLabel>
            <Select
              value={selectedSex}
              onValueChange={(value: "Male" | "Female") => setValue("sex", value)}
            >
              <SelectTrigger id="sex" className="w-full" aria-invalid={!!errors.sex}>
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Male">Male</SelectItem>
                <SelectItem value="Female">Female</SelectItem>
              </SelectContent>
            </Select>
            {errors.sex && <FieldError>{errors.sex.message}</FieldError>}
          </Field>

          <Field>
            <FieldLabel htmlFor="date">Year Joined</FieldLabel>
            <Input
              id="date"
              type="number"
              min="1900"
              max={new Date().getFullYear()}
              placeholder="Enter year"
              aria-invalid={!!errors.date}
              {...register("date")}
            />
            {errors.date && <FieldError>{errors.date.message}</FieldError>}
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field>
            <FieldLabel htmlFor="role">Role</FieldLabel>
            <Select value={selectedRole} onValueChange={(value) => setValue("role", value)}>
              <SelectTrigger id="role" className="w-full" aria-invalid={!!errors.role}>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                {roles.map((role) => (
                  <SelectItem key={role} value={role}>
                    {role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.role && <FieldError>{errors.role.message}</FieldError>}
          </Field>

          <Field>
            <FieldLabel htmlFor="unit">Unit</FieldLabel>
            <Select value={selectedUnit} onValueChange={(value) => setValue("unit", value)}>
              <SelectTrigger id="unit" className="w-full" aria-invalid={!!errors.unit}>
                <SelectValue placeholder="Select unit" />
              </SelectTrigger>
              <SelectContent>
                {units.map((unit) => (
                  <SelectItem key={unit} value={unit}>
                    {unit}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.unit && <FieldError>{errors.unit.message}</FieldError>}
          </Field>

          <Field>
            <FieldLabel htmlFor="location">Location</FieldLabel>
            <Select value={selectedLocation} onValueChange={(value) => setValue("location", value)}>
              <SelectTrigger id="location" className="w-full" aria-invalid={!!errors.location}>
                <SelectValue placeholder="Select location" />
              </SelectTrigger>
              <SelectContent>
                {locations.map((location) => (
                  <SelectItem key={location} value={location}>
                    {location}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.location && <FieldError>{errors.location.message}</FieldError>}
          </Field>
        </div>

        <Field>
          <FieldLabel htmlFor="address">Address (Optional)</FieldLabel>
          <Textarea
            id="address"
            placeholder="Enter address"
            rows={3}
            {...register("address")}
          />
        </Field>
      </FieldGroup>

      <div className="flex justify-end gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {member ? "Updating..." : "Creating..."}
            </>
          ) : member ? (
            "Update Member"
          ) : (
            "Create Member"
          )}
        </Button>
      </div>
    </form>
  )
}
