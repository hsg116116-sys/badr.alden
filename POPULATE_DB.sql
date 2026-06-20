-- ============================================
-- محمصة بدر الدين - Database Population Script
-- ============================================

-- Clean existing data
DELETE FROM public.order_items;
DELETE FROM public.orders;
DELETE FROM public.products;
DELETE FROM public.categories;

-- 1. Insert Categories (15 main categories)
INSERT INTO public.categories (id, name, icon, image) VALUES
('chocolate',      'شوكولاتة مستوردة ومحلية', '🍫', NULL),
('nuts',           'مكسرات وبذور',              '🥜', NULL),
('dates',          'تمور ومعمول',               '🌴', NULL),
('soda',           'مشروبات غازية',             '🥤', NULL),
('energy',         'مشروبات طاقة وعصائر',       '⚡', NULL),
('jelly',          'جيلي وحلوى مطاطة',          '🍭', NULL),
('biscuits',       'بسكويت وكوكيز',             '🍪', NULL),
('toffee',         'حلوى وتوفي',                '🍬', NULL),
('candy',          'مصاصات وكاندي أطفال',       '🍡', NULL),
('coffee',         'قهوة وشاي',                 '☕', NULL),
('chips',          'مقرمشات وشيبس',             '🍿', NULL),
('eastern_sweets', 'حلوى شرقية ونوجا',          '🎂', NULL),
('water',          'مياه معدنية',               '💧', NULL),
('dried_fruits',   'فواكه مجففة وتين',          '🍇', NULL),
('toys',           'ألعاب وهدايا أطفال',        '🎁', NULL);

-- 2. Insert Products

-- === Chocolate ===
INSERT INTO public.products (name, category_id, price, unit, image, description, badge, weight, is_featured, stock_quantity) VALUES
('ميلكا كاملة',       'chocolate', 12,  'قطعة', '/images/products/milka.png',    'شوكولاتة ميلكا الكلاسيكية بالحليب، مستوردة.',         'مستورد',         '100غ', true,  200),
('كيت كات أصلي',      'chocolate', 5,   'قطعة', '/images/products/kitkat.png',   'كيت كات بالشوكولاتة والبسكويت المقرمش.',              NULL,             '45غ',  false, 300),
('فيريرو روشيه',      'chocolate', 45,  'علبة', '/images/products/ferrero.png',  'فيريرو روشيه الفاخر، هدية مثالية في كل مناسبة.',      'فاخر',           '200غ', true,  100),
('جالاكسي حليب',      'chocolate', 10,  'قطعة', '/images/products/galaxy.png',   'جالاكسي ناعم بالحليب الكامل.',                        NULL,             '100غ', false, 200),
('لينت ميلك',         'chocolate', 35,  'قطعة', '/images/products/lindt.png',    'شوكولاتة لينت السويسرية الناعمة.',                    'سويسري',         '100غ', false, 150),
('ريتر سبورت',        'chocolate', 14,  'قطعة', '/images/products/ritter.png',   'ريتر سبورت الألمانية بنكهات متعددة.',                 NULL,             '100غ', false, 180),
('مارس',              'chocolate', 6,   'قطعة', '/images/products/mars.png',     'مارس بالكراميل والشوكولاتة.',                         NULL,             '51غ',  false, 250),
('سنيكرز',            'chocolate', 6,   'قطعة', '/images/products/snickers.png', 'سنيكرز بالفول السوداني والكراميل.',                   NULL,             '50غ',  false, 250);

-- === Nuts & Seeds ===
INSERT INTO public.products (name, category_id, price, unit, image, description, badge, is_featured, stock_quantity, has_packaging, has_extras, allow_special_instructions) VALUES
('فستق حلبي محمص',   'nuts', 120, 'كيلو', '/images/products/pistachios.png', 'فستق حلبي سوري محمص طازج يومياً.',       'طازج',           true,  50,  true, true, true),
('كاجو محمص',        'nuts', 95,  'كيلو', '/images/products/cashew.png',     'كاجو فيتنامي محمص طازج أو خام.',         'الأكثر مبيعاً',  true,  80,  true, true, true),
('لوز مقشور محمص',   'nuts', 80,  'كيلو', '/images/products/almonds.png',    'لوز كاليفورني مقشور محمص.',               NULL,             false, 60,  true, true, true),
('ماكاديميا',        'nuts', 150, 'كيلو', '/images/products/macadamia.png',   'ماكاديميا أسترالية فاخرة.',               'فاخر',           false, 30,  true, false, true),
('بيكان',            'nuts', 110, 'كيلو', '/images/products/pecan.png',       'بيكان أمريكي منتقى محمص بعناية.',        NULL,             false, 40,  true, false, true),
('سوداني محمص',      'nuts', 25,  'كيلو', '/images/products/peanuts.png',     'سوداني محمص بالملح أو بدون.',            NULL,             false, 100, true, true, true),
('زبدة فول سوداني',  'nuts', 40,  'جرة',  '/images/products/peanut_butter.png', 'زبدة فول سوداني طبيعية محلية الصنع.', NULL,             false, 50,  false, false, false);

