import { useState, useEffect, useCallback, Suspense } from 'react'
import { Outlet, useLocation, useNavigate, Navigate } from 'react-router-dom'
import { Navbar, Sidebar, ToastContainer, useToast } from '../components/ui/'
import { navigationItems } from '../constants/navigation'

const Layout = () => {
  const [toasts, setToasts] = useState<Array<{ id: string; message: string; type: 'success' | 'error' | 'info' | 'warning' }>>([])
  const location = useLocation()
  const navigate = useNavigate()
  const toast = useToast()

  const user = (() => {
    const data = localStorage.getItem("user")
    return data ? JSON.parse(data) : null
  })()

  // Listen for toast events
  useEffect(() => {
    const handleToast = (e: Event) => {
      const customEvent = e as CustomEvent<{ toast: { id: string; message: string; type: string }; duration: number }>
      const { toast: toastData, duration } = customEvent.detail
      
      setToasts(prev => [...prev, { 
        id: toastData.id, 
        message: toastData.message, 
        type: toastData.type as 'success' | 'error' | 'info' | 'warning' 
      }])

      // Auto-remove after duration
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== toastData.id))
      }, duration)
    }

    window.addEventListener('toast', handleToast as EventListener)
    return () => window.removeEventListener('toast', handleToast as EventListener)
  }, [])

  const PageLoader = () => (
    <div className="flex h-[50vh] w-full items-center justify-center">
      <i className="fas fa-spinner fa-spin text-4xl text-amber-500" />
    </div>
  )

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('auth')
    localStorage.removeItem('user')
    toast.success('Logged out successfully')
    navigate('/login')
  }

  const sidebarItems = navigationItems

  // Show only navbar for login/register pages
  if (location.pathname === '/login' || location.pathname === '/register') {
    return (
      <>
        <Suspense fallback={<PageLoader />}>
          <Outlet />
        </Suspense>
        <ToastContainer toasts={toasts} onRemove={removeToast} />
      </>
    )
  }

  // Redirect to login if not authenticated
if (
  !localStorage.getItem("auth") &&
  location.pathname !== "/login" &&
  location.pathname !== "/register"
) {
  return <Navigate to="/login" replace />
}

  return (
    <>
      <div className="min-h-screen">
        <Navbar user={user} onLogout={handleLogout} />
        
        <div className="max-w-[1400px] mx-auto px-5 py-8">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Sidebar - Hidden on mobile */}
            <aside className="hidden md:block w-64 flex-shrink-0">
              <Sidebar items={sidebarItems} />
            </aside>

            {/* Main Content */}
            <main className="flex-1 min-w-0">
              <Suspense fallback={ <PageLoader />}>
                <Outlet />
              </Suspense>
            </main>
          </div>
        </div>
      </div>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </>
  )
}

export default Layout