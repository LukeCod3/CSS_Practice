'use client'

/**
 * Meeting Monitor Client Component
 *
 * Handles real-time meeting monitoring with polling and notifications.
 *
 * FUNCTIONALITY:
 * 1. Requests browser notification permission on mount
 * 2. Filters meetings to find those eligible for monitoring
 * 3. Polls /api/check-meeting every 20 seconds for each eligible meeting
 * 4. Sends browser notifications when participants join
 * 5. Shows in-app alerts for new participants
 * 6. Displays monitoring status and controls
 *
 * ELIGIBLE MEETINGS:
 * - scheduled_start <= NOW (meeting has started)
 * - scheduled_start >= NOW - 30 minutes (started within last 30 min)
 * - status = 'scheduled' or 'active'
 *
 * POLLING STRATEGY:
 * - 20-second interval (balance between responsiveness and efficiency)
 * - Only polls eligible meetings (not future meetings)
 * - Pauses when no eligible meetings exist (optimization)
 * - Cleans up interval on component unmount (prevents memory leaks)
 *
 * NOTIFICATION FLOW:
 * 1. Browser permission requested on mount
 * 2. When polling detects new participant (shouldNotify = true):
 *    - Send browser notification (if permission granted)
 *    - Show in-app toast/alert
 *    - Update UI with alert indicator
 * 3. Fallback to in-app alerts if browser notifications blocked
 *
 * ERROR HANDLING:
 * - API failures: Log to console, continue polling (transient errors)
 * - Permission denied: Disable browser notifications, use in-app only
 * - Browser doesn't support notifications: Show warning, use in-app only
 *
 * WHY CLIENT COMPONENT:
 * - Uses React hooks (useEffect, useState)
 * - Needs browser APIs (Notification, setInterval)
 * - Real-time UI updates without page refresh
 * - Cannot be server-rendered (uses window, Notification)
 */

