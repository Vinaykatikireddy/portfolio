import { useState } from 'react'
import { Button, Input, Modal, useToast } from '../components/ui/'
import { authApi } from '../services/api'
import { getApiErrorMessage } from '../services/api'
import { getPasswordError } from '../utils/validators'
import type { User } from '../types'

const Profile = () => {
  const toast = useToast()
  const [user] = useState<User>(() => {
    const userData = localStorage.getItem('user')
    return userData ? JSON.parse(userData) : { username: 'Admin' }
  })
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false)
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('Passwords do not match')
      toast.warning('Passwords do not match')
      return
    }

    const passwordError = getPasswordError(passwordForm.newPassword)
    if (passwordError) {
      setError(passwordError)
      toast.warning(passwordError)
      return
    }

    if (!passwordForm.currentPassword) {
      toast.warning('Please enter current password')
      return
    }

    setLoading(true)
    try {
      await authApi.changePassword(passwordForm.currentPassword, passwordForm.newPassword)
      toast.success('Password changed successfully!')
      setIsPasswordModalOpen(false)
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      })
    } catch (err: any) {
      console.error('Password change error:', err)
      const message = getApiErrorMessage(err)
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fade-in-up">
      <h1 className="text-4xl font-bold text-white mb-8 flex items-center gap-3">
        <i className="fas fa-user text-fras-gold" />
        Profile
      </h1>

      <div className="max-w-2xl mx-auto">
        {/* Profile Card */}
        <div className="bg-white rounded-lg shadow-2xl p-8">
          <div className="flex items-center gap-6 mb-8">
            <div className="w-24 h-24 bg-fras-gold-gradient rounded-full flex items-center justify-center text-4xl font-bold text-white">
              {user.username?.charAt(0).toUpperCase() || 'A'}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">{user.username}</h2>
              <p className="text-gray-500">Administrator</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4 py-3 border-b border-gray-200">
              <span className="font-medium text-gray-600">Username</span>
              <span className="col-span-2 text-gray-800">{user.username}</span>
            </div>
            <div className="grid grid-cols-3 gap-4 py-3 border-b border-gray-200">
              <span className="font-medium text-gray-600">Role</span>
              <span className="col-span-2 text-gray-800">Administrator</span>
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            <Button
              variant="primary"
              onClick={() => setIsPasswordModalOpen(true)}
            >
              <i className="fas fa-key mr-2" />
              Change Password
            </Button>
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      <Modal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        title={
          <>
            <i className="fas fa-key text-fras-gold" />
            <span>Change Password</span>
          </>
        }
        footer={
          <>
            <Button
              variant="secondary"
              className="text-yellow-500"
              onClick={() => setIsPasswordModalOpen(false)}
              type="button"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                const form = document.getElementById('passwordForm') as HTMLFormElement | null
                form?.submit()
              }}
              type="button"
              isLoading={loading}
            >
              <i className="fas fa-save mr-2" />
              Update Password
            </Button>
          </>
        }
      >
        <form id="passwordForm" onSubmit={handleChangePassword} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}
          <Input
            label="Current Password"
            type="password"
            value={passwordForm.currentPassword}
            onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
            required
          />
          <Input
            label="New Password"
            type="password"
            value={passwordForm.newPassword}
            onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
            helperText="Min 6 chars, include uppercase, lowercase, and number"
            required
          />
          <Input
            label="Confirm New Password"
            type="password"
            value={passwordForm.confirmPassword}
            onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
            required
          />
        </form>
      </Modal>
    </div>
  )
}

export default Profile