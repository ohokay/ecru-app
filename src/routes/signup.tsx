import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { OTPVerificationForm } from '../components/OTPVerificationForm'

export const Route = createFileRoute('/signup')({
  component: SignupComponent,
})

function SignupComponent() {
  const [step, setStep] = useState<'signup' | 'verify'>('signup')
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [otpId, setOtpId] = useState('')
  const [error, setError] = useState('')
  const { signup, requestOTP, isLoading } = useAuth()

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    if (!email.trim()) {
      setError('Email is required')
      return
    }

    try {
      await signup(email, name)
      // After successful signup, request OTP
      const otpResponse = await requestOTP(email)
      setOtpId(otpResponse.otpId)
      setStep('verify')
    } catch (err: any) {
      setError(err.message || 'Signup failed. Please try again.')
    }
  }

  const handleResend = (newOtpId: string) => {
    setOtpId(newOtpId)
  }

  const handleBack = () => {
    setStep('signup')
    setOtpId('')
  }

  if (step === 'verify') {
    return (
      <div className="auth-page">
        <OTPVerificationForm 
          email={email}
          otpId={otpId}
          onBack={handleBack}
          onResend={handleResend}
        />
        <p>
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    )
  }

  return (
    <div className="auth-page">
      <form onSubmit={handleSignup} className="auth-form">
        <h2>Create Account</h2>
        
        {error && <div className="error">{error}</div>}
        
        <div className="form-group">
          <label htmlFor="name">Name (optional):</label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name"
          />
        </div>
        
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
          {isLoading ? 'Creating Account...' : 'Create Account & Send OTP'}
        </button>
        
        <p className="otp-info">
          We'll send a verification code to complete your registration
        </p>
      </form>
      
      <p>
        Already have an account? <Link to="/login">Login</Link>
      </p>
    </div>
  )
}