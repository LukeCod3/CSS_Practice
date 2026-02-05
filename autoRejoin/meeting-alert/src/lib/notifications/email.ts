/**
 * Email Notification Service
 *
 * Sends email notifications using Resend API with robust error handling.
 *
 * RESEND API:
 * - Documentation: https://resend.com/docs
 * - Rate limits: 100 emails/day (free tier), 10 emails/second
 * - Retry logic: Handles transient failures automatically
 * - From address: onboarding@resend.dev (verified for testing)
 *
 * ERROR HANDLING:
 * - Rate limits: Exponential backoff, max 3 retries
 * - Network errors: Retry with backoff
 * - Invalid email: Return error without retry
 * - API errors: Log and return descriptive error
 *
 * PRODUCTION NOTES:
 * - Replace onboarding@resend.dev with your verified domain
 * - Add your domain in Resend dashboard: Settings > Domains
 * - Configure SPF/DKIM records for deliverability
 * - Monitor bounce rate and spam complaints
 */

import { Resend } from 'resend'
import {
  participantJoinedEmail,
  type ParticipantJoinedEmailParams,
} from '../email-templates'

/**
 * Initialize Resend client
 *
 * IMPORTANT:
 * - API key stored in environment variable (RESEND_API_KEY)
 * - Never commit API keys to version control
 * - Use different keys for dev/staging/production
 */
const resend = new Resend(process.env.RESEND_API_KEY)

/**
 * Email send result
 */
export interface EmailResult {
  success: boolean
  id?: string // Resend email ID (for tracking)
  error?: string // Error message if failed
}

/**
 * Send participant joined notification email
 *
 * FLOW:
 * 1. Generate email from template
 * 2. Send via Resend API
 * 3. Handle errors with retry logic
 * 4. Return success/failure result
 *
 * RETRY LOGIC:
 * - Max 3 attempts
 * - Exponential backoff: 1s, 2s, 4s
 * - Retries on: rate limits, network errors, 5xx errors
 * - No retry on: invalid email, 4xx errors (except 429)
 *
 * ERROR TYPES:
 * - Rate limit (429): Wait and retry
 * - Network error: Retry with backoff
 * - Invalid email (400): Return error immediately
 * - Server error (5xx): Retry with backoff
 * - Unknown error: Log and return error
 *
 * @param params - Email parameters (recipient, meeting details)
 * @returns Result with success status and email ID or error
 *
 * @example
 * const result = await sendParticipantEmail({
 *   userName: 'John',
 *   userEmail: 'john@example.com',
 *   participantName: 'Sarah Smith',
 *   meetingTitle: 'Team Standup',
 *   meetingLink: 'https://meet.google.com/abc-defg-hij',
 *   joinedAt: new Date().toISOString()
 * })
 *
 * if (result.success) {
 *   console.log('Email sent:', result.id)
 * } else {
 *   console.error('Email failed:', result.error)
 * }
 */
