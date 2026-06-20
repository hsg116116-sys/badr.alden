-- ============================================================
--   محمصة بدر الدين — إعداد قاعدة البيانات الكامل
--   Badr Alden Roastery — Complete Database Setup
--   النسخة: 1.0  |  تاريخ: 2026
-- ============================================================
-- ⚠️  شغّل هذا الملف بالكامل في Supabase SQL Editor دفعة واحدة
-- ⚠️  سيمسح أي بيانات قديمة ويبدأ من الصفر
-- ============================================================


-- ============================================================
-- 0. تمكين الإضافات
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- ============================================================
-- 1. حذف الجداول القديمة (إن وجدت) بالترتيب الصحيح
-- ============================================================
DROP TABLE IF EXISTS order_items          CASCADE;
DROP TABLE IF EXISTS orders               CASCADE;
DROP TABLE IF EXISTS payout_requests      CASCADE;
DROP TABLE IF EXISTS butcher_inventory_logs CASCADE;
DROP TABLE IF EXISTS butcher_inventory    CASCADE;
DROP TABLE IF EXISTS staff                CASCADE;
DROP TABLE IF EXISTS notifications        CASCADE;
DROP TABLE IF EXISTS offers               CASCADE;
DROP TABLE IF EXISTS coupons              CASCADE;
DROP TABLE IF EXISTS product_attributes   CASCADE;
DROP TABLE IF EXISTS delivery_zones       CASCADE;
DROP TABLE IF EXISTS products             CASCADE;
DROP TABLE IF EXISTS categories           CASCADE;
DROP TABLE IF EXISTS site_settings        CASCADE;
DROP TABLE IF EXISTS users                CASCADE;
DROP VIEW  IF EXISTS reports_dashboard;


