import NextAuth from 'next-auth'
import { authConfig } from '../config'

export const authOptions = authConfig

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST } 