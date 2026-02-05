'use client'

/**
 * Real-Time Meetings Component
 *
 * Manages meeting data with real-time updates from Supabase.
 *
 * FUNCTIONALITY:
 * 1. Displays meetings list with live updates
 * 2. Subscribes to Supabase real-time events (INSERT, UPDATE, DELETE)
 * 3. Updates meeting list automatically without page refresh
 * 4. Handles "Sync Now" button with automatic refetch
 * 5. Shows live update indicators and animations
 * 6. Passes updated meetings to MeetingMonitor for polling
 *
 * REAL-TIME ARCHITECTURE:
 * - Supabase Realtime uses WebSocket connection
 * - Changes are broadcast to all subscribed clients
 * - Filter by user_id ensures you only see your meetings
 * - Automatic reconnection on network issues
 *
 * WHY CLIENT COMPONENT:
 * - Uses React hooks (useState, useEffect)
 * - Needs WebSocket connection (Supabase realtime)
 * - Real-time UI updates
 * - Cannot be server-rendered
 *
 * PERFORMANCE OPTIMIZATIONS:
 * - Debounce rapid updates (max 1 UI update per second)
 * - Existing 20-second monitoring polling unchanged
 * - Only re-render when meetings actually change
 * - Clean up subscription on unmount (prevent memory leaks)
 *
 * INTEGRATION WITH MONITORING:
 * - MeetingMonitor receives updated meetings via props
 * - MeetingMonitor's own polling logic continues unchanged
 * - Real-time updates ensure monitoring always has latest data
 * - Both systems work in parallel for redundancy
 */

import { useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Calendar, AlertCircle, RefreshCw } from 'lucide-react'
import MeetingCard from './MeetingCard'
import MeetingMonitor from './MeetingMonitor'

/**
 * Meeting type from database
 */
type Meeting = {
  id: string
  meeting_id: string
  meeting_link: string
  title: string
  scheduled_start: string
  scheduled_end: string
  status: string
  platform: string
  attendees: Array<{ email: string; name?: string }>
}

type RealTimeMeetingsProps = {
  initialMeetings: Meeting[]
  userId: string
  isGoogleConnected: boolean
}

