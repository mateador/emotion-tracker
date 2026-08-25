import { Pool, neonConfig } from '@neondatabase/serverless'
import ws from 'ws'

// Explicit ws package rather than relying on Node's native WebSocket
// global (available in Node 22+, but not guaranteed on whatever Node
// version Render's runtime happens to be pinned to). This removes that
// ambiguity entirely.
neonConfig.webSocketConstructor = ws

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set')
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL })
