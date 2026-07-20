import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

interface SidebarChild {
  path: string
  name: string
  icon: string
}

interface SidebarItem {
  name: string
  icon: string
  path?: string
  children?: SidebarChild[]
}

interface SidebarProps {
  items: SidebarItem[]
}

export const Sidebar: React.FC<SidebarProps> = ({ items }) => {
  const location = useLocation()
  const [openGroups, setOpenGroups] = useState<Set<string>>(() => {
    // Auto-open the group that contains the current path
    const currentGroup = items.find(
      item => item.children?.some(child => child.path === location.pathname)
    )
    return currentGroup ? new Set([currentGroup.name]) : new Set()
  })

  const toggleGroup = (name: string) => {
    setOpenGroups(prev => {
      if (prev.has(name)) {
        return new Set();
      }
      return new Set([name]);
    })
  }

  const isChildActive = (children?: SidebarChild[]) =>
    children?.some(child => location.pathname === child.path) ?? false

  return (
    <div className="bg-fras-navy backdrop-blur-xl p-6 border border-fras-gold rounded-lg shadow-2xl h-fit">
      <nav className="flex flex-col gap-2">
        {items.map((item) => {
          // Plain link (no children)
          if (!item.children) {
            const isActive = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path!}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all duration-300 w-full text-left ${
                  isActive
                    ? 'bg-fras-gold-gradient text-white'
                    : 'bg-white/6 text-white border-[1px] border-l-[4px] border-fras-gold hover:text-fras-gold hover:translate-x-1'
                }`}
              >
                <i className={`fas ${item.icon}`} />
                {item.name}
              </Link>
            )
          }

          // Dropdown group
          const isOpen = openGroups.has(item.name)
          const groupActive = isChildActive(item.children)

          return (
            <div key={item.name}>
              <button
                onClick={() => toggleGroup(item.name)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all duration-300 w-full text-left ${
                  groupActive
                    ? 'bg-fras-gold-gradient text-white'
                    : 'bg-white/6 text-white border-[1px] border-l-[4px] border-fras-gold hover:text-fras-gold'
                }`}
              >
                <i className={`fas ${item.icon}`} />
                <span className="flex-1">{item.name}</span>
                <i className={`fas fa-chevron-${isOpen ? 'down' : 'right'} text-xs transition-transform`} />
              </button>

              <div
                className={`overflow-hidden transition-all duration-300 ${
                  isOpen ? 'max-h-64 opacity-100 mt-2' : 'max-h-0 opacity-0'
                }`}
              >
                <div className="flex flex-col gap-1 pl-10">
                  {item.children.map((child) => {
                    const isActive = location.pathname === child.path
                    return (
                      <Link
                        key={child.path}
                        to={child.path}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                          isActive
                            ? 'bg-fras-gold/20 text-fras-gold border-l-[3px] border-fras-gold'
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
      </nav>
    </div>
  )
}