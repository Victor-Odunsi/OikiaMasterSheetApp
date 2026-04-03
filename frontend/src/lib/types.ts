// lib/types.ts

export interface User {
  id: number
  email: string
  role: 'admin' | 'usher'
  is_active: boolean
  created_at?: string
  last_login?: string
}

export interface LoginResponse {
  access_token: string
  refresh_token: string
  user: User
}

export interface Member {
  id: string
  surname: string
  first_name: string
  phone: string
  email?: string
  address?: string
  location: string
  unit: string
  sex: 'Male' | 'Female'
  role: string
  date: string
  attendance?: Record<string, string>
}

export interface AttendanceRecord {
  id: string
  member_id: string
  date: string
  status: 'P' | ''
  check_in_time?: string
  member?: Member
}

export interface DashboardStats {
  total_members: number
  todays_attendance: number
  attendance_rate: number
  recent_registrations: number
}

export interface AttendanceTrend {
  date: string
  count: number
  day: string
}

export interface ApiError {
  detail: string
}

export interface MemberFormData {
  surname: string
  first_name: string
  phone: string
  email?: string
  address?: string
  location: string
  unit: string
  sex: 'Male' | 'Female'
  role: string
  date: string
}

export interface UserFormData {
  email: string
  password?: string
  role: 'admin' | 'usher'
  is_active?: boolean
}

export interface ChangePasswordData {
  current_password: string
  new_password: string
  confirm_password: string
}

export interface ForgotPasswordData {
  email: string
}

export interface ResetPasswordData {
  token: string
  new_password: string
  confirm_password: string
}