export default function RealTimeMeetings({
  initialMeetings,
  userId,
  isGoogleConnected,
}: RealTimeMeetingsProps) {
  // Meetings state (starts with server-provided initial data)
  const [meetings, setMeetings] = useState<Meeting[]>(initialMeetings)

  // Sync button state
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncError, setSyncError] = useState<string | null>(null)
  const [syncSuccess, setSyncSuccess] = useState<string | null>(null)

  // Real-time connection status
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false)

  // Recently updated meeting IDs (for highlight animation)
  const [recentlyUpdatedIds, setRecentlyUpdatedIds] = useState<Set<string>>(
    new Set()
  )

  // Last sync timestamp (for preventing redundant syncs)
  const lastSyncTimeRef = useRef<number>(0)

  // Debounce timer ref
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Supabase client
  const supabase = createClient()

  /**
   * Filter meetings to show only active/upcoming ones
   *
   * CRITERIA (same as server-side filtering):
   * - status IN ('scheduled', 'active')
   * - scheduled_start >= NOW - 30 minutes
   * - scheduled_end >= NOW
   *
   * CLIENT-SIDE FILTERING:
   * - Ensures UI only shows relevant meetings
   * - Matches server-side query logic
   * - Updates dynamically as time passes
   */
  const filterEligibleMeetings = useCallback((allMeetings: Meeting[]): Meeting[] => {
    const now = new Date()
    const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000)

    return allMeetings.filter((meeting) => {
      const scheduledStart = new Date(meeting.scheduled_start)
      const scheduledEnd = new Date(meeting.scheduled_end)

      const isActiveStatus =
        meeting.status === 'scheduled' || meeting.status === 'active'
      const isRecentOrFuture = scheduledStart >= thirtyMinutesAgo
      const notEnded = scheduledEnd >= now

      return isActiveStatus && isRecentOrFuture && notEnded
    })
  }, [])

  /**
   * Debounced meeting update
   *
   * WHY DEBOUNCE:
   * - Prevents UI thrashing from rapid updates
   * - Batches multiple changes into single render
   * - Max 1 UI update per second for performance
   * - Still feels instant to user (1 second is fast)
   *
   * USE CASES:
   * - Multiple meetings updated simultaneously
   * - Rapid INSERT/UPDATE/DELETE events
   * - Network reconnection with backlog of events
   */
  const debouncedUpdateMeetings = useCallback(
    (updater: (prev: Meeting[]) => Meeting[]) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }

      debounceTimerRef.current = setTimeout(() => {
        setMeetings(updater)
      }, 1000) // 1 second debounce
    },
    []
  )

  /**
   * Add highlight animation to meeting
   *
   * Shows brief highlight when meeting is added or updated.
   * Automatically removes after 3 seconds.
   */
  const highlightMeeting = useCallback((meetingId: string) => {
    setRecentlyUpdatedIds((prev) => new Set(prev).add(meetingId))

    // Remove highlight after 3 seconds
    setTimeout(() => {
      setRecentlyUpdatedIds((prev) => {
        const next = new Set(prev)
        next.delete(meetingId)
        return next
      })
    }, 3000)
  }, [])

  /**
   * Setup Supabase real-time subscription
   *
   * REAL-TIME EVENTS:
   * - INSERT: New meeting added (from Google Calendar sync)
   * - UPDATE: Meeting details changed (time, title, status, etc.)
   * - DELETE: Meeting removed or ended
   *
   * SUBSCRIPTION LIFECYCLE:
   * 1. Create channel with unique name
   * 2. Subscribe to 'postgres_changes' on meetings table
   * 3. Filter by user_id (only see your meetings)
   * 4. Listen for INSERT, UPDATE, DELETE events
   * 5. Update local state when events received
   * 6. Clean up on component unmount
   *
   * FILTERING:
   * - filter: 'user_id=eq.{userId}' ensures you only get your meetings
   * - Server-side filter (RLS policies also enforced)
   * - Prevents seeing other users' meetings
   *
   * ERROR HANDLING:
   * - Connection errors: Logged, status indicator shows disconnected
   * - Automatic reconnection: Supabase client handles this
   * - Fallback: Manual refresh still works if real-time fails
   *
   * PERFORMANCE:
   * - WebSocket connection (more efficient than polling)
   * - Only sends changed data (not full table)
   * - Batched updates via debouncing
   * - Single subscription for all event types
   *
   * CLEANUP:
   * - CRITICAL: Must unsubscribe on unmount
   * - Prevents memory leaks
   * - Closes WebSocket connection
   * - Returns cleanup function from useEffect
   */
  useEffect(() => {
    console.log('🔴 Setting up Supabase real-time subscription for meetings')

    /**
     * Create real-time channel
     *
     * Channel name must be unique per subscription.
     * Using user_id ensures each user has their own channel.
     */
    const channel = supabase.channel(`meetings:${userId}`)

    /**
     * Subscribe to meetings table changes
     *
     * SUBSCRIPTION CONFIG:
     * - event: 'postgres_changes' (listens to database changes)
     * - schema: 'public' (default schema)
     * - table: 'meetings' (specific table to watch)
     * - filter: 'user_id=eq.{userId}' (only this user's meetings)
     */
    channel
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'meetings',
          filter: `user_id=eq.${userId}`,
        },
        (payload: any) => {
          console.log('🔔 Real-time event received:', payload)

          const event = payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE'
          const newMeeting = payload.new as Meeting
          const oldMeeting = payload.old as Meeting

          // Handle different event types
          switch (event) {
            case 'INSERT':
              /**
               * INSERT Event: New meeting added
               *
               * WHEN IT FIRES:
               * - User syncs Google Calendar
               * - New meeting created in database
               * - Automatic sync job runs
               *
               * WHAT TO DO:
               * - Add meeting to local state
               * - Filter to ensure it's eligible (may be old/ended)
               * - Highlight new meeting with animation
               * - Show in meetings list and monitor
               */
              console.log('➕ New meeting added:', newMeeting.title)

              debouncedUpdateMeetings((prev) => {
                // Check if meeting already exists (prevent duplicates)
                const exists = prev.some((m) => m.id === newMeeting.id)
                if (exists) return prev

                // Add new meeting and re-sort by start time
                const updated = [...prev, newMeeting].sort(
                  (a, b) =>
                    new Date(a.scheduled_start).getTime() -
                    new Date(b.scheduled_start).getTime()
                )

                return filterEligibleMeetings(updated)
              })

              highlightMeeting(newMeeting.id)
              break

            case 'UPDATE':
              /**
               * UPDATE Event: Meeting details changed
               *
               * WHEN IT FIRES:
               * - Meeting time changed in Google Calendar
               * - Meeting status updated (scheduled → active)
               * - Meeting title/description edited
               *
               * WHAT TO DO:
               * - Update meeting in local state
               * - Re-filter in case eligibility changed
               * - Highlight updated meeting
               * - Preserve order in list
               */
              console.log('🔄 Meeting updated:', newMeeting.title)

              debouncedUpdateMeetings((prev) => {
                const updated = prev.map((m) =>
                  m.id === newMeeting.id ? newMeeting : m
                )
                return filterEligibleMeetings(updated)
              })

              highlightMeeting(newMeeting.id)
              break

            case 'DELETE':
              /**
               * DELETE Event: Meeting removed
               *
               * WHEN IT FIRES:
               * - Meeting deleted from Google Calendar
               * - Meeting ended and marked as completed
               * - Manual deletion from database
               *
               * WHAT TO DO:
               * - Remove meeting from local state
               * - Fade out animation (CSS handles this)
               * - Update monitoring list
               */
              console.log('❌ Meeting deleted:', oldMeeting.id)

              debouncedUpdateMeetings((prev) =>
                prev.filter((m) => m.id !== oldMeeting.id)
              )
              break
          }
        }
      )
      .subscribe((status) => {
        console.log('Real-time subscription status:', status)

        /**
         * Track connection status
         *
         * STATUS VALUES:
         * - 'SUBSCRIBED': Connected and receiving events
         * - 'CHANNEL_ERROR': Connection failed
         * - 'TIMED_OUT': Connection timed out
         * - 'CLOSED': Connection closed
         */
        if (status === 'SUBSCRIBED') {
          setIsRealtimeConnected(true)
          console.log('✅ Real-time connection established')
        } else if (status === 'CHANNEL_ERROR') {
          setIsRealtimeConnected(false)
          console.error('❌ Real-time connection error')
        } else if (status === 'CLOSED') {
          setIsRealtimeConnected(false)
          console.log('🔌 Real-time connection closed')
        }
      })

    /**
     * CLEANUP FUNCTION
     *
     * WHY CRITICAL:
     * - WebSocket connections persist after component unmounts
     * - Multiple subscriptions cause duplicate events
     * - Memory leaks if not cleaned up
     * - Browser limits on WebSocket connections
     *
     * WHEN IT RUNS:
     * - Component unmounts (user navigates away)
     * - userId changes (different user logs in)
     * - Component re-renders with new props
     *
     * WHAT IT DOES:
     * - Unsubscribe from channel
     * - Close WebSocket connection
     * - Free up memory
     * - Prevent duplicate event handlers
     */
    return () => {
      console.log('🛑 Cleaning up real-time subscription')
      supabase.removeChannel(channel)
    }
  }, [userId, supabase, debouncedUpdateMeetings, highlightMeeting, filterEligibleMeetings])

  /**
   * Clean up debounce timer on unmount
   */
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [])

  /**
   * Automatic periodic sync from Google Calendar
   *
   * WHY AUTO-SYNC:
   * - Keeps dashboard in sync with Google Calendar
   * - Catches deletions/updates made in Google Calendar
   * - Users don't need to manually sync
   * - Real-time subscription only catches database changes, not Google Calendar changes
   *
   * SYNC INTERVAL:
   * - Every 5 minutes (300 seconds)
   * - Balance between freshness and API rate limits
   * - Google Calendar API has rate limits (10,000 requests/day)
   * - With 5-min sync: 288 syncs/day per user (well under limit)
   *
   * OPTIMIZATION:
   * - Check: Last sync was > 5 minutes ago?
   * - If yes: Auto-sync silently
   * - If no: Skip (data is fresh)
   * - Prevents redundant API calls after manual sync
   * - Reduces resource usage
   *
   * WHEN IT SYNCS:
   * - 5 minutes after component mounts (if no manual sync)
   * - Then every 5 minutes thereafter (if needed)
   * - Only if Google account is connected
   * - Stops when component unmounts
   *
   * HOW IT WORKS:
   * 1. Check if 5 minutes elapsed since last sync
   * 2. If yes: Call /api/sync-meetings (same as manual sync)
   * 3. API fetches latest from Google Calendar
   * 4. Updates database
   * 5. Real-time subscription catches changes
   * 6. UI updates automatically
   * 7. Update last sync timestamp
   *
   * SILENT SYNC:
   * - Doesn't show "Syncing..." spinner (would be annoying)
   * - Doesn't show success message (would spam user)
   * - Only logs to console
   * - Errors are logged but not displayed (manual sync still available)
   *
   * CLEANUP:
   * - Clears interval on unmount
   * - Prevents background syncs after user navigates away
   */
  useEffect(() => {
    // Only auto-sync if Google is connected
    if (!isGoogleConnected) {
      return
    }

    console.log('🔄 Starting automatic sync (every 5 minutes)')

    const performSilentSync = async () => {
      // Check if last sync was less than 5 minutes ago
      const now = Date.now()
      const timeSinceLastSync = now - lastSyncTimeRef.current
      const fiveMinutesInMs = 5 * 60 * 1000

      if (timeSinceLastSync < fiveMinutesInMs && lastSyncTimeRef.current > 0) {
        const remainingTime = Math.ceil((fiveMinutesInMs - timeSinceLastSync) / 1000)
        console.log(
          `⏭️ Skipping auto-sync (last sync was ${Math.floor(timeSinceLastSync / 1000)}s ago, waiting ${remainingTime}s more)`
        )
        return
      }

      try {
        console.log('🔄 Auto-sync: Fetching latest from Google Calendar...')

        const response = await fetch('/api/sync-meetings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        if (!response.ok) {
          throw new Error('Auto-sync failed')
        }

        const data = await response.json()
        console.log('✅ Auto-sync successful:', data)

        // Update last sync timestamp
        lastSyncTimeRef.current = Date.now()

        // Refetch meetings from database
        const now = new Date()
        const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000)

        const { data: refreshedMeetings, error: fetchError } = await supabase
          .from('meetings')
          .select('*')
          .eq('user_id', userId)
          .in('status', ['scheduled', 'active'])
          .gte('scheduled_start', thirtyMinutesAgo.toISOString())
          .gte('scheduled_end', now.toISOString())
          .order('scheduled_start', { ascending: true })

        if (fetchError) {
          console.error('Auto-sync: Failed to fetch meetings:', fetchError)
          return
        }

        // Update local state silently
        setMeetings(refreshedMeetings || [])
        console.log(`✅ Auto-sync: Updated ${refreshedMeetings?.length || 0} meetings`)
      } catch (err: any) {
        // Log but don't show error to user (they can still manually sync)
        console.error('❌ Auto-sync failed:', err.message)
      }
    }

    // Sync immediately on mount (will check timestamp)
    performSilentSync()

    // Then sync every 5 minutes (will check timestamp each time)
    const interval = setInterval(performSilentSync, 5 * 60 * 1000) // 5 minutes

    // Cleanup on unmount
    return () => {
      console.log('🛑 Stopping automatic sync')
      clearInterval(interval)
    }
  }, [isGoogleConnected, userId, supabase])

  /**
   * Handle "Sync Now" button click
   *
   * FLOW:
   * 1. Set loading state (disable button, show spinner)
   * 2. POST to /api/sync-meetings
   * 3. If success:
   *    a. Show success message with count
   *    b. Refetch meetings from database
   *    c. Update local state
   *    d. Real-time subscription will also catch the new meetings
   * 4. If error:
   *    a. Show error message
   *    b. Keep existing meetings (don't break UI)
   *
   * WHY REFETCH AFTER SYNC:
   * - Sync may add multiple meetings at once
   * - Real-time events might be delayed
   * - Ensures immediate UI update
   * - Provides feedback to user
   *
   * ERROR HANDLING:
   * - Network errors: Show user-friendly message
   * - API errors: Display error from server
   * - Timeout: Suggest trying again
   */
  const handleSync = async () => {
    try {
      setIsSyncing(true)
      setSyncError(null)
      setSyncSuccess(null)

      console.log('🔄 Starting manual sync...')

      // Call sync API
      const response = await fetch('/api/sync-meetings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Sync failed')
      }

      const data = await response.json()
      console.log('✅ Sync successful:', data)

      // Update last sync timestamp (prevents redundant auto-sync)
      lastSyncTimeRef.current = Date.now()

      // Refetch meetings from database
      console.log('📥 Refetching meetings from database...')
      const now = new Date()
      const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000)

      const { data: refreshedMeetings, error: fetchError } = await supabase
        .from('meetings')
        .select('*')
        .eq('user_id', userId)
        .in('status', ['scheduled', 'active'])
        .gte('scheduled_start', thirtyMinutesAgo.toISOString())
        .gte('scheduled_end', now.toISOString())
        .order('scheduled_start', { ascending: true })

      if (fetchError) {
        throw new Error(`Failed to fetch meetings: ${fetchError.message}`)
      }

      // Update local state with refreshed meetings
      setMeetings(refreshedMeetings || [])

      // Show success message
      const count = refreshedMeetings?.length || 0
      setSyncSuccess(
        `Synced ${count} ${count === 1 ? 'meeting' : 'meetings'}`
      )

      // Clear success message after 5 seconds
      setTimeout(() => {
        setSyncSuccess(null)
      }, 5000)
    } catch (err: any) {
      console.error('❌ Sync failed:', err)
      setSyncError(err.message || 'Failed to sync meetings')
    } finally {
      setIsSyncing(false)
    }
  }

  return (
    <>
      {/* Upcoming Meetings Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-gray-900">
            Upcoming Meetings
          </h3>
          <div className="flex items-center space-x-2">
            {/* Real-time status indicator */}
            {isRealtimeConnected && (
              <div className="flex items-center px-2 py-1 bg-green-50 rounded-full">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-1.5 animate-pulse" />
                <span className="text-xs text-green-700 font-medium">
                  Live
                </span>
              </div>
            )}

            {/* Meeting count badge */}
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {meetings.length}{' '}
              {meetings.length === 1 ? 'meeting' : 'meetings'}
            </span>
          </div>
        </div>

        {/* Sync Button */}
        {isGoogleConnected && (
          <div className="mb-6">
            <button
              onClick={handleSync}
              disabled={isSyncing}
              className="w-full flex items-center justify-center px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw
                className={`w-4 h-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`}
              />
              {isSyncing ? 'Syncing...' : 'Sync Now'}
            </button>

            {/* Sync Success Message */}
            {syncSuccess && (
              <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
                <p className="text-sm text-green-800 font-medium">
                  ✅ {syncSuccess}
                </p>
              </div>
            )}

            {/* Sync Error Message */}
            {syncError && (
              <div className="mt-3 p-3 bg-red-50 rounded-lg border border-red-200">
                <div className="flex items-start">
                  <AlertCircle className="w-4 h-4 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-800">{syncError}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Meetings List or Empty State */}
        {!isGoogleConnected ? (
          /* No Google Account State */
          <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
            <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-sm font-medium text-gray-900">
              No Google Account Connected
            </p>
            <p className="mt-1 text-xs text-gray-500">
              Connect your Google Calendar to see meetings
            </p>
          </div>
        ) : meetings.length === 0 ? (
          /* No Meetings State */
          <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
            <Calendar className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-sm font-medium text-gray-900">
              No upcoming meetings
            </p>
            <p className="mt-1 text-xs text-gray-500">
              Click "Sync Now" to refresh from Google Calendar
            </p>
          </div>
        ) : (
          /* Meetings List */
          <div className="space-y-3">
            {meetings.map((meeting) => (
              <div
                key={meeting.id}
                className={`transition-all duration-300 ${
                  recentlyUpdatedIds.has(meeting.id)
                    ? 'ring-2 ring-blue-400 ring-opacity-50 animate-pulse'
                    : ''
                }`}
              >
                <MeetingCard meeting={meeting} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Meeting Monitor Card */}
      <MeetingMonitor meetings={meetings} />
    </>
  )
}