-- === Dates & Maamoul ===
INSERT INTO public.products (name, category_id, price, unit, image, description, badge, is_featured, stock_quantity) VALUES
('تمر مجدول',         'dates', 90,  'كيلو', '/images/products/medjool.png',    'تمر مجدول أردني فاخر.',                 'فاخر',   true,  100),
('تمر القرشي',        'dates', 60,  'كيلو', '/images/products/qurashi.png',    'تمر القرشي السعودي طري وحلو.',           NULL,     false, 80),
('تمر الطحان',        'dates', 45,  'كيلو', '/images/products/tahan_dates.png','تمر الطحان ناعم القوام.',               NULL,     false, 80),
('تمر الرحاب',        'dates', 55,  'كيلو', '/images/products/rahab_dates.png','تمر الرحاب حلو ولذيذ.',                 NULL,     false, 60),
('معمول بتمر',        'dates', 60,  'كيلو', '/images/products/maamoul.png',    'معمول مصنوع يدوياً محشو بعجوة التمر.',  'منزلي',  false, 50);

-- === Soft Drinks ===
INSERT INTO public.products (name, category_id, price, unit, image, description, badge, weight, is_featured, stock_quantity) VALUES
('بيبسي',             'soda', 3,  'علبة', '/images/products/pepsi.png',      'بيبسي كولا الكلاسيكية المنعشة.',           NULL,     '330مل', false, 500),
('كوكاكولا',          'soda', 3,  'علبة', '/images/products/cocacola.png',   'كوكاكولا الأصلية المنعشة.',                NULL,     '330مل', false, 500),
('سبرايت',            'soda', 3,  'علبة', '/images/products/sprite.png',     'سبرايت ليمون منعش.',                       NULL,     '330مل', false, 300),
('ميرندا برتقال',     'soda', 3,  'علبة', '/images/products/mirinda.png',    'ميرندا بنكهة البرتقال اللذيذة.',           NULL,     '330مل', false, 300),
('شويبس',             'soda', 4,  'علبة', '/images/products/schweppes.png',  'شويبس توتنك ووتر.',                        NULL,     '330مل', false, 200),
('باربيكان تفاح',     'soda', 7,  'علبة', '/images/products/barbican.png',   'باربيكان التفاح المنعش.',                  'مفضل',   '330مل', true,  200);

-- === Energy Drinks & Juices ===
INSERT INTO public.products (name, category_id, price, unit, image, description, badge, weight, is_featured, stock_quantity) VALUES
('ريد بول',           'energy', 10, 'علبة', '/images/products/redbull.png',   'ريد بول مشروب الطاقة الأصلي.',            NULL, '250مل', false, 200),
('هايب',              'energy', 8,  'علبة', '/images/products/hype.png',      'مشروب الطاقة هايب بالفيتامينات.',          NULL, '250مل', false, 150),
('عصير راني مانجو',   'energy', 5,  'علبة', '/images/products/rani.png',      'عصير راني مانجو الطبيعي.',                 NULL, '180مل', false, 200),
('فريز ليتشي',        'energy', 6,  'علبة', '/images/products/freez.png',     'فريز بنكهة الليتشي المنعشة.',              NULL, '275مل', false, 150);

-- === Jelly & Gummies ===
INSERT INTO public.products (name, category_id, price, unit, image, description, badge, weight, is_featured, stock_quantity) VALUES
('هاريبو مكس',        'jelly', 15, 'كيس', '/images/products/haribo.png',     'هاريبو المجموعة المختلطة.',               'الأكثر مبيعاً', '200غ', true,  150),
('بيبيتو',            'jelly', 8,  'كيس', '/images/products/pepito.png',     'بيبيتو جيلي بنكهات فواكه.',               NULL,             '100غ', false, 150),
('مارشميلو',          'jelly', 10, 'كيس', '/images/products/marshmallow.png','مارشميلو ناعم بألوان متعددة.',            NULL,             '150غ', false, 100),
('ستاربورست',         'jelly', 12, 'كيس', '/images/products/starburst.png',  'ستاربورست بنكهات الفواكه المركزة.',       NULL,             '165غ', false, 120);

