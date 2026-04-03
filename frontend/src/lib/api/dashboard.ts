// lib/api/dashboard.ts

import { apiClient } from './client'
import type { DashboardStats, Member, AttendanceRecord, AttendanceTrend } from '../types'

export const dashboardApi = {
  getStats: async (): Promise<DashboardStats> => {
    return apiClient.get<DashboardStats>('/dashboard/stats')
  },

  getRecentMembers: async (limit: number = 5): Promise<Member[]> => {
    return apiClient.get<Member[]>(`/dashboard/recent-members?limit=${limit}`)
  },

  getRecentAttendance: async (limit: number = 5): Promise<AttendanceRecord[]> => {
    return apiClient.get<AttendanceRecord[]>(`/dashboard/recent-attendance?limit=${limit}`)
  },

  getAttendanceTrend: async (days: number = 7): Promise<AttendanceTrend[]> => {
    return apiClient.get<AttendanceTrend[]>(`/dashboard/attendance-trend?days=${days}`)
  },
}
