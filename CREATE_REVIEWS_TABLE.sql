-- =============================================
-- جدول تقييمات الطلبات - Order Reviews Table
-- =============================================
-- شغّل هذا الـ SQL في Supabase SQL Editor:
-- https://supabase.com/dashboard → SQL Editor

CREATE TABLE IF NOT EXISTS order_reviews (
  id          BIGSERIAL PRIMARY KEY,
  order_id    INTEGER     NOT NULL,
  user_id     UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  rating      SMALLINT    NOT NULL CHECK (rating >= 1 AND rating <= 5),
  tags        TEXT[]      NOT NULL DEFAULT ARRAY[]::TEXT[],
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- منع تقييم نفس الطلب مرتين
CREATE UNIQUE INDEX IF NOT EXISTS order_reviews_order_id_unique
  ON order_reviews(order_id);

-- فهرس للبحث السريع بالمستخدم
CREATE INDEX IF NOT EXISTS order_reviews_user_id_idx
  ON order_reviews(user_id);

-- تفعيل Row Level Security
ALTER TABLE order_reviews ENABLE ROW LEVEL SECURITY;

-- أي مستخدم يقدر يقرأ تقييماته
CREATE POLICY "users can read own reviews"
  ON order_reviews FOR SELECT
  USING (auth.uid() = user_id);

-- أي مستخدم يقدر يضيف تقييم
CREATE POLICY "users can insert reviews"
  ON order_reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- السيرفر (service role) يقدر يقرأ كل التقييمات
CREATE POLICY "service role full access"
  ON order_reviews FOR ALL
  USING (true)
  WITH CHECK (true);
