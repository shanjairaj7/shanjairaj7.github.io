CREATE TABLE IF NOT EXISTS manual_reservations (
  visitor_id TEXT PRIMARY KEY,
  reservation_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  profession TEXT NOT NULL,
  selected_offer TEXT NOT NULL,
  listed_amount INTEGER NOT NULL,
  early_bird_discount INTEGER NOT NULL,
  amount_due INTEGER NOT NULL,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (visitor_id) REFERENCES visitors(visitor_id)
);

CREATE INDEX IF NOT EXISTS manual_reservations_updated
  ON manual_reservations(updated_at DESC);
