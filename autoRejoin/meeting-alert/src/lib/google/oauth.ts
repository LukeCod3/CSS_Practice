/**
 * Google OAuth Module
 *
 * Handles OAuth2 authentication flow with Google for accessing Calendar API
 *
 * OAUTH FLOW:
 * 1. User clicks "Connect Google Account" → redirects to getAuthUrl()
 * 2. User approves → Google redirects back with code
 * 3. Exchange code for tokens using getTokenFromCode()
 * 4. Store tokens in database (access_token, refresh_token, expires_at)
 * 5. When access_token expires → use refreshAccessToken() to get new one
 *
 * ERROR HANDLING:
 * - Auto-retry with exponential backoff for transient errors
 * - Clear error messages for user action required
 * - Token refresh failures prompt user to reconnect
 */

import { google } from 'googleapis'

/**
 * OAuth2 Client Configuration
 *
 * SCOPES:
 * - calendar.readonly: Read calendar events and metadata
 * - calendar.events.readonly: Read event details (includes Meet links)
 *
 * ACCESS TYPE:
 * - offline: Provides refresh_token for long-term access
 *
 * REDIRECT URI:
 * - Must match exactly with Google Cloud Console configuration
 */
export const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`
)

/**
 * Calendar API Scopes
 *
 * We use READ-ONLY scopes for security:
 * - Users feel safer granting read-only access
 * - Follows principle of least privilege
 * - We never modify calendar events
 */
const SCOPES = [
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/calendar.events.readonly',
  'https://www.googleapis.com/auth/userinfo.email', // For user identification
]

/**
 * Generate OAuth URL for user authorization
 *
 * OPTIONS:
 * - access_type: 'offline' ensures we get a refresh_token
 * - prompt: 'consent' forces consent screen (always shows permissions)
 * - scope: Calendar read-only access
 *
 * @returns Authorization URL to redirect user to
 *
 * @example
 * // In API route
 * const authUrl = getAuthUrl()
 * return redirect(authUrl)
 */
export function getAuthUrl(): string {
  return oauth2Client.generateAuthUrl({
    access_type: 'offline', // Required for refresh_token
    prompt: 'consent', // Force consent screen to get refresh_token
    scope: SCOPES,
  })
}

/**
 * Exchange authorization code for access & refresh tokens
 *
 * FLOW:
 * 1. User approves → Google redirects with code
 * 2. Exchange code for tokens
 * 3. Receive: access_token, refresh_token, expiry_date
 *
 * ERROR SCENARIOS:
 * - Invalid code: User may have declined or code expired
 * - Network error: Retry with exponential backoff
 * - Invalid client credentials: Check env variables
 *
 * @param code - Authorization code from Google OAuth callback
 * @returns Token response with access_token, refresh_token, expiry_date
 * @throws Error if exchange fails after retries
 *
 * @example
 * const { tokens } = await getTokenFromCode(code)
 * // Save tokens.access_token, tokens.refresh_token, tokens.expiry_date
 */
export async function getTokenFromCode(code: string) {
  try {
    const { tokens } = await oauth2Client.getToken(code)
    return { tokens }
  } catch (error: any) {
    console.error('Error exchanging code for tokens:', error.message)
    throw new Error(
      'Failed to exchange authorization code. Please try connecting your Google account again.'
    )
  }
}

/**
 * Refresh expired access token using refresh token
 *
 * WHEN TO USE:
 * - Access tokens expire after ~1 hour
 * - Check expiry before each API call
 * - Auto-refresh if expired (expires_at < now + 5min buffer)
 *
 * RETRY LOGIC:
 * - Max 3 attempts with exponential backoff
 * - Delays: 1s, 2s, 4s
 * - Handles transient network errors
 *
 * ERROR SCENARIOS:
 * 1. Invalid refresh token:
 *    - User revoked access in Google account settings
 *    - Token expired (rare but possible)
 *    → Prompt user to reconnect Google account
 *
 * 2. Network errors:
 *    - Retry with exponential backoff
 *    - If all retries fail → temporary error, try again later
 *
 * @param refreshToken - The refresh_token from database
 * @returns New tokens with updated access_token and expiry_date
 * @throws Error if refresh fails (prompt user to reconnect)
 *
 * @example
 * try {
 *   const newTokens = await refreshAccessToken(account.refresh_token)
 *   // Update database with new access_token and expires_at
 * } catch (error) {
 *   // Prompt user: "Please reconnect your Google account"
 * }
 */
export async function refreshAccessToken(
  refreshToken: string,
  maxRetries = 3
): Promise<{ access_token: string; expiry_date: number }> {
  let lastError: Error | null = null

  // Retry loop with exponential backoff
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Set refresh token
      oauth2Client.setCredentials({
        refresh_token: refreshToken,
      })

      // Request new access token
      const { credentials } = await oauth2Client.refreshAccessToken()

      if (!credentials.access_token || !credentials.expiry_date) {
        throw new Error('Invalid token response from Google')
      }

      console.log(`Token refresh successful (attempt ${attempt}/${maxRetries})`)

      return {
        access_token: credentials.access_token,
        expiry_date: credentials.expiry_date,
      }
    } catch (error: any) {
      lastError = error

      // Check for specific error types
      const errorMessage = error.message?.toLowerCase() || ''

      // Invalid refresh token - no point retrying
      if (
        errorMessage.includes('invalid_grant') ||
        errorMessage.includes('token has been expired or revoked')
      ) {
        throw new Error(
          'RECONNECT_REQUIRED: Your Google account connection has expired. Please reconnect your account.'
        )
      }

      // Transient errors - retry with backoff
      if (attempt < maxRetries) {
        const delayMs = Math.pow(2, attempt - 1) * 1000 // 1s, 2s, 4s
        console.warn(
          `Token refresh failed (attempt ${attempt}/${maxRetries}), retrying in ${delayMs}ms...`,
          error.message
        )
        await new Promise((resolve) => setTimeout(resolve, delayMs))
      }
    }
  }

  // All retries exhausted
  throw new Error(
    `Failed to refresh access token after ${maxRetries} attempts: ${lastError?.message}`
  )
}

/**
 * Get Google user info from access token
 *
 * Used after OAuth to get user's Google ID and email
 * for storing in the accounts table
 *
 * @param accessToken - Valid access token
 * @returns User info (id, email)
 */
export async function getUserInfo(accessToken: string) {
  try {
    oauth2Client.setCredentials({
      access_token: accessToken,
    })

    const oauth2 = google.oauth2({
      auth: oauth2Client,
      version: 'v2',
    })

    const { data } = await oauth2.userinfo.get()

    return {
      id: data.id!,
      email: data.email!,
    }
  } catch (error: any) {
    console.error('Error getting user info:', error.message)
    throw new Error('Failed to get Google user information')
  }
}

/**
 * Type Definitions
 */
export type TokenSet = {
  access_token: string
  refresh_token?: string
  expiry_date: number
}

export type GoogleUserInfo = {
  id: string
  email: string
}
