/**
 * Get Subscription Status Endpoint
 *
 * GET /api/subscription-status
 *
 * Returns the current user's subscription status from the database.
 * Used to verify that webhook successfully created subscription after payment.
 *
 * RESPONSE:
 * {
 *   "hasSubscription": true,
 *   "subscription": {
 *     "status": "active",
 *     "plan": "pro",
 *     "current_period_end": "2024-03-01T00:00:00Z",
 *     "cancel_at_period_end": false
 *   }
 * }
 *
 * OR if no subscription:
 * {
 *   "hasSubscription": false,
 *   "subscription": null
 * }
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        {
          error: 'Not authenticated',
        },
        { status: 401 }
      )
    }

    // Fetch subscription from database
    const { data: subscription, error: dbError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (dbError) {
      // No subscription found (or other error)
      if (dbError.code === 'PGRST116') {
        // No rows returned - user has no subscription
        return NextResponse.json({
          hasSubscription: false,
          subscription: null,
        })
      }

      console.error('Database error:', dbError)
      return NextResponse.json(
        {
          error: 'Failed to fetch subscription',
        },
        { status: 500 }
      )
    }

    /**
     * Check if subscription is actually active
     *
     * Active statuses:
     * - "active" - subscription is active and paid
     * - "trialing" - subscription is in trial period (future use)
     * - "past_due" - payment failed but user still has access (grace period)
     *
     * Inactive statuses:
     * - "cancelled" - subscription was cancelled
     * - "unpaid" - payment failed and access revoked
     * - "incomplete" - subscription creation never completed
     * - "incomplete_expired" - subscription expired before payment
     *
     * Additional check: If status is active but cancel_at_period_end is true,
     * user still has access until period ends (they cancelled but can use until expiry)
     */
    const activeStatuses = ['active', 'trialing', 'past_due']
    const isActive = activeStatuses.includes(subscription.status)

    // Also check if subscription period hasn't ended yet
    const periodEnd = new Date(subscription.current_period_end)
    const now = new Date()
    const isPeriodValid = periodEnd > now

    // Subscription is active if status is active AND period is valid
    const hasActiveSubscription = isActive && isPeriodValid

    // Return subscription data
    return NextResponse.json({
      hasSubscription: hasActiveSubscription,
      subscription: {
        status: subscription.status,
        plan: subscription.plan,
        current_period_start: subscription.current_period_start,
        current_period_end: subscription.current_period_end,
        cancel_at_period_end: subscription.cancel_at_period_end,
        stripe_customer_id: subscription.stripe_customer_id,
        stripe_subscription_id: subscription.stripe_subscription_id,
      },
    })
  } catch (error: any) {
    console.error('Subscription status error:', error)
    return NextResponse.json(
      {
        error: error.message || 'Internal server error',
      },
      { status: 500 }
    )
  }
}
