// Validation utilities for form inputs

/**
 * Validates Indian mobile number (10 digits, starts with 6-9)
 */
export const isValidPhone = (phone: string): boolean => {
  const cleaned = phone.replace(/\s+/g, '')
  return /^[6-9]\d{9}$/.test(cleaned)
}

/**
 * Validates email format
 */
export const isValidEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}


/**
 * Returns password validation error message
 */
export const getPasswordError = (password: string): string | null => {
  if (password.length < 6) {
    return 'Password must be at least 6 characters'
  }
  if (!/[A-Z]/.test(password)) {
    return 'Password must contain at least one uppercase letter'
  }
  if (!/[a-z]/.test(password)) {
    return 'Password must contain at least one lowercase letter'
  }
  if (!/\d/.test(password)) {
    return 'Password must contain at least one number'
  }
  return null
}

