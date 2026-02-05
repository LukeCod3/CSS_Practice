/**
 * Simple Test Notification Endpoint
 *
 * POST /api/test-notify
 *
 * Sends both email and browser notifications for testing.
 * Bypasses all the complex logic - just sends notifications directly.
 *
 * REQUEST:
 * POST /api/test-notify
 * Body: { "meetingId": "meeting-uuid" } (optional - uses first meeting if not provided)
 *
 * RESPONSE:
 * {
 *   "success": true,
 *   "emailSent": true,
 *   "notification": {
 *     "title": "Test Notification",
 *     "body": "Meeting Title",
 *     "meetingLink": "https://meet.google.com/..."
 *   }
 * }
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendParticipantEmail } from '@/lib/notifications/email'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Not authenticated',
        },
        { status: 401 }
      )
    }

    // Get user email from auth
    const userEmail = user.email
    const userName = user.user_metadata?.name || user.email?.split('@')[0] || 'User'

    if (!userEmail) {
      return NextResponse.json(
        {
          success: false,
          error: 'User email not found',
        },
        { status: 400 }
      )
    }

    console.log(`📧 Test notification for user: ${userName} (${userEmail})`)

    // Get a meeting (use provided ID or get first meeting)
    const body = await request.json().catch(() => ({}))
    const { meetingId } = body

    let meeting
    if (meetingId) {
      const { data } = await supabase
        .from('meetings')
        .select('*')
        .eq('id', meetingId)
        .eq('user_id', user.id)
        .single()
      meeting = data
    } else {
      const { data } = await supabase
        .from('meetings')
        .select('*')
        .eq('user_id', user.id)
        .order('scheduled_start', { ascending: false })
        .limit(1)
        .single()
      meeting = data
    }

    if (!meeting) {
      return NextResponse.json(
        {
          success: false,
          error: 'No meetings found',
        },
        { status: 404 }
      )
    }

    console.log(`📧 Using meeting: ${meeting.title}`)

    // Send email notification directly
    let emailSent = false
    try {
      const emailResult = await sendParticipantEmail({
        userName: userName,
        userEmail: userEmail,
        participantName: 'Test Participant',
        meetingTitle: meeting.title || 'Test Meeting',
        meetingLink: meeting.meeting_link,
        joinedAt: new Date().toISOString(),
      })

      emailSent = emailResult.success

      if (emailResult.success) {
        console.log('✅ Email sent:', emailResult.id)
      } else {
        console.error('❌ Email failed:', emailResult.error)
      }
    } catch (error: any) {
      console.error('Email error:', error.message)
    }

    // Return browser notification data
    const notification = {
      title: '🔔 Test Participant joined',
      body: meeting.title || 'Test Meeting',
      meetingLink: meeting.meeting_link,
    }

    console.log('✅ Test notification complete')

    return NextResponse.json({
      success: true,
      emailSent,
      notification,
      message: emailSent
        ? 'Email sent! Check your inbox and browser notification.'
        : 'Browser notification ready (email failed)',
      userEmail, // So you can verify which email was used
    })
  } catch (error: any) {
    console.error('Test notify error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    )
  }
}
