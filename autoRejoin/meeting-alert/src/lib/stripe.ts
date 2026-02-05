/**
 * Stripe Payment Integration
 *
 * Handles all Stripe-related functionality for subscription payments.
 *
 * PRICING:
 * - $79 USD/month
 * - NO free trial (immediate payment required)
 * - Single "Pro" plan tier
 *
 * STRIPE WORKFLOW:
 * 1. User clicks "Subscribe" button
 * 2. Create checkout session (this file)
 * 3. Redirect to Stripe hosted checkout page
 * 4. User enters payment details and completes payment
 * 5. Stripe sends webhook events (webhook/route.ts handles these)
 * 6. Database updated with subscription status
 *
 * SECURITY:
 * - API keys stored in environment variables
 * - Never expose secret key to client
 * - Webhook signature verification prevents fraud
 *
 * FUTURE EXPANSION:
 * - Can add "Enterprise" tier later ($199/month)
 * - Can add annual billing option (15% discount)
 * - Plan field in DB supports multiple tiers
 */

import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'

/**
 * Initialize Stripe instance
 *
 * IMPORTANT:
 * - Uses secret key (server-side only!)
 * - Never use secret key in client-side code
 * - API version locked to ensure compatibility
 */
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set in environment variables')
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia',
  typescript: true,
})

/**
 * Subscription plan configuration
 *
 * WHY SEPARATE CONFIG:
 * - Easy to add new tiers (Enterprise, etc.)
 * - Centralized pricing changes
 * - Type-safe plan definitions
 */
export const PLANS = {
  sentinel: {
    name: 'Sentinel',
    priceId: process.env.STRIPE_PRICE_ID!,
    price: 79, // $79 USD
    currency: 'usd',
    interval: 'month',
    trialDays: 0, // NO free trial
  },
} as const

/**
 * Create Stripe checkout session
 *
 * FLOW:
 * 1. Find or create Stripe customer (links to user_id)
 * 2. Create checkout session with pricing
 * 3. Return checkout URL to redirect user
 *
 * CHECKOUT SESSION CONFIG:
 * - mode: 'subscription' (recurring payments)
 * - NO trial_period_days (immediate $79 payment)
 * - success_url: Dashboard with success message
 * - cancel_url: Pricing page with cancelled message
 * - metadata: Store user_id to link subscription later
 *
 * CUSTOMER CREATION:
 * - Creates Stripe customer if doesn't exist
 * - Stores user_id in customer metadata
 * - Links customer to subscription in webhook
 *
 * ERROR HANDLING:
 * - Throws on Stripe API errors
 * - Throws on database errors
 * - Caller should catch and return 500 to user
 *
 * @param userId - Supabase auth user ID
 * @param email - User's email address
 * @returns Checkout session URL
 *
 * @example
 * const url = await createCheckoutSession(user.id, user.email)
 * return NextResponse.redirect(url)
 */
export async function createCheckoutSession(
  userId: string,
  email: string
): Promise<string> {
  try {
    console.log(
      `💳 Creating checkout session for user ${userId} (${email})`
    )

    /**
     * Step 1: Find or create Stripe customer
     *
     * WHY CUSTOMER CREATION:
     * - Links Stripe subscription to our user_id
     * - Enables subscription management (upgrade, cancel, etc.)
     * - Allows multiple subscriptions per customer (future)
     * - Customer data persists across subscriptions
     *
     * CUSTOMER LOOKUP:
     * - Check if user already has a Stripe customer ID in database
     * - If not, create new Stripe customer
     * - Store customer ID in database for future use
     */
    const supabase = await createClient()

    // Check if user already has a Stripe customer ID
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .single()

    let customerId: string

    if (subscription?.stripe_customer_id) {
      // User already has a Stripe customer
      customerId = subscription.stripe_customer_id
      console.log(`✓ Found existing Stripe customer: ${customerId}`)
    } else {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email,
        metadata: {
          user_id: userId, // Link customer to our user
        },
      })

      customerId = customer.id
      console.log(`✓ Created new Stripe customer: ${customerId}`)
    }

    /**
     * Step 2: Create checkout session
     *
     * CHECKOUT SESSION:
     * - Hosted by Stripe (PCI compliant, secure)
     * - Handles payment collection
     * - Redirects back to our app on success/cancel
     * - Creates subscription automatically on successful payment
     *
     * PRICING:
     * - line_items: Single "Pro" plan at $79/month
     * - NO trial_period_days (immediate payment)
     * - Recurring billing (monthly)
     *
     * URLS:
     * - success_url: User returns here after successful payment
     * - cancel_url: User returns here if they cancel
     * - Use {CHECKOUT_SESSION_ID} to retrieve session data later
     *
     * METADATA:
     * - Store user_id to link subscription in webhook
     * - Critical for identifying which user subscribed
     *
     * SUBSCRIPTION DATA:
     * - subscription_data.metadata: Copied to subscription object
     * - Used in webhook to identify user
     */
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: PLANS.sentinel.priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=subscribed&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?cancelled=true`,
      metadata: {
        user_id: userId,
      },
      subscription_data: {
        metadata: {
          user_id: userId,
        },
        // NO trial_period_days - immediate payment
      },
      allow_promotion_codes: true, // Allow discount codes (optional)
    })

    console.log(`✓ Created checkout session: ${session.id}`)
    console.log(`✓ Checkout URL: ${session.url}`)

    if (!session.url) {
      throw new Error('Checkout session URL is null')
    }

    return session.url
  } catch (error: any) {
    console.error('❌ Failed to create checkout session:', error.message)
    throw new Error(`Failed to create checkout session: ${error.message}`)
  }
}

/**
 * Get subscription status for user
 *
 * USAGE:
 * - Check if user has active subscription
 * - Display current plan in dashboard
 * - Gate features behind subscription check
 *
 * @param userId - Supabase auth user ID
 * @returns Subscription data or null
 */
export async function getUserSubscription(userId: string) {
  const supabase = await createClient()

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .single()

  return subscription
}

/**
 * Check if user has active subscription
 *
 * ACTIVE SUBSCRIPTION:
 * - status = 'active' OR 'trialing'
 * - current_period_end > NOW (not expired)
 * - cancel_at_period_end can be true (still active until end of period)
 *
 * @param userId - Supabase auth user ID
 * @returns True if user has active subscription
 */
export async function hasActiveSubscription(userId: string): Promise<boolean> {
  const subscription = await getUserSubscription(userId)

  if (!subscription) {
    return false
  }

  // Check if subscription is active and not expired
  const isActive = subscription.status === 'active'
  const notExpired = subscription.current_period_end
    ? new Date(subscription.current_period_end) > new Date()
    : false

  return isActive && notExpired
}
