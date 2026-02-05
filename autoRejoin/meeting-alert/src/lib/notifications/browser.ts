/**
 * Browser Notification Module
 *
 * Handles browser-based notifications using the Notification API.
 *
 * BROWSER NOTIFICATION API:
 * - Standard web API for desktop notifications
 * - Supported in Chrome, Firefox, Safari, Edge
 * - Requires user permission (must be explicitly granted)
 * - Notifications appear in system notification center
 * - Can include title, body, icon, and actions
 *
 * WHY BROWSER NOTIFICATIONS:
 * - Instant alerts without email delay
 * - Visible even when browser tab is in background
 * - Desktop notifications grab user's attention
 * - Complements email notifications for real-time alerts
 *
 * PERMISSION MODEL:
 * - Must request permission before showing notifications
 * - Permission states: 'granted', 'denied', 'default' (not asked yet)
 * - Permission persists across browser sessions
 * - Can be revoked by user in browser settings
 *
 * CLIENT-SIDE ONLY:
 * - This code runs in the browser (client-side)
 * - Server cannot trigger browser notifications directly
 * - Server returns notification data, client displays it
 *
 * SECURITY:
 * - Only works on HTTPS (or localhost for development)
 * - User must interact with page before permission request
 * - Cannot be triggered automatically on page load
 */

/**
 * Browser notification parameters
 */
export interface BrowserNotificationParams {
  title: string // Notification title
  body: string // Notification message
  meetingLink: string // URL to open when clicked
  icon?: string // Optional icon URL
  tag?: string // Optional tag to group/replace notifications
}

/**
 * Check if browser supports notifications
 *
 * Not all browsers support the Notification API:
 * - Chrome: ✅ Supported
 * - Firefox: ✅ Supported
 * - Safari: ✅ Supported (macOS 10.14+)
 * - Edge: ✅ Supported
 * - IE: ❌ Not supported
 * - Mobile browsers: ⚠️ Limited support
 *
 * @returns True if browser supports Notification API
 */
export function isNotificationSupported(): boolean {
  // Check if we're in a browser environment (not SSR)
  if (typeof window === 'undefined') {
    return false
  }
  return 'Notification' in window
}

/**
 * Get current notification permission status
 *
 * Permission states:
 * - 'granted': User has granted permission
 * - 'denied': User has denied permission
 * - 'default': User hasn't been asked yet
 *
 * @returns Current permission status or null if not supported
 */
export function getNotificationPermission(): NotificationPermission | null {
  // Check if we're in a browser environment (not SSR)
  if (typeof window === 'undefined') {
    return null
  }
  if (!isNotificationSupported()) {
    return null
  }
  return Notification.permission
}

/**
 * Request notification permission from user
 *
 * USAGE NOTES:
 * - Must be triggered by user interaction (button click, etc.)
 * - Cannot be called automatically on page load (browsers block this)
 * - Shows browser's native permission dialog
 * - Result persists across browser sessions
 *
 * PERMISSION DIALOG:
 * - Browser shows: "[Site] wants to show notifications"
 * - User clicks: "Allow" or "Block"
 * - Once denied, can only be re-enabled in browser settings
 *
 * ERROR HANDLING:
 * - If browser doesn't support notifications, returns 'denied'
 * - If user dismisses dialog without choosing, returns 'default'
 * - If permission already granted, returns 'granted' immediately
 *
 * @returns Promise resolving to permission status
 *
 * @example
 * // In a React component
 * const handleEnableNotifications = async () => {
 *   const permission = await requestNotificationPermission()
 *   if (permission === 'granted') {
 *     console.log('Notifications enabled!')
 *   } else {
 *     console.log('Notifications denied')
 *   }
 * }
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  // Check if browser supports notifications
  if (!isNotificationSupported()) {
    console.warn('Browser does not support notifications')
    return 'denied'
  }

  // Check current permission
  const currentPermission = Notification.permission

  // If already granted or denied, return current status
  if (currentPermission === 'granted' || currentPermission === 'denied') {
    console.log(`Notification permission already ${currentPermission}`)
    return currentPermission
  }

  // Request permission from user
  try {
    console.log('Requesting notification permission...')
    const permission = await Notification.requestPermission()
    console.log(`Notification permission: ${permission}`)
    return permission
  } catch (error) {
    console.error('Error requesting notification permission:', error)
    return 'denied'
  }
}

/**
 * Send browser notification
 *
 * Displays a system notification to the user.
 *
 * NOTIFICATION BEHAVIOR:
 * - Appears in system notification center (Windows Action Center, macOS Notification Center)
 * - Persists until clicked or dismissed (requireInteraction: true)
 * - Clicking opens the meeting link in a new tab
 * - Can include title, body, and icon
 * - Multiple notifications are stacked by browser
 *
 * CLICK HANDLING:
 * - Opens meetingLink in new tab
 * - Focuses the new tab
 * - Closes the notification
 * - Brings browser window to front
 *
 * TAG USAGE:
 * - Notifications with same tag replace each other
 * - Use meeting ID as tag to avoid duplicate notifications
 * - Example: tag = "meeting-abc123" ensures only one notification per meeting
 *
 * ERROR HANDLING:
 * - Returns null if permission not granted
 * - Returns null if browser doesn't support notifications
 * - Returns null if notification creation fails
 * - Logs errors for debugging
 *
 * @param params - Notification parameters
 * @returns Notification object or null if failed
 *
 * @example
 * const notification = await sendBrowserNotification({
 *   title: 'Sarah Smith joined',
 *   body: 'Team Standup is starting',
 *   meetingLink: 'https://meet.google.com/abc-defg-hij',
 *   tag: 'meeting-abc123' // Optional: group notifications
 * })
 *
 * if (notification) {
 *   console.log('Notification shown successfully')
 * }
 */
