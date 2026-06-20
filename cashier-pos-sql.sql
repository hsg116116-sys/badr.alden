-- ════════════════════════════════════════════════════════════════
-- نظام إشعارات الطلبات الأونلاين — SQL آمن (يعمل حتى لو الجداول موجودة)
-- ضع هذا الكود في SQL Editor في مشروع Supabase الخاص بالكاشير
-- ════════════════════════════════════════════════════════════════

-- ── 1. تأكد من وجود عمود is_active في cashiers (إذا لم يكن موجوداً) ──
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cashiers' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE cashiers ADD COLUMN is_active BOOLEAN DEFAULT true;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cashiers' AND column_name = 'station'
  ) THEN
    ALTER TABLE cashiers ADD COLUMN station TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cashiers' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE cashiers ADD COLUMN created_at TIMESTAMPTZ DEFAULT now();
  END IF;
END $$;

-- ── 2. تحديث بيانات الكاشيرات ────────────────────────────────
-- إذا لم يكن هناك كاشير اسمه "اسلام"، أضفه
INSERT INTO cashiers (id, name, station, is_active)
VALUES (1, 'اسلام', 'كاشير ١', true)
ON CONFLICT (id) DO UPDATE SET name = 'اسلام', station = 'كاشير ١';

INSERT INTO cashiers (id, name, station, is_active)
VALUES (2, 'كاشير ٢', 'كاشير ٢', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO cashiers (id, name, station, is_active)
VALUES (3, 'كاشير ٣', 'كاشير ٣', true)
ON CONFLICT (id) DO NOTHING;

-- ── 3. جدول إشعارات الطلبات الأونلاين (جديد) ────────────────
CREATE TABLE IF NOT EXISTS online_order_notifications (
  id             SERIAL PRIMARY KEY,
  order_id       INTEGER     NOT NULL,
  customer_name  TEXT,
  customer_phone TEXT,
  address        TEXT,
  notes          TEXT,
  total          NUMERIC     NOT NULL DEFAULT 0,
  items          JSONB       NOT NULL DEFAULT '[]',
  status         TEXT        NOT NULL DEFAULT 'pending',
  cashier_id     INTEGER,
  accepted_by    TEXT,
  created_at     TIMESTAMPTZ DEFAULT now(),
  accepted_at    TIMESTAMPTZ
);

-- ── 4. فهارس للأداء ───────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_online_notif_status
  ON online_order_notifications(status);

CREATE INDEX IF NOT EXISTS idx_online_notif_created
  ON online_order_notifications(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_online_notif_cashier
  ON online_order_notifications(cashier_id);

-- ── 5. تفعيل Realtime ─────────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE online_order_notifications;
-- ملاحظة: إذا ظهر خطأ "already member" فهذا يعني أنه مفعّل مسبقاً وهذا جيد

-- ── 6. سياسات الأمان ──────────────────────────────────────────
ALTER TABLE online_order_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_notifications"   ON online_order_notifications;
DROP POLICY IF EXISTS "public_insert_notifications" ON online_order_notifications;
DROP POLICY IF EXISTS "public_update_notifications" ON online_order_notifications;

CREATE POLICY "public_read_notifications"
  ON online_order_notifications FOR SELECT USING (true);

CREATE POLICY "public_insert_notifications"
  ON online_order_notifications FOR INSERT WITH CHECK (true);

CREATE POLICY "public_update_notifications"
  ON online_order_notifications FOR UPDATE USING (true);

-- ════════════════════════════════════════════════════════════════
-- ✅ اكتمل — الجدول الوحيد الجديد هو online_order_notifications
-- ════════════════════════════════════════════════════════════════
