// lib/api/attendance.ts

import { apiClient } from './client'

function getTodayDDMMYYYY(): string {
  const now = new Date()
  const day = now.getDate().toString().padStart(2, '0')
  const month = (now.getMonth() + 1).toString().padStart(2, '0')
  const year = now.getFullYear()
  return `${day}/${month}/${year}`
}

export const attendanceApi = {
  getCurrent: async () => {
    return apiClient.get('/attendance/current')
  },

  // Backend schema: { member_id: str, date: str (DD/MM/YYYY), present: bool }
  markAttendance: async (memberId: string, status: 'P' | ''): Promise<{ message: string }> => {
    return apiClient.post<{ message: string }>('/attendance/mark', {
      member_id: memberId,
      date: getTodayDDMMYYYY(),
      present: status === 'P',
    })
  },

  // Backend schema: { member_ids: list[str], date: str (DD/MM/YYYY), present: bool }
  bulkMark: async (memberIds: string[], status: 'P' | ''): Promise<{ message: string }> => {
    return apiClient.post<{ message: string }>('/attendance/bulk-mark', {
      member_ids: memberIds,
      date: getTodayDDMMYYYY(),
      present: status === 'P',
    })
  },

  getHistory: async (memberId: string) => {
    return apiClient.get(`/attendance/history/${memberId}`)
  },
}
