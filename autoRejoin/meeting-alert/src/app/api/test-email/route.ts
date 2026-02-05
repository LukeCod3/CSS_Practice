/**
 * Test Email API Endpoint
 *
 * GET /api/test-email?email=your@email.com
 *
 * Sends a test email to verify the notification system works.
 * Use this to test email templates, Resend integration, and deliverability.
 *
 * QUERY PARAMETERS:
 * - email: Email address to send test to (required)
 *
 * RESPONSES:
 * - 200: Email sent successfully, returns { success: true, id: "..." }
 * - 400: Missing email parameter
 * - 500: Email send failed, returns { success: false, error: "..." }
 *
 * TESTING:
 * 1. Browser: http://localhost:3000/api/test-email?email=your@email.com
 * 2. cURL: curl "http://localhost:3000/api/test-email?email=your@email.com"
 * 3. Thunder Client / Postman: GET request to endpoint
 *
 * @example
 * // Test with your email
 * http://localhost:3000/api/test-email?email=john@example.com
 *
 * // Expected response:
 * {
 *   "success": true,
 *   "id": "re_abc123xyz",
 *   "message": "Test email sent successfully to john@example.com"
 * }
 */

import { NextRequest, NextResponse } from 'next/server'
import { sendTestEmail } from '@/lib/notifications/email'

export async function GET(request: NextRequest) {
  try {
    // Get email from query parameters
    const email = request.nextUrl.searchParams.get('email')

    // Validate email parameter
    if (!email) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing email parameter',
          usage: 'GET /api/test-email?email=your@email.com',
        },
        { status: 400 }
      )
    }

    console.log(`📧 Test email request received for: ${email}`)

    // Send test email
    const result = await sendTestEmail(email)

    // Return result
    if (result.success) {
      console.log(`✅ Test email sent successfully to ${email}`)
      return NextResponse.json({
        success: true,
        id: result.id,
        message: `Test email sent successfully to ${email}`,
        note: 'Check your inbox (and spam folder) for the email',
      })
    } else {
      console.error(`❌ Test email failed: ${result.error}`)
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          message: `Failed to send test email to ${email}`,
        },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('Unexpected error in test-email endpoint:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Unknown error occurred',
        message: 'An unexpected error occurred while sending test email',
      },
      { status: 500 }
    )
  }
}

/**
 * POST method for testing with JSON body
 *
 * POST /api/test-email
 * Body: { "email": "your@email.com" }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing email in request body',
          usage: 'POST /api/test-email with body: { "email": "your@email.com" }',
        },
        { status: 400 }
      )
    }

    console.log(`📧 Test email request (POST) received for: ${email}`)

    const result = await sendTestEmail(email)

    if (result.success) {
      console.log(`✅ Test email sent successfully to ${email}`)
      return NextResponse.json({
        success: true,
        id: result.id,
        message: `Test email sent successfully to ${email}`,
      })
    } else {
      console.error(`❌ Test email failed: ${result.error}`)
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('Error parsing request body:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Invalid request body',
      },
      { status: 400 }
    )
  }
}
