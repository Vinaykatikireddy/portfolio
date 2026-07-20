export interface NavChild {
  path: string
  name: string
  icon: string
}

export interface NavItem {
  name: string
  icon: string
  path?: string
  children?: NavChild[]
}

export const navigationItems: NavItem[] = [
  { name: 'Dashboard', icon: 'fa-tachometer-alt', path: '/dashboard' },
  {
    name: 'Students', icon: 'fa-users',
    children: [
      { name: 'Search Students', icon: 'fa-search', path: '/students-section' },
      { name: 'Add Student', icon: 'fa-user-plus', path: '/add-student' },
    ],
  },
  { name: 'Take Attendance', icon: 'fa-clipboard-check', path: '/take-attendance' },
  {
    name: 'Faculty', icon: 'fa-chalkboard-teacher',
    children: [
      { name: 'Manage Faculty', icon: 'fa-user-tie', path: '/manage-faculty' },
      { name: 'Add Faculty', icon: 'fa-user-plus', path: '/add-faculty' },
      { name: 'Manage Subjects', icon: 'fa-book', path: '/manage-subjects' },
      { name: 'Manage Assignments', icon: 'fa-clipboard-list', path: '/faculty-assignments' },
    ],
  },
  { name: 'Profile', icon: 'fa-user', path: '/profile' },
]