-- === Biscuits & Cookies ===
INSERT INTO public.products (name, category_id, price, unit, image, description, badge, weight, is_featured, stock_quantity) VALUES
('أوريو أصلي',        'biscuits', 8,  'علبة', '/images/products/oreo.png',      'بسكويت أوريو الكلاسيكي.',               NULL,       '154غ', false, 300),
('دانيسا',            'biscuits', 25, 'علبة', '/images/products/danisa.png',    'دانيسا كوكيز الزبدة الإندونيسية.',      'مستورد',   '200غ', false, 100),
('لواكر فانيليا',     'biscuits', 12, 'علبة', '/images/products/loacker.png',   'لواكر إيطالي بالوافل والفانيليا.',      'إيطالي',   '175غ', false, 150),
('ديجستف',            'biscuits', 15, 'علبة', '/images/products/digestive.png', 'ديجستف بالحبوب الكاملة.',               NULL,       '400غ', false, 100),
('لوتس أصلي',         'biscuits', 18, 'علبة', '/images/products/lotus.png',     'بسكويت لوتس البلجيكي بالكراميل.',       'بلجيكي',   '250غ', true,  200),
('بولا شوكولاتة',     'biscuits', 10, 'علبة', '/images/products/bola.png',      'بولا بالشوكولاتة والبسكويت.',           NULL,       '150غ', false, 150);

-- === Toffee & Candy ===
INSERT INTO public.products (name, category_id, price, unit, image, description, badge, weight, is_featured, stock_quantity) VALUES
('منتوس فراولة',      'toffee', 4,  'لفافة', '/images/products/mentos.png',    'منتوس المنعش بنكهة الفراولة.',            NULL,     '37غ',  false, 400),
('ورثرز أوريجنال',    'toffee', 12, 'كيس',   '/images/products/werthers.png',  'حلوى ورثرز الكريمية الراقية.',            NULL,     '120غ', false, 150),
('هولز نعناع',        'toffee', 3,  'لفافة', '/images/products/halls.png',     'هولز النعناع المنعش.',                    NULL,     '28غ',  false, 500),
('عسلية مصرية',       'toffee', 15, 'كيس',   '/images/products/asaliya.png',   'حلوى العسلية التقليدية.',                 NULL,     '200غ', false, 100),
('توفيكس',            'toffee', 10, 'كيس',   '/images/products/toffex.png',    'توفيكس حلوى التوفي الكريمي.',            NULL,     '150غ', false, 150);

-- === Kids Candy ===
INSERT INTO public.products (name, category_id, price, unit, image, description, badge, weight, is_featured, stock_quantity) VALUES
('لولي بوب مكس',      'candy', 5,  'كيس', '/images/products/lollipop.png',  'مصاصات ملونة بنكهات متعددة.',              NULL, '100غ', false, 300),
('مصاصة ثور',         'candy', 2,  'قطعة','/images/products/bull_pop.png',   'مصاصة ثور المشهورة.',                      NULL, '20غ',  false, 500),
('كاندي رول',         'candy', 3,  'لفافة','/images/products/candy_roll.png', 'كاندي رول ملون بنكهات الفواكه.',          NULL, '30غ',  false, 400);

-- === Coffee & Tea ===
INSERT INTO public.products (name, category_id, price, unit, image, description, badge, weight, is_featured, stock_quantity, has_packaging, has_extras, allow_special_instructions) VALUES
('نسكافيه كلاسيك',   'coffee', 45, 'علبة', '/images/products/nescafe.png',  'نسكافيه القهوة الفورية الأشهر.',           NULL,             '200غ', true,  100, false, false, false),
('بن أبو عوف',       'coffee', 55, 'كيلو', '/images/products/abouauf.png',  'قهوة بن أبو عوف بدرجات طحن مختلفة.',      'الأكثر مبيعاً', NULL,   true,  80,  true,  true,  true),
('سحلب مكس',         'coffee', 30, 'علبة', '/images/products/sahlab.png',   'مشروب السحلب الدافئ بالقشدة.',             NULL,             '250غ', false, 60,  false, false, false),
('كوبيكو',           'coffee', 5,  'علبة', '/images/products/kopiko.png',   'حلوى كوبيكو القهوة المركزة.',              NULL,             '49غ',  false, 200, false, false, false),
('إسبريسو جراندوس', 'coffee', 65, 'علبة', '/images/products/espresso.png', 'إسبريسو جراندوس المطحون الإيطالي.',        'إيطالي',         '250غ', false, 50,  false, false, false);

