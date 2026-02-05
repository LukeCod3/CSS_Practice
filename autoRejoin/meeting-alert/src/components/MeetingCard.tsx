/**
 * Meeting Card Client Component
 *
 * Displays a meeting with live status indicators and countdown timer
 *
 * STATUS LOGIC:
 * - Live Now: Meeting started and hasn't ended (green, pulsing)
 * - Starting Soon: Meeting starts within 15 minutes (yellow)
 * - Upcoming: Meeting starts later (blue)
 *
 * COUNTDOWN TIMER:
 * - Updates every second
 * - Shows "Starts in X minutes"
 * - Auto-updates without page refresh
 */

'use client'

import { useState, useEffect } from 'react'
import { Calendar, ExternalLink } from 'lucide-react'
import { format } from 'date-fns'

type MeetingStatus = 'live' | 'starting-soon' | 'upcoming'

interface MeetingCardProps {
  meeting: {
    id: string
    meeting_link: string
    title: string
    scheduled_start: string
    scheduled_end: string
    status: string
    attendees: Array<{ email: string; name?: string }>
  }
}

/**
 * Calculate meeting status based on current time
 */
function getMeetingStatus(
  scheduledStart: string,
  scheduledEnd: string
): MeetingStatus {
  const now = new Date()
  const start = new Date(scheduledStart)
  const end = new Date(scheduledEnd)

  // Live: Started but not ended
  if (now >= start && now < end) {
    return 'live'
  }

  // Starting Soon: Starts within 15 minutes
  const minutesUntilStart = (start.getTime() - now.getTime()) / (1000 * 60)
  if (minutesUntilStart > 0 && minutesUntilStart <= 15) {
    return 'starting-soon'
  }

  // Upcoming: Starts later
  return 'upcoming'
}

/**
 * Format time until meeting starts
 */
function getTimeUntilStart(scheduledStart: string): string {
  const now = new Date()
  const start = new Date(scheduledStart)
  const diffMs = start.getTime() - now.getTime()
  const diffMinutes = Math.floor(diffMs / (1000 * 60))

  if (diffMinutes <= 0) {
    return 'Starting now'
  } else if (diffMinutes === 1) {
    return 'Starts in 1 minute'
  } else if (diffMinutes < 60) {
    return `Starts in ${diffMinutes} minutes`
  } else {
    const hours = Math.floor(diffMinutes / 60)
    const minutes = diffMinutes % 60
    if (minutes === 0) {
      return `Starts in ${hours} ${hours === 1 ? 'hour' : 'hours'}`
    }
    return `Starts in ${hours}h ${minutes}m`
  }
}

/**
 * Format meeting time in user-friendly way
 */
function formatMeetingTime(scheduledStart: string): string {
  const date = new Date(scheduledStart)
  const now = new Date()

  // Check if today
  if (date.toDateString() === now.toDateString()) {
    return `Today at ${format(date, 'h:mm a')}`
  }

  // Check if tomorrow
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)
  if (date.toDateString() === tomorrow.toDateString()) {
    return `Tomorrow at ${format(date, 'h:mm a')}`
  }

  // Within 7 days: show day of week
  const daysUntil = Math.ceil(
    (date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  )
  if (daysUntil <= 7) {
    return `${format(date, 'EEEE')} at ${format(date, 'h:mm a')}`
  }

  // Future: show date
  return format(date, 'MMM d') + ` at ${format(date, 'h:mm a')}`
}

export default function MeetingCard({ meeting }: MeetingCardProps) {
  // State for dynamic updates
  const [meetingStatus, setMeetingStatus] = useState<MeetingStatus>(
    getMeetingStatus(meeting.scheduled_start, meeting.scheduled_end)
  )
  const [countdown, setCountdown] = useState<string>(
    getTimeUntilStart(meeting.scheduled_start)
  )

  // Update status and countdown every second
  useEffect(() => {
    const interval = setInterval(() => {
      setMeetingStatus(
        getMeetingStatus(meeting.scheduled_start, meeting.scheduled_end)
      )
      setCountdown(getTimeUntilStart(meeting.scheduled_start))
    }, 1000) // Update every second

    return () => clearInterval(interval)
  }, [meeting.scheduled_start, meeting.scheduled_end])

  // Status configuration
  const statusConfig = {
    live: {
      label: 'Live Now',
      emoji: '🟢',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      textColor: 'text-green-900',
      badgeColor: 'bg-green-100 text-green-800',
      buttonColor:
        'bg-green-600 hover:bg-green-700 text-white animate-pulse shadow-lg shadow-green-500/50',
      buttonText: 'Join Now',
    },
    'starting-soon': {
      label: 'Starting Soon',
      emoji: '🟡',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      textColor: 'text-yellow-900',
      badgeColor: 'bg-yellow-100 text-yellow-800',
      buttonColor: 'bg-blue-600 hover:bg-blue-700 text-white',
      buttonText: 'Join Meeting',
    },
    upcoming: {
      label: 'Upcoming',
      emoji: '🔵',
      bgColor: 'bg-white',
      borderColor: 'border-gray-200',
      textColor: 'text-gray-900',
      badgeColor: 'bg-gray-100 text-gray-800',
      buttonColor:
        'bg-gray-600 hover:bg-gray-700 text-white disabled:opacity-60',
      buttonText: 'Join Meeting',
    },
  }

  const config = statusConfig[meetingStatus]

  return (
    <div
      className={`p-4 border ${config.borderColor} ${config.bgColor} rounded-lg hover:shadow-md transition-all duration-200`}
    >
      {/* Status Badge */}
      <div className="flex items-center justify-between mb-3">
        <span
          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${config.badgeColor}`}
        >
          <span className="mr-1.5">{config.emoji}</span>
          {config.label}
        </span>

        {/* Google Meet Badge */}
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          <svg
            className="w-3 h-3 mr-1"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          </svg>
          Google Meet
        </span>
      </div>

      {/* Meeting Title */}
      <h4 className={`font-semibold ${config.textColor} mb-2 text-base`}>
        {meeting.title || 'Untitled Meeting'}
      </h4>

      {/* Time Display */}
      <div className="flex items-center text-sm text-gray-600 mb-2">
        <Calendar className="w-4 h-4 mr-2 flex-shrink-0" />
        <span>{formatMeetingTime(meeting.scheduled_start)}</span>
      </div>

      {/* Countdown (for live and starting soon) */}
      {(meetingStatus === 'live' || meetingStatus === 'starting-soon') && (
        <div
          className={`mb-3 px-3 py-2 rounded-lg text-sm font-medium ${
            meetingStatus === 'live'
              ? 'bg-green-100 text-green-800 border border-green-200'
              : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
          }`}
        >
          {meetingStatus === 'live' ? '⏱️ In progress' : `⏰ ${countdown}`}
        </div>
      )}

      {/* Attendees Count */}
      {meeting.attendees && meeting.attendees.length > 0 && (
        <p className="text-xs text-gray-500 mb-3">
          👥 {meeting.attendees.length}{' '}
          {meeting.attendees.length === 1 ? 'attendee' : 'attendees'}
        </p>
      )}

      {/* Join Meeting Button */}
      <a
        href={meeting.meeting_link}
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-flex items-center justify-center w-full px-4 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${config.buttonColor}`}
      >
        {config.buttonText}
        <ExternalLink className="w-4 h-4 ml-2" />
      </a>
    </div>
  )
}
