/**
 * Sign Out API Route
 *
 * This is an API ROUTE HANDLER for signing out users
 *
 * WHY AN API ROUTE?
 * - API routes can modify cookies (Server Components cannot)
 * - Allows sign out via form POST (works without JavaScript)
 * - Provides a dedicated endpoint for sign out operations
 * - Can be called from client or server
 *
 * AUTHENTICATION FLOW:
 * 1. User clicks "Sign Out" button (form POST)
 * 2. This route handler receives the POST request
 * 3. Create server Supabase client (with cookie support)
 * 4. Call signOut() to invalidate the session
 * 5. Supabase automatically clears auth cookies
 * 6. Redirect user to /login page
 *
 * SECURITY:
 * - Only accepts POST requests (prevents CSRF via GET)
 * - Supabase handles secure cookie removal
 * - Session invalidated on server side
 * - No client-side token manipulation needed
 *
 * ERROR HANDLING:
 * - If sign out fails: redirect to login anyway (fail-safe)
 * - Always clear cookies even on error
 * - Log errors for debugging
 */

import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/auth/signout
 *
 * Signs out the current user and redirects to login page
 *
 * @param request - Next.js request object
 * @returns Redirect response to /login
 *
 * USAGE FROM CLIENT COMPONENT:
 * ```tsx
 * const handleSignOut = async () => {
 *   await fetch('/api/auth/signout', { method: 'POST' })
 *   router.push('/login')
 * }
 * ```
 *
 * USAGE FROM FORM (No JavaScript needed):
 * ```tsx
 * <form action="/api/auth/signout" method="POST">
 *   <button type="submit">Sign Out</button>
 * </form>
 * ```
 */
export async function POST(request: NextRequest) {
  try {
    // Create server Supabase client with cookie support
    const supabase = await createClient()

    /**
     * Sign out the current user
     *
     * This will:
     * 1. Invalidate the session in Supabase database
     * 2. Clear authentication cookies via the server client
     * 3. Remove the JWT token from storage
     *
     * After signOut(), the user is no longer authenticated
     */
    const { error } = await supabase.auth.signOut()

    if (error) {
      /**
       * Log error but still redirect to login
       * This ensures user is always redirected even if sign out fails
       * (e.g., network issues, already signed out, etc.)
       */
      console.error('Sign out error:', error.message)
    }

    /**
     * Redirect to login page
     *
     * Using NextResponse.redirect() ensures proper HTTP redirect
     * The user's browser will navigate to /login automatically
     */
    const redirectUrl = new URL('/login', request.url)
    return NextResponse.redirect(redirectUrl)
  } catch (error) {
    /**
     * Catch any unexpected errors
     * Still redirect to login as a fail-safe
     */
    console.error('Unexpected sign out error:', error)

    const redirectUrl = new URL('/login', request.url)
    return NextResponse.redirect(redirectUrl)
  }
}

/**
 * Block GET requests
 *
 * Sign out should only be done via POST to prevent CSRF attacks
 * If someone tries GET /api/auth/signout, return 405 Method Not Allowed
 */
export async function GET() {
  return new NextResponse('Method Not Allowed', { status: 405 })
}
