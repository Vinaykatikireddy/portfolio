import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authApi } from '../services/api'
import { getApiErrorMessage } from '../services/api'
import { Button, Input, useToast } from '../components/ui/'

const Login = () => {
  const navigate = useNavigate()
  const toast = useToast()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!formData.username.trim()) {
      toast.warning('Please enter your username')
      return
    }

    if (!formData.password) {
      toast.warning('Please enter your password')
      return
    }

    setLoading(true)

    try {
      const response = await authApi.login(formData.username, formData.password)
      
      const token = response.data.access_token
      if (!token) {
        throw new Error('No authentication token received')
      }

      localStorage.setItem('auth', token)
      localStorage.setItem(
        'user',
        JSON.stringify({
          username: formData.username,
        })
      )
      
      toast.success("Login successful!");
      navigate('/dashboard');

    } catch (err: any) {
      console.error('Login error:', err)
      
      if (err.response?.status === 401) {
        setError('Invalid username or password')
        toast.error('Invalid username or password')
      } else {
        const message = getApiErrorMessage(err)
        setError(message)
        toast.error(message)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-fras-gradient">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-2xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="text-4xl font-bold bg-fras-gold-gradient bg-clip-text text-transparent mb-2">
              FRAS
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Sign in to your account</h2>
            <p className="text-gray-600 mt-2">
              Don't have an account?{' '}
              <Link to="/register" className="text-fras-gold hover:underline font-medium">
                Create one
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
              placeholder="Enter your username"
              required
            />
            <Input
              label="Password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
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
                  <i className="fas fa-spin mr-2" />
                  Signing in...
                </>
              ) : (
                <>
                  <i className="fas fa-sign-in-alt mr-2" />
                  Sign In
                </>
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Login