export async function sendParticipantEmail(
  params: ParticipantJoinedEmailParams
): Promise<EmailResult> {
  const { userEmail } = params

  // Validate email format
  if (!userEmail || !isValidEmail(userEmail)) {
    return {
      success: false,
      error: 'Invalid email address format',
    }
  }

  // Generate email from template
  const { subject, html } = participantJoinedEmail(params)

  // Retry configuration
  const maxRetries = 3
  let lastError: Error | null = null

  // Retry loop with exponential backoff
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(
        `Sending email to ${userEmail} (attempt ${attempt}/${maxRetries})`
      )

      // Send email via Resend API
      const { data, error } = await resend.emails.send({
        from: 'Meeting Alert <onboarding@resend.dev>', // TODO: Replace with your verified domain
        to: userEmail,
        subject,
        html,
        // Optional: Add reply-to for user responses
        // reply_to: 'support@yourdomain.com',
      })

      // Check for Resend API errors
      if (error) {
        throw new Error(error.message || 'Resend API error')
      }

      // Success!
      console.log(`Email sent successfully to ${userEmail}, ID: ${data?.id}`)
      return {
        success: true,
        id: data?.id,
      }
    } catch (error: any) {
      lastError = error
      const errorMessage = error.message?.toLowerCase() || ''

      console.error(
        `Email send attempt ${attempt}/${maxRetries} failed:`,
        errorMessage
      )

      // Check if error is retryable
      const isRetryable =
        // Rate limit errors (429)
        errorMessage.includes('rate limit') ||
        errorMessage.includes('too many requests') ||
        errorMessage.includes('429') ||
        // Network errors
        errorMessage.includes('network') ||
        errorMessage.includes('timeout') ||
        errorMessage.includes('econnrefused') ||
        errorMessage.includes('enotfound') ||
        // Server errors (5xx)
        errorMessage.includes('internal server error') ||
        errorMessage.includes('service unavailable') ||
        errorMessage.includes('500') ||
        errorMessage.includes('502') ||
        errorMessage.includes('503')

      // Check for non-retryable errors
      const isInvalidEmail =
        errorMessage.includes('invalid email') ||
        errorMessage.includes('invalid recipient') ||
        errorMessage.includes('bounce') ||
        errorMessage.includes('undeliverable')

      // If invalid email, don't retry
      if (isInvalidEmail) {
        console.error('Invalid email address, not retrying:', userEmail)
        return {
          success: false,
          error: `Invalid email address: ${userEmail}`,
        }
      }

      // If not retryable or last attempt, give up
      if (!isRetryable || attempt >= maxRetries) {
        console.error('Email send failed after all retries:', errorMessage)
        return {
          success: false,
          error: `Failed to send email: ${error.message}`,
        }
      }

      // Calculate backoff delay (exponential: 1s, 2s, 4s)
      const delayMs = Math.pow(2, attempt - 1) * 1000
      console.log(`Retrying in ${delayMs}ms...`)

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, delayMs))
    }
  }

  // All retries exhausted
  return {
    success: false,
    error: `Failed to send email after ${maxRetries} attempts: ${lastError?.message}`,
  }
}

/**
 * Validate email format
 *
 * Uses simple regex for basic validation.
 * More robust validation happens on Resend's side.
 *
 * @param email - Email address to validate
 * @returns True if valid format
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Batch send emails (for future use)
 *
 * Sends multiple emails with rate limiting.
 * Useful for notifying multiple users about the same event.
 *
 * RATE LIMITING:
 * - Resend free tier: 100 emails/day, 10 emails/second
 * - Add delay between batches to avoid hitting rate limits
 * - Use Promise.all() for concurrent sends (within limits)
 *
 * @param emailParams - Array of email parameters
 * @returns Array of results
 */
export async function sendBatchEmails(
  emailParams: ParticipantJoinedEmailParams[]
): Promise<EmailResult[]> {
  const results: EmailResult[] = []

  // Send in batches of 10 (Resend rate limit: 10/second)
  const batchSize = 10
  for (let i = 0; i < emailParams.length; i += batchSize) {
    const batch = emailParams.slice(i, i + batchSize)

    console.log(
      `Sending batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(emailParams.length / batchSize)}`
    )

    // Send batch concurrently
    const batchResults = await Promise.all(
      batch.map((params) => sendParticipantEmail(params))
    )

    results.push(...batchResults)

    // Wait 1 second between batches to avoid rate limits
    if (i + batchSize < emailParams.length) {
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }
  }

  const successCount = results.filter((r) => r.success).length
  console.log(
    `Batch send complete: ${successCount}/${results.length} successful`
  )

  return results
}

/**
 * Test email sending (for development)
 *
 * Sends a test email to verify configuration.
 * Use this to test email templates and delivery.
 *
 * @param testEmail - Email address to send test to
 * @returns Result with success status
 */
export async function sendTestEmail(testEmail: string): Promise<EmailResult> {
  console.log('Sending test email to:', testEmail)

  return sendParticipantEmail({
    userName: 'Test User',
    userEmail: testEmail,
    participantName: 'Sarah Smith (Test)',
    meetingTitle: 'Test Meeting - Meeting Alert',
    meetingLink: 'https://meet.google.com/test-test-test',
    joinedAt: new Date().toISOString(),
  })
}
