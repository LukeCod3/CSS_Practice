/**
 * Supabase Server Client
 *
 * This client is used for SERVER-SIDE operations in:
 * - Server Components (default in Next.js 14 App Router)
 * - API Routes (/app/api/*)
 * - Server Actions
 * - Middleware
 *
 * WHEN TO USE THIS CLIENT:
 * ✓ Server Components fetching data
 * ✓ API route handlers
 * ✓ Server-side authentication checks
 * ✓ Protected page validation
 * ✓ Database operations from the server
 *
 * WHEN NOT TO USE:
 * ✗ Client Components ('use client')
 * ✗ Browser-side operations
 * ✗ Real-time subscriptions (use browser client)
 *
 * For client-side operations, use ./client.ts instead
 */

import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Creates a Supabase client for server-side use with cookie handling
 *
 * COOKIE HANDLING:
 * This client reads and writes cookies to maintain auth state across requests.
 * Next.js 14 requires explicit cookie management using the cookies() API.
 *
 * The client will:
 * 1. Read auth tokens from cookies on each request
 * 2. Validate and refresh tokens if needed
 * 3. Update cookies with new tokens after refresh
 * 4. Remove cookies on sign out
 *
 * IMPORTANT: This must be called inside an async Server Component,
 * API Route, or Server Action where cookies() is available.
 *
 * @returns Supabase client instance for server with cookie support
 *
 * @example
 * // In a Server Component
 * export default async function Page() {
 *   const supabase = createClient()
 *   const { data: { user } } = await supabase.auth.getUser()
 *   // ...
 * }
 *
 * @example
 * // In an API Route
 * export async function GET() {
 *   const supabase = createClient()
 *   const { data } = await supabase.from('meetings').select()
 *   return Response.json(data)
 * }
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        /**
         * Get a cookie by name
         * Used by Supabase to read auth tokens
         */
        get(name: string) {
          return cookieStore.get(name)?.value
        },

        /**
         * Set a cookie with options
         * Used by Supabase to store auth tokens after sign in or refresh
         *
         * SECURITY NOTES:
         * - httpOnly: Prevents JavaScript access (XSS protection)
         * - secure: Only sent over HTTPS in production
         * - sameSite: CSRF protection
         * - path: Cookie available to entire app
         */
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            /**
             * IMPORTANT: The set method can be called from Server Components,
             * which are read-only. In this case, setting cookies will fail.
             * This is expected behavior - cookies can only be set in:
             * - API Routes
             * - Server Actions
             * - Route Handlers
             *
             * For Server Components, use middleware or check auth without
             * attempting to refresh tokens.
             */
            console.error('Error setting cookie:', error)
          }
        },

        /**
         * Remove a cookie by name
         * Used by Supabase on sign out to clear auth tokens
         */
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            /**
             * Same read-only limitation as set() applies here.
             * Sign out should be done through an API route or Server Action.
             */
            console.error('Error removing cookie:', error)
          }
        },
      },
    }
  )
}

/**
 * Type helper to get the Supabase server client type
 * Useful for TypeScript type inference
 */
export type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>
