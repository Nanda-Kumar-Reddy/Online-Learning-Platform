PRAGMA foreign_keys = ON;


CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  mobile TEXT,
  role TEXT NOT NULL CHECK (role IN ('learner','educator')),
  target_exam TEXT,
  preferred_language TEXT,
  level TEXT DEFAULT 'beginner',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS educators (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL UNIQUE,
  qualification TEXT,
  experience_years INTEGER DEFAULT 0,
  bio TEXT,
  is_verified INTEGER DEFAULT 0,
  rating REAL DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS educator_subjects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  educator_id INTEGER NOT NULL,
  subject TEXT NOT NULL,
  FOREIGN KEY (educator_id) REFERENCES educators(id) ON DELETE CASCADE
);


CREATE TABLE IF NOT EXISTS courses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  educator_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  target_exam TEXT,
  duration_text TEXT,
  validity_days INTEGER DEFAULT 180,
  validity_text TEXT,
  price INTEGER NOT NULL,
  discounted_price INTEGER NOT NULL,
  course_type TEXT CHECK (course_type IN ('live','recorded')) NOT NULL,
  language TEXT,
  total_lessons INTEGER DEFAULT 0,
  live_count INTEGER DEFAULT 0,
  mock_tests INTEGER DEFAULT 0,
  pdf_notes INTEGER DEFAULT 1,
  doubt_support INTEGER DEFAULT 1,
  rating REAL DEFAULT 0,
  popularity INTEGER DEFAULT 0,
  thumbnail_url TEXT,
  highlights TEXT, 
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (educator_id) REFERENCES educators(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS course_subjects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  course_id INTEGER NOT NULL,
  subject TEXT NOT NULL,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS lessons (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  course_id INTEGER NOT NULL,
  chapter TEXT NOT NULL,
  chapter_order INTEGER DEFAULT 0,
  title TEXT NOT NULL,
  lesson_order INTEGER DEFAULT 0,
  description TEXT,
  video_url TEXT,
  duration_sec INTEGER DEFAULT 0,
  resources_json TEXT,
  is_free INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);


CREATE TABLE IF NOT EXISTS live_classes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  course_id INTEGER NOT NULL,
  educator_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  scheduled_at TEXT NOT NULL,
  duration_min INTEGER NOT NULL,
  max_students INTEGER DEFAULT 500,
  enrolled_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'scheduled',
  recording_available INTEGER DEFAULT 0,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  FOREIGN KEY (educator_id) REFERENCES educators(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS live_questions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  live_class_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  question TEXT NOT NULL,
  timestamp_sec INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (live_class_id) REFERENCES live_classes(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS enrollments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  course_id INTEGER NOT NULL,
  purchase_date TEXT NOT NULL,
  expiry_date TEXT NOT NULL,
  progress_percent INTEGER DEFAULT 0,
  UNIQUE(user_id, course_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS watch_history (
  user_id INTEGER NOT NULL,
  lesson_id INTEGER NOT NULL,
  watched_sec INTEGER DEFAULT 0,
  total_sec INTEGER DEFAULT 0,
  completed INTEGER DEFAULT 0,
  updated_at TEXT DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, lesson_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS lesson_notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  lesson_id INTEGER NOT NULL,
  timestamp_sec INTEGER DEFAULT 0,
  note TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE
);


CREATE TABLE IF NOT EXISTS tests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  course_id INTEGER, 
  title TEXT NOT NULL,
  type TEXT CHECK (type IN ('practice','mock','chapter')) NOT NULL,
  subject TEXT,
  questions_count INTEGER NOT NULL,
  duration_min INTEGER NOT NULL,
  max_marks INTEGER NOT NULL,
  difficulty TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS test_questions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  test_id INTEGER NOT NULL,
  question TEXT NOT NULL,
  options_json TEXT NOT NULL,
  correct_option INTEGER NOT NULL,
  marks INTEGER NOT NULL DEFAULT 4,
  negative_marks INTEGER NOT NULL DEFAULT 1,
  FOREIGN KEY (test_id) REFERENCES tests(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS test_attempts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  test_id INTEGER NOT NULL,
  session_id TEXT NOT NULL UNIQUE,
  started_at TEXT,
  finished_at TEXT,
  time_spent_sec INTEGER DEFAULT 0,
  status TEXT CHECK (status IN ('in_progress','submitted')) NOT NULL,
  score INTEGER DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (test_id) REFERENCES tests(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS test_attempt_answers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  attempt_id INTEGER NOT NULL,
  question_id INTEGER NOT NULL,
  selected_option INTEGER,
  FOREIGN KEY (attempt_id) REFERENCES test_attempts(id) ON DELETE CASCADE,
  FOREIGN KEY (question_id) REFERENCES test_questions(id) ON DELETE CASCADE
);


CREATE TABLE IF NOT EXISTS subscriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  price_cents INTEGER NOT NULL,
  duration TEXT CHECK (duration IN ('monthly','yearly')) NOT NULL,
  features_json TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS user_subscriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  subscription_id INTEGER NOT NULL,
  purchased_at TEXT NOT NULL,
  valid_until TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  amount_cents INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE CASCADE
);


CREATE TABLE IF NOT EXISTS doubts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  course_id INTEGER NOT NULL,
  lesson_id INTEGER,
  question TEXT NOT NULL,
  attachments_json TEXT,
  status TEXT DEFAULT 'open',
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS doubt_answers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  doubt_id INTEGER NOT NULL,
  educator_user_id INTEGER NOT NULL,
  answer TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (doubt_id) REFERENCES doubts(id) ON DELETE CASCADE,
  FOREIGN KEY (educator_user_id) REFERENCES users(id) ON DELETE CASCADE
);


CREATE TABLE IF NOT EXISTS materials (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  course_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  chapter TEXT,
  size_label TEXT,
  url TEXT,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS material_downloads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  material_id INTEGER NOT NULL,
  downloaded_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (material_id) REFERENCES materials(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS follows (
  user_id INTEGER NOT NULL,
  educator_id INTEGER NOT NULL,
  PRIMARY KEY (user_id, educator_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (educator_id) REFERENCES educators(id) ON DELETE CASCADE
);


CREATE TABLE IF NOT EXISTS reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  course_id INTEGER NOT NULL,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  review TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  -- UNIQUE(user_id, course_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);
