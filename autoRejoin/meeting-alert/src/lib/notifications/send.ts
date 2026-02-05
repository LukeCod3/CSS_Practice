/**
 * Unified Notification Handler
 *
 * Coordinates sending notifications across multiple channels:
 * - Email notifications (server-side via Resend)
 * - Browser notifications (client-side via Notification API)
 * - Database logging (audit trail)
 *
 * WHY UNIFIED HANDLER:
 * - Single function to trigger all notification types
 * - Consistent error handling across channels
 * - Database logging for audit and analytics
 * - Prevents duplicate notifications
 *
 * NOTIFICATION FLOW:
 * 1. Validate user and meeting exist
 * 2. Check if participant is meeting owner (prevent self-notifications)
 * 3. Send email notification (don't fail if this fails)
 * 4. Log to database for audit trail
 * 5. Return data for browser notification (client will display it)
 *
 * WHY EMAIL FROM SERVER, BROWSER FROM CLIENT:
 * - Email: Requires API keys, must be server-side
 * - Browser: Requires Notification API, must be client-side
 * - Server returns notification data, client displays it
 *
 * ERROR HANDLING PHILOSOPHY:
 * - Don't throw errors that break the notification flow
 * - If email fails, still log and return browser notification data
 * - Graceful degradation: some notification better than none
 * - Log all errors for debugging and monitoring
 */

import { createClient } from '@/lib/supabase/server'
import { sendParticipantEmail } from './email'

/**
 * Participant joined notification parameters
 */
export interface NotifyParticipantJoinedParams {
  userId: string // User ID to notify (meeting owner)
  meetingId: string // Meeting ID where participant joined
  participantName: string // Name of participant who joined
  participantEmail: string // Email of participant who joined
}

/**
 * Notification result
 */
export interface NotificationResult {
  success: boolean
  notification: {
    title: string // For browser notification
    body: string // For browser notification
    meetingLink: string // Meeting URL to open on click
  } | null
  emailSent: boolean // Was email sent successfully
  logged: boolean // Was notification logged to database
  error?: string // Error message if something failed
}

/**
 * Notify user when participant joins their meeting
 *
 * COMPLETE NOTIFICATION FLOW:
 * 1. Validate user exists and get their data (name, email)
 * 2. Validate meeting exists and get meeting data (title, link)
 * 3. Check if participant is the meeting owner (prevent self-notifications)
 * 4. Send email notification (non-blocking, don't fail entire flow)
 * 5. Log notification to database (audit trail)
 * 6. Return notification data for browser notification
 *
 * SELF-NOTIFICATION PREVENTION:
 * - If participant's email matches meeting owner's email, don't notify
 * - This prevents users from getting notified when THEY join their own meeting
 * - Common scenario: User clicks "Join Meeting" on their own meeting
 *
 * DATABASE LOGGING:
 * - Records all notifications for audit trail
 * - Enables analytics: notification count, delivery rate, etc.
 * - Tracks: user_id, meeting_id, type ('email'), message, sent_at
 * - Useful for debugging delivery issues
 *
 * GRACEFUL DEGRADATION:
 * - If email fails: still return browser notification data
 * - If database logging fails: still return notification data
 * - Goal: Always try to notify user, even if one channel fails
 *
 * @param params - Notification parameters
 * @returns Result with notification data and status flags
 *
 * @example
 * // In API route when participant joins
 * const result = await notifyParticipantJoined({
 *   userId: 'user-123',
 *   meetingId: 'meeting-456',
 *   participantName: 'Sarah Smith',
 *   participantEmail: 'sarah@example.com'
 * })
 *
 * if (result.success) {
 *   // Return notification data to client
 *   return NextResponse.json({
 *     success: true,
 *     notification: result.notification,
 *     emailSent: result.emailSent
 *   })
 * }
 */
