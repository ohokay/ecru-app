import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'

interface OTPRequestFormProps {
  onOTPRequested: (email: string, otpId: string) => void
  title?: string
}

export function OTPRequestForm({ onOTPRequested, title = "Enter your email" }: OTPRequestFormProps) {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const { requestOTP, isLoading } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    if (!email.trim()) {
      setError('Email is required')
      return
    }

    try {
      const response = await requestOTP(email)
      onOTPRequested(email, response.otpId)
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP. Please try again.')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="auth-form">
      <h2>{title}</h2>
      
      {error && <div className="error">{error}</div>}
      
      <div className="form-group">
        <label htmlFor="email">Email:</label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email address"
          required
        />
      </div>
      
      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Sending...' : 'Send OTP Code'}
      </button>
      
      <p className="otp-info">
        We'll send a one-time password to your email address
      </p>
    </form>
  )
}