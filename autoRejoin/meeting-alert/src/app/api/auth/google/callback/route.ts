/**
 * Google OAuth Callback Endpoint
 *
 * GET /api/auth/google/callback?code=...
 *
 * Handles the OAuth callback from Google after user approves access
 *
 * FLOW:
 * 1. User approves → Google redirects here with authorization code
 * 2. Exchange code for access_token and refresh_token
 * 3. Get user's Google ID and email
 * 4. Save or update in accounts table (upsert)
 * 5. Redirect to dashboard with success message
 *
 * ERROR HANDLING:
 * - Missing code: User denied or error occurred
 * - Invalid code: Code expired or already used
 * - Database errors: Failed to save account
 * - All errors redirect to dashboard with error message
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getTokenFromCode, getUserInfo } from '@/lib/google/oauth'

/**
 * GET /api/auth/google/callback
 *
 * OAuth callback handler
 *
 * QUERY PARAMETERS:
 * - code: Authorization code from Google (required)
 * - error: Error code if user denied access (optional)
 *
 * SUCCESS: Redirects to /dashboard?success=google_connected
 * ERROR: Redirects to /dashboard?error=google_connection_failed
 *
 * @param request - Next.js request with query parameters
 * @returns Redirect to dashboard
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  const supabase = await createClient()

  // Check if user denied access
  if (error) {
    console.log('User denied Google access or error occurred:', error)
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=access_denied`
    )
  }

  // Validate authorization code
  if (!code) {
    console.error('No authorization code received from Google')
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=missing_code`
    )
  }

  try {
    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      console.error('User not authenticated:', userError)
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/login?error=not_authenticated`
      )
    }

    console.log(`Processing Google OAuth callback for user ${user.id}`)

    // Exchange code for tokens
    console.log('Exchanging authorization code for tokens...')
    const { tokens } = await getTokenFromCode(code)

    if (!tokens.access_token || !tokens.refresh_token || !tokens.expiry_date) {
      throw new Error('Incomplete token response from Google')
    }

    console.log('Tokens received successfully')

    // Get Google user info
    console.log('Fetching Google user info...')
    const googleUser = await getUserInfo(tokens.access_token)
    console.log(`Google user: ${googleUser.email} (${googleUser.id})`)

    // Calculate expires_at in seconds (Google returns milliseconds)
    const expiresAtSeconds = Math.floor(tokens.expiry_date / 1000)

    // Save to accounts table (upsert)
    console.log('Saving Google account to database...')
    const { error: dbError } = await supabase.from('accounts').upsert(
      {
        user_id: user.id,
        provider: 'google',
        provider_account_id: googleUser.id,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: expiresAtSeconds,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'provider,provider_account_id', // Update if exists
      }
    )

    if (dbError) {
      console.error('Database error saving Google account:', dbError)
      throw new Error(`Failed to save account: ${dbError.message}`)
    }

    console.log('Google account connected successfully')

    // Redirect to dashboard with success message
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=google_connected`
    )
  } catch (error: any) {
    console.error('Error in Google OAuth callback:', error.message)

    // Determine error type for better user messaging
    let errorCode = 'google_connection_failed'

    if (error.message?.includes('authorization code')) {
      errorCode = 'invalid_code'
    } else if (error.message?.includes('database') || error.message?.includes('save')) {
      errorCode = 'database_error'
    } else if (error.message?.includes('token')) {
      errorCode = 'token_exchange_failed'
    }

    // Redirect to dashboard with error
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=${errorCode}`
    )
  }
}
