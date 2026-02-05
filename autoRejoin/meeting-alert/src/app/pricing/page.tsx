'use client'

/**
 * Pricing Page Component
 *
 * Professional SaaS pricing page for SalesGuard Sentinel
 *
 * SECTIONS:
 * 1. Hero - Value proposition and headline
 * 2. Pricing Card - Single tier ($79/month) with feature list
 * 3. ROI Calculator - Show cost savings from one saved deal
 * 4. FAQ - Common questions about billing, features, privacy
 * 5. Coming Soon - Enterprise features preview
 *
 * CHECKOUT FLOW:
 * 1. User clicks "Get Started Now" button
 * 2. POST to /api/create-checkout (creates Stripe session)
 * 3. Redirect to Stripe hosted checkout page
 * 4. User enters payment details
 * 5. Stripe processes payment
 * 6. Webhook updates database
 * 7. User redirected to dashboard with success message
 *
 * ERROR HANDLING:
 * - Show loading spinner during checkout creation
 * - Display user-friendly error messages
 * - Handle network errors gracefully
 * - Prevent multiple clicks during loading
 *
 * DESIGN:
 * - Modern SaaS design (Stripe/Vercel style)
 * - Blue accent color (#2563eb)
 * - Mobile responsive
 * - Professional trust indicators
 */

import { useState } from 'react'
import { Check, Zap, Shield, AlertCircle } from 'lucide-react'

