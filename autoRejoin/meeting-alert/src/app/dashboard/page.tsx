/**
 * Dashboard Page Component
 *
 * This is a SERVER COMPONENT (no 'use client') because it:
 * - Checks authentication server-side
 * - Fetches initial data from the database (accounts, meetings)
 * - Reduces client-side JavaScript
 * - Improves initial page load performance
 *
 * AUTHENTICATION FLOW:
 * 1. Server component runs on the server
 * 2. Check if user is authenticated using server Supabase client
 * 3. If not authenticated: redirect to /login
 * 4. If authenticated: render dashboard with user data
 *
 * DATA FETCHING:
 * - Query accounts table to check Google Calendar connection
 * - Query meetings table for upcoming meetings (scheduled_start >= NOW())
 * - All data fetched server-side for better performance and SEO
 *
 * CLIENT COMPONENTS:
 * - StatusMessage: Displays success/error messages from URL params
 * - SyncButton: Triggers manual meeting sync with loading state
 *
 * SECURITY:
 * - Authentication check happens server-side (secure)
 * - User cannot bypass by disabling JavaScript
 * - Session validation on every page load
 * - Sign out uses a separate API route (POST request)
 */

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CheckCircle, AlertCircle } from 'lucide-react'
import StatusMessage from '@/components/StatusMessage'
import NotificationSettings from '@/components/NotificationSettings'
import RealTimeMeetings from '@/components/RealTimeMeetings'
import { Suspense } from 'react'

/**
 * Meeting type from database
 */
type Meeting = {
  id: string
  meeting_id: string
  meeting_link: string
  title: string
  scheduled_start: string
  scheduled_end: string
  status: string
  platform: string
  attendees: Array<{ email: string; name?: string }>
}

