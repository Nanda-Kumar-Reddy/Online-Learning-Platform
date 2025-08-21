import { getDb } from "../config/database.js";
import { JSON_ERR, JSON_OK } from "../utils/constants.js";

export const getLesson = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const userId = req.user.id;
    const db = await getDb();

    const lesson = await db.get(`SELECT * FROM lessons WHERE id = ?`, [id]);
    if (!lesson) return res.status(404).json(JSON_ERR("Lesson not found", "LESSON_404"));

    const enrolled = await db.get(`SELECT 1 FROM enrollments WHERE user_id = ? AND course_id = ? AND date(expiry_date) >= date('now')`, [userId, lesson.course_id]);
    if (!enrolled && !lesson.is_free) return res.status(403).json(JSON_ERR("Not enrolled", "LESSON_403"));

    const next = await db.get(
      `SELECT id, title FROM lessons WHERE course_id = ? AND (chapter_order, lesson_order) > (?, ?) 
       ORDER BY chapter_order, lesson_order LIMIT 1`,
      [lesson.course_id, lesson.chapter_order, lesson.lesson_order]
    );

    
    const videoUrl = `https://cdn.example.com/video/${lesson.id}?token=${Buffer.from(String(userId)).toString("base64")}`;

    const payload = {
      id: lesson.id,
      title: lesson.title,
      description: lesson.description,
      videoUrl,
      duration: lesson.duration_sec,
      resources: lesson.resources_json ? JSON.parse(lesson.resources_json) : [],
      nextLesson: next || null
    };

    return res.json(JSON_OK({ lesson: payload }));
  } catch (e) {
    return res.status(500).json(JSON_ERR("Failed to fetch lesson", "LESSON_500"));
  }
};

export const updateProgress = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { watchedDuration, totalDuration, completed } = req.body;
    const userId = req.user.id;
    const db = await getDb();

    const lesson = await db.get(`SELECT * FROM lessons WHERE id = ?`, [id]);
    if (!lesson) return res.status(404).json(JSON_ERR("Lesson not found", "LESSON_404"));

    const enr = await db.get(`SELECT * FROM enrollments WHERE user_id = ? AND course_id = ?`, [userId, lesson.course_id]);
    if (!enr) return res.status(403).json(JSON_ERR("Not enrolled", "LESSON_403"));

    const pct = Math.min(100, Math.round((watchedDuration / (totalDuration || lesson.duration_sec || 1)) * 100));

    await db.run(
      `INSERT INTO watch_history (user_id, lesson_id, watched_sec, total_sec, completed, updated_at)
       VALUES (?, ?, ?, ?, ?, datetime('now'))
       ON CONFLICT(user_id, lesson_id) DO UPDATE SET watched_sec=excluded.watched_sec, total_sec=excluded.total_sec,
       completed=excluded.completed, updated_at=datetime('now')`,
      [userId, id, watchedDuration, totalDuration || lesson.duration_sec, completed ? 1 : 0]
    );

    
    const { countCompleted } = await db.get(
      `SELECT COUNT(*) as countCompleted FROM watch_history wh JOIN lessons l ON l.id = wh.lesson_id
       WHERE wh.user_id = ? AND l.course_id = ? AND wh.completed = 1`,
      [userId, lesson.course_id]
    );
    const { totalLessons } = await db.get(`SELECT COUNT(*) as totalLessons FROM lessons WHERE course_id = ?`, [lesson.course_id]);
    const overall = totalLessons ? Math.round((countCompleted / totalLessons) * 100) : 0;
    await db.run(`UPDATE enrollments SET progress_percent = ? WHERE id = ?`, [overall, enr.id]);

    return res.json(JSON_OK({ message: "Progress updated", percent: pct, overallProgress: overall }));
  } catch (e) {
    return res.status(500).json(JSON_ERR("Failed to update progress", "LESSON_500"));
  }
};

export const saveNote = async (req, res) => {
  try {
    const lessonId = parseInt(req.params.id, 10);
    const { timestamp, note } = req.body;
    const userId = req.user.id;
    const db = await getDb();

    const lesson = await db.get(`SELECT course_id FROM lessons WHERE id = ?`, [lessonId]);
    if (!lesson) return res.status(404).json(JSON_ERR("Lesson not found", "LESSON_404"));

    const enr = await db.get(`SELECT 1 FROM enrollments WHERE user_id = ? AND course_id = ?`, [userId, lesson.course_id]);
    if (!enr) return res.status(403).json(JSON_ERR("Not enrolled", "LESSON_403"));

    await db.run(
      `INSERT INTO lesson_notes (user_id, lesson_id, timestamp_sec, note, created_at)
       VALUES (?, ?, ?, ?, datetime('now'))`,
      [userId, lessonId, Math.max(0, parseInt(timestamp || 0, 10)), String(note || "").slice(0, 2000)]
    );
    return res.status(201).json(JSON_OK({ message: "Note saved" }));
  } catch (e) {
    return res.status(500).json(JSON_ERR("Failed to save note", "LESSON_500"));
  }
};
