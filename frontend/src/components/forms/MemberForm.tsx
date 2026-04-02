'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button, Input, Select } from '@/components/ui'
import type { Member, MemberFormData } from '@/lib/types'

const schema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  surname: z.string().min(1, 'Surname is required'),
  phone: z.string().min(6, 'Valid phone number required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  address: z.string().optional().default(''),
  location: z.string().optional().default(''),
  unit: z.string().optional().default(''),       // open text, not required
  sex: z.enum(['Male', 'Female']),
  role: z.string().min(1, 'Role is required'),   // dropdown, required
  date: z.string().optional().default(''),
})

type FormData = z.infer<typeof schema>

interface MemberFormProps {
  defaultValues?: Partial<Member>
  onSubmit: (data: MemberFormData) => Promise<void>
  submitLabel?: string
}

const SEX_OPTIONS = [
  { value: 'Male', label: 'Male' },
  { value: 'Female', label: 'Female' },
]

const ROLE_OPTIONS = [
  { value: '', label: 'Select role' },
  { value: '1-Pastor', label: '1-Pastor' },
  { value: '2-Worker', label: '2-Worker' },
  { value: '2b-Visiting Worker', label: '2b-Visiting Worker' },
  { value: '3-Members', label: '3-Members' },
  { value: '4-Attendee', label: '4-Attendee' },
  { value: '5-Firstimer', label: '5-Firstimer' },
  { value: '6-Visitors', label: '6-Visitors' },
  { value: '7-Archived', label: '7-Archived' },
  { value: '8-AnotherBranch', label: '8-AnotherBranch' },
  { value: '9-NoContact', label: '9-NoContact' },
  { value: '10- Invalid Contact', label: '10-Invalid Contact' },
  { value: '11-Volunteer', label: '11-Volunteer' },
  { value: '12-Non-Reachable', label: '12-Non-Reachable' },
  { value: '13-Student', label: '13-Student' },
]

export function MemberForm({ defaultValues, onSubmit, submitLabel = 'Save Member' }: MemberFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      first_name: defaultValues?.first_name ?? '',
      surname: defaultValues?.surname ?? '',
      phone: defaultValues?.phone ?? '',
      email: defaultValues?.email ?? '',
      address: defaultValues?.address ?? '',
      location: defaultValues?.location ?? '',
      unit: defaultValues?.unit ?? '',
      sex: defaultValues?.sex ?? 'Male',
      role: defaultValues?.role ?? '',
      date: defaultValues?.date ? defaultValues.date.split('T')[0] : new Date().toISOString().split('T')[0],
    },
  })

  const handleFormSubmit = async (data: FormData) => {
    await onSubmit({
      ...data,
      email: data.email || undefined,
    } as MemberFormData)
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <Input
          label="First Name"
          placeholder="John"
          error={errors.first_name?.message}
          required
          {...register('first_name')}
        />
        <Input
          label="Surname"
          placeholder="Doe"
          error={errors.surname?.message}
          required
          {...register('surname')}
        />
        <Input
          label="Phone"
          type="tel"
          placeholder="+234 800 000 0000"
          error={errors.phone?.message}
          required
          {...register('phone')}
        />
        <Input
          label="Email"
          type="email"
          placeholder="john@example.com"
          error={errors.email?.message}
          {...register('email')}
        />
        <Input
          label="Address"
          placeholder="Street address"
          error={errors.address?.message}
          {...register('address')}
        />
        <Input
          label="Location"
          placeholder="City, State"
          error={errors.location?.message}
          {...register('location')}
        />
        {/* Unit: open text field, not required */}
        <Input
          label="Unit"
          placeholder="e.g. Choir, Ushers, Media…"
          error={errors.unit?.message}
          {...register('unit')}
        />
        <Select
          label="Sex"
          options={SEX_OPTIONS}
          error={errors.sex?.message}
          required
          {...register('sex')}
        />
        {/* Role: dropdown with values from sheet */}
        <Select
          label="Role"
          options={ROLE_OPTIONS}
          error={errors.role?.message}
          required
          {...register('role')}
        />
        <Input
          label="Date Joined"
          type="date"
          error={errors.date?.message}
          {...register('date')}
        />
      </div>

      <div className="pt-2">
        <Button type="submit" loading={isSubmitting} size="lg">
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}
