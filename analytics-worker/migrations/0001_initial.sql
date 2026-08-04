CREATE TABLE IF NOT EXISTS visitors (
  visitor_id TEXT PRIMARY KEY,
  first_seen_at TEXT NOT NULL,
  last_seen_at TEXT NOT NULL,
  first_landing_path TEXT,
  first_referrer TEXT,
  campaign_json TEXT,
  locale TEXT,
  timezone TEXT,
  device_type TEXT
);

CREATE TABLE IF NOT EXISTS sessions (
  session_id TEXT PRIMARY KEY,
  visitor_id TEXT NOT NULL,
  started_at TEXT NOT NULL,
  ended_at TEXT,
  landing_path TEXT,
  referrer TEXT,
  campaign_json TEXT,
  FOREIGN KEY (visitor_id) REFERENCES visitors(visitor_id)
);

CREATE INDEX IF NOT EXISTS sessions_by_visitor_started
  ON sessions(visitor_id, started_at DESC);

CREATE TABLE IF NOT EXISTS journey_events (
  event_id TEXT PRIMARY KEY,
  visitor_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  occurred_at TEXT NOT NULL,
  path TEXT,
  section_id TEXT,
  payload_json TEXT,
  FOREIGN KEY (visitor_id) REFERENCES visitors(visitor_id),
  FOREIGN KEY (session_id) REFERENCES sessions(session_id)
);

CREATE INDEX IF NOT EXISTS journey_events_by_session_time
  ON journey_events(session_id, occurred_at);
CREATE INDEX IF NOT EXISTS journey_events_by_type_time
  ON journey_events(event_type, occurred_at DESC);

CREATE TABLE IF NOT EXISTS lead_drafts (
  visitor_id TEXT PRIMARY KEY,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  profession TEXT,
  consent_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  registration_submitted_at TEXT,
  checkout_viewed_at TEXT,
  FOREIGN KEY (visitor_id) REFERENCES visitors(visitor_id)
);

CREATE INDEX IF NOT EXISTS lead_drafts_updated
  ON lead_drafts(updated_at DESC);

CREATE TABLE IF NOT EXISTS paddle_orders (
  transaction_id TEXT PRIMARY KEY,
  visitor_id TEXT,
  customer_email TEXT,
  status TEXT NOT NULL,
  amount TEXT,
  currency_code TEXT,
  completed_at TEXT,
  received_at TEXT NOT NULL,
  order_json TEXT NOT NULL,
  FOREIGN KEY (visitor_id) REFERENCES visitors(visitor_id)
);

CREATE INDEX IF NOT EXISTS paddle_orders_completed
  ON paddle_orders(completed_at DESC);
