// lib/api/client.ts

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

class ApiClient {
  private client: AxiosInstance

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Request interceptor - add token to headers
    this.client.interceptors.request.use(
      (config) => {
        const token = this.getToken()
        if (token && !(config.headers as Record<string, unknown>).skipAuth) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      (error) => Promise.reject(error)
    )

    // Response interceptor - handle 401 errors
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true

          const refreshed = await this.refreshToken()
          if (refreshed) {
            const token = this.getToken()
            if (token) {
              originalRequest.headers.Authorization = `Bearer ${token}`
              return this.client(originalRequest)
            }
          } else {
            if (typeof window !== 'undefined') {
              this.clearTokens()
              window.location.href = '/login'
            }
          }
        }

        return Promise.reject(error)
      }
    )
  }

  private getToken(): string | null {
    if (typeof window === 'undefined') return null
    return localStorage.getItem('access_token')
  }

  private getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null
    return localStorage.getItem('refresh_token')
  }

  setTokens(accessToken: string, refreshToken: string): void {
    if (typeof window === 'undefined') return
    localStorage.setItem('access_token', accessToken)
    localStorage.setItem('refresh_token', refreshToken)
  }

  clearTokens(): void {
    if (typeof window === 'undefined') return
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
  }

  private async refreshToken(): Promise<boolean> {
    const refreshToken = this.getRefreshToken()
    if (!refreshToken) return false

    try {
      const response = await this.client.post(
        '/auth/refresh',
        { refresh_token: refreshToken },
        { headers: { skipAuth: true } } as AxiosRequestConfig
      )

      this.setTokens(response.data.access_token, response.data.refresh_token)
      return true
    } catch {
      this.clearTokens()
      return false
    }
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.client.get(url, config)
    return response.data
  }

  async post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.client.post(url, data, config)
    return response.data
  }

  async put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.client.put(url, data, config)
    return response.data
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.client.delete(url, config)
    return response.data
  }
}

export const apiClient = new ApiClient()
