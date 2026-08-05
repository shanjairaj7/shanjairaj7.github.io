CREATE TABLE IF NOT EXISTS notification_log (
  notification_key TEXT PRIMARY KEY,
  visitor_id TEXT,
  event_type TEXT NOT NULL,
  status TEXT NOT NULL,
  attempted_at TEXT NOT NULL,
  sent_at TEXT,
  payload_json TEXT
);

CREATE INDEX IF NOT EXISTS notification_log_by_visitor
  ON notification_log(visitor_id, attempted_at DESC);