export default function PricingPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Handle checkout button click
   *
   * Creates Stripe checkout session and redirects to payment page
   *
   * FLOW:
   * 1. Set loading state to prevent double-clicks
   * 2. POST to create-checkout API endpoint
   * 3. Receive checkout URL from Stripe
   * 4. Redirect user to Stripe checkout page
   *
   * ERROR CASES:
   * - Network error: Show "Connection failed" message
   * - API error: Show specific error from server
   * - Already subscribed: Show "You already have a subscription"
   * - Auth error: Redirect to login
   */
  const handleGetStarted = async () => {
    try {
      setIsLoading(true)
      setError(null)

      console.log('🚀 Initiating checkout...')

      const response = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (!response.ok) {
        // Handle specific error cases
        if (response.status === 401) {
          // User not authenticated - redirect to login
          window.location.href = '/login?redirect=/pricing'
          return
        }

        throw new Error(data.error || 'Failed to create checkout session')
      }

      if (!data.url) {
        throw new Error('No checkout URL received')
      }

      console.log('✅ Checkout session created, redirecting to Stripe...')

      // Redirect to Stripe checkout page
      window.location.href = data.url
    } catch (err: any) {
      console.error('❌ Checkout error:', err)
      setError(err.message || 'Something went wrong. Please try again.')
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Shield className="w-8 h-8 text-blue-600 mr-2" />
              <h1 className="text-2xl font-bold text-gray-900">
                SalesGuard <span className="text-blue-600">Sentinel</span>
              </h1>
            </div>

            {/* Sign In Link */}
            <div className="flex items-center space-x-4">
              <a
                href="/login"
                className="text-sm font-medium text-gray-700 hover:text-gray-900 transition"
              >
                Sign In
              </a>
              <a
                href="/dashboard"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition"
              >
                Dashboard
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center px-4 py-2 bg-blue-50 rounded-full mb-6">
            <Zap className="w-4 h-4 text-blue-600 mr-2" />
            <span className="text-sm font-medium text-blue-900">
              Never miss a late-joining client
            </span>
          </div>

          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Simple, Transparent Pricing
          </h1>

          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            One saved{' '}
            <span className="font-semibold text-gray-900">$2K deal</span> pays
            for <span className="font-semibold text-gray-900">25+ months</span>
          </p>
        </div>

        {/* Pricing Card */}
        <div className="bg-white rounded-2xl shadow-xl border-2 border-blue-500 p-8 mb-12 relative overflow-hidden">
          {/* Popular Badge */}
          <div className="absolute top-0 right-0 bg-blue-600 text-white px-6 py-2 rounded-bl-2xl">
            <p className="text-sm font-semibold">MOST POPULAR</p>
          </div>

          <div className="pt-8">
            {/* Plan Name */}
            <div className="flex items-center mb-4">
              <Shield className="w-8 h-8 text-blue-600 mr-3" />
              <h2 className="text-3xl font-bold text-gray-900">
                SalesGuard Sentinel Pro
              </h2>
            </div>

            {/* Price */}
            <div className="mb-6">
              <div className="flex items-baseline">
                <span className="text-6xl font-bold text-gray-900">$79</span>
                <span className="text-2xl text-gray-600 ml-2">/month</span>
              </div>
              <div className="mt-2 inline-flex items-center px-3 py-1 bg-yellow-50 border border-yellow-200 rounded-full">
                <AlertCircle className="w-4 h-4 text-yellow-600 mr-2" />
                <span className="text-sm font-medium text-yellow-900">
                  Start protecting your deals immediately
                </span>
              </div>
              <p className="mt-2 text-sm text-gray-500">Cancel anytime, no questions asked</p>
            </div>

            {/* Features List */}
            <div className="space-y-4 mb-8">
              <div className="flex items-start">
                <Check className="w-5 h-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">
                  <strong>Never miss a late-joining client</strong> - Get alerted the moment they enter
                </span>
              </div>
              <div className="flex items-start">
                <Check className="w-5 h-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">
                  <strong>Instant email + browser notifications</strong> - Be the first to know
                </span>
              </div>
              <div className="flex items-start">
                <Check className="w-5 h-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">
                  <strong>Detects if clients join after you leave</strong> - Be back in 30 seconds
                </span>
              </div>
              <div className="flex items-start">
                <Check className="w-5 h-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">
                  <strong>One-click rejoin links</strong> - Jump back in instantly
                </span>
              </div>
              <div className="flex items-start">
                <Check className="w-5 h-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">
                  <strong>Monitor meetings after you leave</strong> - Stay protected even when offline
                </span>
              </div>
              <div className="flex items-start">
                <Check className="w-5 h-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">
                  <strong>Unlimited meeting alerts</strong> - No caps, no limits
                </span>
              </div>
            </div>

            {/* CTA Button */}
            <button
              onClick={handleGetStarted}
              disabled={isLoading}
              className="w-full bg-blue-600 text-white py-4 px-8 rounded-xl text-lg font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Creating checkout session...
                </span>
              ) : (
                'Get Started Now - $79/month'
              )}
            </button>

            {/* Error Message */}
            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">
                  <strong>Error:</strong> {error}
                </p>
              </div>
            )}

            {/* Trust Indicator */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500">
                <strong>🔒 Secure payment powered by Stripe</strong>
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Your payment information is encrypted and secure
              </p>
            </div>
          </div>
        </div>

        {/* ROI Section */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-8 mb-12 border border-blue-100">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            One Saved Deal = 25+ Months Paid For
          </h3>

          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="text-center mb-4">
                <p className="text-lg text-gray-700 mb-2">Simple ROI Calculation:</p>
                <div className="flex items-center justify-center space-x-3 text-3xl font-bold">
                  <span className="text-green-600">$2,000</span>
                  <span className="text-gray-400">÷</span>
                  <span className="text-blue-600">$79</span>
                  <span className="text-gray-400">=</span>
                  <span className="text-purple-600">25 months</span>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4 mt-4">
                <p className="text-center text-gray-600">
                  <strong className="text-gray-900">
                    Most users save their subscription cost in the first week
                  </strong>
                </p>
                <p className="text-center text-sm text-gray-500 mt-2">
                  Missing one client could cost you thousands. SalesGuard Sentinel ensures you never miss an opportunity.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mb-12">
          <h3 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Frequently Asked Questions
          </h3>

          <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h4 className="text-lg font-semibold text-gray-900 mb-2">
                Can I cancel anytime?
              </h4>
              <p className="text-gray-600">
                Yes! Cancel anytime with one click. No questions asked, no cancellation fees. You'll have access until the end of your current billing period.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h4 className="text-lg font-semibold text-gray-900 mb-2">
                What happens when I sign up?
              </h4>
              <p className="text-gray-600">
                Immediate access! You'll be charged $79/month starting today. Connect your Google Calendar and start monitoring meetings right away.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h4 className="text-lg font-semibold text-gray-900 mb-2">
                What exactly do you monitor?
              </h4>
              <p className="text-gray-600">
                We only monitor meeting times and when participants join via Google Calendar API. We <strong>do not</strong> record audio, video, or chat. Completely privacy-safe and GDPR compliant.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h4 className="text-lg font-semibold text-gray-900 mb-2">
                Do you record meetings?
              </h4>
              <p className="text-gray-600">
                <strong>No.</strong> We only monitor via API to detect when people join. No recording, no listening, no privacy invasion. Just smart alerts to keep you informed.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h4 className="text-lg font-semibold text-gray-900 mb-2">
                What platforms are supported?
              </h4>
              <p className="text-gray-600">
                Currently: <strong>Google Meet</strong> (fully supported). Coming Q2 2026: <strong>Microsoft Teams</strong>. More platforms on our roadmap!
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h4 className="text-lg font-semibold text-gray-900 mb-2">
                What if I miss the notification?
              </h4>
              <p className="text-gray-600">
                You get <strong>both email and browser alerts</strong>, plus your dashboard shows all active meetings. Multiple safety nets ensure you'll never miss an important client join.
              </p>
            </div>
          </div>
        </div>

        {/* Coming Soon Section */}
        <div className="bg-gradient-to-r from-purple-900 to-blue-900 rounded-2xl p-8 text-white">
          <div className="text-center mb-6">
            <div className="inline-block px-4 py-2 bg-white/20 rounded-full mb-4">
              <p className="text-sm font-semibold">COMING SOON</p>
            </div>
            <h3 className="text-3xl font-bold mb-2">
              SalesGuard Sentinel Enterprise
            </h3>
            <p className="text-2xl font-bold text-blue-200">$129/month</p>
          </div>

          <div className="max-w-2xl mx-auto space-y-3">
            <div className="flex items-start">
              <Check className="w-5 h-5 text-green-400 mr-3 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Bot-powered meeting monitoring</strong> - AI bot joins to guarantee detection
              </span>
            </div>
            <div className="flex items-start">
              <Check className="w-5 h-5 text-green-400 mr-3 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Auto-admit from waiting room</strong> - Never leave clients waiting
              </span>
            </div>
            <div className="flex items-start">
              <Check className="w-5 h-5 text-green-400 mr-3 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Keep meetings alive indefinitely</strong> - Bot stays even when everyone leaves
              </span>
            </div>
            <div className="flex items-start">
              <Check className="w-5 h-5 text-green-400 mr-3 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Advanced analytics</strong> - Track client join patterns and optimize scheduling
              </span>
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-blue-200">
              Expected launch: Q2 2026. Join the waitlist from your dashboard.
            </p>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Ready to Never Miss a Client Again?
          </h3>
          <button
            onClick={handleGetStarted}
            disabled={isLoading}
            className="inline-flex items-center px-8 py-4 bg-blue-600 text-white rounded-xl text-lg font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            {isLoading ? 'Creating checkout...' : 'Get Started Now - $79/month'}
          </button>
          <p className="mt-4 text-sm text-gray-500">
            30-day money-back guarantee if you're not satisfied
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-sm text-gray-500">
            <p>© 2026 SalesGuard Sentinel. All rights reserved.</p>
            <p className="mt-2">
              <a href="/privacy" className="hover:text-gray-700 transition">
                Privacy Policy
              </a>
              {' · '}
              <a href="/terms" className="hover:text-gray-700 transition">
                Terms of Service
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
