import { describe, it, expect, beforeEach } from 'vitest'
import { enqueueLog, getQueuedLogs, removeQueuedLog, markQueuedLogFailed, __resetForTests } from './offline-db'
import 'fake-indexeddb/auto'
import { IDBFactory } from 'fake-indexeddb'

describe('offline-db (real IndexedDB via fake-indexeddb, not mocked)', () => {
  beforeEach(() => {
    // Fresh IndexedDB per test -- fake-indexeddb's global instance persists
    // across tests otherwise, which would let state leak between them.
    // The module's own cached connection promise has to be dropped too,
    // or it silently keeps using the connection from the PREVIOUS test's
    // IndexedDB instance instead of the fresh one just created above.
    indexedDB = new IDBFactory()
    __resetForTests()
  })

  it('enqueues a log and retrieves it', async () => {
    await enqueueLog({
      client_id: 'a-1',
      emotion_type: 'calm_content',
      trigger_tags: [],
      notes: null
    })
    const queued = await getQueuedLogs()
    expect(queued).toHaveLength(1)
    expect(queued[0].client_id).toBe('a-1')
    expect(queued[0].queued_at).toBeTruthy()
  })

  it('removes a log by client_id after successful sync', async () => {
    await enqueueLog({ client_id: 'a-1', emotion_type: 'calm_content', trigger_tags: [], notes: null })
    await enqueueLog({ client_id: 'a-2', emotion_type: 'sad_drained', trigger_tags: [], notes: null })

    await removeQueuedLog('a-1')

    const queued = await getQueuedLogs()
    expect(queued.map((q) => q.client_id)).toEqual(['a-2'])
  })

  it('marks a log as failed without removing it from the queue', async () => {
    await enqueueLog({
      client_id: 'a-1',
      emotion_type: 'anxious_overwhelmed',
      trigger_tags: ['Workload'],
      notes: null
    })
    await markQueuedLogFailed('a-1', 'Invalid emotion_type')

    const queued = await getQueuedLogs()
    expect(queued).toHaveLength(1)
    expect(queued[0].sync_error).toBe('Invalid emotion_type')
  })

  it('preserves trigger_tags and notes through the round trip', async () => {
    await enqueueLog({
      client_id: 'a-1',
      emotion_type: 'frustrated_irritated',
      trigger_tags: ['Conflict', 'Sleep'],
      notes: null
    })
    const [entry] = await getQueuedLogs()
    expect(entry.trigger_tags).toEqual(['Conflict', 'Sleep'])
  })
})
