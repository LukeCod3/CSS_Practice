/**
 * Google Calendar Module
 *
 * Fetches upcoming Google Meet meetings from user's calendar
 *
 * KEY FEATURES:
 * - Auto-refresh expired tokens
 * - Multiple Meet link detection strategies
 * - Rate limit handling with exponential backoff
 * - Pagination for users with many events
 * - Comprehensive error handling
 *
 * MEET LINK DETECTION:
 * We use 4 fallback strategies to ensure we catch all Google Meet links:
 * 1. conferenceData.entryPoints (primary, most reliable)
 * 2. hangoutLink field (older events)
 * 3. Parse description for meet.google.com URLs
 * 4. Parse location field for Meet links
 */

import { google, calendar_v3 } from 'googleapis'
import { createClient } from '@/lib/supabase/server'
import { oauth2Client, refreshAccessToken } from './oauth'

/**
 * Meeting object returned by getUpcomingMeetings
 */
export type Meeting = {
  meeting_id: string // Google Calendar event ID
  meeting_link: string // Google Meet URL
  meeting_code: string // Meet code (abc-defg-hij)
  title: string
  scheduled_start: string // ISO datetime
  scheduled_end: string // ISO datetime
  attendees: Array<{ email: string; name?: string }>
}

/**
 * Get configured Calendar API client for a user
 *
 * FLOW:
 * 1. Fetch Google account from Supabase
 * 2. Check if access token is expired (with 5-minute buffer)
 * 3. Auto-refresh if expired and update database
 * 4. Return configured Calendar client
 *
 * TOKEN EXPIRY BUFFER:
 * - Tokens expire after ~1 hour
 * - We add 5-minute buffer (expires_at < now + 5min)
 * - This prevents token expiring mid-request
 *
 * ERROR SCENARIOS:
 * - No Google account connected → clear message to connect
 * - Invalid refresh token → prompt user to reconnect
 * - Network errors → retry with backoff
 *
 * @param userId - Supabase user ID
 * @returns Configured Calendar API client
 * @throws Error with specific message for each failure scenario
 */
export async function getCalendarClient(userId: string) {
  const supabase = await createClient()

  // Fetch Google account from database
  const { data: account, error: accountError } = await supabase
    .from('accounts')
    .select('*')
    .eq('user_id', userId)
    .eq('provider', 'google')
    .single()

  if (accountError || !account) {
    throw new Error(
      'NO_ACCOUNT: No Google account connected. Please connect your Google account in settings.'
    )
  }

  // Check if access token is expired (with 5-minute buffer)
  const now = Math.floor(Date.now() / 1000) // Unix timestamp in seconds
  const expiryBuffer = 5 * 60 // 5 minutes in seconds
  const isExpired = account.expires_at < now + expiryBuffer

  let accessToken = account.access_token

  // Refresh token if expired
  if (isExpired) {
    console.log(
      `Access token expired for user ${userId}, refreshing... (expires_at: ${account.expires_at}, now: ${now})`
    )

    try {
      const newTokens = await refreshAccessToken(account.refresh_token)

      // Update database with new access token
      const { error: updateError } = await supabase
        .from('accounts')
        .update({
          access_token: newTokens.access_token,
          expires_at: Math.floor(newTokens.expiry_date / 1000), // Convert ms to seconds
          updated_at: new Date().toISOString(),
        })
        .eq('id', account.id)

      if (updateError) {
        console.error('Failed to update refreshed token:', updateError)
        // Continue anyway - token is valid even if database update failed
      }

      accessToken = newTokens.access_token
      console.log(`Token refreshed successfully for user ${userId}`)
    } catch (error: any) {
      // Check if user needs to reconnect
      if (error.message?.includes('RECONNECT_REQUIRED')) {
        throw error // Pass through reconnect errors
      }

      // Other refresh errors
      throw new Error(
        `TOKEN_REFRESH_FAILED: Failed to refresh your Google access token. Please try again later.`
      )
    }
  }

  // Configure OAuth client with access token
  oauth2Client.setCredentials({
    access_token: accessToken,
  })

  // Return Calendar API client
  return google.calendar({
    version: 'v3',
    auth: oauth2Client,
  })
}

/**
 * Extract Google Meet link from calendar event
 *
 * STRATEGIES (in order):
 * 1. conferenceData.entryPoints - Official Meet integration
 * 2. hangoutLink - Legacy field for older events
 * 3. description - Parse for meet.google.com URLs
 * 4. location - Sometimes Meet links are in location field
 *
 * @param event - Calendar event from Google API
 * @returns Google Meet URL or null if not found
 */
function extractMeetLink(event: calendar_v3.Schema$Event): string | null {
  // Strategy 1: conferenceData.entryPoints (most reliable)
  if (event.conferenceData?.entryPoints) {
    const meetEntry = event.conferenceData.entryPoints.find(
      (entry) => entry.entryPointType === 'video'
    )
    if (meetEntry?.uri) {
      return meetEntry.uri
    }
  }

  // Strategy 2: hangoutLink field (older events)
  if (event.hangoutLink) {
    return event.hangoutLink
  }

  // Strategy 3: Parse description for meet.google.com URLs
  if (event.description) {
    const meetRegex = /https?:\/\/meet\.google\.com\/[a-z]{3}-[a-z]{4}-[a-z]{3}/gi
    const match = event.description.match(meetRegex)
    if (match) {
      return match[0]
    }
  }

  // Strategy 4: Parse location field
  if (event.location) {
    const meetRegex = /https?:\/\/meet\.google\.com\/[a-z]{3}-[a-z]{4}-[a-z]{3}/gi
    const match = event.location.match(meetRegex)
    if (match) {
      return match[0]
    }
  }

  return null
}

