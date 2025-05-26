'use client'

import { useSession, signIn, signOut } from 'next-auth/react'
import { useState, useEffect } from 'react'

export default function Home() {
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      signIn('google')
    },
  })
  const [scheduledMeeting, setScheduledMeeting] = useState(null)
  const [instantMeeting, setInstantMeeting] = useState(null)
  const [dateTime, setDateTime] = useState('')

  useEffect(() => {
    // Clear meetings when user signs out
    if (status === 'unauthenticated') {
      setScheduledMeeting(null)
      setInstantMeeting(null)
      setDateTime('')
    }
  }, [status])

  const generateMeetLink = () => {
    // In a real application, this would use the Google Calendar API
    const meetId = Math.random().toString(36).substring(2, 15)
    return `https://meet.google.com/${meetId}`
  }

  const createInstantMeeting = () => {
    const meetLink = generateMeetLink()
    setInstantMeeting({
      link: meetLink,
      createdAt: new Date().toLocaleString()
    })
  }

  const createScheduledMeeting = (e) => {
    e.preventDefault()
    const meetLink = generateMeetLink()
    setScheduledMeeting({
      link: meetLink,
      scheduledFor: new Date(dateTime).toLocaleString()
    })
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-xl">Loading...</div>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <h1 className="text-2xl font-bold mb-4">Welcome to Meeting Scheduler</h1>
          <p className="mb-4 text-gray-600">Sign in with Google to create and schedule meetings</p>
          <button
            onClick={() => signIn('google', { callbackUrl: '/home' })}
            className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
          >
            Sign in with Google
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
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
              className="bg-green-500 text-white px-6 py-2 rounded hover:bg-green-600 w-full"
            >
              Create Instant Meeting
            </button>
            {instantMeeting && (
              <div className="mt-4 p-4 bg-gray-50 rounded">
                <p className="font-medium">Meeting Link:</p>
                <a href={instantMeeting.link} target="_blank" rel="noopener noreferrer" 
                   className="text-blue-500 hover:underline break-all">
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
                min={new Date().toISOString().slice(0, 16)}
              />
              <button
                type="submit"
                className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 w-full"
              >
                Schedule Meeting
              </button>
            </form>
            {scheduledMeeting && (
              <div className="mt-4 p-4 bg-gray-50 rounded">
                <p className="font-medium">Meeting Link:</p>
                <a href={scheduledMeeting.link} target="_blank" rel="noopener noreferrer"
                   className="text-blue-500 hover:underline break-all">
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