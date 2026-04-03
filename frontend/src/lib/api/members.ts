// lib/api/members.ts

import { apiClient } from './client'
import type { Member, MemberFormData } from '../types'

export const membersApi = {
  getAll: async (): Promise<Member[]> => {
    return apiClient.get<Member[]>('/members/')
  },

  search: async (query: string): Promise<Member[]> => {
    return apiClient.get<Member[]>(`/members/search?q=${encodeURIComponent(query)}`)
  },

  getById: async (id: string): Promise<Member> => {
    return apiClient.get<Member>(`/members/${id}`)
  },

  create: async (data: MemberFormData): Promise<Member> => {
    return apiClient.post<Member>('/members/', data)
  },

  update: async (id: string, data: Partial<MemberFormData>): Promise<Member> => {
    return apiClient.put<Member>(`/members/${id}`, data)
  },

  refreshCache: async (): Promise<{ message: string }> => {
    return apiClient.post<{ message: string }>('/members/cache/refresh')
  },
}
