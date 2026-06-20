-- Initial Site Settings - محمصة بدر الدين
INSERT INTO site_settings (key, value) VALUES 
('store_status', '"open"'),
('working_hours', '{"saturday":{"from":"08:00","to":"23:00","closed":false},"sunday":{"from":"08:00","to":"23:00","closed":false},"monday":{"from":"08:00","to":"23:00","closed":false},"tuesday":{"from":"08:00","to":"23:00","closed":false},"wednesday":{"from":"08:00","to":"23:00","closed":false},"thursday":{"from":"08:00","to":"23:00","closed":false},"friday":{"from":"13:00","to":"22:00","closed":false}}'),
('legal_terms', '"سيتم إضافة شروط الاستخدام هنا..."'),
('legal_privacy', '"سيتم إضافة سياسة الخصوصية هنا..."'),
('legal_copyright', '"© 2026 محمصة بدر الدين. جميع الحقوق محفوظة."'),
('contact_details', '{"whatsapp":"201110085927","email":"info@badr-aldin.com","tax_number":"","store_name":"محمصة بدر الدين","instagram":"https://www.instagram.com/badr_alden_roastery","facebook":"https://www.facebook.com/share/16sijBdhH5/","tiktok":"https://www.tiktok.com/@badr.alden19"}')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
