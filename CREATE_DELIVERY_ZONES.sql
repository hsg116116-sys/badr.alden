-- أنشئ جدول مناطق التوصيل
CREATE TABLE IF NOT EXISTS delivery_zones (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    fee REAL NOT NULL DEFAULT 0,
    driver_commission REAL DEFAULT 0,
    min_order REAL NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    coordinates TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- فعّل Row Level Security
ALTER TABLE delivery_zones ENABLE ROW LEVEL SECURITY;

-- سياسة: السماح لأي طلب بالقراءة والكتابة (السيرفر يتحقق من الصلاحيات)
DROP POLICY IF EXISTS "Allow all access for delivery_zones" ON delivery_zones;
CREATE POLICY "Allow all access for delivery_zones"
  ON delivery_zones FOR ALL
  USING (true)
  WITH CHECK (true);

-- أضف بعض المناطق كمثال (اختياري)
INSERT INTO delivery_zones (name, fee, driver_commission, min_order, is_active)
VALUES
  ('المعادي', 20, 10, 50, true),
  ('مدينة نصر', 25, 12, 50, true),
  ('الزمالك', 30, 15, 75, true)
ON CONFLICT DO NOTHING;
