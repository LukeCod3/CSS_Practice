/**
 * Status Message Client Component
 *
 * Displays success/error messages from URL parameters
 * Auto-dismisses after 5 seconds
 */

'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { CheckCircle, XCircle, X } from 'lucide-react'

export default function StatusMessage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [visible, setVisible] = useState(false)

  const success = searchParams.get('success')
  const error = searchParams.get('error')

  useEffect(() => {
    if (success || error) {
      setVisible(true)

      // Auto-dismiss after 5 seconds
      const timer = setTimeout(() => {
        dismissMessage()
      }, 5000)

      return () => clearTimeout(timer)
    }
  }, [success, error])

  const dismissMessage = () => {
    setVisible(false)
    // Remove URL params
    router.replace('/dashboard')
  }

  if (!visible || (!success && !error)) {
    return null
  }

  const messages: Record<string, string> = {
    // Success messages
    google_connected: 'Google Calendar connected successfully!',

    // Error messages
    access_denied: 'You denied access to your Google account.',
    missing_code: 'Authorization failed. Please try again.',
    not_authenticated: 'Please sign in to connect your Google account.',
    google_connection_failed: 'Failed to connect Google Calendar. Please try again.',
    invalid_code: 'Authorization code expired. Please try connecting again.',
    database_error: 'Database error occurred. Please contact support.',
    token_exchange_failed: 'Failed to exchange tokens. Please try again.',
  }

  const message = success
    ? messages[success] || 'Success!'
    : messages[error || ''] || 'An error occurred.'

  const isSuccess = !!success

  return (
    <div
      className={`mb-6 p-4 rounded-lg border ${
        isSuccess
          ? 'bg-green-50 border-green-200 text-green-800'
          : 'bg-red-50 border-red-200 text-red-800'
      } flex items-start justify-between animate-in slide-in-from-top duration-300`}
    >
      <div className="flex items-start">
        {isSuccess ? (
          <CheckCircle className="w-5 h-5 mr-3 flex-shrink-0 mt-0.5" />
        ) : (
          <XCircle className="w-5 h-5 mr-3 flex-shrink-0 mt-0.5" />
        )}
        <div>
          <p className="font-medium">{isSuccess ? 'Success' : 'Error'}</p>
          <p className="text-sm mt-0.5">{message}</p>
        </div>
      </div>
      <button
        onClick={dismissMessage}
        className="ml-4 flex-shrink-0 text-gray-400 hover:text-gray-600 transition"
        aria-label="Dismiss"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  )
}
