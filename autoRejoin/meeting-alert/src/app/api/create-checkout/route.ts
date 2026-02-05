/**
 * Create Stripe Checkout Session Endpoint
 *
 * POST /api/create-checkout
 *
 * Creates a Stripe checkout session for the authenticated user and returns the checkout URL.
 * The user will be redirected to Stripe's hosted checkout page to complete payment.
 *
 * FLOW:
 * 1. User clicks "Subscribe" button on pricing page
 * 2. POST to this endpoint
 * 3. Create Stripe checkout session (via stripe.ts)
 * 4. Return checkout URL to client
 * 5. Client redirects to Stripe checkout page
 * 6. User completes payment
 * 7. Stripe sends webhook events (handled in webhook/route.ts)
 * 8. User redirected back to success_url with session_id
 *
 * AUTHENTICATION:
 * - Requires authenticated user (Supabase session)
 * - Returns 401 if not authenticated
 *
 * RESPONSE:
 * {
 *   "success": true,
 *   "url": "https://checkout.stripe.com/c/pay/..."
 * }
 *
 * ERROR RESPONSE:
 * {
 *   "success": false,
 *   "error": "Error message"
 * }
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createCheckoutSession } from '@/lib/stripe'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    /**
     * STEP 1: Authenticate user
     *
     * Check if user is authenticated using Supabase auth.
     * Return 401 if not authenticated.
     * Extract user email for Stripe customer creation.
     */
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error('❌ Authentication failed:', authError?.message)
      return NextResponse.json(
        {
          success: false,
          error: 'Not authenticated',
        },
        { status: 401 }
      )
    }

    if (!user.email) {
      console.error('❌ User has no email address')
      return NextResponse.json(
        {
          success: false,
          error: 'User email not found',
        },
        { status: 400 }
      )
    }

    console.log(`💳 Creating checkout session for user ${user.id} (${user.email})`)

    /**
     * STEP 2: Check if user already has active subscription
     *
     * WHY CHECK:
     * - Prevent duplicate subscriptions
     * - Don't charge users twice
     * - Stripe allows multiple subscriptions but we only want one per user
     *
     * NOTE: This is a soft check - webhook is the source of truth.
     * User could have subscribed in another tab/device.
     */
    const { data: existingSubscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (
      existingSubscription &&
      existingSubscription.status === 'active' &&
      existingSubscription.current_period_end &&
      new Date(existingSubscription.current_period_end) > new Date()
    ) {
      console.log('⚠️ User already has active subscription')
      return NextResponse.json(
        {
          success: false,
          error: 'You already have an active subscription',
        },
        { status: 400 }
      )
    }

    /**
     * STEP 3: Create Stripe checkout session
     *
     * This calls the createCheckoutSession() function from stripe.ts which:
     * - Finds or creates Stripe customer
     * - Creates checkout session with Pro plan ($79/month)
     * - Returns checkout URL
     *
     * The checkout URL is a Stripe-hosted page where user enters payment.
     */
    const checkoutUrl = await createCheckoutSession(user.id, user.email)

    console.log('✅ Checkout session created successfully')

    /**
     * STEP 4: Return checkout URL
     *
     * Client will redirect user to this URL.
     * After payment, Stripe will:
     * - Send webhook events to our webhook endpoint
     * - Redirect user to success_url with session_id
     */
    return NextResponse.json({
      success: true,
      url: checkoutUrl,
    })
  } catch (error: any) {
    /**
     * STEP 5: Error handling
     *
     * Log error details for debugging.
     * Return 500 with error message.
     *
     * COMMON ERRORS:
     * - Stripe API key invalid
     * - Network error connecting to Stripe
     * - Database error checking subscription
     */
    console.error('❌ Failed to create checkout session:', error)

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to create checkout session',
      },
      { status: 500 }
    )
  }
}
