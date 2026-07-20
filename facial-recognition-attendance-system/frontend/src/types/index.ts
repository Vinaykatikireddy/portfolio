// User & Auth Types
export interface User {
  username: string
  email?: string
  role?: string
}

export interface LoginResponse {
  access_token: string
  token_type: string
}

export interface RegisterData {
  username: string
  email: string
  password: string
}

export interface ChangePasswordData {
  currentPassword: string
  newPassword: string
}

export interface Student {
  id: number
  name: string
  regid: string
  gender: string
  email: string
  mobile: string
  dob: string
  programme: string
  semester: string
  regulation: string
  batch: string
  father_mobile: string
  lab_section: string
  class_section: string
  residence: string
  image?: string
}

export interface StudentFormData {
  name: string
  regid: string
  gender: string
  email: string
  mobile: string
  dob: string
  programme: string
  semester: string
  regulation: string
  batch: string
  fatherMobile: string
  lab_section: string
  class_section: string
  residence: string
  embedding?: string
}

// Attendance Types
export interface AttendanceRecord {
  total_working_periods: number
  attended_periods: number
  attendance_percentage: number
}

export interface DashboardStats {
  todayPresent: number
  totalStudents: number
  attendanceRate: number
  classesToday: number
}

export interface ApiError {
  response?: {
    status: number
    data?: {
      error?: string
      message?: string
    }
  }
  message: string
  code?: string
}

export interface CapturedImage {
  id: string
  blob: Blob
  url: string
}

export interface CameraHandle {
  open: () => void
  close: () => void
  getImages: () => CapturedImage[]
  clearImages: () => void
}

export interface DropdownOption {
  value: string
  label: string
}

export interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'info' | 'warning'
}