export default async function DashboardPage() {
  // Create server Supabase client
  const supabase = await createClient()

  /**
   * Check authentication status
   *
   * getUser() validates the JWT token and fetches user data
   * - If token is valid: returns user data
   * - If token is invalid/expired: returns null
   * - If not authenticated: returns null
   *
   * Note: This uses the auth token from cookies automatically
   */
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  /**
   * Redirect to login if not authenticated
   *
   * This is a server-side redirect, so it happens before
   * the page is sent to the browser. User never sees the
   * dashboard content if they're not authenticated.
   */
  if (authError || !user) {
    redirect('/login')
  }

  /**
   * Fetch Google account connection status
   *
   * Query accounts table to see if user has connected Google Calendar
   * - provider = 'google': We only support Google Calendar for now
   * - user_id = current user: Ensures we only fetch this user's accounts
   *
   * SERVER-SIDE QUERY:
   * This runs on the server, so the database credentials are secure
   * and the query is fast (no network round-trip to browser)
   */
  const { data: googleAccount } = await supabase
    .from('accounts')
    .select('*')
    .eq('user_id', user.id)
    .eq('provider', 'google')
    .single()

  const isGoogleConnected = !!googleAccount

  /**
   * Check if Google tokens are expired
   *
   * Tokens expire after ~1 hour. We use a 5-minute buffer to detect
   * tokens that are about to expire or are already expired.
   *
   * If tokens are expired, they will be auto-refreshed on next sync,
   * but we show a warning to let users know they may need to reconnect
   * if the refresh token is also invalid.
   */
  const now = Math.floor(Date.now() / 1000) // Unix timestamp in seconds
  const expiryBuffer = 5 * 60 // 5 minutes in seconds
  const isTokenExpired = googleAccount
    ? googleAccount.expires_at < now + expiryBuffer
    : false

  /**
   * Fetch upcoming and active meetings
   *
   * Query meetings table for user's meetings:
   * - user_id = current user
   * - status IN ('scheduled', 'active'): Only active meetings
   * - scheduled_start >= NOW() - 30 minutes: Include meetings that started recently
   * - scheduled_end >= NOW(): Exclude meetings that have already ended
   * - ORDER BY scheduled_start ASC: Soonest first
   *
   * This shows:
   * 1. Meetings in progress (started up to 30 min ago, not ended)
   * 2. Meetings starting now
   * 3. Future meetings
   *
   * SERVER-SIDE QUERY:
   * This runs on the server for better performance and SEO.
   * The meetings are rendered server-side, so they appear immediately
   * without a loading spinner.
   */
  const currentTime = new Date()
  const thirtyMinutesAgo = new Date(currentTime.getTime() - 30 * 60 * 1000) // 30 minutes ago

  const { data: meetings } = await supabase
    .from('meetings')
    .select('*')
    .eq('user_id', user.id)
    .in('status', ['scheduled', 'active'])
    .gte('scheduled_start', thirtyMinutesAgo.toISOString()) // Started in last 30 min or future
    .gte('scheduled_end', currentTime.toISOString()) // Not ended yet
    .order('scheduled_start', { ascending: true })

  const upcomingMeetings = (meetings || []) as Meeting[]

  /**
   * Fetch subscription status
   *
   * Check if user has active subscription
   * - Query subscriptions table
   * - Check status and expiry date
   * - Used to gate features and show subscription info
   */
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .single()

  // Check if subscription is active
  const activeStatuses = ['active', 'trialing', 'past_due']
  const isSubscriptionActive =
    subscription &&
    activeStatuses.includes(subscription.status) &&
    new Date(subscription.current_period_end) > new Date()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-blue-600">Meeting Alert</h1>
            </div>

            {/* User Info & Sign Out */}
            <div className="flex items-center space-x-4">
              {/* User Email */}
              <div className="hidden sm:block">
                <p className="text-sm text-gray-700">
                  Signed in as{' '}
                  <span className="font-medium text-gray-900">{user.email}</span>
                </p>
              </div>

              {/* Sign Out Button
                  Using a form ensures sign out works without JavaScript
                  The form POSTs to the sign out API route
              */}
              <form action="/api/auth/signout" method="POST">
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition"
                >
                  Sign Out
                </button>
              </form>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900">
            Welcome back, {user.email?.split('@')[0]}!
          </h2>
          <p className="mt-2 text-gray-600">
            Manage your meetings and notification settings below
          </p>
        </div>

        {/**
         * Status Messages (Client Component)
         *
         * Displays success/error messages from URL parameters:
         * - /dashboard?success=google_connected
         * - /dashboard?error=access_denied
         *
         * This is a client component because it needs to:
         * - Read URL search params with useSearchParams()
         * - Auto-dismiss after 5 seconds
         * - Update URL when dismissed
         *
         * Suspense boundary prevents hydration errors from useSearchParams
         */}
        <Suspense fallback={null}>
          <StatusMessage />
        </Suspense>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Connected Accounts Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900">
                Connected Accounts
              </h3>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  isGoogleConnected
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {isGoogleConnected ? '1 connected' : '0 connected'}
              </span>
            </div>

            {isGoogleConnected ? (
              /* Google Connected State */
              <div>
                <div className="flex items-center p-4 bg-green-50 border border-green-200 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-3 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-green-900">
                      Google Calendar Connected
                    </p>
                    <p className="text-xs text-green-700 mt-0.5">
                      Syncing meetings from your calendar
                    </p>
                  </div>
                </div>

                {isTokenExpired ? (
                  /* Warning: Tokens are expired */
                  <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div className="flex items-start">
                      <AlertCircle className="w-4 h-4 text-yellow-600 mr-2 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-medium text-yellow-900">
                          Connection may need refresh
                        </p>
                        <p className="text-xs text-yellow-800 mt-1">
                          Your access token has expired. Click "Sync Now" below to
                          automatically refresh, or reconnect if sync fails.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Normal tip */
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-xs text-blue-800">
                      <strong>Tip:</strong> Meetings are synced automatically. Click
                      "Sync Now" below to refresh manually.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              /* Google Not Connected State */
              <div>
                <p className="text-sm text-gray-600 mb-6">
                  Connect your Google account to start monitoring meetings
                </p>

                {/* Connect Google Button */}
                <a
                  href="/api/auth/google"
                  className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition"
                >
                  <svg
                    className="w-5 h-5 mr-2"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  Connect Google Account
                </a>

                <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-xs text-blue-800">
                    <strong>Required:</strong> Connect your Google account to sync
                    your calendar and monitor Google Meet meetings
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Notification Settings Card */}
          <NotificationSettings />

          {/* Real-Time Meetings (includes Upcoming Meetings + Meeting Monitor) */}
          <RealTimeMeetings
            initialMeetings={upcomingMeetings}
            userId={user.id}
            isGoogleConnected={isGoogleConnected}
          />

          {/* Subscription Status Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Subscription
            </h3>

            {isSubscriptionActive ? (
              /* Active Subscription */
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Plan</span>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                    {subscription.plan === 'sentinel' ? '⚡ Sentinel' : subscription.plan}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Status</span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Active
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Billing</span>
                  <span className="text-sm font-medium text-gray-900">$79/month</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Next Billing Date</span>
                  <span className="text-sm font-medium text-gray-900">
                    {new Date(subscription.current_period_end).toLocaleDateString()}
                  </span>
                </div>

                {subscription.cancel_at_period_end && (
                  <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <p className="text-xs text-yellow-800">
                      <strong>⚠️ Subscription Ending:</strong> Your subscription will end on{' '}
                      {new Date(subscription.current_period_end).toLocaleDateString()}
                    </p>
                  </div>
                )}

                <div className="pt-4 border-t border-gray-200">
                  <a
                    href="https://billing.stripe.com/p/login/test_..."
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition"
                  >
                    Manage Billing
                  </a>
                </div>
              </div>
            ) : (
              /* No Subscription */
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-sm text-gray-600 mb-3">
                    Subscribe to <strong className="text-gray-900">⚡ Sentinel</strong> to unlock:
                  </p>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-start">
                      <CheckCircle className="w-4 h-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                      <span>Unlimited Google Meet monitoring</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-4 h-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                      <span>Instant email & browser notifications</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-4 h-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                      <span>Real-time participant alerts</span>
                    </li>
                  </ul>
                </div>

                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div>
                    <p className="text-lg font-bold text-gray-900">$79<span className="text-sm font-normal text-gray-600">/month</span></p>
                    <p className="text-xs text-gray-600">No free trial</p>
                  </div>
                </div>

                <a
                  href="/test-stripe"
                  className="w-full inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition"
                >
                  Subscribe to Sentinel
                </a>

                <p className="text-xs text-gray-500 text-center">
                  Secure payment powered by Stripe
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
