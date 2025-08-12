import { useState, useEffect } from 'react'
import { useRouteContext } from '@tanstack/react-router'
import type { UsersResponse } from '../../pocketbase-types'

export function useAuth() {
  const { pb } = useRouteContext({ from: '__root__' })
  const [user, setUser] = useState<UsersResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Initialize user from auth store
    setUser(pb.authStore.record as UsersResponse | null)
    setIsLoading(false)

    const unsubscribe = pb.authStore.onChange((_, record) => {
      setUser(record as UsersResponse | null)
    })

    return unsubscribe
  }, [pb.authStore])

  const requestOTP = async (email: string) => {
    setIsLoading(true)
    try {
      const otpResponse = await pb.collection('users').requestOTP(email)
      return { success: true, otpId: otpResponse.otpId }
    } catch (error) {
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const verifyOTP = async (otpId: string, otpCode: string) => {
    setIsLoading(true)
    try {
      const authData = await pb.collection('users').authWithOTP(otpId, otpCode)
      setUser(authData.record as UsersResponse)
      return authData
    } catch (error) {
      console.log(error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const signup = async (email: string, name?: string) => {
    setIsLoading(true)
    const randomPassword = Math.random().toString(36).substring(2, 15)
    try {
      const userData = {
        email,
        name: name || '',
        verified: false,
        password: randomPassword,
        passwordConfirm: randomPassword,
        // PocketBase will handle OTP-based verification
      }
      
      const record = await pb.collection('users').create(userData)
      return record
    } catch (error) {
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    pb.authStore.clear()
    setUser(null)
  }

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    requestOTP,
    verifyOTP,
    signup,
    logout,
  }
}