export async function sendBrowserNotification(
  params: BrowserNotificationParams
): Promise<Notification | null> {
  const { title, body, meetingLink, icon, tag } = params

  // Check if notifications are supported
  if (!isNotificationSupported()) {
    console.warn('Browser notifications not supported')
    return null
  }

  // Check if permission is granted
  if (Notification.permission !== 'granted') {
    console.warn(
      `Cannot show notification: permission is ${Notification.permission}`
    )
    return null
  }

  try {
    console.log('Sending browser notification:', title)

    /**
     * Create notification with options
     *
     * OPTIONS:
     * - body: Main message text
     * - icon: URL to icon image (optional, defaults to app icon)
     * - tag: Unique identifier to group/replace notifications
     * - requireInteraction: true = notification stays until user dismisses
     * - badge: Small icon shown when notification is collapsed (optional)
     * - silent: false = plays notification sound (default)
     */
    const notification = new Notification(title, {
      body,
      icon: icon, // Use provided icon (optional)
      tag: tag || `meeting-${Date.now()}`, // Unique tag if not provided
      requireInteraction: true, // Don't auto-dismiss
      // silent: false removed - let browser/OS use default sound behavior
    })

    /**
     * Handle notification click
     *
     * When user clicks notification:
     * 1. Open meeting link in new tab
     * 2. Focus the new tab
     * 3. Close the notification
     * 4. Bring browser to foreground
     */
    notification.onclick = (event) => {
      event.preventDefault() // Prevent default behavior

      console.log('Notification clicked, opening meeting:', meetingLink)

      // Open meeting link in new tab
      window.open(meetingLink, '_blank')

      // Close notification
      notification.close()

      // Focus the browser window (bring to front)
      if (window.focus) {
        window.focus()
      }
    }

    /**
     * Handle notification close
     *
     * Track when user dismisses notification without clicking
     */
    notification.onclose = () => {
      console.log('Notification closed')
      console.log('Notification properties:', {
        title: notification.title,
        body: notification.body,
        tag: notification.tag,
        requireInteraction: notification.requireInteraction,
      })
    }

    /**
     * Handle notification show
     *
     * Track when notification is actually displayed
     */
    notification.onshow = () => {
      console.log('✅ Notification is now showing on screen!')
    }

    /**
     * Handle notification errors
     *
     * Can occur if:
     * - Permission revoked while notification is being created
     * - Browser resource limits reached
     * - Icon URL fails to load
     */
    notification.onerror = (error) => {
      console.error('Notification error:', error)
    }

    console.log('Browser notification sent successfully')
    return notification
  } catch (error) {
    console.error('Failed to create browser notification:', error)
    return null
  }
}

/**
 * Test browser notification
 *
 * Sends a test notification to verify everything works.
 * Use this to test notification setup before production use.
 *
 * @returns Notification object or null if failed
 */
export async function sendTestBrowserNotification(): Promise<Notification | null> {
  return sendBrowserNotification({
    title: 'Test Notification',
    body: 'Browser notifications are working! Click to open test link.',
    meetingLink: 'https://meet.google.com/test',
    tag: 'test-notification',
  })
}

/**
 * Check if notifications are enabled and request if needed
 *
 * Helper function that combines permission check and request.
 * Use this in UI components to enable notifications with one call.
 *
 * @returns True if notifications are enabled (granted)
 *
 * @example
 * // In a settings component
 * const handleEnableNotifications = async () => {
 *   const enabled = await ensureNotificationsEnabled()
 *   if (enabled) {
 *     alert('Notifications enabled!')
 *   } else {
 *     alert('Please enable notifications in browser settings')
 *   }
 * }
 */
export async function ensureNotificationsEnabled(): Promise<boolean> {
  if (!isNotificationSupported()) {
    return false
  }

  const currentPermission = Notification.permission

  if (currentPermission === 'granted') {
    return true
  }

  if (currentPermission === 'denied') {
    console.warn(
      'Notification permission denied. User must enable in browser settings.'
    )
    return false
  }

  // Permission is 'default' (not asked yet), request it
  const permission = await requestNotificationPermission()
  return permission === 'granted'
}
