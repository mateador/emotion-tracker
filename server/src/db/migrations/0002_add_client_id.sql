-- Migration 0002: idempotency support for offline-queued log sync.
--
-- Without this, retrying a sync request whose response was lost (a very
-- normal occurrence on the flaky mobile connections this offline queue
-- exists for) would create a duplicate emotion log. client_id is
-- generated on-device when a log is queued and stays attached to that
-- log through however many sync retries it takes -- the unique index
-- makes a retried insert a safe no-op instead of a duplicate row.

ALTER TABLE emotion_logs ADD COLUMN client_id UUID;

CREATE UNIQUE INDEX idx_emotion_logs_client_id
    ON emotion_logs (client_id) WHERE client_id IS NOT NULL;
