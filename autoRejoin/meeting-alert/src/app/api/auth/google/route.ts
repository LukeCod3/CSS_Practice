/**
 * Google OAuth Initiate Endpoint
 *
 * GET /api/auth/google
 *
 * Initiates the OAuth flow by redirecting user to Google's consent screen
 *
 * FLOW:
 * 1. User clicks "Connect Google Account" button
 * 2. Frontend calls this endpoint
 * 3. We generate OAuth URL with required scopes
 * 4. Redirect user to Google for authorization
 * 5. User approves → Google redirects to /api/auth/google/callback
 *
 * SCOPES REQUESTED:
 * - calendar.readonly: Read calendar events
 * - calendar.events.readonly: Read event details (Meet links)
 * - userinfo.email: Get user's email for identification
 *
 * ACCESS TYPE:
 * - offline: Provides refresh_token for long-term access
 * - prompt: 'consent' forces consent screen (ensures refresh_token)
 */

import { NextResponse } from 'next/server'
import { getAuthUrl } from '@/lib/google/oauth'

/**
 * GET /api/auth/google
 *
 * Redirects user to Google OAuth consent screen
 *
 * @returns Redirect to Google OAuth URL
 *
 * @example
 * // In a client component
 * <button onClick={() => window.location.href = '/api/auth/google'}>
 *   Connect Google Account
 * </button>
 */
export async function GET() {
  try {
    // Generate OAuth URL
    const authUrl = getAuthUrl()

    console.log('Redirecting user to Google OAuth consent screen')

    // Redirect to Google
    return NextResponse.redirect(authUrl)
  } catch (error: any) {
    console.error('Error initiating Google OAuth:', error.message)

    // Return error response
    return NextResponse.json(
      {
        error: 'Failed to initiate Google authentication',
        message: error.message,
      },
      { status: 500 }
    )
  }
}
