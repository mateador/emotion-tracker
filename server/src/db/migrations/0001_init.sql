-- Migration 0001: initial schema
-- Applied via src/db/migrate.ts, tracked in schema_migrations.

CREATE EXTENSION IF NOT EXISTS pgcrypto; -- for gen_random_uuid()

-- ============================================================
-- users
-- ============================================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    onesignal_player_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT users_email_unique UNIQUE (email)
);

CREATE UNIQUE INDEX idx_users_email ON users (email);

-- ============================================================
-- emotion_logs
-- ============================================================
-- emotion_type uses a CHECK constraint on TEXT rather than a native
-- Postgres ENUM -- adding a value to a CHECK constraint later is a simple
-- ALTER TABLE; adding a value to a Postgres ENUM type has more operational
-- friction (ALTER TYPE ... ADD VALUE can't run inside a transaction block
-- in older Postgres versions). Given "Big 5" is described as the current
-- product scope but not necessarily eternal, TEXT + CHECK is the lower-
-- friction choice for a value set that may grow.
CREATE TABLE emotion_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    emotion_type TEXT NOT NULL CHECK (
        emotion_type IN (
            'calm_content',
            'energized_focused',
            'anxious_overwhelmed',
            'frustrated_irritated',
            'sad_drained'
        )
    ),
    trigger_tags TEXT[] NOT NULL DEFAULT '{}',
    notes TEXT,
    logged_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_emotion_logs_user_id ON emotion_logs (user_id);
CREATE INDEX idx_emotion_logs_logged_at ON emotion_logs (logged_at);
-- Composite index for the common query shape: "this user's logs in this
-- date range", which both the dashboard (14-day view) and CSV export
-- (custom range) use as their primary access pattern.
CREATE INDEX idx_emotion_logs_user_logged_at ON emotion_logs (user_id, logged_at);
