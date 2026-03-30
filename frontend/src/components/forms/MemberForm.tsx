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
  location: z.string().min(1, 'Location is required'),
  unit: z.string().min(1, 'Unit is required'),
  sex: z.enum(['Male', 'Female']),
  role: z.string().min(1, 'Role is required'),
  date: z.string().min(1, 'Date is required'),
})

type FormData = z.infer<typeof schema>

interface MemberFormProps {
  defaultValues?: Partial<Member>
  onSubmit: (data: MemberFormData) => Promise<void>
  submitLabel?: string
}

const SEX_OPTIONS = [
  { value: '', label: 'Select sex' },
  { value: 'Male', label: 'Male' },
  { value: 'Female', label: 'Female' },
]

const UNIT_OPTIONS = [
  { value: '', label: 'Select unit' },
  { value: 'Choir', label: 'Choir' },
  { value: 'Ushers', label: 'Ushers' },
  { value: 'Media', label: 'Media' },
  { value: 'Security', label: 'Security' },
  { value: 'Protocol', label: 'Protocol' },
  { value: 'Sanctuary', label: 'Sanctuary' },
  { value: 'Children', label: 'Children' },
  { value: 'Youth', label: 'Youth' },
  { value: 'General', label: 'General' },
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
          label="Location"
          placeholder="City, State"
          error={errors.location?.message}
          required
          {...register('location')}
        />
        <Select
          label="Unit"
          options={UNIT_OPTIONS}
          error={errors.unit?.message}
          required
          {...register('unit')}
        />
        <Select
          label="Sex"
          options={SEX_OPTIONS}
          error={errors.sex?.message}
          required
          {...register('sex')}
        />
        <Input
          label="Role / Position"
          placeholder="Member, Leader, etc."
          error={errors.role?.message}
          required
          {...register('role')}
        />
        <Input
          label="Date Joined"
          type="date"
          error={errors.date?.message}
          required
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
