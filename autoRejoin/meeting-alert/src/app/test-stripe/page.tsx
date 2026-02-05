'use client'

/**
 * Stripe Checkout Test Page
 *
 * Simple page to test the complete Stripe payment flow:
 * 1. Click "Subscribe" button
 * 2. Creates checkout session via API
 * 3. Redirects to Stripe checkout page
 * 4. Complete test payment
 * 5. Redirected back to success page
 * 6. Webhook creates subscription in database
 *
 * TEST CARDS:
 * - Success: 4242 4242 4242 4242
 * - Declined: 4000 0000 0000 0002
 * - 3D Secure: 4000 0025 0000 3155
 *
 * Any future expiry date, any 3-digit CVC
 */

import { useState } from 'react'

export default function TestStripePage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [subscriptionStatus, setSubscriptionStatus] = useState<any>(null)

  /**
   * Start checkout flow
   *
   * Calls /api/create-checkout which:
   * 1. Authenticates user
   * 2. Creates Stripe checkout session
   * 3. Returns checkout URL
   * 4. Redirects to Stripe payment page
   */
  const handleSubscribe = async () => {
    try {
      setLoading(true)
      setError(null)

      console.log('🚀 Creating checkout session...')

      const response = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session')
      }

      if (!data.url) {
        throw new Error('No checkout URL returned')
      }

      console.log('✅ Checkout session created, redirecting to Stripe...')

      // Redirect to Stripe checkout page
      window.location.href = data.url
    } catch (err: any) {
      console.error('❌ Checkout error:', err)
      setError(err.message)
      setLoading(false)
    }
  }

  /**
   * Check subscription status
   *
   * Fetches current user's subscription from database
   * Use this AFTER completing payment to verify webhook worked
   */
  const checkSubscription = async () => {
    try {
      setLoading(true)
      setError(null)

      console.log('🔍 Checking subscription status...')

      const response = await fetch('/api/subscription-status')
      const data = await response.json()

      console.log('📊 Subscription data:', data)

      setSubscriptionStatus(data)
      setLoading(false)
    } catch (err: any) {
      console.error('❌ Error checking subscription:', err)
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold mb-2">Test Stripe Checkout</h1>
          <p className="text-gray-600 mb-8">
            Test the complete payment flow with Stripe test mode
          </p>

          {/* Plan Details */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Pro Plan</h2>
            <div className="text-4xl font-bold mb-4">
              $79<span className="text-lg text-gray-600">/month</span>
            </div>
            <ul className="space-y-2 text-gray-700">
              <li>✅ Unlimited Google Meet monitoring</li>
              <li>✅ Email & browser notifications</li>
              <li>✅ Real-time participant alerts</li>
              <li>✅ Priority support</li>
            </ul>
            <p className="mt-4 text-sm text-gray-500">
              🔒 No free trial - immediate payment required
            </p>
          </div>

          {/* Subscribe Button */}
          <button
            onClick={handleSubscribe}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors mb-4"
          >
            {loading ? 'Creating checkout session...' : '💳 Subscribe Now'}
          </button>

          {/* Check Subscription Button */}
          <button
            onClick={checkSubscription}
            disabled={loading}
            className="w-full bg-gray-200 text-gray-800 py-3 px-6 rounded-lg font-semibold hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Checking...' : '🔍 Check Subscription Status'}
          </button>

          {/* Error Display */}
          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 font-semibold">❌ Error</p>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Subscription Status Display */}
          {subscriptionStatus && (
            <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-800 font-semibold mb-2">
                ✅ Subscription Status
              </p>
              <pre className="text-sm text-gray-700 overflow-auto">
                {JSON.stringify(subscriptionStatus, null, 2)}
              </pre>
            </div>
          )}

          {/* Test Instructions */}
          <div className="mt-8 border-t pt-8">
            <h3 className="font-semibold mb-4">🧪 Test Instructions</h3>
            <ol className="space-y-3 text-sm text-gray-700">
              <li>
                <strong>1. Click "Subscribe Now"</strong> - Creates checkout
                session and redirects to Stripe
              </li>
              <li>
                <strong>2. Use test card:</strong> 4242 4242 4242 4242
                <br />
                <span className="text-gray-500 ml-4">
                  Any future expiry, any 3-digit CVC, any ZIP
                </span>
              </li>
              <li>
                <strong>3. Complete payment</strong> - You'll be redirected back
                to dashboard
              </li>
              <li>
                <strong>4. Click "Check Subscription Status"</strong> - Verify
                webhook created subscription
              </li>
              <li>
                <strong>5. Check Supabase</strong> - Go to Table Editor →
                subscriptions table
              </li>
            </ol>

            <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-yellow-800 text-sm">
                <strong>⚠️ Test Mode:</strong> No real charges will be made.
                Using Stripe test mode with test API keys.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
