import React from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  className = '',
  id,
  ...props
}) => {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-gray-600 mb-2">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`w-full px-3 py-2 border-2 rounded-lg text-base transition-all duration-300 bg-white/80 ${
          error 
            ? 'border-red-500 focus:border-red-500 focus:ring-red-100' 
            : 'border-gray-200 focus:border-blue-500 focus:ring-blue-100'
        } focus:outline-none focus:shadow-[0_0_0_3px_rgba(102,126,234,0.1)] -translate-y-0.5 ${className}`}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
      {helperText && !error && <p className="mt-1 text-sm text-gray-500">{helperText}</p>}
    </div>
  )
}