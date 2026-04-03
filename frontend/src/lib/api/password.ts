// lib/api/password.ts

import { apiClient } from './client'

export const passwordApi = {
  forgotPassword: async (email: string): Promise<{ message: string }> => {
    return apiClient.post(
      '/password/forgot',
      { email },
      { headers: { skipAuth: true } } as never
    )
  },

  resetPassword: async (token: string, newPassword: string): Promise<{ message: string }> => {
    return apiClient.post(
      '/password/reset',
      { token, new_password: newPassword },
      { headers: { skipAuth: true } } as never
    )
  },

  verifyResetToken: async (token: string): Promise<{ valid: boolean }> => {
    return apiClient.get(
      `/password/verify-token/${token}`,
      { headers: { skipAuth: true } } as never
    )
  },
}
