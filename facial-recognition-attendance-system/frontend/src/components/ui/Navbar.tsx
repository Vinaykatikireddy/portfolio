import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { navigationItems } from '../../constants/navigation'

interface NavbarProps {
  user?: {
    username: string
    role?: string
  } | null
  onLogout?: () => void
}

export const Navbar: React.FC<NavbarProps> = ({ user, onLogout }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [openMobileGroups, setOpenMobileGroups] = useState<Set<string>>(new Set())
  const location = useLocation()
  const navigate = useNavigate()

  const isChildActive = (children?: Array<{ path: string }>) =>
    children?.some(child => location.pathname === child.path) ?? false

  const toggleMobileGroup = (name: string) => {
    setOpenMobileGroups(prev => {
      if (prev.has(name)) {
        return new Set();
      }
      return new Set([name]);
    })
  }

  const handleLogout = () => {
    localStorage.removeItem('auth')
    localStorage.removeItem('user')
    onLogout?.()
    navigate('/login')
  }

  const getInitials = (username?: string) => {
    if (!username) return 'no username'
    return username.toUpperCase()
  }

  return (
    <nav className="bg-fras-navy-gradient backdrop-blur-xl border-b border-fras-gold shadow-2xl sticky top-0 z-40">
      <div className="max-w-[1400px] mx-auto px-5 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="text-2xl font-bold bg-fras-gold-gradient bg-clip-text text-transparent flex items-center">
            <i className="fas fa-graduation-cap mr-2" />
            <span className="md:hidden">FRAS</span>
            <span className="hidden md:inline">Facial Recognition Attendance System</span>
          </div>


          {/* Mobile menu toggle */}
          <div className="flex items-center gap-3">
          <button
            className="md:hidden text-fras-gold text-2xl"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            ☰
          </button>
          <button
              onClick={() => navigate('/profile')}
              className="md:hidden w-10 h-10 bg-white/6 text-fras-gold border border-fras-gold rounded-lg flex items-center justify-center hover:bg-white/20 transition-colors"
              title="Profile"
            >
              <i className="fas fa-user" />
            </button>
          <button
              onClick={handleLogout}
              className="md:hidden w-10 h-10 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg flex items-center justify-center hover:shadow-lg transition-all"
              title="Logout"
            >
              <i className="fas fa-sign-out-alt" />
            </button>
            </div>

          {/* Desktop user section */}
          <div className="hidden md:flex items-center gap-3">
            <div className="bg-white/6 text-white pr-[15px] rounded-lg font-medium">
              {getInitials(user?.username)}
            </div>
            <button
              onClick={() => navigate('/profile')}
              className="w-10 h-10 bg-white/6 text-fras-gold border border-fras-gold rounded-lg flex items-center justify-center hover:bg-white/20 transition-colors"
              title="Profile"
            >
              <i className="fas fa-user" />
            </button>
            <button
              onClick={handleLogout}
              className="w-10 h-10 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg flex items-center justify-center hover:shadow-lg transition-all"
              title="Logout"
            >
              <i className="fas fa-sign-out-alt" />
            </button>
          </div>
        </div>

        {/* Mobile navigation */}
        <div
          className={`md:hidden flex flex-col gap-2 overflow-hidden transition-all duration-300 ${
            isMenuOpen
              ? 'max-h-150 mt-3 opacity-100 translate-y-0'
              : 'max-h-0 opacity-0 -translate-y-2'
          }`}
        >
          {navigationItems.map((item) => {
            if (!item.children) {
              const isActive = location.pathname === item.path
              return (
                <Link
                  key={item.path}
                  to={item.path!}
                  onClick={() => setIsMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all duration-300 ${
                    isActive
                      ? 'bg-fras-gold-gradient text-white'
                      : 'text-white bg-white/6 border border-fras-gold'
                  }`}
                >
                  <i className={`fas ${item.icon}`} />
                  {item.name}
                </Link>
              )
            }

            const isOpen = openMobileGroups.has(item.name)
            const groupActive = isChildActive(item.children)

            return (
              <div key={item.name}>
                <button
                  onClick={() => toggleMobileGroup(item.name)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all duration-300 w-full text-left ${
                    groupActive
                      ? 'bg-fras-gold-gradient text-white'
                      : 'text-white bg-white/6 border border-fras-gold'
                  }`}
                >
                  <i className={`fas ${item.icon}`} />
                  <span className="flex-1">{item.name}</span>
                  <i className={`fas fa-chevron-${isOpen ? 'down' : 'right'} text-xs`} />
                </button>
                <div className={`overflow-hidden transition-all duration-300 ${
                  isOpen ? 'max-h-64 opacity-100 mt-1' : 'max-h-0 opacity-0'
                }`}>
                  <div className="flex flex-col gap-1 pl-8">
                    {item.children.map((child) => {
                      const isChildActive = location.pathname === child.path
                      return (
                        <Link
                          key={child.path}
                          to={child.path}
                          onClick={() => setIsMenuOpen(false)}
                          className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                            isChildActive
                              ? 'text-fras-gold bg-white/10 border-l-[3px] border-fras-gold'
                              : 'text-white/70 hover:text-fras-gold hover:bg-white/5'
                          }`}
                        >
                          <i className={`fas ${child.icon} w-4`} />
                          {child.name}
                        </Link>
                      )
                    })}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
