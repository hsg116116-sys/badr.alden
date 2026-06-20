-- Order Ratings System
-- Run this in your main Supabase SQL Editor

CREATE TABLE IF NOT EXISTS order_ratings (
  id          SERIAL PRIMARY KEY,
  order_id    INTEGER,
  pos_notif_id INTEGER,
  rating      INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  tags        JSONB DEFAULT '[]'::jsonb,
  note        TEXT,
  customer_phone TEXT,
  driver_name TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_ratings_order_id ON order_ratings(order_id);
CREATE INDEX IF NOT EXISTS idx_order_ratings_pos_notif_id ON order_ratings(pos_notif_id);

-- Allow anonymous insert and select (customers submit ratings without auth)
ALTER TABLE order_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert ratings"
  ON order_ratings FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can read ratings"
  ON order_ratings FOR SELECT TO anon, authenticated
  USING (true);
