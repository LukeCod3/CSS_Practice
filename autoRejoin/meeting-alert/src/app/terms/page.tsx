/**
 * Terms of Service Page
 *
 * Legally compliant terms for Meeting Alert SaaS
 * Last Updated: February 4, 2026
 */

import Link from 'next/link'

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link
            href="/login"
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            ← Back to Meeting Alert
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 md:p-12">
          {/* Title */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Terms of Service
            </h1>
            <p className="text-sm text-gray-500">
              Last Updated: February 4, 2026
            </p>
          </div>

          {/* Introduction */}
          <section className="mb-8">
            <p className="text-gray-700 leading-relaxed">
              Welcome to Meeting Alert. By using our service, you agree to these
              Terms of Service. Please read them carefully before using our
              platform.
            </p>
          </section>

          {/* Section 1: Service Description */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              1. Service Description
            </h2>
            <div className="space-y-3 text-gray-700 leading-relaxed">
              <p>
                Meeting Alert is a software-as-a-service (SaaS) platform that
                monitors your Google Meet meetings and sends notifications when
                participants join.
              </p>
              <p className="font-medium">How it works:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  We access your Google Calendar via OAuth with read-only
                  permissions
                </li>
                <li>
                  We monitor your Google Meet meetings by polling the Google
                  Calendar API approximately every 30 seconds
                </li>
                <li>
                  When a participant joins your meeting, we send you a
                  notification via email or browser push notification
                </li>
              </ul>
              <p className="font-medium text-gray-900 bg-blue-50 border-l-4 border-blue-600 p-4 my-4">
                Important: We do NOT record, store, or process any meeting content,
                audio, video, screen shares, or chat logs. We only access meeting
                metadata (times, titles, participant names).
              </p>
            </div>
          </section>

          {/* Section 2: User Responsibilities */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              2. User Responsibilities
            </h2>
            <div className="space-y-3 text-gray-700 leading-relaxed">
              <p>By using Meeting Alert, you agree to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  Provide accurate and complete information during registration
                </li>
                <li>
                  Maintain the security of your account credentials
                </li>
                <li>
                  Use the service in compliance with all applicable laws and
                  regulations
                </li>
                <li>
                  Obtain necessary consent from meeting participants if required
                  by law in your jurisdiction
                </li>
                <li>Not use the service for any unlawful or prohibited purposes</li>
                <li>
                  Not attempt to access, modify, or interfere with our systems or
                  other users' data
                </li>
              </ul>
            </div>
          </section>

          {/* Section 3: API Usage and Platform Dependency */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              3. API Usage and Platform Dependency
            </h2>
            <div className="space-y-3 text-gray-700 leading-relaxed">
              <p>
                Meeting Alert depends on third-party APIs, primarily the Google
                Calendar API. Our service is subject to:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Google's API availability and rate limits</li>
                <li>
                  Changes to Google's API policies or terms of service
                </li>
                <li>
                  Potential service interruptions due to API maintenance or
                  outages
                </li>
              </ul>
              <p className="mt-3">
                We are not responsible for service disruptions caused by
                third-party platforms beyond our control.
              </p>
            </div>
          </section>

          {/* Section 4: Payment Terms */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              4. Payment Terms
            </h2>
            <div className="space-y-3 text-gray-700 leading-relaxed">
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong>Pricing:</strong> Meeting Alert costs $79 per month
                </li>
                <li>
                  <strong>Free Trial:</strong> New users receive a 14-day free
                  trial. No credit card required during trial.
                </li>
                <li>
                  <strong>Billing:</strong> Subscriptions are billed monthly in
                  advance via Stripe
                </li>
                <li>
                  <strong>Cancellation:</strong> You can cancel anytime. No
                  refunds for partial months, but you'll retain access until the
                  end of your billing period
                </li>
                <li>
                  <strong>Price Changes:</strong> We may change prices with 30
                  days' notice to existing subscribers
                </li>
              </ul>
            </div>
          </section>

          {/* Section 5: Data Collection and Privacy */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              5. Data Collection and Privacy
            </h2>
            <div className="space-y-3 text-gray-700 leading-relaxed">
              <p className="font-medium">What we collect:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Meeting metadata (times, titles, participant names)</li>
                <li>Google OAuth tokens (encrypted)</li>
                <li>Your email address and account information</li>
                <li>Payment information (processed securely by Stripe)</li>
              </ul>
              <p className="font-medium mt-4">What we DON'T collect:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Meeting content, audio, or video</li>
                <li>Screen recordings or shares</li>
                <li>Chat logs or transcripts</li>
                <li>Any personally identifiable information from meetings</li>
              </ul>
              <p className="mt-4">
                For more details, please read our{' '}
                <Link href="/privacy" className="text-blue-600 hover:text-blue-700 underline">
                  Privacy Policy
                </Link>
                .
              </p>
            </div>
          </section>

          {/* Section 6: Disclaimers and Limitations of Liability */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              6. Disclaimers and Limitations of Liability
            </h2>
            <div className="space-y-3 text-gray-700 leading-relaxed">
              <p>
                <strong>SERVICE PROVIDED "AS IS":</strong> Meeting Alert is
                provided "as is" without warranties of any kind, express or
                implied. We do not guarantee:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Uninterrupted or error-free service</li>
                <li>100% accurate participant detection</li>
                <li>Delivery of all notifications</li>
                <li>Availability of third-party APIs</li>
              </ul>
              <p className="mt-4">
                <strong>LIMITATION OF LIABILITY:</strong> To the maximum extent
                permitted by law, Meeting Alert shall not be liable for:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  Missed meetings or notifications due to service interruptions
                </li>
                <li>Loss of data or revenue</li>
                <li>
                  Indirect, incidental, or consequential damages
                </li>
                <li>
                  Any damages exceeding the amount paid for the service in the
                  past 3 months
                </li>
              </ul>
            </div>
          </section>

          {/* Section 7: Account Termination */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              7. Account Termination
            </h2>
            <div className="space-y-3 text-gray-700 leading-relaxed">
              <p>We reserve the right to suspend or terminate your account if:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>You violate these Terms of Service</li>
                <li>Your payment fails or is disputed</li>
                <li>You engage in fraudulent or abusive behavior</li>
                <li>Required by law or legal process</li>
              </ul>
              <p className="mt-3">
                Upon termination, your access to the service will cease, and your
                data may be deleted according to our data retention policy.
              </p>
            </div>
          </section>

          {/* Section 8: Changes to Terms */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              8. Changes to These Terms
            </h2>
            <div className="space-y-3 text-gray-700 leading-relaxed">
              <p>
                We may update these Terms of Service from time to time. Changes
                will be posted on this page with an updated "Last Updated" date.
                Continued use of the service after changes constitutes acceptance
                of the new terms.
              </p>
            </div>
          </section>

          {/* Section 9: Governing Law */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              9. Governing Law
            </h2>
            <div className="space-y-3 text-gray-700 leading-relaxed">
              <p>
                These Terms of Service are governed by the laws of England and
                Wales. Any disputes will be resolved in accordance with the laws
                of the United Kingdom. You agree that the courts of England and
                Wales shall have exclusive jurisdiction over any disputes arising
                from these Terms.
              </p>
            </div>
          </section>

          {/* Section 10: Contact Information */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              10. Contact Information
            </h2>
            <div className="space-y-3 text-gray-700 leading-relaxed">
              <p>
                If you have questions about these Terms of Service, please contact
                us at:
              </p>
              <div className="bg-gray-50 p-4 rounded-lg mt-3">
                <p className="font-medium text-gray-900">Meeting Alert Support</p>
                <p className="text-gray-700">
                  Email:{' '}
                  <a
                    href="mailto:support@meetingalert.com"
                    className="text-blue-600 hover:text-blue-700"
                  >
                    support@meetingalert.com
                  </a>
                </p>
              </div>
            </div>
          </section>

          {/* Acknowledgment */}
          <section className="border-t border-gray-200 pt-8">
            <p className="text-sm text-gray-600 leading-relaxed">
              By clicking "Create Account" or using Meeting Alert, you acknowledge
              that you have read, understood, and agree to be bound by these Terms
              of Service.
            </p>
          </section>
        </div>

        {/* Footer Navigation */}
        <div className="mt-8 text-center">
          <Link
            href="/privacy"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            View Privacy Policy →
          </Link>
        </div>
      </main>
    </div>
  )
}
