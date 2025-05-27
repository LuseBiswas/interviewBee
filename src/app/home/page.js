'use client'

import { useSession, signIn, signOut } from 'next-auth/react'
import { useState, useEffect } from 'react'

export default function Home() {
  const { data: session, status } = useSession()
  const [scheduledMeeting, setScheduledMeeting] = useState(null)
  const [instantMeeting, setInstantMeeting] = useState(null)
  const [dateTime, setDateTime] = useState('')
  const [minDateTime, setMinDateTime] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  console.log('Client-side session:', session)
  console.log('Session status:', status)

  useEffect(() => {
    const now = new Date()
    // Add 5 minutes to current time to give buffer for meeting creation
    now.setMinutes(now.getMinutes() + 5)
    const localDateTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16)
    setMinDateTime(localDateTime)
    setDateTime(localDateTime) // Set default value to current time + 5 minutes
  }, [])

  const createInstantMeeting = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await fetch('/api/meetings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          summary: 'Instant Meeting',
        }),
        credentials: 'include',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create meeting')
      }

      const result = await response.json()
      setInstantMeeting({
        link: result.meetingLink,
        id: result.meetingId,
        createdAt: new Date().toLocaleString()
      })
    } catch (err) {
      setError('Failed to create meeting. Please try again.')
      console.error('Error creating instant meeting:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const createScheduledMeeting = async (e) => {
    e.preventDefault()
    
    // Additional validation for past dates
    const selectedDateTime = new Date(dateTime)
    const now = new Date()
    
    if (selectedDateTime <= now) {
      setError('Please select a future date and time for the meeting.')
      return
    }
    
    try {
      setIsLoading(true)
      setError(null)
      const response = await fetch('/api/meetings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          summary: 'Scheduled Meeting',
          startTime: new Date(dateTime).toISOString(),
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to schedule meeting')
      }

      const result = await response.json()
      setScheduledMeeting({
        link: result.meetingLink,
        id: result.meetingId,
        scheduledFor: new Date(dateTime).toLocaleString()
      })
    } catch (err) {
      setError('Failed to schedule meeting. Please try again.')
      console.error('Error scheduling meeting:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignIn = (e) => {
    e.preventDefault()
    signIn('google', { callbackUrl: '/home' })
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-xl">Loading...</div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-100">
        {/* Hero Section */}
        <div className="bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center">
              <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
                <span className="block">Welcome to</span>
                <span className="block text-blue-600">Meeting Scheduler</span>
              </h1>
              <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
                Create instant meetings or schedule them for later. Simple, fast, and efficient way to manage your Google Meet sessions.
              </p>
              <div className="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
                <div className="rounded-md shadow">
                  <button
                    onClick={handleSignIn}
                    className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 md:py-4 md:text-lg md:px-10"
                  >
                    Sign in with Google
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="py-12 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="lg:text-center">
              <h2 className="text-base text-blue-600 font-semibold tracking-wide uppercase">Features</h2>
              <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
                Everything you need for meetings
              </p>
            </div>

            <div className="mt-10">
              <div className="space-y-10 md:space-y-0 md:grid md:grid-cols-2 md:gap-x-8 md:gap-y-10">
                <div className="relative">
                  <div className="text-lg leading-6 font-medium text-gray-900">Instant Meetings</div>
                  <div className="mt-2 text-base text-gray-500">
                    Create instant Google Meet links with one click. Perfect for impromptu meetings.
                  </div>
                </div>

                <div className="relative">
                  <div className="text-lg leading-6 font-medium text-gray-900">Scheduled Meetings</div>
                  <div className="mt-2 text-base text-gray-500">
                    Plan ahead by scheduling meetings with specific dates and times.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        {error && (
          <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            {session?.user?.image && (
              <img
                src={session.user.image}
                alt={session.user.name || 'User'}
                className="w-10 h-10 rounded-full"
              />
            )}
            <span className="font-medium">{session?.user?.name}</span>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/home' })}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            Sign Out
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Instant Meeting Section */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold mb-4">Instant Meeting</h2>
            <button
              onClick={createInstantMeeting}
              disabled={isLoading}
              className={`w-full px-6 py-2 rounded ${
                isLoading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-green-500 hover:bg-green-600'
              } text-white`}
            >
              {isLoading ? 'Creating...' : 'Create Instant Meeting'}
            </button>
            {instantMeeting && (
              <div className="mt-4 p-4 bg-gray-50 rounded">
                <p className="font-medium">Meeting Link:</p>
                <a
                  href={instantMeeting.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline break-all"
                >
                  {instantMeeting.link}
                </a>
                <p className="mt-2 text-sm text-gray-600">
                  Created at: {instantMeeting.createdAt}
                </p>
              </div>
            )}
          </div>

          {/* Scheduled Meeting Section */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold mb-4">Schedule Meeting</h2>
            <form onSubmit={createScheduledMeeting}>
              <input
                type="datetime-local"
                value={dateTime}
                onChange={(e) => setDateTime(e.target.value)}
                className="w-full p-2 border rounded mb-4"
                required
                min={minDateTime}
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !dateTime || new Date(dateTime) <= new Date()}
                className={`w-full px-6 py-2 rounded ${
                  isLoading || !dateTime || new Date(dateTime) <= new Date()
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-500 hover:bg-blue-600'
                } text-white`}
              >
                {isLoading ? 'Scheduling...' : 'Schedule Meeting'}
              </button>
            </form>
            {scheduledMeeting && (
              <div className="mt-4 p-4 bg-gray-50 rounded">
                <p className="font-medium">Meeting Link:</p>
                <a
                  href={scheduledMeeting.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline break-all"
                >
                  {scheduledMeeting.link}
                </a>
                <p className="mt-2 text-sm text-gray-600">
                  Scheduled for: {scheduledMeeting.scheduledFor}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 