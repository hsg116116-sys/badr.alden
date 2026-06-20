-- Fix/Update Categories for محمصة بدر الدين

-- Delete old butcher shop categories
DELETE FROM public.categories WHERE id IN ('lamb', 'chicken', 'veggies', 'sacrifices', 'beef', 'minced');

-- Upsert all 15 roastery categories
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
('toys',           'ألعاب وهدايا أطفال',        '🎁', NULL)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  icon = EXCLUDED.icon,
  image = EXCLUDED.image;