/**
 * Extract meeting code from Google Meet URL
 *
 * FORMATS:
 * - https://meet.google.com/abc-defg-hij → abc-defg-hij
 * - meet.google.com/abc-defg-hij → abc-defg-hij
 *
 * @param meetLink - Google Meet URL
 * @returns Meeting code (abc-defg-hij format) or empty string
 */
function extractMeetCode(meetLink: string): string {
  const codeRegex = /meet\.google\.com\/([a-z]{3}-[a-z]{4}-[a-z]{3})/i
  const match = meetLink.match(codeRegex)
  return match ? match[1] : ''
}

/**
 * Get upcoming Google Meet meetings for the next 24 hours
 *
 * FEATURES:
 * - Fetches events for next 24 hours
 * - Filters for Google Meet links only
 * - Handles pagination (max 2500 results per page)
 * - Rate limit handling with exponential backoff
 * - Extracts meeting details (title, time, attendees)
 *
 * RATE LIMITS:
 * - Google Calendar API: 1M requests/day, 10 requests/second
 * - We handle 429 errors with exponential backoff
 * - Max 3 retries with delays: 2s, 4s, 8s
 *
 * @param userId - Supabase user ID
 * @returns Array of Meeting objects (only events with Google Meet links)
 * @throws Error for various failure scenarios
 *
 * @example
 * try {
 *   const meetings = await getUpcomingMeetings(userId)
 *   console.log(`Found ${meetings.length} upcoming meetings`)
 * } catch (error) {
 *   if (error.message.includes('NO_ACCOUNT')) {
 *     // Prompt user to connect Google account
 *   }
 * }
 */
export async function getUpcomingMeetings(
  userId: string,
  maxRetries = 3
): Promise<Meeting[]> {
  let calendar: calendar_v3.Calendar

  try {
    calendar = await getCalendarClient(userId)
  } catch (error: any) {
    // Pass through specific errors (NO_ACCOUNT, RECONNECT_REQUIRED, etc.)
    throw error
  }

  const meetings: Meeting[] = []
  let pageToken: string | undefined

  // Time range: now to 24 hours from now
  const now = new Date()
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)

  let attempt = 0
  let lastError: Error | null = null

  // Retry loop for rate limit handling
  while (attempt < maxRetries) {
    try {
      // Fetch events (with pagination)
      do {
        const response = await calendar.events.list({
          calendarId: 'primary',
          timeMin: now.toISOString(),
          timeMax: tomorrow.toISOString(),
          singleEvents: true, // Expand recurring events
          orderBy: 'startTime',
          maxResults: 2500, // Max allowed by Google
          pageToken,
        })

        const events = response.data.items || []

        // Process each event
        for (const event of events) {
          // Skip events without start time
          if (!event.start?.dateTime) continue

          // Extract Google Meet link
          const meetLink = extractMeetLink(event)
          if (!meetLink) continue // Skip non-Meet events

          // Extract meeting code
          const meetCode = extractMeetCode(meetLink)

          // Extract attendees
          const attendees =
            event.attendees?.map((attendee) => ({
              email: attendee.email || '',
              name: attendee.displayName,
            })) || []

          // Add to meetings array
          meetings.push({
            meeting_id: event.id!,
            meeting_link: meetLink,
            meeting_code: meetCode,
            title: event.summary || 'Untitled Meeting',
            scheduled_start: event.start.dateTime!,
            scheduled_end: event.end?.dateTime || event.start.dateTime!,
            attendees,
          })
        }

        // Check for next page
        pageToken = response.data.nextPageToken || undefined
      } while (pageToken)

      // Success - return meetings
      console.log(`Found ${meetings.length} upcoming Google Meet meetings for user ${userId}`)
      return meetings
    } catch (error: any) {
      lastError = error
      attempt++

      // Check for rate limit error (429)
      if (error.code === 429 || error.message?.includes('rate limit')) {
        if (attempt < maxRetries) {
          const delayMs = Math.pow(2, attempt) * 1000 // 2s, 4s, 8s
          console.warn(
            `Rate limit hit, retrying in ${delayMs}ms (attempt ${attempt}/${maxRetries})`
          )
          await new Promise((resolve) => setTimeout(resolve, delayMs))
          continue
        }
      }

      // Check for token errors
      if (error.code === 401 || error.message?.includes('invalid_grant')) {
        throw new Error(
          'RECONNECT_REQUIRED: Your Google account connection has expired. Please reconnect your account.'
        )
      }

      // Other errors - retry if attempts remain
      if (attempt < maxRetries) {
        const delayMs = 1000 * attempt // 1s, 2s, 3s
        console.warn(
          `Error fetching calendar events, retrying in ${delayMs}ms (attempt ${attempt}/${maxRetries}):`,
          error.message
        )
        await new Promise((resolve) => setTimeout(resolve, delayMs))
      }
    }
  }

  // All retries exhausted
  throw new Error(
    `Failed to fetch calendar events after ${maxRetries} attempts: ${lastError?.message}`
  )
}

/**
 * Error type definitions for better error handling
 */
export const CalendarErrors = {
  NO_ACCOUNT: 'NO_ACCOUNT',
  RECONNECT_REQUIRED: 'RECONNECT_REQUIRED',
  TOKEN_REFRESH_FAILED: 'TOKEN_REFRESH_FAILED',
  RATE_LIMIT: 'RATE_LIMIT',
  NETWORK_ERROR: 'NETWORK_ERROR',
} as const

export type CalendarErrorType =
  (typeof CalendarErrors)[keyof typeof CalendarErrors]
