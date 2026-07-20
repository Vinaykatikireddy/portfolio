import axios, { AxiosError } from 'axios'
import type { ApiError } from '../types'

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL

if (!API_BASE_URL) {
  console.warn('VITE_BACKEND_URL not set, using default vinaykatikireddy-face-recognition.hf.space')
}

const api = axios.create({
  baseURL: API_BASE_URL || 'https://vinaykatikireddy-portfolio.hf.space/fras/api/',
  //baseURL: 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiError>) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth')
      localStorage.removeItem('user')
      window.location.href = '/fras/login'
    }
    return Promise.reject(error)
  }
)

// Extract user-friendly error message from API response
export const getApiErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ error?: string; message?: string }>
    return axiosError.response?.data?.error || 
           axiosError.response?.data?.message ||
           axiosError.message || 
           'An unexpected error occurred'
  }
  if (error instanceof Error) {
    return error.message
  }
  return 'An unexpected error occurred'
}

// Auth APIs
export const authApi = {
  login: (username: string, password: string) => {
    const formData = new URLSearchParams()
    formData.append('username', username)
    formData.append('password', password)
    
    return api.post('/auth/login', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })
  },

   register: (username: string, email: string, password: string ) => {
    const formData = new URLSearchParams()
    formData.append('username', username)
    formData.append('password', password)
    formData.append('email', email)
    console.log(username, email, password)
    return api.post('/auth/register', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
  },

  changePassword: (currentPassword: string, newPassword: string) => api.post('/change-password', { currentPassword, newPassword }),
}

// Student APIs
export const studentApi = {
  search: (query: string) => api.get(`/students/${encodeURIComponent(query)}`),

  filter: (params: { programme?: string; batch?: string; section?: string; semester?: string }) => api.get('/students/filter', { params }),

  create: (formData: FormData) => api.post('/students', formData, { headers: { 'Content-Type': 'multipart/form-data'} }),
  
  update: (formData: FormData) => api.post('/update-students', formData, {headers: { 'Content-Type': 'multipart/form-data'} }),

  delete: (regid: string) => api.delete(`/students/${encodeURIComponent(regid)}`),
  
  generateEmbedding: (formData: FormData) => api.post('/generate-embedding', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
}

// Attendance APIs
export const attendanceApi = {
  submit: (data: { class: string; period: number; students: { regid: string; status: number }[] }) => {
    console.log(data);
    return api.post('/attendance', data);
  },

  getAttendanceSummary: (regid: string) => api.get(`/attendance/summary/${encodeURIComponent(regid)}`),

  recognize: (images: Blob[]) => {
    const formData = new FormData()
    images.forEach((img) => formData.append("images", img))
    return api.post('/attendance/recognize', formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
  },
}

// Dashboard APIs
export const dashboardApi = {
  getStats: () => api.get("/api/dashboard")
}

export default api
