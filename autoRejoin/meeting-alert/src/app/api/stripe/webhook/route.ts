/**
 * Stripe Webhook Handler
 *
 * POST /api/stripe/webhook
 *
 * Receives and processes Stripe webhook events for subscription lifecycle management.
 * This is the CRITICAL piece that updates your database when subscriptions change.
 *
 * SECURITY:
 * - ALWAYS verify webhook signature (prevents fraud/replay attacks)
 * - Use raw request body (NOT parsed JSON) for signature verification
 * - Webhook secret is different from API secret key
 * - Without verification, anyone could fake subscription events
 *
 * STRIPE EVENTS HANDLED:
 * 1. checkout.session.completed - User completed payment, create subscription
 * 2. customer.subscription.updated - Subscription changed (plan, status, etc.)
 * 3. customer.subscription.deleted - Subscription cancelled/expired
 *
 * WEBHOOK SETUP:
 * 1. Go to Stripe Dashboard → Developers → Webhooks
 * 2. Add endpoint: https://yourdomain.com/api/stripe/webhook
 * 3. Select events: checkout.session.completed, customer.subscription.updated, customer.subscription.deleted
 * 4. Copy webhook signing secret to STRIPE_WEBHOOK_SECRET in .env.local
 *
 * TESTING WEBHOOKS LOCALLY:
 * 1. Install Stripe CLI: https://stripe.com/docs/stripe-cli
 * 2. Run: stripe listen --forward-to localhost:3000/api/stripe/webhook
 * 3. Copy webhook signing secret from CLI output
 * 4. Test events: stripe trigger checkout.session.completed
 *
 * IMPORTANT STRIPE WEBHOOK REQUIREMENTS:
 * - ALWAYS return 200 status code (even on errors)
 * - Stripe will retry failed webhooks (non-200 responses)
 * - Make webhook handler idempotent (safe to process same event twice)
 * - Process events quickly (<15 seconds)
 * - Use event ID to prevent duplicate processing
 */

import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { stripe } from '@/lib/stripe'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

