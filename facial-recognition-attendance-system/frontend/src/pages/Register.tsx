import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authApi } from '../services/api'
import { getApiErrorMessage } from '../services/api'
import { Button, Input, useToast } from '../components/ui/'
import { isValidEmail, getPasswordError } from '../utils/validators'

const Register = () => {
  const navigate = useNavigate()
  const toast = useToast()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validation
    if (!formData.username.trim()) {
      toast.warning('Please enter a username')
      return
    }

    if (!isValidEmail(formData.email)) {
      toast.warning('Please enter a valid email address')
      return
    }

    const passwordError = getPasswordError(formData.password)
    if (passwordError) {
      toast.warning(passwordError)
      return
    }

    if (formData.password !== formData.confirmPassword) {
      toast.warning('Passwords do not match')
      return
    }

    setLoading(true)
    try {
      await authApi.register(formData.username, formData.email, formData.password )

      toast.success('Registration successful! Please login.')
      navigate('/login')
    } catch (err: any) {
      console.error('Registration error:', err)
      const message = getApiErrorMessage(err)
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-2xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="text-4xl font-bold bg-fras-gold-gradient bg-clip-text text-transparent mb-2">
              FRAS
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Create Account</h2>
            <p className="text-gray-600 mt-2">
              Already have an account?{' '}
              <Link to="/login" className="text-fras-gold hover:underline font-medium">
                Sign in
              </Link>
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Username"
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Choose a username"
              required
            />
            <Input
              label="Email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="your@email.com"
              required
            />
            <Input
              label="Password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Create a password"
              helperText="Min 6 chars, include uppercase, lowercase, and number"
              required
            />
            <Input
              label="Confirm Password"
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm your password"
              required
            />

            <Button
              type="submit"
              variant="primary"
              isLoading={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2" />
                  Creating account...
                </>
              ) : (
                <>
                  <i className="fas fa-user-plus mr-2" />
                  Create Account
                </>
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Register