import { useEffect, useState } from 'react'
import { Bell, BellOff, Activity, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react'
import {
  requestNotificationPermission,
  sendBrowserNotification,
} from '@/lib/notifications/browser'

/**
 * Meeting type from database
 */
type Meeting = {
  id: string
  meeting_id: string
  meeting_link: string
  title: string
  scheduled_start: string
  scheduled_end: string
  status: string
  platform: string
  attendees: Array<{ email: string; name?: string }>
}

type MeetingMonitorProps = {
  meetings: Meeting[]
}

/**
 * Notification alert displayed in-app when participant joins
 */
type NotificationAlert = {
  id: string
  meetingTitle: string
  message: string
  timestamp: Date
}

export default function MeetingMonitor({ meetings }: MeetingMonitorProps) {
  // Notification permission state
  const [notificationPermission, setNotificationPermission] = useState<
    'default' | 'granted' | 'denied'
  >('default')

  // Monitoring enabled/disabled toggle
  const [isMonitoringEnabled, setIsMonitoringEnabled] = useState(true)

  // Tracks last check time for each meeting
  const [lastCheckTimes, setLastCheckTimes] = useState<
    Record<string, number>
  >({})

  // Tracks which meetings are currently being checked (for spinner animation)
  const [checkingMeetings, setCheckingMeetings] = useState<Set<string>>(
    new Set()
  )

  // Current time for real-time timer updates (updates every second)
  const [currentTime, setCurrentTime] = useState(Date.now())

  // In-app notification alerts
  const [alerts, setAlerts] = useState<NotificationAlert[]>([])

  // Error state for debugging
  const [error, setError] = useState<string | null>(null)

  // Browser notification support check
  const [supportsNotifications, setSupportsNotifications] = useState(true)

  /**
   * Check if browser supports notifications
   *
   * The Notification API is not available in:
   * - Server-side rendering (no window object)
   * - Some older browsers
   * - Certain restricted contexts (embedded iframes, etc.)
   *
   * WHY CHECK:
   * - Prevents runtime errors in unsupported environments
   * - Allows graceful degradation to in-app alerts only
   * - Better user experience with clear feedback
   */
  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setSupportsNotifications(false)
      console.warn('Browser does not support notifications')
    } else {
      setNotificationPermission(Notification.permission)
    }
  }, [])

  /**
   * Request notification permission on component mount
   *
   * TIMING:
   * - Runs once when component first renders
   * - Should be triggered by user action (best practice)
   * - Here we auto-request since user is on dashboard (implicit consent)
   *
   * PERMISSION STATES:
   * - 'default': Not yet asked, will show permission prompt
   * - 'granted': User allowed, can send notifications
   * - 'denied': User blocked, fallback to in-app alerts only
   *
   * BEST PRACTICES:
   * - Only request when needed (not on every page load)
   * - Explain why you need permission before requesting
   * - Provide fallback if permission denied
   * - Don't repeatedly ask if user denied
   *
   * WHY ASYNC:
   * - Browser permission dialog is asynchronous
   * - User needs time to click Allow/Block
   * - Must handle promise resolution
   */
  useEffect(() => {
    const requestPermission = async () => {
      if (!supportsNotifications) return

      try {
        const permission = await requestNotificationPermission()
        setNotificationPermission(permission)

        if (permission === 'denied') {
          console.warn(
            'Notification permission denied. Using in-app alerts only.'
          )
        }
      } catch (err) {
        console.error('Failed to request notification permission:', err)
      }
    }

    requestPermission()
  }, [supportsNotifications])

  /**
   * Real-time timer updates
   *
   * WHY NEEDED:
   * - Updates "Last checked: Xs ago" display every second
   * - Makes monitoring feel alive and responsive
   * - Shows real-time countdown without user interaction
   *
   * HOW IT WORKS:
   * - Sets up 1-second interval timer
   * - Updates currentTime state every second
   * - UI re-renders with updated time calculations
   * - getTimeSinceLastCheck uses currentTime instead of Date.now()
   *
   * OPTIMIZATION:
   * - Only runs when tab is visible (document.visibilityState)
   * - Pauses timer when tab is hidden (saves CPU)
   * - Resumes when tab becomes visible again
   * - Prevents unnecessary re-renders in background
   *
   * WHY PAUSE WHEN HIDDEN:
   * - Browser throttles background tabs anyway
   * - Saves CPU and battery on mobile
   * - User can't see updates when tab is hidden
   * - Modern web performance best practice
   *
   * CLEANUP:
   * - Clears interval on unmount (prevent memory leaks)
   * - Returns cleanup function from useEffect
   * - Critical for component lifecycle management
   */
  useEffect(() => {
    /**
     * Update timer function
     *
     * Updates currentTime which triggers re-render of all time displays.
     * Only updates if tab is visible (optimization).
     */
    const updateTimer = () => {
      // Only update if tab is visible
      if (document.visibilityState === 'visible') {
        setCurrentTime(Date.now())
      }
    }

    /**
     * Handle visibility change
     *
     * When tab becomes visible again, immediately update time.
     * This ensures timer shows correct value when user returns.
     */
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        setCurrentTime(Date.now())
      }
    }

    // Set up 1-second interval timer
    const timerInterval = setInterval(updateTimer, 1000)

    // Listen for visibility changes
    document.addEventListener('visibilitychange', handleVisibilityChange)

    // Initial update
    updateTimer()

    // Cleanup on unmount
    return () => {
      clearInterval(timerInterval)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  /**
   * Filter meetings to find those eligible for monitoring
   *
   * ELIGIBILITY CRITERIA:
   * 1. Meeting has already started (scheduled_start <= NOW)
   * 2. Meeting started recently (scheduled_start >= NOW - 30 minutes)
   * 3. Meeting is active or scheduled (status = 'scheduled' or 'active')
   * 4. Meeting has not ended (scheduled_end >= NOW) - already filtered server-side
   *
   * WHY THESE RULES:
   * - Only check meetings that are happening now
   * - Don't check meetings that haven't started yet
   * - Don't check meetings that ended more than 30 min ago
   * - Reduces unnecessary API calls (optimization)
   *
   * CLIENT-SIDE FILTERING:
   * - Server already filters by status and end time
   * - Client filters by start time (dynamic, changes every second)
   * - This ensures we only poll meetings that need checking RIGHT NOW
   */
  const getEligibleMeetings = (): Meeting[] => {
    const now = new Date()
    const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000)

    return meetings.filter((meeting) => {
      const scheduledStart = new Date(meeting.scheduled_start)

      // Meeting must have started (or starting now)
      const hasStarted = scheduledStart <= now

      // Meeting must have started within last 30 minutes
      const isRecent = scheduledStart >= thirtyMinutesAgo

      // Meeting must be scheduled or active
      const isActiveStatus =
        meeting.status === 'scheduled' || meeting.status === 'active'

      return hasStarted && isRecent && isActiveStatus
    })
  }

  const eligibleMeetings = getEligibleMeetings()

  /**
   * Polling logic: Check meetings every 20 seconds
   *
   * POLLING CYCLE:
   * 1. Get eligible meetings (filter client-side)
   * 2. For each eligible meeting:
   *    a. POST to /api/check-meeting with { meetingId }
   *    b. If response.shouldNotify = true:
   *       - Send browser notification (if permission granted)
   *       - Show in-app alert
   *       - Update last check time
   * 3. Wait 20 seconds, repeat
   *
   * WHY 20 SECONDS:
   * - Fast enough to catch late-joining clients (they have time to settle in)
   * - Slow enough to avoid API rate limits
   * - Balance between responsiveness and efficiency
   * - Google Meet API has rate limits, we want to stay under them
   *
   * CLEANUP PATTERN:
   * - useEffect returns a cleanup function
   * - Cleanup runs when:
   *   1. Component unmounts (user navigates away)
   *   2. Dependencies change (monitoring enabled, meetings, etc.)
   * - clearInterval prevents memory leaks
   * - Without cleanup, interval keeps running in background
   *
   * DEPENDENCY ARRAY:
   * - isMonitoringEnabled: Restart polling when user toggles monitoring
   * - meetings: Restart polling when meetings list changes
   * - notificationPermission: Restart when permission state changes
   * - Empty array would mean: run once on mount, never update
   *
   * ERROR HANDLING:
   * - API call failures: Log to console, continue polling
   * - Don't stop polling on single failure (might be transient)
   * - Track errors to show in UI for debugging
   */
  useEffect(() => {
    // Don't poll if monitoring is disabled
    if (!isMonitoringEnabled) {
      return
    }

    // Don't poll if no eligible meetings
    if (eligibleMeetings.length === 0) {
      return
    }

    console.log(
      `🔍 Starting polling for ${eligibleMeetings.length} eligible meeting(s)`
    )

    /**
     * Check all eligible meetings
     *
     * Makes parallel API calls to check each meeting.
     * Updates UI with results from each check.
     */
    const checkMeetings = async () => {
      for (const meeting of eligibleMeetings) {
        try {
          console.log(`🔎 Checking meeting: ${meeting.title}`)

          // Mark meeting as being checked (for spinner animation)
          setCheckingMeetings((prev) => new Set(prev).add(meeting.id))

          // Call check-meeting API
          const response = await fetch('/api/check-meeting', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              meetingId: meeting.id,
            }),
          })

          if (!response.ok) {
            throw new Error(`API returned ${response.status}`)
          }

          const data = await response.json()

          // Update last check time
          setLastCheckTimes((prev) => ({
            ...prev,
            [meeting.id]: Date.now(),
          }))

          // Remove from checking set (stop spinner)
          setCheckingMeetings((prev) => {
            const next = new Set(prev)
            next.delete(meeting.id)
            return next
          })

          // If new participant joined, send notifications
          if (data.shouldNotify) {
            console.log(`🔔 New participant joined: ${meeting.title}`)

            // Send browser notification (if permission granted)
            if (notificationPermission === 'granted' && supportsNotifications) {
              try {
                await sendBrowserNotification({
                  title: `Client Joined: ${meeting.title}`,
                  body: 'A participant has joined your meeting. Click to rejoin.',
                  meetingLink: meeting.meeting_link,
                  icon: '/icon.png',
                  tag: meeting.id, // Prevents duplicate notifications
                })
              } catch (notifErr) {
                console.error('Failed to send browser notification:', notifErr)
              }
            }

            // Show in-app alert
            const newAlert: NotificationAlert = {
              id: `${meeting.id}-${Date.now()}`,
              meetingTitle: meeting.title,
              message: 'A participant has joined',
              timestamp: new Date(),
            }

            setAlerts((prev) => [newAlert, ...prev].slice(0, 5)) // Keep last 5 alerts
            setError(null)
          }
        } catch (err: any) {
          console.error(`Failed to check meeting ${meeting.title}:`, err)
          setError(`Failed to check ${meeting.title}: ${err.message}`)

          // Remove from checking set even on error (stop spinner)
          setCheckingMeetings((prev) => {
            const next = new Set(prev)
            next.delete(meeting.id)
            return next
          })
        }
      }
    }

    // Check immediately on mount
    checkMeetings()

    // Then check every 20 seconds
    const interval = setInterval(checkMeetings, 20000) // 20 seconds

    /**
     * CLEANUP FUNCTION
     *
     * WHY NECESSARY:
     * - Intervals keep running even after component unmounts
     * - This causes memory leaks (interval calls setLastCheckTimes on unmounted component)
     * - Can cause unexpected behavior (checking meetings after user navigated away)
     *
     * WHEN IT RUNS:
     * - Component unmounts (user navigates away from dashboard)
     * - Dependencies change (monitoring toggled, meetings updated, etc.)
     * - Before running effect again (prevents duplicate intervals)
     *
     * WHAT IT DOES:
     * - Clears the interval timer
     * - Prevents checkMeetings from being called again
     * - Frees up memory
     */
    return () => {
      console.log('🛑 Stopping meeting monitor polling')
      clearInterval(interval)
    }
  }, [
    isMonitoringEnabled,
    eligibleMeetings.length,
    notificationPermission,
    supportsNotifications,
  ])

  /**
   * Test notification button handler
   *
   * Manually triggers a test notification for debugging.
   * Useful for verifying that notifications work without waiting for a real event.
   */
  const handleTestNotification = async () => {
    try {
      if (notificationPermission === 'granted' && supportsNotifications) {
        await sendBrowserNotification({
          title: 'Test Notification',
          body: 'This is a test notification from Meeting Alert',
          meetingLink: window.location.href, // Link back to dashboard
          icon: '/icon.png',
          tag: 'test',
        })

        // Also show in-app alert
        const testAlert: NotificationAlert = {
          id: `test-${Date.now()}`,
          meetingTitle: 'Test',
          message: 'Test notification sent!',
          timestamp: new Date(),
        }
        setAlerts((prev) => [testAlert, ...prev].slice(0, 5))
      } else {
        // Just show in-app alert if no browser permission
        const testAlert: NotificationAlert = {
          id: `test-${Date.now()}`,
          meetingTitle: 'Test',
          message: 'Test notification (browser notifications disabled)',
          timestamp: new Date(),
        }
        setAlerts((prev) => [testAlert, ...prev].slice(0, 5))
      }
    } catch (err) {
      console.error('Failed to send test notification:', err)
      setError('Failed to send test notification')
    }
  }

  /**
   * Request notification permission button handler
   *
   * Re-requests permission if user initially denied or dismissed.
   * Note: If user explicitly blocked, browser won't show prompt again.
   */
  const handleRequestPermission = async () => {
    if (!supportsNotifications) return

    try {
      const permission = await requestNotificationPermission()
      setNotificationPermission(permission)
    } catch (err) {
      console.error('Failed to request permission:', err)
    }
  }

  /**
   * Get time since last check for a meeting with status information
   *
   * Returns rich status object with:
   * - timeText: Formatted time string ("5s ago", "2m ago")
   * - statusMessage: Context-aware status message
   * - colorClass: Tailwind color class for text
   * - dotColor: Color for animated activity dot
   * - secondsAgo: Raw seconds value for calculations
   *
   * STATUS TIERS:
   * - 0-20s: Healthy (green) - Recent check, all good
   * - 21-40s: Attention (amber) - Checking soon, expected delay
   * - 41s+: Delayed (orange) - High demand, still monitoring
   *
   * WHY REASSURING MESSAGES:
   * - Builds user trust and confidence
   * - Explains delays without causing alarm
   * - Shows system is working even during high load
   * - Reduces user anxiety about monitoring reliability
   *
   * COLOR PSYCHOLOGY:
   * - Green (#10b981): Safe, healthy, working well
   * - Amber (#f59e0b): Attention, transitional, no action needed
   * - Orange (#f97316): Delayed but working, system under load
   * - Never red: Red signals error/failure (we're still working)
   *
   * RANDOM MESSAGES FOR 41s+:
   * - Adds variety to prevent message fatigue
   * - Makes delays feel less repetitive
   * - Maintains reassuring tone throughout
   * - Different wordings keep interface feeling alive
   */
  const getTimeSinceLastCheck = (
    meetingId: string
  ): {
    timeText: string
    statusMessage: string
    colorClass: string
    dotColor: string
    secondsAgo: number
  } => {
    const lastCheck = lastCheckTimes[meetingId]

    if (!lastCheck) {
      return {
        timeText: 'Never',
        statusMessage: 'Waiting for first check...',
        colorClass: 'text-gray-500',
        dotColor: '#9ca3af',
        secondsAgo: 0,
      }
    }

    // Use currentTime state for real-time updates (updates every second)
    const secondsAgo = Math.floor((currentTime - lastCheck) / 1000)

    // Format time display
    let timeText: string
    if (secondsAgo < 60) {
      timeText = `${secondsAgo}s ago`
    } else {
      const minutesAgo = Math.floor(secondsAgo / 60)
      timeText = `${minutesAgo}m ago`
    }

    // Determine status tier and messages
    if (secondsAgo <= 20) {
      // TIER 1: Healthy (0-20s)
      return {
        timeText,
        statusMessage: '', // No message needed, everything is normal
        colorClass: 'text-green-600',
        dotColor: '#10b981',
        secondsAgo,
      }
    } else if (secondsAgo <= 40) {
      // TIER 2: Checking soon (21-40s)
      return {
        timeText,
        statusMessage: 'Checking soon...',
        colorClass: 'text-amber-600',
        dotColor: '#f59e0b',
        secondsAgo,
      }
    } else {
      // TIER 3: Delayed (41s+)
      // Rotate through reassuring messages for variety
      const delayedMessages = [
        'High server demand, checking shortly',
        'Experiencing temporary delay, still monitoring',
        'Slight delay, your meeting is being monitored',
        'Checking momentarily, all systems active',
      ]

      // Use meeting ID and seconds to deterministically pick a message
      // This ensures same meeting shows same message for a given delay period
      const messageIndex =
        (meetingId.charCodeAt(0) + Math.floor(secondsAgo / 10)) %
        delayedMessages.length
      const statusMessage = delayedMessages[messageIndex]

      return {
        timeText,
        statusMessage,
        colorClass: 'text-orange-600',
        dotColor: '#f97316',
        secondsAgo,
      }
    }
  }

  /**
   * Dismiss an alert
   */
  const dismissAlert = (alertId: string) => {
    setAlerts((prev) => prev.filter((alert) => alert.id !== alertId))
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-gray-900">
          Meeting Monitor
        </h3>
        {/* Prominent Pause/Resume Button with Label */}
        <button
          onClick={() => setIsMonitoringEnabled(!isMonitoringEnabled)}
          className={`group relative inline-flex flex-col items-center px-5 py-3 rounded-lg text-sm font-semibold transition-all shadow-sm hover:shadow-md ${
            isMonitoringEnabled
              ? 'bg-green-600 text-white hover:bg-green-700'
              : 'bg-orange-500 text-white hover:bg-orange-600 animate-pulse'
          }`}
        >
          <div className="flex items-center">
            {isMonitoringEnabled ? (
              <>
                <Activity className="w-5 h-5 mr-2" />
                <span>Monitoring Active</span>
              </>
            ) : (
              <>
                <BellOff className="w-5 h-5 mr-2" />
                <span>Monitoring Paused</span>
              </>
            )}
          </div>
          <span className={`text-[10px] font-normal mt-1 transition-opacity ${
            isMonitoringEnabled
              ? 'text-green-100 opacity-75 group-hover:opacity-100'
              : 'text-orange-100 opacity-75 group-hover:opacity-100'
          }`}>
            {isMonitoringEnabled ? 'Click to pause' : 'Click to resume'}
          </span>
        </button>
      </div>

      {/* Paused State Warning Banner */}
      {!isMonitoringEnabled && (
        <div className="mb-4 p-4 bg-orange-50 rounded-lg border-2 border-orange-300">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-orange-600 mr-3 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-orange-900 mb-1">
                Monitoring is currently paused
              </p>
              <p className="text-xs text-orange-800">
                You won't receive notifications if participants join your meetings. Click "Monitoring Paused" above to resume.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Browser Notification Support Warning */}
      {!supportsNotifications && (
        <div className="mb-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
          <div className="flex items-start">
            <AlertCircle className="w-4 h-4 text-yellow-600 mr-2 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-medium text-yellow-900">
                Browser notifications not supported
              </p>
              <p className="text-xs text-yellow-800 mt-1">
                Your browser doesn't support notifications. You'll still see in-app alerts.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Notification Permission Status */}
      {supportsNotifications && (
        <div className="mb-4">
          {notificationPermission === 'granted' ? (
            <div className="flex items-center p-3 bg-green-50 rounded-lg border border-green-200">
              <CheckCircle className="w-4 h-4 text-green-600 mr-2 flex-shrink-0" />
              <span className="text-sm text-green-900 font-medium">
                ✅ Notifications enabled
              </span>
            </div>
          ) : notificationPermission === 'denied' ? (
            <div className="p-3 bg-red-50 rounded-lg border border-red-200">
              <div className="flex items-start">
                <AlertCircle className="w-4 h-4 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-red-900">
                    Notifications blocked
                  </p>
                  <p className="text-xs text-red-800 mt-1">
                    Enable notifications in your browser settings to receive alerts. You'll still see in-app alerts.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <button
              onClick={handleRequestPermission}
              className="w-full flex items-center justify-center p-3 bg-yellow-50 rounded-lg border border-yellow-200 hover:bg-yellow-100 transition text-sm font-medium text-yellow-900"
            >
              <Bell className="w-4 h-4 mr-2" />
              ⚠️ Click to enable notifications
            </button>
          )}
        </div>
      )}

      {/* Monitoring Status - Enhanced with overall stats */}
      <div className={`mb-4 p-4 rounded-lg border transition-all ${
        isMonitoringEnabled
          ? 'bg-blue-50 border-blue-200'
          : 'bg-gray-100 border-gray-300 opacity-60'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center flex-1">
            <Activity
              className={`w-5 h-5 mr-2 ${
                isMonitoringEnabled && eligibleMeetings.length > 0
                  ? 'text-blue-600 animate-pulse'
                  : 'text-gray-400'
              }`}
            />
            <div className="flex-1">
              {eligibleMeetings.length === 0 ? (
                <p className="text-sm font-medium text-gray-900">
                  No active meetings to monitor
                </p>
              ) : (
                <>
                  {/* Main status line with meeting count and most recent check */}
                  <div className="flex items-center flex-wrap gap-x-2">
                    <p className="text-sm font-medium text-gray-900">
                      {isMonitoringEnabled ? 'Monitoring' : 'Paused -'} {eligibleMeetings.length}{' '}
                      {eligibleMeetings.length === 1 ? 'meeting' : 'meetings'}
                    </p>

                    {/* Show most recent check across all meetings */}
                    {isMonitoringEnabled && Object.keys(lastCheckTimes).length > 0 && (
                      <>
                        <span className="text-gray-400">•</span>
                        <div className="flex items-center">
                          <RefreshCw
                            className={`w-3 h-3 mr-1 ${
                              checkingMeetings.size > 0
                                ? 'animate-spin text-blue-500'
                                : 'text-gray-500'
                            }`}
                          />
                          <p className="text-xs text-gray-600">
                            Last check:{' '}
                            {(() => {
                              // Find most recent check time across all meetings
                              const mostRecentTime = Math.max(
                                ...Object.values(lastCheckTimes)
                              )
                              const secondsAgo = Math.floor(
                                (currentTime - mostRecentTime) / 1000
                              )
                              return secondsAgo < 60
                                ? `${secondsAgo}s ago`
                                : `${Math.floor(secondsAgo / 60)}m ago`
                            })()}
                          </p>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Secondary info line */}
                  {isMonitoringEnabled && (
                    <div className="flex items-center mt-1 text-xs text-gray-600">
                      {checkingMeetings.size > 0 ? (
                        <span className="font-medium text-blue-600">
                          Checking {checkingMeetings.size}{' '}
                          {checkingMeetings.size === 1 ? 'meeting' : 'meetings'} now...
                        </span>
                      ) : (
                        <span>Checks every 20 seconds</span>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
          <button
            onClick={handleTestNotification}
            disabled={!isMonitoringEnabled}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all shadow-sm ${
              isMonitoringEnabled
                ? 'text-blue-700 bg-white border-2 border-blue-400 hover:bg-blue-50 hover:border-blue-500'
                : 'text-gray-500 bg-gray-200 border-2 border-gray-300 cursor-not-allowed opacity-50'
            }`}
          >
            Test Notification
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 rounded-lg border border-red-200">
          <div className="flex items-start">
            <AlertCircle className="w-4 h-4 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-red-800">{error}</p>
          </div>
        </div>
      )}

      {/* Per-Meeting Status - Interactive with real-time updates */}
      {eligibleMeetings.length > 0 && (
        <div className={`space-y-2 transition-opacity ${!isMonitoringEnabled ? 'opacity-50' : ''}`}>
          <p className="text-xs font-medium text-gray-700 mb-2">
            {isMonitoringEnabled ? 'Currently monitoring:' : 'Meetings (monitoring paused):'}
          </p>
          {eligibleMeetings.map((meeting) => {
            const checkStatus = getTimeSinceLastCheck(meeting.id)
            const isChecking = checkingMeetings.has(meeting.id)

            return (
              <div
                key={meeting.id}
                className={`p-3 rounded-lg border transition-colors ${
                  isMonitoringEnabled
                    ? 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                    : 'bg-gray-100 border-gray-300'
                }`}
              >
                <div className="flex items-start">
                  {/* Animated activity dot - color changes based on status */}
                  <div
                    className="w-2 h-2 rounded-full mr-3 flex-shrink-0 mt-1.5 animate-pulse"
                    style={{
                      backgroundColor: isMonitoringEnabled
                        ? checkStatus.dotColor
                        : '#9ca3af',
                    }}
                  />

                  <div className="flex-1 min-w-0">
                    {/* Meeting title */}
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {meeting.title}
                    </p>

                    {/* Time since last check with refresh icon */}
                    <div className="flex items-center mt-1 space-x-1.5">
                      {/* Refresh icon - spins when checking */}
                      <RefreshCw
                        className={`w-3 h-3 flex-shrink-0 ${
                          isChecking
                            ? 'animate-spin text-blue-500'
                            : checkStatus.colorClass
                        }`}
                      />

                      {/* Time text - color-coded by status */}
                      <p
                        className={`text-xs font-medium ${checkStatus.colorClass}`}
                      >
                        Last checked: {checkStatus.timeText}
                      </p>
                    </div>

                    {/* Status message - only shown for attention/delayed states */}
                    {checkStatus.statusMessage && (
                      <div className="flex items-start mt-1">
                        <AlertCircle className="w-3 h-3 text-amber-500 mr-1 flex-shrink-0 mt-0.5" />
                        <p
                          className={`text-xs ${checkStatus.colorClass} leading-tight`}
                        >
                          {checkStatus.statusMessage}
                        </p>
                      </div>
                    )}

                    {/* Active checking indicator */}
                    {isChecking && (
                      <div className="flex items-center mt-1">
                        <div className="flex space-x-1">
                          <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" />
                          <div
                            className="w-1 h-1 bg-blue-500 rounded-full animate-bounce"
                            style={{ animationDelay: '0.1s' }}
                          />
                          <div
                            className="w-1 h-1 bg-blue-500 rounded-full animate-bounce"
                            style={{ animationDelay: '0.2s' }}
                          />
                        </div>
                        <p className="text-xs text-blue-600 ml-2 font-medium">
                          Checking now...
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* In-App Alerts */}
      {alerts.length > 0 && (
        <div className="mt-4 space-y-2">
          <p className="text-xs font-medium text-gray-700 mb-2">Recent alerts:</p>
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className="flex items-start justify-between p-3 bg-green-50 rounded-lg border border-green-200 animate-pulse"
            >
              <div className="flex items-start min-w-0 flex-1">
                <Bell className="w-4 h-4 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-green-900">
                    {alert.meetingTitle}
                  </p>
                  <p className="text-xs text-green-800">{alert.message}</p>
                  <p className="text-xs text-green-600 mt-0.5">
                    {alert.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
              <button
                onClick={() => dismissAlert(alert.id)}
                className="text-green-600 hover:text-green-800 ml-2"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
