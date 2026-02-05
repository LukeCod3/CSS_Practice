'use client'

import { useState, useEffect } from 'react'
import { sendBrowserNotification } from '@/lib/notifications/browser'

interface Meeting {
  id: string
  meeting_id: string
  meeting_link: string
  title: string
  scheduled_start: string
  scheduled_end: string
  status: string
}

interface CheckResult {
  shouldNotify: boolean
  reason?: string
  notification?: {
    title: string
    body: string
    meetingLink: string
  }
  participantCount?: number
  emailSent?: boolean
  logged?: boolean
}

export default function TestCheckMeetingPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [loading, setLoading] = useState(true)
  const [checking, setChecking] = useState<string | null>(null)
  const [results, setResults] = useState<Record<string, CheckResult>>({})
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    fetchMeetings()
  }, [])

  const fetchMeetings = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/meetings')
      if (response.ok) {
        const data = await response.json()
        setMeetings(data.meetings || [])
      } else {
        console.error('Failed to fetch meetings:', response.statusText)
      }
    } catch (error) {
      console.error('Error fetching meetings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCheckMeeting = async (meetingId: string) => {
    setChecking(meetingId)
    setResults((prev) => ({ ...prev, [meetingId]: undefined as any }))

    try {
      console.log(`🔍 Checking meeting ${meetingId}...`)

      const response = await fetch('/api/check-meeting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meetingId }),
      })

      const data: CheckResult = await response.json()

      console.log('📊 Check result:', data)

      // Save result
      setResults((prev) => ({ ...prev, [meetingId]: data }))

      // If we should notify, show browser notification
      if (data.shouldNotify && data.notification) {
        console.log('🔔 Showing browser notification...')

        const notification = await sendBrowserNotification({
          title: data.notification.title,
          body: data.notification.body,
          meetingLink: data.notification.meetingLink,
          tag: `meeting-${meetingId}`,
        })

        if (notification) {
          console.log('✅ Browser notification shown successfully')
        } else {
          console.warn('❌ Failed to show browser notification')
        }
      }
    } catch (error: any) {
      console.error('Error checking meeting:', error)
      setResults((prev) => ({
        ...prev,
        [meetingId]: {
          shouldNotify: false,
          reason: `Error: ${error.message}`,
        },
      }))
    } finally {
      setChecking(null)
    }
  }

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center text-gray-500">Loading...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h1 className="text-2xl font-bold mb-2">Test Meeting Check</h1>
          <p className="text-sm text-gray-600">
            Test the smart polling endpoint by checking your meetings for new
            participants.
          </p>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 rounded-lg border border-blue-200 p-4 mb-6">
          <h2 className="text-sm font-semibold text-blue-900 mb-2">
            How It Works
          </h2>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>
              • Click "Check Meeting" to simulate checking for new participants
            </li>
            <li>
              • First check on an active meeting: You'll get email + browser
              notification
            </li>
            <li>• Subsequent checks: Rate limited (once per 10 seconds)</li>
            <li>
              • Meeting must have started and be within last 30 minutes to
              notify
            </li>
          </ul>
        </div>

        {/* Refresh button */}
        <div className="mb-4">
          <button
            onClick={fetchMeetings}
            disabled={loading}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {loading ? 'Refreshing...' : 'Refresh Meetings'}
          </button>
        </div>

        {/* Meetings List */}
        {loading ? (
          <div className="text-center py-8 text-gray-500">
            Loading meetings...
          </div>
        ) : meetings.length === 0 ? (
          <div className="bg-yellow-50 rounded-lg border border-yellow-200 p-6">
            <p className="text-sm text-yellow-800">
              No meetings found. Go to your{' '}
              <a href="/dashboard" className="underline font-medium">
                dashboard
              </a>{' '}
              and sync your Google Calendar to create meetings.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {meetings.map((meeting) => {
              const result = results[meeting.id]
              const isChecking = checking === meeting.id
              const scheduledStart = new Date(meeting.scheduled_start)
              const now = new Date()
              const isActive =
                scheduledStart <= now &&
                scheduledStart >= new Date(now.getTime() - 30 * 60 * 1000)

              return (
                <div
                  key={meeting.id}
                  className="bg-white rounded-lg border border-gray-200 p-4"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">
                        {meeting.title || 'Untitled Meeting'}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {scheduledStart.toLocaleString()}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            meeting.status === 'active'
                              ? 'bg-green-50 text-green-700'
                              : meeting.status === 'scheduled'
                                ? 'bg-blue-50 text-blue-700'
                                : 'bg-gray-50 text-gray-700'
                          }`}
                        >
                          {meeting.status}
                        </span>
                        {isActive && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-50 text-orange-700">
                            Can notify
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => handleCheckMeeting(meeting.id)}
                      disabled={isChecking}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition text-sm font-medium"
                    >
                      {isChecking ? 'Checking...' : 'Check Meeting'}
                    </button>
                  </div>

                  {/* Result */}
                  {result && (
                    <div
                      className={`mt-3 p-3 rounded-lg text-sm ${
                        result.shouldNotify
                          ? 'bg-green-50 border border-green-200'
                          : 'bg-gray-50 border border-gray-200'
                      }`}
                    >
                      <p
                        className={`font-medium ${
                          result.shouldNotify
                            ? 'text-green-900'
                            : 'text-gray-900'
                        }`}
                      >
                        {result.shouldNotify
                          ? '✅ Notification Sent!'
                          : '❌ No Notification'}
                      </p>
                      {result.reason && (
                        <p
                          className={`text-xs mt-1 ${
                            result.shouldNotify
                              ? 'text-green-700'
                              : 'text-gray-600'
                          }`}
                        >
                          {result.reason}
                        </p>
                      )}
                      {result.shouldNotify && (
                        <div className="mt-2 space-y-1">
                          {result.notification && (
                            <p className="text-xs text-green-700">
                              Browser: {result.notification.title}
                            </p>
                          )}
                          {result.emailSent && (
                            <p className="text-xs text-green-700">
                              ✓ Email sent
                            </p>
                          )}
                          {result.logged && (
                            <p className="text-xs text-green-700">
                              ✓ Logged to database
                            </p>
                          )}
                          {result.participantCount !== undefined && (
                            <p className="text-xs text-green-700">
                              Participant count: {result.participantCount}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Meeting details */}
                  <details className="mt-3">
                    <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                      Show details
                    </summary>
                    <div className="mt-2 text-xs text-gray-600 space-y-1 bg-gray-50 p-2 rounded">
                      <p>
                        <strong>ID:</strong> {meeting.id}
                      </p>
                      <p>
                        <strong>Meeting ID:</strong> {meeting.meeting_id}
                      </p>
                      <p>
                        <strong>Link:</strong>{' '}
                        <a
                          href={meeting.meeting_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {meeting.meeting_link}
                        </a>
                      </p>
                      <p>
                        <strong>End:</strong>{' '}
                        {new Date(meeting.scheduled_end).toLocaleString()}
                      </p>
                    </div>
                  </details>
                </div>
              )
            })}
          </div>
        )}

        {/* Back to dashboard */}
        <div className="mt-8 text-center">
          <a
            href="/dashboard"
            className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
          >
            ← Back to Dashboard
          </a>
        </div>
      </div>
    </div>
  )
}
