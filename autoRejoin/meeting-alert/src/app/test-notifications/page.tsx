'use client'

import { useState, useEffect } from 'react'
import {
  requestNotificationPermission,
  sendTestBrowserNotification,
  isNotificationSupported,
  getNotificationPermission,
} from '@/lib/notifications/browser'

export default function TestNotificationsPage() {
  const [permission, setPermission] = useState<NotificationPermission | null>(null)
  const [message, setMessage] = useState('')
  const [mounted, setMounted] = useState(false)

  // Get permission state after component mounts (client-side only)
  useEffect(() => {
    setMounted(true)
    setPermission(getNotificationPermission())
  }, [])

  const handleRequestPermission = async () => {
    setMessage('Requesting permission...')
    const result = await requestNotificationPermission()
    setPermission(result)
    setMessage(`Permission: ${result}`)
  }

  const handleTestNotification = async () => {
    setMessage('Sending test notification...')

    // Log to console for debugging
    console.log('Permission:', permission)
    console.log('Notification supported:', isNotificationSupported())

    try {
      const notification = await sendTestBrowserNotification()
      console.log('Notification result:', notification)

      if (notification) {
        setMessage('✅ Notification sent! Check your system notification center. (Check browser console for details)')
      } else {
        setMessage('❌ Failed to send notification. Permission: ' + permission + '. Check browser console for details.')
      }
    } catch (error: any) {
      console.error('Error sending notification:', error)
      setMessage('❌ Error: ' + error.message)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-4">Test Browser Notifications</h1>

        {mounted && (
          <>
            {!isNotificationSupported() ? (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-4">
                <p className="text-red-800">
                  ❌ Your browser doesn&apos;t support notifications
                </p>
              </div>
            ) : (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-4">
                <p className="text-blue-800">
                  ✅ Your browser supports notifications
                </p>
              </div>
            )}
          </>
        )}

        <div className="mb-6">
          <p className="text-sm text-gray-600 mb-2">Current permission status:</p>
          <p className="text-lg font-semibold">
            {permission === 'granted' && '✅ Granted'}
            {permission === 'denied' && '❌ Denied'}
            {permission === 'default' && '⚠️ Not requested yet'}
          </p>
        </div>

        <div className="space-y-4">
          <button
            onClick={handleRequestPermission}
            disabled={permission === 'granted'}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {permission === 'granted' ? '✅ Permission Granted' : 'Request Permission'}
          </button>

          <button
            onClick={handleTestNotification}
            disabled={permission !== 'granted'}
            className="w-full px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            Send Test Notification
          </button>
        </div>

        {message && (
          <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <p className="text-sm text-gray-800">{message}</p>
          </div>
        )}

        <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>💡 Tip:</strong> If you don&apos;t see the notification, check:
          </p>
          <ul className="text-sm text-yellow-800 list-disc list-inside mt-2 space-y-1">
            <li>Windows: Click notification icon in taskbar (bottom-right)</li>
            <li>Mac: Check Notification Center (top-right)</li>
            <li>Browser settings: Notifications are allowed for this site</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
