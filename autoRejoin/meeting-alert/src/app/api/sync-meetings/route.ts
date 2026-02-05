/**
 * Sync Meetings Endpoint
 *
 * POST /api/sync-meetings
 *
 * Fetches upcoming Google Meet meetings and syncs them to the database
 *
 * FLOW:
 * 1. Authenticate user
 * 2. Fetch upcoming meetings from Google Calendar (next 24 hours)
 * 3. Upsert each meeting to database
 * 4. Return success with count of synced meetings
 *
 * ERROR HANDLING:
 * - Partial failures: Continue syncing other meetings
 * - Track errors for each failed meeting
 * - Return summary of successes and failures
 *
 * RESPONSE:
 * {
 *   success: true,
 *   synced: 5,
 *   failed: 1,
 *   errors: ["Failed to sync meeting ABC: Database error"]
 * }
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUpcomingMeetings, CalendarErrors } from '@/lib/google/calendar'

/**
 * POST /api/sync-meetings
 *
 * Syncs upcoming Google Meet meetings to database
 *
 * AUTHENTICATION: Required (checks auth token)
 *
 * SUCCESS RESPONSE:
 * {
 *   success: true,
 *   synced: number,      // Count of successfully synced meetings
 *   failed: number,      // Count of failed meetings
 *   errors: string[]     // Error messages for failed meetings
 * }
 *
 * ERROR RESPONSE:
 * {
 *   success: false,
 *   error: string,       // Error code (NO_ACCOUNT, RECONNECT_REQUIRED, etc.)
 *   message: string      // Human-readable error message
 * }
 *
 * @param request - Next.js request
 * @returns JSON response with sync results
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient()

  try {
    // Authenticate user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: 'UNAUTHENTICATED',
          message: 'You must be signed in to sync meetings',
        },
        { status: 401 }
      )
    }

    console.log(`Syncing meetings for user ${user.id}`)

    // Fetch upcoming meetings from Google Calendar
    let meetings
    try {
      meetings = await getUpcomingMeetings(user.id)
      console.log(`Fetched ${meetings.length} meetings from Google Calendar`)
    } catch (error: any) {
      // Handle specific calendar errors
      const errorMessage = error.message || ''

      if (errorMessage.includes(CalendarErrors.NO_ACCOUNT)) {
        return NextResponse.json(
          {
            success: false,
            error: CalendarErrors.NO_ACCOUNT,
            message:
              'No Google account connected. Please connect your Google account first.',
          },
          { status: 400 }
        )
      }

      if (errorMessage.includes(CalendarErrors.RECONNECT_REQUIRED)) {
        return NextResponse.json(
          {
            success: false,
            error: CalendarErrors.RECONNECT_REQUIRED,
            message:
              'Your Google account connection has expired. Please reconnect your account.',
          },
          { status: 401 }
        )
      }

      // Generic error
      console.error('Error fetching meetings:', errorMessage)
      return NextResponse.json(
        {
          success: false,
          error: 'FETCH_FAILED',
          message: 'Failed to fetch meetings from Google Calendar. Please try again.',
        },
        { status: 500 }
      )
    }

    // If no meetings found
    if (meetings.length === 0) {
      return NextResponse.json({
        success: true,
        synced: 0,
        failed: 0,
        errors: [],
        message: 'No upcoming Google Meet meetings found in the next 24 hours',
      })
    }

    // Sync meetings to database (with partial failure handling)
    let syncedCount = 0
    let failedCount = 0
    const errors: string[] = []

    for (const meeting of meetings) {
      try {
        // Upsert meeting to database
        const { error: dbError } = await supabase.from('meetings').upsert(
          {
            user_id: user.id,
            platform: 'google_meet',
            meeting_id: meeting.meeting_id,
            meeting_link: meeting.meeting_link,
            title: meeting.title,
            scheduled_start: meeting.scheduled_start,
            scheduled_end: meeting.scheduled_end,
            attendees: meeting.attendees,
            status: 'scheduled',
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: 'user_id,meeting_id', // Update if exists
          }
        )

        if (dbError) {
          throw new Error(dbError.message)
        }

        syncedCount++
        console.log(`Synced meeting: ${meeting.title} (${meeting.meeting_id})`)
      } catch (error: any) {
        failedCount++
        const errorMsg = `Failed to sync "${meeting.title}": ${error.message}`
        errors.push(errorMsg)
        console.error(errorMsg)
        // Continue with next meeting (partial failure)
      }
    }

    console.log(
      `Sync complete: ${syncedCount} synced, ${failedCount} failed out of ${meetings.length} total`
    )

    // Return results
    return NextResponse.json({
      success: true,
      synced: syncedCount,
      failed: failedCount,
      errors,
      message:
        failedCount === 0
          ? `Successfully synced ${syncedCount} meeting${syncedCount !== 1 ? 's' : ''}`
          : `Synced ${syncedCount} meeting${syncedCount !== 1 ? 's' : ''} with ${failedCount} failure${failedCount !== 1 ? 's' : ''}`,
    })
  } catch (error: any) {
    console.error('Unexpected error in sync-meetings:', error.message)

    return NextResponse.json(
      {
        success: false,
        error: 'UNEXPECTED_ERROR',
        message: 'An unexpected error occurred. Please try again.',
      },
      { status: 500 }
    )
  }
}

/**
 * GET method not allowed
 */
export async function GET() {
  return NextResponse.json(
    {
      success: false,
      error: 'METHOD_NOT_ALLOWED',
      message: 'This endpoint only accepts POST requests',
    },
    { status: 405 }
  )
}
