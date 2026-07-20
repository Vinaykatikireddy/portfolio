import React from 'react'
import type { Toast } from '../../types'

interface ToastContainerProps {
  toasts: Toast[]
  onRemove: (id: string) => void
}

export const ToastContainer: React.FC<ToastContainerProps> = ({
  toasts,
  onRemove,
}) => {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col-reverse gap-3">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`
            relative overflow-hidden
            flex items-center gap-3
            min-w-[320px]
            px-4 py-3
            rounded-full
            border
            backdrop-blur-md
            bg-slate-900/95
            shadow-[0_0_25px_rgba(212,175,55,0.25)]
            animate-slide-in-right
            transition-all duration-500

            ${ toast.type === 'success' ? 'border-[#66FF00]/40 text-[#66FF00]' : '' }

            ${ toast.type === 'error' ? 'border-red-500/40 text-red-100' : '' }

            ${ toast.type === 'warning' ? 'border-amber-500/40 text-amber-100' : '' }

            ${ toast.type === 'info' ? 'border-blue-500/40 text-blue-100' : '' }
          `}
        >
          {/* Icon */}
          <div
            className={`
              flex h-7 w-7 shrink-0 items-center justify-center rounded-full

              ${ toast.type === 'success' ? 'bg-[#66FF00]/20 text-[#66FF00]' : '' }

              ${ toast.type === 'error' ? 'bg-red-500/20 text-red-400' : '' }

              ${ toast.type === 'warning' ? 'bg-amber-500/20 text-amber-400' : '' }

              ${ toast.type === 'info' ? 'bg-blue-500/20 text-blue-400' : '' }
              
            `}
          >
            <i className={`fas ${getToastIcon(toast.type)}`} />
          </div>

          {/* Message */}
          <span className="flex-1 text-sm font-medium">
            {toast.message}
          </span>

          {/* Close Button */}
          <button
            onClick={() => onRemove(toast.id)}
            className="
              rounded-full
              p-1.5
              text-white/50
              transition-all
              hover:bg-white/10
              hover:text-white
            "
            aria-label="Close notification"
          >
            <i className="fas fa-times text-xs" />
          </button>

          {/* Progress Bar */}
          <div className="absolute bottom-0 left-0 h-[2px] w-full bg-white/5">
            <div
              className={`
                h-full animate-toast-progress

                ${ toast.type === 'success' ? 'bg-[#66FF00]' : '' }

                ${ toast.type === 'error' ? 'bg-red-400' : '' }

                ${ toast.type === 'warning' ? 'bg-amber-400' : '' }

                ${ toast.type === 'info' ? 'bg-blue-400' : '' }
              `}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

const getToastIcon = (type: Toast['type']): string => {
  switch (type) {
    case 'success': return 'fa-check-circle'

    case 'error':   return 'fa-exclamation-circle'

    case 'warning': return 'fa-exclamation-triangle'

    case 'info':    return 'fa-info-circle'

    default:        return 'fa-info-circle'
  }
}

// Hook for managing toasts
export const useToast = () => {
  const addToast = (
    message: string,
    type: Toast['type'] = 'info',
    duration: number = 1500
  ) => {
    const id = crypto.randomUUID()

    const toast: Toast = {
      id,
      message,
      type,
    }

    window.dispatchEvent(
      new CustomEvent('toast', {
        detail: { toast, duration },
      })
    )

    return id
  }

  const success = (message: string, duration?: number) =>
    addToast(message, 'success', duration)

  const error = (message: string, duration?: number) =>
    addToast(message, 'error', duration)

  const warning = (message: string, duration?: number) =>
    addToast(message, 'warning', duration)

  const info = (message: string, duration?: number) =>
    addToast(message, 'info', duration)

  return {
    success,
    error,
    warning,
    info,
  }
}

// Animations
const style = document.createElement('style')

style.textContent = `
  @keyframes slide-in-right {
    from {
      transform: translateX(100%) scale(0.95);
      opacity: 0;
    }

    to {
      transform: translateX(0) scale(1);
      opacity: 1;
    }
  }

  @keyframes toast-progress {
    from {
      width: 100%;
    }

    to {
      width: 0%;
    }
  }

  .animate-slide-in-right {
    animation: slide-in-right 0.2s ease-out;
  }

  .animate-toast-progress {
    animation: toast-progress 1.5s linear forwards !important;
  }
`

if (!document.getElementById('toast-styles')) {
  style.id = 'toast-styles'
  document.head.appendChild(style)
}