export async function notifyParticipantJoined(
  params: NotifyParticipantJoinedParams
): Promise<NotificationResult> {
  const { userId, meetingId, participantName, participantEmail } = params

  console.log(
    `Processing notification: ${participantName} joined meeting ${meetingId} for user ${userId}`
  )

  const supabase = await createClient()

  try {
    /**
     * Step 1: Get user data
     *
     * Fetch user's name and email from auth.users table.
     * Need this to:
     * - Send email to correct recipient
     * - Personalize notification message
     * - Check if participant is the meeting owner
     */
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('email, raw_user_meta_data')
      .eq('id', userId)
      .single()

    // Fallback: Try to get user from auth if users table query fails
    let userEmail = user?.email
    let userName = user?.raw_user_meta_data?.name || user?.email?.split('@')[0]

    if (userError || !user) {
      console.log('User not found in users table, checking auth.users...')
      const { data: authData } = await supabase.auth.admin.getUserById(userId)

      if (!authData.user) {
        console.error('User not found:', userId)
        return {
          success: false,
          notification: null,
          emailSent: false,
          logged: false,
          error: 'User not found',
        }
      }

      userEmail = authData.user.email
      userName =
        authData.user.user_metadata?.name ||
        authData.user.email?.split('@')[0] ||
        'User'
    }

    if (!userEmail) {
      console.error('User has no email:', userId)
      return {
        success: false,
        notification: null,
        emailSent: false,
        logged: false,
        error: 'User email not found',
      }
    }

    /**
     * Step 2: Get meeting data
     *
     * Fetch meeting details from database.
     * Need: title, meeting_link for notification
     */
    const { data: meeting, error: meetingError } = await supabase
      .from('meetings')
      .select('title, meeting_link, user_id')
      .eq('id', meetingId)
      .single()

    if (meetingError || !meeting) {
      console.error('Meeting not found:', meetingId)
      return {
        success: false,
        notification: null,
        emailSent: false,
        logged: false,
        error: 'Meeting not found',
      }
    }

    /**
     * Step 3: Prevent self-notifications
     *
     * Don't notify user if THEY are the participant joining.
     * This prevents:
     * - User getting notified when they join their own meeting
     * - Duplicate notifications for the meeting owner
     * - Confusing UX ("You joined your meeting")
     *
     * Check: participant email matches user email
     */
    if (participantEmail.toLowerCase() === userEmail.toLowerCase()) {
      console.log(
        'Skipping notification: participant is the meeting owner',
        participantEmail
      )
      return {
        success: true,
        notification: null,
        emailSent: false,
        logged: false,
        error: 'Participant is meeting owner',
      }
    }

    console.log(`Sending notification to ${userEmail}`)

    /**
     * Step 4: Send email notification
     *
     * Send email via Resend API.
     * Non-blocking: If email fails, still continue with browser notification.
     *
     * EMAIL FAILURE HANDLING:
     * - Rate limit exceeded: Log error, continue
     * - Invalid email: Log error, continue
     * - Network error: Log error, continue
     * - Goal: Don't fail entire notification flow if email fails
     */
    let emailSent = false
    try {
      const emailResult = await sendParticipantEmail({
        userName: userName || 'User',
        userEmail: userEmail,
        participantName: participantName,
        meetingTitle: meeting.title || 'Untitled Meeting',
        meetingLink: meeting.meeting_link,
        joinedAt: new Date().toISOString(),
      })

      emailSent = emailResult.success

      if (emailResult.success) {
        console.log('Email notification sent successfully:', emailResult.id)
      } else {
        console.error('Email notification failed:', emailResult.error)
        // Don't throw - continue with browser notification
      }
    } catch (emailError: any) {
      console.error('Unexpected error sending email:', emailError.message)
      // Don't throw - continue with browser notification
    }

    /**
     * Step 5: Log notification to database
     *
     * Record notification in notifications table for:
     * - Audit trail (who was notified, when)
     * - Analytics (delivery rate, notification count)
     * - Debugging (troubleshoot delivery issues)
     *
     * TABLE SCHEMA:
     * - user_id: Who was notified
     * - meeting_id: Which meeting
     * - type: 'email' or 'browser'
     * - message: Notification content
     * - sent_at: Timestamp
     * - status: 'sent', 'failed', 'pending'
     */
    let logged = false
    try {
      const { error: logError } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          meeting_id: meetingId,
          type: 'email',
          message: `${participantName} joined ${meeting.title}`,
          sent_at: new Date().toISOString(),
          status: emailSent ? 'sent' : 'failed',
        })

      if (logError) {
        console.error('Failed to log notification:', logError)
        // Don't throw - this is not critical
      } else {
        logged = true
        console.log('Notification logged to database')
      }
    } catch (logError: any) {
      console.error('Unexpected error logging notification:', logError.message)
      // Don't throw - this is not critical
    }

    /**
     * Step 6: Return notification data for browser notification
     *
     * Server can't trigger browser notifications directly.
     * Return data to client, client will display notification.
     *
     * CLIENT USAGE:
     * 1. Client receives this data in API response
     * 2. Client calls sendBrowserNotification() with this data
     * 3. Browser shows notification to user
     */
    const notification = {
      title: `🔔 ${participantName} joined`,
      body: meeting.title || 'Your meeting',
      meetingLink: meeting.meeting_link,
    }

    console.log('Notification processing complete')

    return {
      success: true,
      notification,
      emailSent,
      logged,
    }
  } catch (error: any) {
    console.error('Unexpected error in notifyParticipantJoined:', error.message)

    return {
      success: false,
      notification: null,
      emailSent: false,
      logged: false,
      error: error.message || 'Unknown error',
    }
  }
}

/**
 * Batch notify multiple users
 *
 * Sends notifications to multiple users about the same event.
 * Useful when multiple users are monitoring the same meeting.
 *
 * @param notifications - Array of notification parameters
 * @returns Array of results
 */
export async function notifyMultipleUsers(
  notifications: NotifyParticipantJoinedParams[]
): Promise<NotificationResult[]> {
  console.log(`Batch notifying ${notifications.length} users`)

  const results = await Promise.all(
    notifications.map((params) => notifyParticipantJoined(params))
  )

  const successCount = results.filter((r) => r.success).length
  console.log(
    `Batch notification complete: ${successCount}/${results.length} successful`
  )

  return results
}
