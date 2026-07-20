import { useState, useEffect } from 'react'
import { dashboardApi } from '../services/api'
import { getApiErrorMessage } from '../services/api'
import type { DashboardStats } from '../types'

const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    todayPresent: 0,
    totalStudents: 0,
    attendanceRate: 0,
    classesToday: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await dashboardApi.getStats()
        setStats(response.data)
      } catch (err: any) {
        console.error('Failed to fetch dashboard stats:', err)
        setError(getApiErrorMessage(err))
      } finally {
        setLoading(false)
      }
    }
  fetchStats()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-4xl text-fras-gold mb-4" />
          <p className="text-white text-lg">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500 rounded-lg p-6 text-center">
        <i className="fas fa-exclamation-triangle text-4xl text-red-500 mb-4" />
        <p className="text-red-500 text-lg mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
        >
          Try Again
        </button>
      </div>
    )
  }

  const statCards = [
    {
      title: 'Present Today',
      value: stats.todayPresent,
      icon: 'fa-check-circle',
      color: '#4CAF50',
      bgColor: 'from-green-500/20 to-green-600/20',
    },
    {
      title: 'Total Students',
      value: stats.totalStudents,
      icon: 'fa-users',
      color: '#2196F3',
      bgColor: 'from-blue-500/20 to-blue-600/20',
    },
    {
      title: 'Avg Attendance',
      value: `${stats.attendanceRate}%`,
      icon: 'fa-calendar',
      color: '#FF9800',
      bgColor: 'from-orange-500/20 to-orange-600/20',
    },
    {
      title: 'Classes Today',
      value: stats.classesToday,
      icon: 'fa-chalkboard-teacher',
      color: '#9C27B0',
      bgColor: 'from-purple-500/20 to-purple-600/20',
    },
  ]

  return (
    <div className="fade-in-up">
      <h1 className="text-4xl font-bold text-white mb-8 flex items-center gap-3">
        <i className="fas fa-tachometer-alt text-fras-gold" />
        Dashboard
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <div
            key={stat.title}
            className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/10 hover:border-fras-gold/50 transition-colors"
          >
            <div className="flex items-center justify-between mb-4">
              <div
                className="w-12 h-12 rounded-lg flex items-center justify-center"
                style={{ background: `linear-gradient(135deg, ${stat.color}20, ${stat.color}40)` }}
              >
                <i className={`fas ${stat.icon} text-2xl`} style={{ color: stat.color }} />
              </div>
            </div>
            <div className={`bg-gradient-to-r ${stat.bgColor} p-4 rounded-lg`}>
              <p className="text-white/70 text-sm mb-1">{stat.title}</p>
              <p className="text-3xl font-bold text-white">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity Section - Placeholder for future implementation */}
      <div className="mt-8">
        <h2 className="text-2xl font-bold text-white mb-4">Recent Activity</h2>
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-8 border border-white/10 text-center">
          <i className="fas fa-history text-4xl text-white/30 mb-4" />
          <p className="text-white/50">Activity tracking coming soon</p>
        </div>
      </div>
    </div>
  )
}

export default Dashboard