-- ============================================================
-- 2. جدول المستخدمين (users)
-- ============================================================
CREATE TABLE users (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username    TEXT UNIQUE NOT NULL,
    password    TEXT NOT NULL,
    email       TEXT NOT NULL,
    phone       TEXT NOT NULL DEFAULT '',
    address     TEXT,
    city        TEXT,
    district    TEXT,
    street      TEXT,
    building    TEXT,
    landmark    TEXT,
    gps_lat     REAL,
    gps_lng     REAL,
    avatar_url  TEXT,
    role        TEXT NOT NULL DEFAULT 'customer',
    is_admin    BOOLEAN NOT NULL DEFAULT false,
    is_banned   BOOLEAN NOT NULL DEFAULT false,
    wallet      REAL NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================================
-- 3. جدول الأقسام (categories)
-- ============================================================
CREATE TABLE categories (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    icon        TEXT NOT NULL DEFAULT '',
    image       TEXT,
    parent_id   TEXT,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================================
-- 4. جدول المنتجات (products)
-- ============================================================
CREATE TABLE products (
    id                         SERIAL PRIMARY KEY,
    name                       TEXT NOT NULL,
    category_id                TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    price                      REAL NOT NULL,
    unit                       TEXT NOT NULL,
    image                      TEXT NOT NULL DEFAULT '',
    description                TEXT NOT NULL DEFAULT '',
    badge                      TEXT,
    size                       TEXT,
    weight                     TEXT,
    is_featured                BOOLEAN DEFAULT false,
    is_active                  BOOLEAN DEFAULT true,
    image_object_position      TEXT DEFAULT 'object-center',
    stock_quantity             INTEGER DEFAULT 0,
    is_out_of_stock            BOOLEAN DEFAULT false,
    has_cutting                BOOLEAN DEFAULT false,
    has_packaging              BOOLEAN DEFAULT false,
    has_extras                 BOOLEAN DEFAULT false,
    allow_special_instructions BOOLEAN DEFAULT true,
    created_at                 TIMESTAMPTZ DEFAULT NOW(),
    updated_at                 TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================================
-- 5. مناطق التوصيل (delivery_zones)
-- ============================================================
CREATE TABLE delivery_zones (
    id          SERIAL PRIMARY KEY,
    name        TEXT NOT NULL,
    fee         REAL NOT NULL DEFAULT 0,
    min_order   REAL NOT NULL DEFAULT 0,
    is_active   BOOLEAN DEFAULT true,
    coordinates TEXT,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================================
-- 6. صفات المنتجات (product_attributes)
-- ============================================================
CREATE TABLE product_attributes (
    id         SERIAL PRIMARY KEY,
    name       TEXT NOT NULL,
    type       TEXT NOT NULL,
    is_active  BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================================
-- 7. الكوبونات (coupons)
-- ============================================================
CREATE TABLE coupons (
    id              SERIAL PRIMARY KEY,
    code            TEXT NOT NULL UNIQUE,
    discount_type   TEXT NOT NULL DEFAULT 'percentage',
    discount_value  REAL NOT NULL,
    min_purchase    REAL DEFAULT 0,
    min_order_amount REAL DEFAULT 0,
    expiry_date     TEXT,
    is_active       BOOLEAN DEFAULT true,
    max_usage       INTEGER,
    used_count      INTEGER DEFAULT 0,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================================
-- 8. العروض (offers)
-- ============================================================
CREATE TABLE offers (
    id                  SERIAL PRIMARY KEY,
    title               TEXT NOT NULL,
    description         TEXT,
    discount_percentage INTEGER,
    image_url           TEXT,
    is_active           BOOLEAN DEFAULT true,
    start_date          TEXT,
    end_date            TEXT,
    created_at          TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================================
-- 9. الإشعارات (notifications)
-- ============================================================
CREATE TABLE notifications (
    id         SERIAL PRIMARY KEY,
    user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
    title      TEXT NOT NULL,
    message    TEXT NOT NULL,
    is_read    BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================================
-- 10. الموظفون (staff)
-- ============================================================
CREATE TABLE staff (
    id          SERIAL PRIMARY KEY,
    user_id     UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    role        TEXT NOT NULL DEFAULT 'support',
    salary      REAL DEFAULT 0,
    is_active   BOOLEAN DEFAULT true,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================================
-- 11. طلبات الصرف (payout_requests)
-- ============================================================
CREATE TABLE payout_requests (
    id          SERIAL PRIMARY KEY,
    staff_id    INTEGER REFERENCES staff(id) ON DELETE CASCADE,
    amount      REAL NOT NULL,
    status      TEXT NOT NULL DEFAULT 'pending',
    note        TEXT,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================================
-- 12. السائقون (drivers) — اختياري
-- ============================================================
CREATE TABLE drivers (
    id         SERIAL PRIMARY KEY,
    name       TEXT NOT NULL,
    phone      TEXT NOT NULL,
    is_active  BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================================
-- 13. الطلبات (orders)
-- ============================================================
CREATE TABLE orders (
    id              SERIAL PRIMARY KEY,
    user_id         UUID REFERENCES users(id) ON DELETE SET NULL,
    total           REAL NOT NULL,
    status          TEXT NOT NULL DEFAULT 'pending',
    address         TEXT NOT NULL DEFAULT '',
    customer_name   TEXT,
    customer_phone  TEXT,
    notes           TEXT,
    payment_method  TEXT DEFAULT 'cash',
    coupon_code     TEXT,
    discount        REAL DEFAULT 0,
    driver_id       INTEGER REFERENCES drivers(id) ON DELETE SET NULL,
    gps_lat         REAL,
    gps_lng         REAL,
    is_pickup       BOOLEAN DEFAULT false,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================================
-- 14. عناصر الطلبات (order_items)
-- ============================================================
CREATE TABLE order_items (
    id           SERIAL PRIMARY KEY,
    order_id     INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id   INTEGER REFERENCES products(id) ON DELETE SET NULL,
    product_name TEXT,
    quantity     INTEGER NOT NULL,
    price        REAL NOT NULL,
    cutting      TEXT,
    packaging    TEXT,
    notes        TEXT
);


-- ============================================================
-- 15. إعدادات الموقع (site_settings)
-- ============================================================
CREATE TABLE site_settings (
    key        TEXT PRIMARY KEY,
    value      TEXT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================================
-- 16. وظائف مساعدة (Helper Functions)
-- ============================================================

-- تحديث updated_at تلقائياً
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER trg_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER trg_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER trg_staff_updated_at
    BEFORE UPDATE ON staff
    FOR EACH ROW EXECUTE FUNCTION handle_updated_at();


-- تأكيد البريد تلقائياً عند التسجيل (حتى لا يحتاج المستخدم لتفعيل بريده)
CREATE OR REPLACE FUNCTION auto_confirm_user()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE auth.users
    SET email_confirmed_at = NOW()
    WHERE id = NEW.id AND email_confirmed_at IS NULL;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_auto_confirm ON auth.users;
CREATE TRIGGER trg_auto_confirm
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION auto_confirm_user();


-- ============================================================
-- 17. تفعيل RLS على كل الجداول
-- ============================================================
ALTER TABLE users               ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories          ENABLE ROW LEVEL SECURITY;
ALTER TABLE products            ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_zones      ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_attributes  ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons             ENABLE ROW LEVEL SECURITY;
ALTER TABLE offers              ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications       ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff               ENABLE ROW LEVEL SECURITY;
ALTER TABLE payout_requests     ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers             ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders              ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items         ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings       ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- 18. سياسات الأمان (RLS Policies)
-- ملاحظة: هذا التطبيق يستخدم Express Sessions وليس Supabase Auth
-- لذلك auth.uid() دائماً NULL — الأمان يُطبَّق على مستوى Express
-- ============================================================

CREATE POLICY "open_access_users"           ON users           FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open_access_categories"      ON categories      FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open_access_products"        ON products        FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open_access_delivery_zones"  ON delivery_zones  FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open_access_attributes"      ON product_attributes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open_access_coupons"         ON coupons         FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open_access_offers"          ON offers          FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open_access_notifications"   ON notifications   FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open_access_staff"           ON staff           FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open_access_payouts"         ON payout_requests FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open_access_drivers"         ON drivers         FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "open_access_orders"         ON orders          FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open_access_order_items"    ON order_items     FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open_access_site_settings"  ON site_settings   FOR ALL USING (true) WITH CHECK (true);


-- ============================================================
-- 19. View: لوحة التقارير
-- ============================================================
CREATE OR REPLACE VIEW reports_dashboard AS
SELECT
    COUNT(id)             AS total_orders,
    SUM(total)            AS total_revenue,
    AVG(total)            AS average_order_value,
    (SELECT COUNT(*) FROM users)                                  AS total_customers,
    (SELECT COUNT(*) FROM products WHERE stock_quantity < 10)     AS low_stock_items,
    (SELECT COUNT(*) FROM orders WHERE status = 'pending')        AS pending_orders,
    (SELECT COUNT(*) FROM orders WHERE status = 'delivered')      AS delivered_orders
FROM orders;


-- ============================================================
-- 20. البيانات الأولية — الأقسام (15 قسم)
-- ============================================================
INSERT INTO categories (id, name, icon) VALUES
('chocolate',      'شوكولاتة مستوردة ومحلية',   '🍫'),
('nuts',           'مكسرات وبذور',               '🥜'),
('dates',          'تمور ومعمول',                '🌴'),
('soda',           'مشروبات غازية',              '🥤'),
('energy',         'مشروبات طاقة وعصائر',        '⚡'),
('jelly',          'جيلي وحلوى مطاطة',           '🍭'),
('biscuits',       'بسكويت وكوكيز',              '🍪'),
('toffee',         'حلوى وتوفي',                 '🍬'),
('candy',          'مصاصات وكاندي أطفال',        '🍡'),
('coffee',         'قهوة وشاي',                  '☕'),
('chips',          'مقرمشات وشيبس',              '🍿'),
('eastern_sweets', 'حلوى شرقية ونوجا',           '🎂'),
('water',          'مياه معدنية',                '💧'),
('dried_fruits',   'فواكه مجففة وتين',           '🍇'),
('toys',           'ألعاب وهدايا أطفال',         '🎁')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, icon = EXCLUDED.icon;


-- ============================================================
-- 21. البيانات الأولية — المنتجات (38 منتج)
-- ============================================================

-- 🍫 شوكولاتة
INSERT INTO products (name, category_id, price, unit, image, description, badge, weight, is_featured, is_active, stock_quantity, has_cutting, has_packaging, has_extras, allow_special_instructions) VALUES
('ميلكا كاملة',        'chocolate', 12,  'قطعة', '/images/products/milka.png',    'شوكولاتة ميلكا الكلاسيكية بالحليب الكامل الدسم، مستوردة.',              'مستورد', '100غ',  true,  true, 200, false, false, false, false),
('كيت كات أصلي',       'chocolate',  5,  'قطعة', '/images/products/kitkat.png',   'كيت كات بالشوكولاتة الكاملة والبسكويت المقرمش.',                        NULL,     '45غ',   false, true, 300, false, false, false, false),
('فيريرو روشيه',       'chocolate', 45,  'علبة', '/images/products/ferrero.png',  'فيريرو روشيه الفاخر، هدية مثالية في كل مناسبة.',                        'فاخر',   '200غ',  true,  true, 100, false, false, false, false),
('لينت ميلك',          'chocolate', 35,  'قطعة', '/images/products/lindt.png',    'شوكولاتة لينت السويسرية الناعمة بالحليب الكامل.',                       'سويسري', '100غ',  false, true, 150, false, false, false, false);

-- 🥜 مكسرات
INSERT INTO products (name, category_id, price, unit, image, description, badge, is_featured, is_active, stock_quantity, has_packaging, has_extras, allow_special_instructions) VALUES
('فستق حلبي محمص',   'nuts', 120, 'كيلو', '/images/products/pistachios.png', 'فستق حلبي سوري محمص طازج يومياً بدرجات تحميص مختلفة.', 'طازج',           true,  true, 50, true, true,  true),
('كاجو خام / محمص',  'nuts',  95, 'كيلو', '/images/products/cashew.png',     'كاجو أصلي فيتنامي، متاح خام أو محمص حسب رغبتك.',      'الأكثر مبيعاً',  true,  true, 80, true, true,  true),
('لوز مقشور محمص',   'nuts',  80, 'كيلو', '/images/products/almonds.png',    'لوز كاليفورني مقشور محمص بزيت الزيتون والملح الخشن.',  NULL,             false, true, 60, true, true,  true),
('ماكاديميا',         'nuts', 150, 'كيلو', '/images/products/macadamia.png',  'ماكاديميا أسترالية فاخرة، طعم زبداني رائع.',           'فاخر',           false, true, 30, true, false, true),
('بيكان',             'nuts', 110, 'كيلو', '/images/products/pecan.png',      'بيكان أمريكي منتقى، محمص بعناية.',                     NULL,             false, true, 40, true, false, true);

-- 🌴 تمور
INSERT INTO products (name, category_id, price, unit, image, description, badge, is_featured, is_active, stock_quantity, has_packaging, allow_special_instructions) VALUES
('تمر مجدول',  'dates', 90, 'كيلو', '/images/products/medjool.png', 'تمر مجدول أردني فاخر، كبير الحجم وطري القوام.',              'فاخر',  true,  true, 100, true,  false),
('معمول بتمر', 'dates', 60, 'كيلو', '/images/products/maamoul.png', 'معمول تقليدي محشو بعجوة التمر، مصنوع يدوياً.',               'منزلي', false, true,  50, false, false);

-- 🥤 مشروبات غازية
INSERT INTO products (name, category_id, price, unit, image, description, badge, weight, is_featured, is_active, stock_quantity) VALUES
('بيبسي',       'soda', 3, 'علبة', '/images/products/pepsi.png',    'بيبسي كولا الكلاسيكية المنعشة، 330 مل.',       NULL,      '330مل', false, true, 500),
('كوكاكولا',    'soda', 3, 'علبة', '/images/products/cocacola.png', 'كوكاكولا الأصلية المنعشة، 330 مل.',            NULL,      '330مل', false, true, 500),
('باربيكان تفاح','soda',7, 'علبة', '/images/products/barbican.png', 'باربيكان بنكهة التفاح، مشروب لذيذ بدون كحول.', 'مفضل',   '330مل', true,  true, 200);

-- ⚡ مشروبات طاقة
INSERT INTO products (name, category_id, price, unit, image, description, weight, is_featured, is_active, stock_quantity) VALUES
('ريد بول', 'energy', 10, 'علبة', '/images/products/redbull.png', 'ريد بول مشروب الطاقة الأصلي، 250 مل.', '250مل', false, true, 200),
('هايب',    'energy',  8, 'علبة', '/images/products/hype.png',    'مشروب الطاقة هايب، توليفة مميزة من الفيتامينات.', '250مل', false, true, 150);

-- 🍭 جيلي
INSERT INTO products (name, category_id, price, unit, image, description, badge, weight, is_featured, is_active, stock_quantity) VALUES
('هاريبو مكس', 'jelly', 15, 'كيس', '/images/products/haribo.png',      'هاريبو المجموعة المختلطة، مذاقات متنوعة للجميع.', 'الأكثر مبيعاً', '200غ', true,  true, 150),
('مارشميلو',   'jelly', 10, 'كيس', '/images/products/marshmallow.png', 'مارشميلو ناعم وخفيف، متوفر بألوان وأشكال متعددة.', NULL,            '150غ', false, true, 100);

-- 🍪 بسكويت
INSERT INTO products (name, category_id, price, unit, image, description, badge, weight, is_featured, is_active, stock_quantity) VALUES
('أوريو أصلي',   'biscuits',  8, 'علبة', '/images/products/oreo.png',    'بسكويت أوريو الكلاسيكي بالكريمة البيضاء.',          NULL,      '154غ', false, true, 300),
('لواكر فانيليا','biscuits', 12, 'علبة', '/images/products/loacker.png', 'لواكر الإيطالي بالوافل والفانيليا الكريمي.',          'إيطالي',  '175غ', false, true, 150),
('لوتس أصلي',    'biscuits', 18, 'علبة', '/images/products/lotus.png',   'بسكويت لوتس البلجيكي بنكهة الكراميل المميزة.',       'بلجيكي',  '250غ', true,  true, 200);

-- 🍬 توفي وحلوى
INSERT INTO products (name, category_id, price, unit, image, description, weight, is_featured, is_active, stock_quantity) VALUES
('منتوس فراولة',    'toffee',  4, 'لفافة', '/images/products/mentos.png',  'منتوس المنعش بنكهة الفراولة اللذيذة.', '37غ',  false, true, 400),
('ورثرز أوريجنال', 'toffee', 12, 'كيس',    '/images/products/werthers.png','حلوى ورثرز الكريمية ذات المذاق الراقي.', '120غ', false, true, 150);

-- 🍡 كاندي أطفال
INSERT INTO products (name, category_id, price, unit, image, description, weight, is_featured, is_active, stock_quantity) VALUES
('لولي بوب مكس', 'candy', 5, 'كيس', '/images/products/lollipop.png', 'مجموعة مصاصات ملونة بنكهات متعددة للأطفال.', '100غ', false, true, 300);

-- ☕ قهوة وشاي
INSERT INTO products (name, category_id, price, unit, image, description, badge, weight, is_featured, is_active, stock_quantity, has_packaging, has_extras, allow_special_instructions) VALUES
('نسكافيه كلاسيك', 'coffee', 45, 'علبة', '/images/products/nescafe.png',  'نسكافيه الكلاسيكي القهوة الفورية الأشهر عالمياً.', NULL,            '200غ', true,  true, 100, false, false, false),
('بن أبو عوف',     'coffee', 55, 'كيلو', '/images/products/abouauf.png',  'قهوة بن أبو عوف المحمصة، متوفر بدرجات طحن مختلفة.', 'الأكثر مبيعاً', NULL,  true,  true,  80, true,  true,  true),
('سحلب مكس',       'coffee', 30, 'علبة', '/images/products/sahlab.png',   'مشروب السحلب الدافئ بالقشدة والمكسرات.',           NULL,            '250غ', false, true,  60, false, false, false);

-- 🍿 مقرمشات
INSERT INTO products (name, category_id, price, unit, image, description, weight, is_featured, is_active, stock_quantity) VALUES
('برنجلز أصلي', 'chips', 15, 'علبة', '/images/products/pringles.png', 'برنجلز المقرمش الكلاسيكي، مذاق لا يُقاوم.', '165غ', false, true, 200),
('شيبسي ملح',   'chips',  5, 'كيس',  '/images/products/chipsy.png',   'شيبسي بالملح الكلاسيكي، مقرمش ولذيذ.',       '90غ',  false, true, 400);

-- 🎂 حلوى شرقية
INSERT INTO products (name, category_id, price, unit, image, description, badge, is_featured, is_active, stock_quantity) VALUES
('نوجا بالفستق', 'eastern_sweets', 50, 'كيلو', '/images/products/nougat.png',        'نوجا تركية فاخرة محشوة بالفستق الحلبي.',              'فاخر', true,  true, 40),
('ملبس لوز',     'eastern_sweets', 70, 'كيلو', '/images/products/sugared_almond.png', 'لوز ملبس بالسكر الناعم، هدية مناسبات مميزة.',         NULL,   false, true, 50);

-- 💧 مياه
INSERT INTO products (name, category_id, price, unit, image, description, weight, is_featured, is_active, stock_quantity) VALUES
('أكوا دلتا 1.5 لتر', 'water', 2, 'زجاجة', '/images/products/aquadelta.png',   'مياه أكوا دلتا المعدنية الطبيعية، 1.5 لتر.', '1.5 لتر', false, true, 500),
('نستله مياه',         'water', 2, 'زجاجة', '/images/products/nestle_water.png', 'مياه نستله المعدنية النقية، 1.5 لتر.',        '1.5 لتر', false, true, 500);

-- 🍇 فواكه مجففة
INSERT INTO products (name, category_id, price, unit, image, description, is_featured, is_active, stock_quantity) VALUES
('زبيب ذهبي',    'dried_fruits', 25, 'كيلو', '/images/products/raisins.png',       'زبيب ذهبي أفغاني فاخر، حلو الطعم غني بالحديد.',       false, true, 80),
('تين مجفف',     'dried_fruits', 40, 'كيلو', '/images/products/dried_figs.png',    'تين مجفف تركي طبيعي، غني بالألياف والمعادن.',          false, true, 60),
('مشمشية مجففة', 'dried_fruits', 35, 'كيلو', '/images/products/dried_apricot.png', 'مشمش تركي مجفف طبيعي دون مواد حافظة.',                 false, true, 50);

-- 🎁 ألعاب وهدايا
INSERT INTO products (name, category_id, price, unit, image, description, badge, weight, is_featured, is_active, stock_quantity, has_packaging, allow_special_instructions) VALUES
('بيضة كيندر سوربريز',         'toys',  10, 'قطعة', '/images/products/kinder_surprise.png', 'بيضة كيندر سوربريز بالشوكولاتة والمفاجأة الداخلية.',                      'للأطفال', '20غ', false, true, 200, false, false),
('هدية مكسرات وشوكولاتة',     'toys', 120, 'علبة', '/images/products/gift_box.png',         'علبة هدايا فاخرة تحتوي على تشكيلة من المكسرات والشوكولاتة.',             'هدية',    NULL,  true,  true,  30, true,  true);


-- ============================================================
-- 22. إعدادات الموقع (site_settings)
-- ============================================================
INSERT INTO site_settings (key, value) VALUES
('store_status',   '"open"'),
('store_name',     '"محمصة بدر الدين"'),
('working_hours',  '{"saturday":{"from":"08:00","to":"23:00","closed":false},"sunday":{"from":"08:00","to":"23:00","closed":false},"monday":{"from":"08:00","to":"23:00","closed":false},"tuesday":{"from":"08:00","to":"23:00","closed":false},"wednesday":{"from":"08:00","to":"23:00","closed":false},"thursday":{"from":"08:00","to":"23:00","closed":false},"friday":{"from":"13:00","to":"22:00","closed":false}}'),
('legal_terms',    '"شروط الاستخدام: يُعدّ استخدامك للموقع قبولاً تاماً لهذه الشروط. جميع الأسعار شاملة الضريبة. يحق للمتجر تعديل الأسعار دون إشعار مسبق."'),
('legal_privacy',  '"سياسة الخصوصية: نحن نحمي بياناتك الشخصية ولا نشاركها مع أطراف ثالثة. البيانات تُستخدم فقط لإتمام الطلبات والتواصل معك."'),
('legal_copyright', '"© 2026 محمصة بدر الدين. جميع الحقوق محفوظة."'),
('contact_details', '{"whatsapp":"201110085927","email":"info@badr-aldin.com","tax_number":"","store_name":"محمصة بدر الدين","instagram":"https://www.instagram.com/badr_alden_roastery","facebook":"https://www.facebook.com/share/16sijBdhH5/","tiktok":"https://www.tiktok.com/@badr.alden19"}'),
('maintenance_mode', 'false'),
('delivery_fee',   '10'),
('min_order',      '50')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();


-- ============================================================
-- 23. مناطق التوصيل الافتراضية
-- ============================================================
INSERT INTO delivery_zones (name, fee, min_order, is_active) VALUES
('منطقة أ — قريب',  10, 50,  true),
('منطقة ب — متوسط', 15, 80,  true),
('منطقة ج — بعيد',  25, 120, true)
ON CONFLICT DO NOTHING;


-- ============================================================
-- 24. كوبون ترحيبي افتراضي
-- ============================================================
INSERT INTO coupons (code, discount_type, discount_value, min_order_amount, max_usage, is_active) VALUES
('WELCOME10', 'percentage', 10, 50,  500, true),
('BADR20',    'fixed',      20, 100, 200, true)
ON CONFLICT (code) DO NOTHING;


-- ============================================================
-- 25. إنشاء مستخدم Admin (اختياري — غيّر البيانات)
-- ============================================================
-- لإنشاء أدمن: أنشئه أولاً من Supabase Dashboard > Auth > Users
-- ثم شغّل هذا السطر باستبدال البريد الإلكتروني:
--
-- UPDATE users SET is_admin = true, role = 'admin'
-- WHERE email = 'admin@badr-aldin.com';


-- ============================================================
-- ✅ تم الإعداد الكامل بنجاح!
-- محمصة بدر الدين جاهزة للعمل 🎉
-- ============================================================
