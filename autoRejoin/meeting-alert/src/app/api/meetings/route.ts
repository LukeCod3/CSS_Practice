/**
 * Meetings API Endpoint
 *
 * GET /api/meetings
 *
 * Returns all meetings for the authenticated user.
 * Sorted by scheduled_start ascending (soonest first).
 *
 * RESPONSE:
 * {
 *   "success": true,
 *   "meetings": [
 *     {
 *       "id": "uuid",
 *       "meeting_id": "meet-code",
 *       "meeting_link": "https://meet.google.com/...",
 *       "title": "Meeting Title",
 *       "scheduled_start": "2024-01-01T10:00:00Z",
 *       "scheduled_end": "2024-01-01T11:00:00Z",
 *       "status": "scheduled|active|completed"
 *     }
 *   ],
 *   "count": 5
 * }
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check if user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized',
        },
        { status: 401 }
      )
    }

    // Fetch all meetings for the user
    const { data: meetings, error: meetingsError } = await supabase
      .from('meetings')
      .select('*')
      .eq('user_id', user.id)
      .order('scheduled_start', { ascending: true })

    if (meetingsError) {
      console.error('Error fetching meetings:', meetingsError)
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch meetings',
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      meetings: meetings || [],
      count: meetings?.length || 0,
    })
  } catch (error: any) {
    console.error('Unexpected error in meetings endpoint:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Unknown error occurred',
      },
      { status: 500 }
    )
  }
}