/**
 * CRITICAL: Disable Next.js body parsing
 *
 * WHY:
 * - Stripe signature verification requires RAW request body
 * - Next.js automatically parses body as JSON
 * - Parsed body breaks signature verification
 * - Must get raw body buffer instead
 */
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    /**
     * STEP 1: Get raw request body and signature
     *
     * Stripe signature is in 'stripe-signature' header.
     * Must use raw body (not parsed JSON) for verification.
     */
    const body = await request.text()
    const headersList = await headers()
    const signature = headersList.get('stripe-signature')

    if (!signature) {
      console.error('❌ No Stripe signature found in request headers')
      return NextResponse.json(
        { error: 'No signature' },
        { status: 400 }
      )
    }

    /**
     * STEP 2: Verify webhook signature
     *
     * SECURITY CRITICAL:
     * - Prevents anyone from sending fake webhook events
     * - Verifies event actually came from Stripe
     * - Detects replay attacks (event sent twice)
     *
     * HOW IT WORKS:
     * - Stripe signs webhook with your webhook secret
     * - We verify signature matches the body + secret
     * - If signature invalid, reject the webhook
     *
     * WEBHOOK SECRET:
     * - Different from API secret key
     * - Get from Stripe Dashboard → Developers → Webhooks
     * - Starts with "whsec_"
     */
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

    if (!webhookSecret) {
      console.error('❌ STRIPE_WEBHOOK_SECRET not set in environment variables')
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      )
    }

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
      console.log(`✅ Webhook signature verified: ${event.type}`)
    } catch (err: any) {
      console.error('❌ Webhook signature verification failed:', err.message)
      return NextResponse.json(
        { error: `Webhook signature verification failed: ${err.message}` },
        { status: 400 }
      )
    }

    /**
     * STEP 3: Process event based on type
     *
     * Different events require different database updates.
     * Handle each event type separately.
     *
     * IMPORTANT: Use service role key for webhooks
     * - Webhooks are server-to-server from Stripe
     * - No user session exists
     * - Need to bypass RLS to write subscription data
     * - Service role key bypasses schema cache issues
     */
    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    switch (event.type) {
      /**
       * EVENT: checkout.session.completed
       *
       * WHEN IT FIRES:
       * - User completes payment on Stripe checkout page
       * - Payment succeeds and subscription created
       *
       * WHAT TO DO:
       * - Create subscription record in database
       * - Link subscription to user via user_id in metadata
       * - Store Stripe subscription ID and customer ID
       * - Set status to 'active'
       */
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session

        console.log(`💳 Checkout session completed: ${session.id}`)

        // Get user_id from metadata (set in createCheckoutSession)
        const userId = session.metadata?.user_id

        if (!userId) {
          console.error('❌ No user_id in checkout session metadata')
          return NextResponse.json({ received: true })
        }

        // Get subscription details
        const subscriptionId = session.subscription as string
        const customerId = session.customer as string

        if (!subscriptionId) {
          console.error('❌ No subscription ID in checkout session')
          return NextResponse.json({ received: true })
        }

        // Fetch full subscription object from Stripe
        const subscription = await stripe.subscriptions.retrieve(subscriptionId)

        // Create or update subscription in database
        const { error: dbError } = await supabase.from('subscriptions').upsert(
          {
            user_id: userId,
            stripe_subscription_id: subscriptionId,
            stripe_customer_id: customerId,
            status: subscription.status,
            plan: 'sentinel', // Sentinel plan ($79/month)
            current_period_start: new Date(
              subscription.current_period_start * 1000
            ).toISOString(),
            current_period_end: new Date(
              subscription.current_period_end * 1000
            ).toISOString(),
            cancel_at_period_end: subscription.cancel_at_period_end,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: 'user_id',
          }
        )

        if (dbError) {
          console.error('❌ Failed to create subscription in database:', dbError)
          // Return 200 anyway so Stripe doesn't retry
          return NextResponse.json({ received: true })
        }

        console.log(
          `✅ Subscription created in database for user ${userId}`
        )

        break
      }

      /**
       * EVENT: customer.subscription.updated
       *
       * WHEN IT FIRES:
       * - Subscription renewed (monthly billing)
       * - Subscription plan changed (upgrade/downgrade)
       * - Subscription status changed (active → past_due → cancelled)
       * - User cancels subscription (status stays active until period end)
       *
       * WHAT TO DO:
       * - Update subscription record in database
       * - Update status, period dates, cancel_at_period_end
       *
       * IMPORTANT:
       * - Don't immediately revoke access when user cancels
       * - They paid for the full period, let them use it
       * - cancel_at_period_end = true means "cancel at end of paid period"
       */
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription

        console.log(`🔄 Subscription updated: ${subscription.id}`)

        // Get user_id from metadata
        const userId = subscription.metadata?.user_id

        if (!userId) {
          console.error('❌ No user_id in subscription metadata')
          return NextResponse.json({ received: true })
        }

        // Update subscription in database
        const { error: dbError } = await supabase
          .from('subscriptions')
          .update({
            status: subscription.status,
            current_period_start: new Date(
              subscription.current_period_start * 1000
            ).toISOString(),
            current_period_end: new Date(
              subscription.current_period_end * 1000
            ).toISOString(),
            cancel_at_period_end: subscription.cancel_at_period_end,
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', subscription.id)

        if (dbError) {
          console.error('❌ Failed to update subscription in database:', dbError)
          return NextResponse.json({ received: true })
        }

        console.log(
          `✅ Subscription updated in database: ${subscription.id} (status: ${subscription.status})`
        )

        break
      }

      /**
       * EVENT: customer.subscription.deleted
       *
       * WHEN IT FIRES:
       * - Subscription expires (cancelled and period ended)
       * - Payment failed and all retries exhausted
       * - Admin manually deletes subscription in Stripe Dashboard
       *
       * WHAT TO DO:
       * - Update subscription status to 'cancelled'
       * - User will lose access immediately
       *
       * NOTE:
       * - This fires AFTER the paid period ends
       * - If user cancels but still in paid period, you get subscription.updated (cancel_at_period_end=true)
       * - This event means subscription is truly ended
       */
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription

        console.log(`❌ Subscription deleted: ${subscription.id}`)

        // Update subscription status to cancelled
        const { error: dbError } = await supabase
          .from('subscriptions')
          .update({
            status: 'cancelled',
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', subscription.id)

        if (dbError) {
          console.error('❌ Failed to update subscription in database:', dbError)
          return NextResponse.json({ received: true })
        }

        console.log(
          `✅ Subscription marked as cancelled in database: ${subscription.id}`
        )

        break
      }

      /**
       * OTHER EVENTS:
       *
       * Stripe sends many event types.
       * We only handle the critical ones for subscription lifecycle.
       * Other events are ignored but logged.
       *
       * OTHER USEFUL EVENTS (future):
       * - invoice.payment_succeeded - Payment succeeded (send receipt email)
       * - invoice.payment_failed - Payment failed (notify user)
       * - customer.subscription.trial_will_end - Trial ending soon (reminder email)
       */
      default:
        console.log(`ℹ️ Unhandled webhook event: ${event.type}`)
    }

    /**
     * STEP 4: Always return 200
     *
     * CRITICAL:
     * - Always return 200, even if processing failed
     * - Non-200 response = Stripe retries webhook
     * - Failed database update shouldn't block webhook acknowledgment
     * - Log errors for manual review instead
     */
    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('❌ Webhook handler error:', error)

    // Still return 200 to prevent Stripe retries
    // Log error for manual investigation
    return NextResponse.json({ received: true })
  }
}
