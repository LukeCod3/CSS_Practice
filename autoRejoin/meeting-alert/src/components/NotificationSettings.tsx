'use client'

import { useState, useEffect } from 'react'
import {
  requestNotificationPermission,
  isNotificationSupported,
  getNotificationPermission,
} from '@/lib/notifications/browser'

export default function NotificationSettings() {
  const [mounted, setMounted] = useState(false)
  const [browserNotificationsEnabled, setBrowserNotificationsEnabled] =
    useState(false)
  const [emailNotificationsEnabled, setEmailNotificationsEnabled] =
    useState(true) // Email notifications are always on for now
  const [isRequesting, setIsRequesting] = useState(false)

  // Check if browser notifications are enabled
  useEffect(() => {
    setMounted(true)
    const permission = getNotificationPermission()
    setBrowserNotificationsEnabled(permission === 'granted')
  }, [])

  const handleBrowserNotificationToggle = async () => {
    if (!isNotificationSupported()) {
      alert('Your browser does not support notifications')
      return
    }

    const currentPermission = getNotificationPermission()

    if (currentPermission === 'denied') {
      alert(
        'Notification permission was denied. Please enable notifications in your browser settings:\n\n' +
          '1. Click the lock icon in the address bar\n' +
          '2. Find "Notifications" setting\n' +
          '3. Change to "Allow"'
      )
      return
    }

    if (currentPermission === 'granted') {
      // User is trying to disable - show message
      alert(
        'To disable browser notifications, please update your browser settings:\n\n' +
          '1. Click the lock icon in the address bar\n' +
          '2. Find "Notifications" setting\n' +
          '3. Change to "Block"'
      )
      return
    }

    // Permission is 'default' - request it
    setIsRequesting(true)
    try {
      const permission = await requestNotificationPermission()
      setBrowserNotificationsEnabled(permission === 'granted')

      if (permission === 'granted') {
        alert('✅ Browser notifications enabled! You will now receive real-time alerts.')
      } else {
        alert('❌ Notification permission denied.')
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error)
      alert('Failed to request notification permission')
    } finally {
      setIsRequesting(false)
    }
  }

  const handleEmailNotificationToggle = () => {
    // For now, email notifications are always on
    // In the future, you could store this preference in the database
    alert(
      'Email notifications are currently always enabled.\n\n' +
        'In the future, you will be able to customize this in your account settings.'
    )
  }

  if (!mounted) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">
          Notification Settings
        </h3>
        <div className="text-sm text-gray-500">Loading...</div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">
        Notification Settings
      </h3>

      <div className="space-y-4">
        {/* Email Notifications Toggle */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900">
              Email Notifications
            </p>
            <p className="text-xs text-gray-500">
              Get notified via email when participants join
            </p>
          </div>
          <button
            type="button"
            onClick={handleEmailNotificationToggle}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              emailNotificationsEnabled ? 'bg-blue-600' : 'bg-gray-200'
            }`}
            aria-pressed={emailNotificationsEnabled}
          >
            <span
              className={`${
                emailNotificationsEnabled ? 'translate-x-5' : 'translate-x-0'
              } inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
            />
          </button>
        </div>

        {/* Browser Notifications Toggle */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900">
              Browser Notifications
            </p>
            <p className="text-xs text-gray-500">
              Get browser push notifications in real-time
            </p>
          </div>
          <button
            type="button"
            onClick={handleBrowserNotificationToggle}
            disabled={isRequesting}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
              browserNotificationsEnabled ? 'bg-blue-600' : 'bg-gray-200'
            }`}
            aria-pressed={browserNotificationsEnabled}
          >
            <span
              className={`${
                browserNotificationsEnabled
                  ? 'translate-x-5'
                  : 'translate-x-0'
              } inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
            />
          </button>
        </div>
      </div>

      {/* Status Information */}
      <div className="mt-4 p-4 bg-blue-50 rounded-lg">
        <p className="text-xs text-blue-800">
          {browserNotificationsEnabled ? (
            <>
              ✅ <strong>Browser notifications enabled!</strong> You'll receive
              real-time alerts when participants join your meetings.
            </>
          ) : (
            <>
              💡 <strong>Enable browser notifications</strong> to get instant
              alerts even when this tab is in the background.
            </>
          )}
        </p>
      </div>

      {!isNotificationSupported() && (
        <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <p className="text-xs text-yellow-800">
            ⚠️ Your browser does not support notifications. Please use a modern
            browser like Chrome, Firefox, or Edge.
          </p>
        </div>
      )}
    </div>
  )
}
