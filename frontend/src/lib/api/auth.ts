// lib/api/auth.ts

import { apiClient } from './client'
import type { LoginResponse, User } from '../types'

export const authApi = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>(
      '/auth/login',
      { email, password },
      { headers: { skipAuth: true } } as never
    )

    apiClient.setTokens(response.access_token, response.refresh_token)

    return response
  },

  logout: (): void => {
    apiClient.clearTokens()
  },

  verifyToken: async (): Promise<User> => {
    return apiClient.get<User>('/auth/verify')
  },

  changePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
    return apiClient.post('/auth/change-password', {
      current_password: currentPassword,
      new_password: newPassword,
    })
  },
}
