// lib/api/users.ts

import { apiClient } from './client'
import type { User, UserFormData } from '../types'

export const usersApi = {
  getAll: async (): Promise<User[]> => {
    return apiClient.get<User[]>('/users/')
  },

  getById: async (id: number): Promise<User> => {
    return apiClient.get<User>(`/users/${id}`)
  },

  create: async (data: UserFormData): Promise<User> => {
    return apiClient.post<User>('/users/', data)
  },

  update: async (id: number, data: Partial<UserFormData>): Promise<User> => {
    return apiClient.put<User>(`/users/${id}`, data)
  },

  delete: async (id: number): Promise<void> => {
    return apiClient.delete<void>(`/users/${id}`)
  },
}
