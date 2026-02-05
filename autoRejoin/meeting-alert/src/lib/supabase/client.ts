/**
 * Supabase Browser Client
 *
 * This client is used for CLIENT-SIDE operations in:
 * - Client Components (components marked with 'use client')
 * - Browser-side authentication flows
 * - Real-time subscriptions
 * - Client-side data fetching
 *
 * WHEN TO USE THIS CLIENT:
 * ✓ Sign in/sign up forms
 * ✓ Client components that need auth state
 * ✓ Browser-side API calls
 * ✓ Real-time listeners
 *
 * WHEN NOT TO USE:
 * ✗ Server Components
 * ✗ API Routes
 * ✗ Server Actions
 * ✗ Middleware
 *
 * For server-side operations, use ./server.ts instead
 */

import { createBrowserClient } from '@supabase/ssr'

/**
 * Creates and returns a singleton Supabase client for browser use
 *
 * This client:
 * - Automatically manages auth state in localStorage
 * - Handles session refresh automatically
 * - Persists auth across page reloads
 * - Works with cookies for SSR compatibility
 *
 * @returns Supabase client instance for browser
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

/**
 * Type helper to get the Supabase client type
 * Useful for TypeScript type inference in components
 */
export type SupabaseClient = ReturnType<typeof createClient>
