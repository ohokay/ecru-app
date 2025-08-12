import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useRouter } from '@tanstack/react-router'

interface OTPVerificationFormProps {
  email: string
  otpId: string
  onBack: () => void
  onResend?: (newOtpId: string) => void
}

export function OTPVerificationForm({ email, otpId, onBack, onResend }: OTPVerificationFormProps) {
  const [otpCode, setOtpCode] = useState('')
  const [error, setError] = useState('')
  const { verifyOTP, requestOTP, isLoading } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    if (!otpCode.trim()) {
      setError('OTP code is required')
      return
    }

    try {
      await verifyOTP(otpId, otpCode)
      router.navigate({ to: '/' })
    } catch (err: any) {
      setError(err.message || 'Invalid OTP code. Please try again.')
    }
  }

  const handleResend = async () => {
    setError('')
    try {
      const response = await requestOTP(email)
      setOtpCode('')
      if (onResend) {
        onResend(response.otpId)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to resend OTP. Please try again.')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="auth-form">
      <h2>Verify OTP Code</h2>
      
      <p className="otp-info">
        We sent a verification code to <strong>{email}</strong>
      </p>
      
      {error && <div className="error">{error}</div>}
      
      <div className="form-group">
        <label htmlFor="otpCode">Enter 6-digit code:</label>
        <input
          type="text"
          id="otpCode"
          value={otpCode}
          onChange={(e) => setOtpCode(e.target.value)}
          placeholder="00000000"
          maxLength={8}
          minLength={8}
          className="otp-input"
          required
        />
      </div>
      
      <button type="submit" disabled={isLoading || otpCode.length !== 8}>
        {isLoading ? 'Verifying...' : 'Verify & Sign In'}
      </button>
      
      <div className="otp-actions">
        <button type="button" onClick={handleResend} disabled={isLoading} className="link-button">
          Resend code
        </button>
        <button type="button" onClick={onBack} className="link-button">
          Use different email
        </button>
      </div>
    </form>
  )
}