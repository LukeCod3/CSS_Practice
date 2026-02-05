/**
 * Privacy Policy Page
 *
 * GDPR and CCPA compliant privacy policy for Meeting Alert SaaS
 * Last Updated: February 4, 2026
 */

import Link from 'next/link'

export default function PrivacyPolicyPage() {
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
              Privacy Policy
            </h1>
            <p className="text-sm text-gray-500">
              Last Updated: February 4, 2026
            </p>
          </div>

          {/* Introduction */}
          <section className="mb-8">
            <p className="text-gray-700 leading-relaxed">
              At Meeting Alert, we take your privacy seriously. This Privacy Policy
              explains how we collect, use, store, and protect your personal
              information when you use our service.
            </p>
          </section>

          {/* Section 1: Information We Collect */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              1. Information We Collect
            </h2>
            <div className="space-y-4 text-gray-700 leading-relaxed">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  1.1 Account Information
                </h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Email address</li>
                  <li>Account credentials (password is hashed and encrypted)</li>
                  <li>Account creation date and last login</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  1.2 Google OAuth Data
                </h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>OAuth access tokens (encrypted)</li>
                  <li>OAuth refresh tokens (encrypted)</li>
                  <li>Google account ID</li>
                  <li>Read-only access to your Google Calendar</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  1.3 Meeting Metadata
                </h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Meeting titles</li>
                  <li>Scheduled start and end times</li>
                  <li>Meeting links (Google Meet URLs)</li>
                  <li>Participant names and email addresses</li>
                  <li>Meeting status (scheduled, active, ended)</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  1.4 Payment Information
                </h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Stripe customer ID</li>
                  <li>Subscription status and plan</li>
                  <li>
                    Payment method (stored securely by Stripe, not on our servers)
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  1.5 Usage Data
                </h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Notification history (what notifications were sent)</li>
                  <li>Feature usage patterns</li>
                  <li>Error logs and system diagnostics</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Section 2: Information We DO NOT Collect */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              2. Information We DO NOT Collect
            </h2>
            <div className="bg-green-50 border-l-4 border-green-600 p-6 my-4">
              <p className="font-medium text-gray-900 mb-3">
                We want to be crystal clear about what we DON'T collect:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>
                  <strong>Meeting content:</strong> We do not record or store
                  anything discussed in your meetings
                </li>
                <li>
                  <strong>Audio or video:</strong> We do not capture or process
                  any audio or video from meetings
                </li>
                <li>
                  <strong>Screen recordings:</strong> We do not record or store
                  screen shares
                </li>
                <li>
                  <strong>Chat logs:</strong> We do not access or store meeting
                  chat messages
                </li>
                <li>
                  <strong>Transcripts:</strong> We do not create or store meeting
                  transcripts
                </li>
                <li>
                  <strong>Files:</strong> We do not access files shared in
                  meetings
                </li>
              </ul>
            </div>
            <p className="text-gray-700 leading-relaxed mt-4">
              We only access meeting metadata (times, titles, participants) to send
              you notifications. We never access the actual content of your
              meetings.
            </p>
          </section>

          {/* Section 3: How We Use Your Information */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              3. How We Use Your Information
            </h2>
            <div className="space-y-3 text-gray-700 leading-relaxed">
              <p>We use your information solely to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Provide the Meeting Alert service</li>
                <li>Send notifications when participants join your meetings</li>
                <li>Manage your account and subscription</li>
                <li>Process payments through Stripe</li>
                <li>Send important service updates or security alerts</li>
                <li>Improve our service and fix bugs</li>
                <li>Comply with legal obligations</li>
              </ul>
              <p className="mt-4 font-medium">
                We do NOT sell, rent, or share your personal information with third
                parties for marketing purposes.
              </p>
            </div>
          </section>

          {/* Section 4: Data Storage and Security */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              4. Data Storage and Security
            </h2>
            <div className="space-y-4 text-gray-700 leading-relaxed">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  4.1 Where We Store Data
                </h3>
                <p>
                  Your data is stored securely in Supabase (built on PostgreSQL),
                  which provides:
                </p>
                <ul className="list-disc pl-6 space-y-2 mt-2">
                  <li>Encryption at rest</li>
                  <li>Encryption in transit (SSL/TLS)</li>
                  <li>Regular automated backups</li>
                  <li>Industry-standard security practices</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  4.2 Security Measures
                </h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    OAuth tokens are encrypted using industry-standard encryption
                  </li>
                  <li>Passwords are hashed using bcrypt</li>
                  <li>Row-level security (RLS) ensures data isolation</li>
                  <li>Regular security audits and updates</li>
                  <li>Access controls and authentication requirements</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  4.3 Data Retention
                </h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    <strong>Meeting data:</strong> Automatically deleted after 30
                    days
                  </li>
                  <li>
                    <strong>Account data:</strong> Retained while your account is
                    active
                  </li>
                  <li>
                    <strong>After account deletion:</strong> All data permanently
                    deleted within 30 days
                  </li>
                  <li>
                    <strong>Payment records:</strong> Retained for 7 years for tax
                    compliance
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* Section 5: Third-Party Services */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              5. Third-Party Services
            </h2>
            <div className="space-y-4 text-gray-700 leading-relaxed">
              <p>We use the following third-party services:</p>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2">
                  Google (OAuth and Calendar API)
                </h3>
                <p className="text-sm">
                  Purpose: Authentication and calendar access
                  <br />
                  Data shared: OAuth tokens, calendar metadata
                  <br />
                  Privacy Policy:{' '}
                  <a
                    href="https://policies.google.com/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700 underline"
                  >
                    Google Privacy Policy
                  </a>
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2">Stripe</h3>
                <p className="text-sm">
                  Purpose: Payment processing and subscription management
                  <br />
                  Data shared: Email, payment information
                  <br />
                  Privacy Policy:{' '}
                  <a
                    href="https://stripe.com/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700 underline"
                  >
                    Stripe Privacy Policy
                  </a>
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2">Resend</h3>
                <p className="text-sm">
                  Purpose: Email notifications
                  <br />
                  Data shared: Email address, notification content
                  <br />
                  Privacy Policy:{' '}
                  <a
                    href="https://resend.com/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700 underline"
                  >
                    Resend Privacy Policy
                  </a>
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2">Supabase</h3>
                <p className="text-sm">
                  Purpose: Database and authentication
                  <br />
                  Data shared: All stored user data
                  <br />
                  Privacy Policy:{' '}
                  <a
                    href="https://supabase.com/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700 underline"
                  >
                    Supabase Privacy Policy
                  </a>
                </p>
              </div>
            </div>
          </section>

          {/* Section 6: Your Rights */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              6. Your Rights
            </h2>
            <div className="space-y-4 text-gray-700 leading-relaxed">
              <p>You have the right to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong>Access:</strong> Request a copy of all data we have about
                  you
                </li>
                <li>
                  <strong>Correction:</strong> Update or correct your personal
                  information
                </li>
                <li>
                  <strong>Deletion:</strong> Request deletion of your account and
                  all associated data
                </li>
                <li>
                  <strong>Export:</strong> Download your data in a portable format
                </li>
                <li>
                  <strong>Opt-out:</strong> Unsubscribe from notification emails
                </li>
                <li>
                  <strong>Revoke access:</strong> Disconnect your Google account at
                  any time
                </li>
              </ul>

              <p className="mt-4">
                To exercise any of these rights, contact us at{' '}
                <a
                  href="mailto:support@meetingalert.com"
                  className="text-blue-600 hover:text-blue-700 underline"
                >
                  support@meetingalert.com
                </a>
              </p>
            </div>
          </section>

          {/* Section 7: UK GDPR & Data Protection Compliance */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              7. UK GDPR & Data Protection Compliance
            </h2>
            <div className="space-y-3 text-gray-700 leading-relaxed">
              <p>
                Meeting Alert complies with the UK General Data Protection
                Regulation (UK GDPR) and the Data Protection Act 2018. As a UK-based
                service, we provide the following rights to all users, including
                those in the United Kingdom and European Economic Area (EEA):
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong>Right to be forgotten:</strong> Request complete deletion
                  of your data
                </li>
                <li>
                  <strong>Data portability:</strong> Receive your data in a
                  machine-readable format
                </li>
                <li>
                  <strong>Restrict processing:</strong> Limit how we use your data
                </li>
                <li>
                  <strong>Object to processing:</strong> Opt-out of certain data
                  uses
                </li>
                <li>
                  <strong>Withdraw consent:</strong> Revoke permission for data
                  processing at any time
                </li>
              </ul>
              <p className="mt-4">
                <strong>Legal basis for processing:</strong> We process your data
                based on your consent (by creating an account) and for contractual
                necessity (to provide the service).
              </p>
              <p className="mt-4">
                <strong>Data Controller:</strong> Meeting Alert is the data
                controller for your personal information, operating under UK data
                protection laws.
              </p>
            </div>
          </section>

          {/* Section 8: CCPA Compliance (California Users) */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              8. CCPA Compliance (California Users)
            </h2>
            <div className="space-y-3 text-gray-700 leading-relaxed">
              <p>
                If you are a California resident, you have rights under the
                California Consumer Privacy Act (CCPA):
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong>Right to know:</strong> What personal information we
                  collect and how we use it
                </li>
                <li>
                  <strong>Right to delete:</strong> Request deletion of your
                  personal information
                </li>
                <li>
                  <strong>Right to opt-out:</strong> Opt-out of the "sale" of
                  personal information (we do not sell data)
                </li>
                <li>
                  <strong>Right to non-discrimination:</strong> We will not
                  discriminate against you for exercising your rights
                </li>
              </ul>
              <p className="mt-4 font-medium">
                We do NOT sell your personal information to third parties.
              </p>
            </div>
          </section>

          {/* Section 9: Cookies */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              9. Cookies and Tracking
            </h2>
            <div className="space-y-3 text-gray-700 leading-relaxed">
              <p>We use cookies for:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong>Authentication:</strong> Maintaining your login session
                </li>
                <li>
                  <strong>Security:</strong> Protecting against CSRF attacks
                </li>
                <li>
                  <strong>Preferences:</strong> Remembering your settings
                </li>
              </ul>
              <p className="mt-4">
                We do NOT use cookies for advertising or tracking across other
                websites.
              </p>
            </div>
          </section>

          {/* Section 10: Children's Privacy */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              10. Children's Privacy
            </h2>
            <div className="space-y-3 text-gray-700 leading-relaxed">
              <p>
                Meeting Alert is not intended for children under 13 years of age.
                We do not knowingly collect personal information from children. If
                you are a parent and believe your child has provided us with
                personal information, please contact us immediately.
              </p>
            </div>
          </section>

          {/* Section 11: Data Breach Notification */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              11. Data Breach Notification
            </h2>
            <div className="space-y-3 text-gray-700 leading-relaxed">
              <p>
                In the event of a data breach that affects your personal
                information, we will:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Notify you within 72 hours via email</li>
                <li>Explain what data was affected</li>
                <li>Describe steps we're taking to resolve the issue</li>
                <li>Provide recommendations to protect your account</li>
              </ul>
            </div>
          </section>

          {/* Section 12: Changes to Privacy Policy */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              12. Changes to This Privacy Policy
            </h2>
            <div className="space-y-3 text-gray-700 leading-relaxed">
              <p>
                We may update this Privacy Policy from time to time. Changes will
                be posted on this page with an updated "Last Updated" date. For
                significant changes, we will notify you via email.
              </p>
            </div>
          </section>

          {/* Section 13: Contact Information */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              13. Contact Information
            </h2>
            <div className="space-y-4 text-gray-700 leading-relaxed">
              <p>
                If you have questions about this Privacy Policy or want to exercise
                your rights, please contact us:
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
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
                <p className="text-sm text-gray-500 mt-2">
                  We typically respond within 48 hours
                </p>
              </div>

              <div className="mt-4">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  UK Data Protection Authority
                </h3>
                <p>
                  If you are not satisfied with our response to your privacy
                  concerns, you have the right to lodge a complaint with the UK's
                  supervisory authority:
                </p>
                <div className="bg-blue-50 p-4 rounded-lg mt-3 border-l-4 border-blue-600">
                  <p className="font-medium text-gray-900">
                    Information Commissioner's Office (ICO)
                  </p>
                  <p className="text-sm text-gray-700 mt-1">
                    Website:{' '}
                    <a
                      href="https://ico.org.uk"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 underline"
                    >
                      ico.org.uk
                    </a>
                  </p>
                  <p className="text-sm text-gray-700">
                    Phone: 0303 123 1113
                  </p>
                  <p className="text-sm text-gray-700">
                    Address: Wycliffe House, Water Lane, Wilmslow, Cheshire, SK9 5AF
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Acknowledgment */}
          <section className="border-t border-gray-200 pt-8">
            <p className="text-sm text-gray-600 leading-relaxed">
              By using Meeting Alert, you acknowledge that you have read and
              understood this Privacy Policy.
            </p>
          </section>
        </div>

        {/* Footer Navigation */}
        <div className="mt-8 text-center">
          <Link
            href="/terms"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            View Terms of Service →
          </Link>
        </div>
      </main>
    </div>
  )
}
