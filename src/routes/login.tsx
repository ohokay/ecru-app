import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { OTPRequestForm } from '../components/OTPRequestForm'
import { OTPVerificationForm } from '../components/OTPVerificationForm'

export const Route = createFileRoute('/login')({
  component: LoginComponent,
})

function LoginComponent() {
  const [step, setStep] = useState<'request' | 'verify'>('request')
  const [email, setEmail] = useState('')
  const [otpId, setOtpId] = useState('')

  const handleOTPRequested = (userEmail: string, userOtpId: string) => {
    setEmail(userEmail)
    setOtpId(userOtpId)
    setStep('verify')
  }

  const handleResend = (newOtpId: string) => {
    setOtpId(newOtpId)
  }

  const handleBack = () => {
    setStep('request')
    setEmail('')
    setOtpId('')
  }

  return (
    <div className="auth-page">
      {step === 'request' ? (
        <OTPRequestForm 
          onOTPRequested={handleOTPRequested}
          title="Sign in to your account"
        />
      ) : (
        <OTPVerificationForm 
          email={email}
          otpId={otpId}
          onBack={handleBack}
          onResend={handleResend}
        />
      )}
      
      <p>
        Don't have an account? <Link to="/signup">Sign up</Link>
      </p>
    </div>
  )
}