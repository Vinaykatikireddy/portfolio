import React from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'success' | 'danger' | 'secondary'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
  children: React.ReactNode
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  children,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles = 'rounded-lg font-semibold transition-all duration-300 inline-flex items-center gap-2 hover:-translate-y-1 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none'
  
  const variantStyles = {
    primary: 'bg-fras-blue text-white px-6 py-3',
    success: 'bg-fras-gold-gradient text-white px-6 py-3',
    danger: 'bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-3',
    secondary: 'bg-white/10 border border-fras-gold px-6 py-3 hover:bg-white/20'
  }
  
  const sizeStyles = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg'
  }

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && <i className="fas fa-spinner fa-spin" />}
      {children}
    </button>
  )
}