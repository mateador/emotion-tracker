/**
 * Migration runner. Not a full framework (Knex/Prisma Migrate/Drizzle Kit)
 * -- this schema is small and changes infrequently enough that a version-
 * table + numbered-files pattern is easier to reason about and debug than
 * a full migration framework's abstraction layer.
 *
 * Usage:
 *   npx tsx src/db/migrate.ts           -- applies any pending migrations
 *   npx tsx src/db/migrate.ts --status  -- shows applied vs. pending, no changes
 */
import 'dotenv/config'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { pool } from './pool.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const MIGRATIONS_DIR = path.join(__dirname, 'migrations')

const VERSION_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS schema_migrations (
    version TEXT PRIMARY KEY,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
`

async function getAppliedVersions(): Promise<Set<string>> {
  await pool.query(VERSION_TABLE_SQL)
  const result = await pool.query<{ version: string }>('SELECT version FROM schema_migrations')
  return new Set(result.rows.map((r) => r.version))
}

function getMigrationFiles(): string[] {
  if (!fs.existsSync(MIGRATIONS_DIR)) return []
  return fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort()
}

async function run() {
  const statusOnly = process.argv.includes('--status')
  const applied = await getAppliedVersions()
  const files = getMigrationFiles()

  if (files.length === 0) {
    console.log('No migration files found in', MIGRATIONS_DIR)
    return
  }

  const versionOf = (filename: string) => filename.replace(/\.sql$/, '')

  if (statusOnly) {
    for (const f of files) {
      const marker = applied.has(versionOf(f)) ? 'applied' : 'PENDING'
      console.log(`  [${marker}] ${versionOf(f)}`)
    }
    return
  }

  const pending = files.filter((f) => !applied.has(versionOf(f)))
  if (pending.length === 0) {
    console.log('Database is up to date. No pending migrations.')
    return
  }

  for (const f of pending) {
    console.log(`Applying ${versionOf(f)}...`)
    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, f), 'utf-8')
    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      await client.query(sql)
      await client.query('INSERT INTO schema_migrations (version) VALUES ($1)', [versionOf(f)])
      await client.query('COMMIT')
      console.log(`  -> applied ${versionOf(f)}`)
    } catch (err) {
      await client.query('ROLLBACK')
      throw err
    } finally {
      client.release()
    }
  }

  console.log(`Done. Applied ${pending.length} migration(s).`)
}

run()
  .then(() => pool.end())
  .catch((err) => {
    console.error(err)
    pool.end().finally(() => process.exit(1))
  })
