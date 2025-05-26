import { google } from 'googleapis'
import { getServerSession } from 'next-auth'
import { authConfig } from '../auth/config'
import { headers } from 'next/headers'


export async function POST(req) {
  try {
    // Get the session using the auth config
    const session = await getServerSession(authConfig)
    console.log('Session in API route:', session)
    
    if (!session?.user) {
      console.log('No session user found')
      return new Response(JSON.stringify({ error: 'Unauthorized - No session' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const { summary, startTime, duration = 60 } = await req.json()

    // Get a fresh token using the refresh token
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.NEXTAUTH_URL}/api/auth/callback/google`  // Add the callback URL
    )

    if (!session.accessToken) {
      return new Response(JSON.stringify({ error: 'No access token available' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    oauth2Client.setCredentials({
      access_token: session.accessToken,
      refresh_token: session.refreshToken
    })

    const calendar = google.calendar({
      version: 'v3',
      auth: oauth2Client
    })

    const event = {
      summary: summary || 'Google Meet Meeting',
      start: {
        dateTime: startTime || new Date().toISOString(),
        timeZone: 'UTC',
      },
      end: {
        dateTime: startTime 
          ? new Date(new Date(startTime).getTime() + duration * 60000).toISOString()
          : new Date(Date.now() + duration * 60000).toISOString(),
        timeZone: 'UTC',
      },
      conferenceData: {
        createRequest: {
          requestId: Date.now().toString(),
          conferenceSolutionKey: { type: 'hangoutsMeet' },
        },
      },
    }

    const response = await calendar.events.insert({
      calendarId: 'primary',
      conferenceDataVersion: 1,
      resource: event,
    })

    return new Response(JSON.stringify({
      meetingLink: response.data.conferenceData?.entryPoints?.[0]?.uri,
      meetingId: response.data.conferenceData?.conferenceId,
      eventId: response.data.id,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error creating meeting:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
} 