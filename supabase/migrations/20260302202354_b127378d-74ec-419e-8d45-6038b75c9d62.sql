UPDATE site_content SET content_value = 'מלאו את הפרטים כדי שנוכל להתאים לכם את הפודטראק המושלם' WHERE content_key = 'contact_subtitle';

INSERT INTO site_content (content_key, content_value, content_type, category, description)
VALUES ('contact_heading', 'נשמח להכיר אתכם', 'text', 'contact', 'כותרת ראשית במסך פרטים אישיים')
ON CONFLICT (content_key) DO UPDATE SET content_value = EXCLUDED.content_value;