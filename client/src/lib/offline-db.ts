import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { EmotionType } from '../types/emotion'

interface QueuedLog {
  client_id: string
  emotion_type: EmotionType
  trigger_tags: string[]
  notes: string | null
  queued_at: string
  sync_error?: string
}

interface OfflineDB extends DBSchema {
  'pending-logs': {
    key: string // client_id
    value: QueuedLog
  }
}

const DB_NAME = 'emotion-tracker-offline'
const DB_VERSION = 1
const STORE = 'pending-logs'

let dbPromise: Promise<IDBPDatabase<OfflineDB>> | null = null

function getDb() {
  if (!dbPromise) {
    dbPromise = openDB<OfflineDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE, { keyPath: 'client_id' })
        }
      }
    })
  }
  return dbPromise
}

/**
 * Test-only. The module caches its DB connection promise at module scope
 * (correct and desirable in production -- there's only ever one real
 * IndexedDB), but that same caching means swapping in a fresh
 * fake-indexeddb instance between tests silently doesn't take effect
 * unless this is called to drop the stale cached connection first.
 */
export function __resetForTests() {
  dbPromise = null
}

export async function enqueueLog(
  log: Omit<QueuedLog, 'queued_at' | 'sync_error'>
): Promise<void> {
  const db = await getDb()
  await db.put(STORE, { ...log, queued_at: new Date().toISOString() })
}

export async function getQueuedLogs(): Promise<QueuedLog[]> {
  const db = await getDb()
  return db.getAll(STORE)
}

export async function removeQueuedLog(clientId: string): Promise<void> {
  const db = await getDb()
  await db.delete(STORE, clientId)
}

export async function markQueuedLogFailed(clientId: string, error: string): Promise<void> {
  const db = await getDb()
  const existing = await db.get(STORE, clientId)
  if (existing) {
    await db.put(STORE, { ...existing, sync_error: error })
  }
}

export type { QueuedLog }
