DELETE FROM users;
DELETE FROM educators;
DELETE FROM educator_subjects;
DELETE FROM courses;
DELETE FROM course_subjects;
DELETE FROM lessons;
DELETE FROM live_classes;
DELETE FROM enrollments;
DELETE FROM watch_history;
DELETE FROM tests;
DELETE FROM test_questions;
DELETE FROM subscriptions;
DELETE FROM materials;
DELETE FROM reviews;


INSERT INTO users (name, email, password_hash, mobile, role, target_exam, preferred_language, level) VALUES
('John Doe','john@example.com','$2a$10$9fQxg1U0pQk2eG2nR2pS3u6V5m5W1p8b8q8q8q8q8q8q8q8q8q8.','+919876543210','learner','UPSC','English','beginner');

INSERT INTO users (name, email, password_hash, mobile, role) VALUES
('Dr. Sarah Kumar','sarah@example.com','$2a$10$9fQxg1U0pQk2eG2nR2pS3u6V5m5W1p8b8q8q8q8q8q8q8q8q8.','+919876543211','educator');

INSERT INTO educators (user_id, qualification, experience_years, bio, is_verified, rating)
VALUES ((SELECT id FROM users WHERE email='sarah@example.com'),'PhD Physics, IIT Delhi',8,'8+ years teaching experience',1,4.8);

INSERT INTO educator_subjects (educator_id, subject) VALUES
((SELECT id FROM educators WHERE id=1),'Physics');


INSERT INTO courses (educator_id, title, description, target_exam, duration_text, validity_days, validity_text, price, discounted_price, course_type, language, total_lessons, live_count, mock_tests, pdf_notes, doubt_support, rating, popularity, thumbnail_url, highlights)
VALUES
(1,'Complete Physics for JEE Main + Advanced','Comprehensive course covering Mechanics, Waves, EM...', 'JEE', '6 months', 180, '6 months', 5999, 3999, 'recorded', 'English', 120, 50, 10, 1, 1, 4.7, 15420, 'course_thumbnail_url',
 '["120+ video lectures","50+ live problem solving sessions","10 mock tests","Doubt clearing sessions"]');

INSERT INTO course_subjects (course_id, subject) VALUES (1,'Physics');


INSERT INTO lessons (course_id, chapter, chapter_order, title, lesson_order, description, duration_sec, is_free)
VALUES
(1,'Mechanics',1,'Introduction to Mechanics',1,'Basic concepts of mechanics',2700,1),
(1,'Mechanics',1,'Laws of Motion',2,'Newton laws',3000,0);


INSERT INTO live_classes (course_id, educator_id, title, scheduled_at, duration_min, max_students, enrolled_count, status)
VALUES (1,1,'Problem Solving Session - Mechanics','2025-08-25T18:00:00Z',90,500,342,'scheduled');


INSERT INTO tests (course_id, title, type, subject, questions_count, duration_min, max_marks, difficulty)
VALUES (1,'JEE Main Mock Test - 1','mock','Physics',2,180,8,'moderate');

INSERT INTO test_questions (test_id, question, options_json, correct_option, marks, negative_marks) VALUES
(1,'A particle moves with...','["10 m/s","20 m/s","30 m/s","40 m/s"]',2,4,1),
(1,'Find the acceleration...','["1 m/s^2","2 m/s^2","3 m/s^2","4 m/s^2"]',1,4,1);


INSERT INTO subscriptions (name, price_cents, duration, features_json) VALUES
('Plus', 99900, 'monthly', '["Access to all Plus courses","Live classes","Doubt clearing sessions","Test series"]'),
('Iconic', 299900, 'monthly', '["Everything in Plus","Top educator courses","Personal mentorship","Priority doubt solving"]');

INSERT INTO materials (course_id, title, type, chapter, size_label, url)
VALUES (1,'Physics Formula Sheet','pdf','All Chapters','2.5 MB','pdf_url');


INSERT INTO enrollments (user_id, course_id, purchase_date, expiry_date, progress_percent)
VALUES ((SELECT id FROM users WHERE email='john@example.com'), 1, date('now'), date('now','+180 days'), 0);
