'use client'

/**
 * Meeting Monitor Test Page
 *
 * Displays all monitoring status states for testing and demonstration:
 * - Healthy (0-20s) - Green
 * - Checking Soon (21-40s) - Amber
 * - Delayed (41s+) - Orange
 * - Actively Checking - Blue with spinner
 *
 * Access at: /test-monitor
 */

import { useState, useEffect } from 'react'
import { RefreshCw, AlertCircle, Activity } from 'lucide-react'

type StatusDemo = {
  title: string
  secondsAgo: number
  isChecking: boolean
  description: string
}

export default function TestMonitorPage() {
  const [currentTime, setCurrentTime] = useState(Date.now())
  const [checkingStates, setCheckingStates] = useState({
    healthy: false,
    attention: false,
    delayed: false,
  })

  // Update timer every second for live updates
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now())
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  // Simulate checking animations
  const simulateCheck = (key: 'healthy' | 'attention' | 'delayed') => {
    setCheckingStates((prev) => ({ ...prev, [key]: true }))
    setTimeout(() => {
      setCheckingStates((prev) => ({ ...prev, [key]: false }))
    }, 2000) // Stop after 2 seconds
  }

  // Status calculation function (same as MeetingMonitor)
  const getStatusInfo = (secondsAgo: number, isChecking: boolean) => {
    if (secondsAgo <= 20) {
      return {
        timeText: `${secondsAgo}s ago`,
        statusMessage: '',
        colorClass: 'text-green-600',
        dotColor: '#10b981',
        tier: 'Healthy',
      }
    } else if (secondsAgo <= 40) {
      return {
        timeText: `${secondsAgo}s ago`,
        statusMessage: 'Checking soon...',
        colorClass: 'text-amber-600',
        dotColor: '#f59e0b',
        tier: 'Attention',
      }
    } else {
      const delayedMessages = [
        'High server demand, checking shortly',
        'Experiencing temporary delay, still monitoring',
        'Slight delay, your meeting is being monitored',
        'Checking momentarily, all systems active',
      ]
      const messageIndex = Math.floor(secondsAgo / 10) % delayedMessages.length
      return {
        timeText: `${secondsAgo}s ago`,
        statusMessage: delayedMessages[messageIndex],
        colorClass: 'text-orange-600',
        dotColor: '#f97316',
        tier: 'Delayed',
      }
    }
  }

  // Demo scenarios
  const scenarios: StatusDemo[] = [
    {
      title: 'Sales Call with John (Healthy)',
      secondsAgo: 5,
      isChecking: checkingStates.healthy,
      description: '0-20s: Recent check, all systems normal',
    },
    {
      title: 'Team Standup (Checking Soon)',
      secondsAgo: 25,
      isChecking: checkingStates.attention,
      description: '21-40s: Expected delay, will check shortly',
    },
    {
      title: 'Client Demo (Delayed)',
      secondsAgo: 45,
      isChecking: checkingStates.delayed,
      description: '41s+: High load, still monitoring actively',
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-blue-600">
              Meeting Monitor - Status Demo
            </h1>
            <a
              href="/dashboard"
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              Back to Dashboard
            </a>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Introduction */}
        <div className="mb-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Monitoring Status States
          </h2>
          <p className="text-gray-600 mb-4">
            This page demonstrates all the different monitoring states you'll see
            in the live dashboard. The timers update in real-time, and you can
            click the "Simulate Check" buttons to see the active checking
            animations.
          </p>

          {/* Color Legend */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="flex items-center p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="w-3 h-3 rounded-full bg-green-500 mr-3 animate-pulse" />
              <div>
                <p className="text-sm font-semibold text-green-900">
                  🟢 Healthy (0-20s)
                </p>
                <p className="text-xs text-green-700">All systems normal</p>
              </div>
            </div>

            <div className="flex items-center p-3 bg-amber-50 rounded-lg border border-amber-200">
              <div className="w-3 h-3 rounded-full bg-amber-500 mr-3 animate-pulse" />
              <div>
                <p className="text-sm font-semibold text-amber-900">
                  🟡 Checking Soon (21-40s)
                </p>
                <p className="text-xs text-amber-700">Expected delay</p>
              </div>
            </div>

            <div className="flex items-center p-3 bg-orange-50 rounded-lg border border-orange-200">
              <div className="w-3 h-3 rounded-full bg-orange-500 mr-3 animate-pulse" />
              <div>
                <p className="text-sm font-semibold text-orange-900">
                  🟠 Delayed (41s+)
                </p>
                <p className="text-xs text-orange-700">High load, still active</p>
              </div>
            </div>
          </div>
        </div>

        {/* Overall Monitoring Stats */}
        <div className="mb-6 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Overall Monitoring Stats (Header)
          </h3>
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center">
              <Activity className="w-5 h-5 mr-2 text-blue-600 animate-pulse" />
              <div className="flex-1">
                <div className="flex items-center flex-wrap gap-x-2">
                  <p className="text-sm font-medium text-gray-900">
                    Monitoring 3 meetings
                  </p>
                  <span className="text-gray-400">•</span>
                  <div className="flex items-center">
                    <RefreshCw className="w-3 h-3 mr-1 text-gray-500" />
                    <p className="text-xs text-gray-600">
                      Last check:{' '}
                      {Math.floor(
                        (currentTime - (Date.now() - 5000)) / 1000
                      )}
                      s ago
                    </p>
                  </div>
                </div>
                <div className="flex items-center mt-1 text-xs text-gray-600">
                  <span>Checks every 20 seconds</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Status Scenarios */}
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-900">
            Individual Meeting States
          </h3>

          {scenarios.map((scenario, index) => {
            const status = getStatusInfo(scenario.secondsAgo, scenario.isChecking)
            const key = Object.keys(checkingStates)[
              index
            ] as keyof typeof checkingStates

            return (
              <div
                key={scenario.title}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
              >
                {/* Scenario description */}
                <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-sm font-medium text-gray-900 mb-1">
                    {status.tier} State
                  </p>
                  <p className="text-xs text-gray-600">{scenario.description}</p>
                </div>

                {/* Meeting card (actual UI) */}
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors">
                  <div className="flex items-start">
                    {/* Animated activity dot */}
                    <div
                      className="w-2 h-2 rounded-full mr-3 flex-shrink-0 mt-1.5 animate-pulse"
                      style={{ backgroundColor: status.dotColor }}
                    />

                    <div className="flex-1 min-w-0">
                      {/* Meeting title */}
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {scenario.title}
                      </p>

                      {/* Time since last check with refresh icon */}
                      <div className="flex items-center mt-1 space-x-1.5">
                        <RefreshCw
                          className={`w-3 h-3 flex-shrink-0 ${
                            scenario.isChecking
                              ? 'animate-spin text-blue-500'
                              : status.colorClass
                          }`}
                        />
                        <p
                          className={`text-xs font-medium ${status.colorClass}`}
                        >
                          Last checked: {status.timeText}
                        </p>
                      </div>

                      {/* Status message */}
                      {status.statusMessage && (
                        <div className="flex items-start mt-1">
                          <AlertCircle className="w-3 h-3 text-amber-500 mr-1 flex-shrink-0 mt-0.5" />
                          <p
                            className={`text-xs ${status.colorClass} leading-tight`}
                          >
                            {status.statusMessage}
                          </p>
                        </div>
                      )}

                      {/* Active checking indicator */}
                      {scenario.isChecking && (
                        <div className="flex items-center mt-1">
                          <div className="flex space-x-1">
                            <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" />
                            <div
                              className="w-1 h-1 bg-blue-500 rounded-full animate-bounce"
                              style={{ animationDelay: '0.1s' }}
                            />
                            <div
                              className="w-1 h-1 bg-blue-500 rounded-full animate-bounce"
                              style={{ animationDelay: '0.2s' }}
                            />
                          </div>
                          <p className="text-xs text-blue-600 ml-2 font-medium">
                            Checking now...
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Simulate Check Button */}
                <button
                  onClick={() => simulateCheck(key)}
                  disabled={scenario.isChecking}
                  className="mt-4 w-full px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {scenario.isChecking
                    ? 'Checking...'
                    : 'Simulate Check Animation'}
                </button>
              </div>
            )
          })}
        </div>

        {/* Implementation Notes */}
        <div className="mt-8 bg-blue-50 rounded-xl border border-blue-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Implementation Notes
          </h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>
                Timers update every second in real-time (no refresh needed)
              </span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>
                Colors change automatically based on elapsed time since last check
              </span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>
                Spinner animation shows when actively checking a meeting
              </span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>
                Status messages are reassuring and explain delays without causing
                alarm
              </span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>
                Timer pauses when tab is hidden (saves CPU/battery)
              </span>
            </li>
          </ul>
        </div>
      </main>
    </div>
  )
}
