-- ============================================================
-- إصلاح RLS — محمصة بدر الدين
-- هذا التطبيق يستخدم Express Sessions وليس Supabase Auth
-- لذلك auth.uid() دائماً NULL ويجب فتح الوصول لكل الجداول
-- الأمان يُطبَّق بالكامل على مستوى Express Middleware
-- ============================================================
-- شغّل هذا الملف في: Supabase Dashboard → SQL Editor
-- ============================================================

DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN
        SELECT policyname, tablename
        FROM pg_policies
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol.policyname, pol.tablename);
    END LOOP;
END $$;

-- ============================================================
-- سياسات مفتوحة لجميع الجداول (USING true)
-- ============================================================

ALTER TABLE IF EXISTS users               ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS categories          ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS products            ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS orders              ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS order_items         ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS site_settings       ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS staff               ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS delivery_zones      ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS product_attributes  ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS coupons             ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS offers              ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS notifications       ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS payout_requests     ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS drivers             ENABLE ROW LEVEL SECURITY;

CREATE POLICY "open_all_users"           ON users           FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open_all_categories"      ON categories      FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open_all_products"        ON products        FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open_all_orders"          ON orders          FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open_all_order_items"     ON order_items     FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open_all_site_settings"   ON site_settings   FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open_all_staff"           ON staff           FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open_all_delivery_zones"  ON delivery_zones  FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open_all_attributes"      ON product_attributes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open_all_coupons"         ON coupons         FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open_all_offers"          ON offers          FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open_all_notifications"   ON notifications   FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open_all_payouts"         ON payout_requests FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open_all_drivers"         ON drivers         FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- ✅ تم الإصلاح — يجب إعادة تشغيل التطبيق بعد تشغيل هذا الملف
-- ============================================================
