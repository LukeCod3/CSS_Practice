/**
 * Sync Button Client Component
 *
 * Client component for triggering manual meeting sync
 * Shows loading state during sync operation
 * Handles reconnect required errors when Google tokens are invalid
 */

'use client'

import { useState } from 'react'
import { RefreshCw, AlertCircle } from 'lucide-react'

export default function SyncButton() {
  const [syncing, setSyncing] = useState(false)
  const [message, setMessage] = useState<{
    type: 'success' | 'error' | 'reconnect'
    text: string
  } | null>(null)

  const handleSync = async () => {
    setSyncing(true)
    setMessage(null)

    try {
      const response = await fetch('/api/sync-meetings', {
        method: 'POST',
      })

      const data = await response.json()

      if (data.success) {
        setMessage({
          type: 'success',
          text: data.message || `Synced ${data.synced} meeting(s)`,
        })
        // Refresh the page to show updated meetings
        setTimeout(() => {
          window.location.reload()
        }, 1500)
      } else {
        // Check for specific error types that require reconnection
        if (
          data.error === 'RECONNECT_REQUIRED' ||
          data.error === 'NO_ACCOUNT' ||
          data.message?.includes('reconnect') ||
          data.message?.includes('expired')
        ) {
          setMessage({
            type: 'reconnect',
            text:
              data.message ||
              'Your Google account connection has expired. Please reconnect.',
          })
        } else {
          setMessage({
            type: 'error',
            text: data.message || 'Failed to sync meetings',
          })
        }
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'An error occurred while syncing meetings',
      })
    } finally {
      setSyncing(false)
    }
  }

  return (
    <div>
      <button
        onClick={handleSync}
        disabled={syncing}
        className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <RefreshCw
          className={`w-4 h-4 mr-2 ${syncing ? 'animate-spin' : ''}`}
        />
        {syncing ? 'Syncing...' : 'Sync Now'}
      </button>

      {message && (
        <div
          className={`mt-3 p-3 rounded-lg text-sm border ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800 border-green-200'
              : message.type === 'reconnect'
                ? 'bg-yellow-50 text-yellow-900 border-yellow-200'
                : 'bg-red-50 text-red-800 border-red-200'
          }`}
        >
          <div className="flex items-start">
            {message.type === 'reconnect' && (
              <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <p className="mb-2">{message.text}</p>
              {message.type === 'reconnect' && (
                <a
                  href="/api/auth/google"
                  className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-white bg-yellow-600 rounded-lg hover:bg-yellow-700 transition"
                >
                  Reconnect Google Account
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