-- === Chips & Snacks ===
INSERT INTO public.products (name, category_id, price, unit, image, description, badge, weight, is_featured, stock_quantity) VALUES
('برنجلز أصلي',      'chips', 15, 'علبة', '/images/products/pringles.png',  'برنجلز المقرمش الكلاسيكي.',               NULL, '165غ', false, 200),
('شيبسي ملح',        'chips', 5,  'كيس',  '/images/products/chipsy.png',    'شيبسي بالملح الكلاسيكي.',                 NULL, '90غ',  false, 400),
('برتزل',            'chips', 12, 'كيس',  '/images/products/pretzel.png',   'برتزل مقرمش بالملح الخشن.',               NULL, '150غ', false, 150),
('كونو',             'chips', 5,  'كيس',  '/images/products/cono.png',      'كونو مقرمش بالجبن.',                      NULL, '60غ',  false, 200),
('فشار ميكروويف',    'chips', 8,  'علبة', '/images/products/popcorn.png',   'فشار ميكروويف بالزبدة.',                  NULL, '85غ',  false, 150);

-- === Eastern Sweets ===
INSERT INTO public.products (name, category_id, price, unit, image, description, badge, is_featured, stock_quantity) VALUES
('نوجا بالفستق',     'eastern_sweets', 50, 'كيلو', '/images/products/nougat.png',         'نوجا تركية فاخرة بالفستق الحلبي.',    'فاخر',   true,  40),
('ملبس لوز',         'eastern_sweets', 70, 'كيلو', '/images/products/sugared_almond.png', 'لوز ملبس بالسكر الناعم.',              NULL,     false, 50),
('ملبن',             'eastern_sweets', 35, 'كيلو', '/images/products/malban.png',         'ملبن بالفستق والمكسرات.',              NULL,     false, 60),
('سمسمية',           'eastern_sweets', 30, 'كيلو', '/images/products/simsimiya.png',      'سمسمية تقليدية بالسمسم والعسل.',      NULL,     false, 40),
('قمر الدين',        'eastern_sweets', 20, 'كيلو', '/images/products/qamar_aldin.png',    'قمر الدين المصري الأصيل.',             NULL,     false, 60);

-- === Mineral Water ===
INSERT INTO public.products (name, category_id, price, unit, image, description, weight, is_featured, stock_quantity) VALUES
('أكوا دلتا 1.5 لتر',  'water', 2, 'زجاجة', '/images/products/aquadelta.png',    'مياه أكوا دلتا المعدنية الطبيعية.', '1.5 لتر', false, 500),
('نستله مياه 1.5 لتر',  'water', 2, 'زجاجة', '/images/products/nestle_water.png', 'مياه نستله المعدنية النقية.',       '1.5 لتر', false, 500),
('فلو 1.5 لتر',         'water', 3, 'زجاجة', '/images/products/flo_water.png',    'مياه فلو المعدنية الخفيفة.',        '1.5 لتر', false, 300);

-- === Dried Fruits ===
INSERT INTO public.products (name, category_id, price, unit, image, description, badge, is_featured, stock_quantity) VALUES
('زبيب ذهبي',         'dried_fruits', 25, 'كيلو', '/images/products/raisins.png',       'زبيب ذهبي أفغاني فاخر.',               NULL, false, 80),
('تين مجفف',          'dried_fruits', 40, 'كيلو', '/images/products/dried_figs.png',    'تين مجفف تركي طبيعي.',                 NULL, false, 60),
('مشمشية مجففة',      'dried_fruits', 35, 'كيلو', '/images/products/dried_apricot.png', 'مشمش تركي مجفف طبيعي.',                NULL, false, 50),
('خروب',              'dried_fruits', 20, 'كيلو', '/images/products/carob.png',         'خروب مجفف طبيعي.',                     NULL, false, 40),
('دوم',               'dried_fruits', 30, 'كيلو', '/images/products/doum.png',          'دوم مصري طبيعي.',                      NULL, false, 40);

-- === Toys & Gifts ===
INSERT INTO public.products (name, category_id, price, unit, image, description, badge, is_featured, stock_quantity, has_packaging) VALUES
('بيضة كيندر سوربريز',           'toys', 10,  'قطعة', '/images/products/kinder_surprise.png', 'بيضة كيندر بالشوكولاتة والمفاجأة.',      'للأطفال', false, 200, false),
('هدية مكسرات وشوكولاتة فاخرة',  'toys', 120, 'علبة', '/images/products/gift_box.png',        'علبة هدايا فاخرة مكسرات وشوكولاتة.',     'هدية',    true,  30,  true),
('توي بوكس للأطفال',             'toys', 25,  'علبة', '/images/products/toy_box.png',         'علبة مفاجآت للأطفال بالحلوى والألعاب.',  NULL,      false, 50,  false);
