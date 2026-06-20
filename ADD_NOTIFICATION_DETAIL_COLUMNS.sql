-- ════════════════════════════════════════════════════════════════
-- إضافة أعمدة التفاصيل المالية لجدول online_order_notifications
-- ضع هذا الكود في SQL Editor في مشروع Supabase الخاص بالكاشير
-- ════════════════════════════════════════════════════════════════

DO $$
BEGIN
  -- subtotal (المجموع قبل التوصيل)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'online_order_notifications' AND column_name = 'subtotal'
  ) THEN
    ALTER TABLE online_order_notifications ADD COLUMN subtotal NUMERIC;
  END IF;

  -- delivery_fee (رسوم التوصيل)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'online_order_notifications' AND column_name = 'delivery_fee'
  ) THEN
    ALTER TABLE online_order_notifications ADD COLUMN delivery_fee NUMERIC;
  END IF;

  -- discount_amount (قيمة الخصم)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'online_order_notifications' AND column_name = 'discount_amount'
  ) THEN
    ALTER TABLE online_order_notifications ADD COLUMN discount_amount NUMERIC;
  END IF;

  -- coupon_code (كود الكوبون)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'online_order_notifications' AND column_name = 'coupon_code'
  ) THEN
    ALTER TABLE online_order_notifications ADD COLUMN coupon_code TEXT;
  END IF;

  -- payment_method (طريقة الدفع)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'online_order_notifications' AND column_name = 'payment_method'
  ) THEN
    ALTER TABLE online_order_notifications ADD COLUMN payment_method TEXT DEFAULT 'cash';
  END IF;
END $$;

-- ════════════════════════════════════════════════════════════════
-- ✅ اكتمل — الأعمدة الجديدة: subtotal, delivery_fee, discount_amount, coupon_code, payment_method
-- الآن items تحتوي أيضاً على: cutting, packaging, notes لكل منتج
-- ════════════════════════════════════════════════════════════════
