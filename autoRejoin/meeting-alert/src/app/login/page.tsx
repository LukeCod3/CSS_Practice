/**
 * Login Page Component
 *
 * This is a CLIENT COMPONENT ('use client') because it:
 * - Uses React hooks (useState)
 * - Handles form interactions
 * - Manages loading states
 * - Uses the browser Supabase client for auth
 *
 * AUTHENTICATION FLOW:
 * 1. User enters email and password
 * 2. Click "Sign In" -> signInWithPassword -> redirects to /dashboard
 * 3. Click "Sign Up" -> signUp -> shows confirmation message (check email)
 *
 * ERROR HANDLING:
 * - Invalid credentials: "Invalid login credentials"
 * - Weak password: "Password should be at least 6 characters"
 * - Email not confirmed: "Email not confirmed"
 * - Network errors: Generic error message
 *
 * SECURITY:
 * - Passwords are never stored in state longer than needed
 * - Auth tokens are handled by Supabase client
 * - Forms use native HTML5 validation
 */

'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [isSigningIn, setIsSigningIn] = useState(false)
  const [isSigningUp, setIsSigningUp] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  /**
   * Handle Sign In
   *
   * Flow:
   * 1. Validate inputs (email, password)
   * 2. Call supabase.auth.signInWithPassword()
   * 3. On success: redirect to /dashboard
   * 4. On error: display error message
   *
   * Common errors:
   * - "Invalid login credentials" (wrong email/password)
   * - "Email not confirmed" (user hasn't verified email)
   */
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setMessage(null)
    setIsSigningIn(true)

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        // Handle specific error cases
        if (signInError.message.includes('Invalid login credentials')) {
          setError('Invalid email or password. Please try again.')
        } else if (signInError.message.includes('Email not confirmed')) {
          setError('Please confirm your email address before signing in.')
        } else {
          setError(signInError.message)
        }
        return
      }

      if (data.user) {
        // Successfully signed in - redirect to dashboard
        router.push('/dashboard')
        router.refresh() // Refresh server components
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
      console.error('Sign in error:', err)
    } finally {
      setIsSigningIn(false)
    }
  }

  /**
   * Handle Sign Up
   *
   * Flow:
   * 1. Validate inputs (email, password)
   * 2. Call supabase.auth.signUp()
   * 3. On success: show "Check your email" message
   * 4. On error: display error message
   *
   * IMPORTANT: By default, Supabase requires email confirmation.
   * Users will receive a confirmation email and must click the link
   * before they can sign in.
   *
   * Common errors:
   * - "Password should be at least 6 characters"
   * - "User already registered" (email exists)
   */
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setMessage(null)
    setIsSigningUp(true)

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          // Redirect user back to app after email confirmation
          emailRedirectTo: `${window.location.origin}/api/auth/callback`,
        },
      })

      if (signUpError) {
        // Handle specific error cases
        if (signUpError.message.includes('Password')) {
          setError('Password should be at least 6 characters.')
        } else if (signUpError.message.includes('already registered')) {
          setError('This email is already registered. Please sign in instead.')
        } else {
          setError(signUpError.message)
        }
        return
      }

      if (data.user) {
        // Successfully signed up
        setMessage(
          'Account created! Please check your email to confirm your account before signing in.'
        )
        // Clear form
        setEmail('')
        setPassword('')
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
      console.error('Sign up error:', err)
    } finally {
      setIsSigningUp(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-12">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900">Meeting Alert</h1>
          <p className="mt-2 text-sm text-gray-600">
            Monitor Google Meet meetings and get notified when participants join
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-xl shadow-lg p-8 space-y-6">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 text-center">
              Sign in to your account
            </h2>
            <p className="mt-2 text-sm text-gray-600 text-center">
              Or create a new account to get started
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {message && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-800">{message}</p>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSignIn} className="space-y-4">
            {/* Email Input */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                placeholder="you@example.com"
                disabled={isSigningIn || isSigningUp}
              />
            </div>

            {/* Password Input */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                placeholder="••••••••"
                disabled={isSigningIn || isSigningUp}
                minLength={6}
              />
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 pt-2">
              {/* Sign In Button */}
              <button
                type="submit"
                disabled={isSigningIn || isSigningUp}
                className="w-full bg-blue-600 text-white py-2.5 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {isSigningIn ? (
                  <span className="flex items-center justify-center">
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Signing in...
                  </span>
                ) : (
                  'Sign In'
                )}
              </button>

              {/* Sign Up Button */}
              <button
                type="button"
                onClick={handleSignUp}
                disabled={isSigningIn || isSigningUp}
                className="w-full bg-white text-blue-600 py-2.5 px-4 rounded-lg font-medium border-2 border-blue-600 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {isSigningUp ? (
                  <span className="flex items-center justify-center">
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-600"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Creating account...
                  </span>
                ) : (
                  'Create Account'
                )}
              </button>
            </div>
          </form>

          {/* Footer Links */}
          <div className="pt-4 border-t border-gray-200">
            <p className="text-xs text-center text-gray-500">
              By continuing, you agree to our{' '}
              <a href="#" className="text-blue-600 hover:text-blue-700 underline">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="#" className="text-blue-600 hover:text-blue-700 underline">
                Privacy Policy
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
