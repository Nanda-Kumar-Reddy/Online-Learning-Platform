import { getDb } from "../config/database.js";
import { JSON_ERR, JSON_OK } from "../utils/constants.js";
import { buildFilters } from "../utils/helpers.js";
import { customAlphabet } from "nanoid";
const nanoid = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 16);

export const schedule = async (req, res) => {
  try {
    const filters = buildFilters(req.query, ["courseId", "date", "upcoming"]);
    const params = [];
    const where = [];
    if (filters.courseId) { where.push("lc.course_id = ?"); params.push(+filters.courseId); }
    if (filters.date) { where.push("date(lc.scheduled_at) = date(?)"); params.push(filters.date); }
    if (filters.upcoming === "true") { where.push("datetime(lc.scheduled_at) >= datetime('now')"); }

    const db = await getDb();
    const classes = await db.all(`
      SELECT lc.*, u.name as educatorName FROM live_classes lc
      JOIN educators e ON e.id = lc.educator_id
      JOIN users u ON u.id = e.user_id
      ${where.length ? "WHERE " + where.join(" AND ") : ""}
      ORDER BY lc.scheduled_at ASC
    `, params);

    const liveClasses = classes.map(c => ({
      id: c.id,
      title: c.title,
      educator: c.educatorName,
      scheduledAt: c.scheduled_at,
      duration: c.duration_min,
      courseId: c.course_id,
      maxStudents: c.max_students,
      enrolled: c.enrolled_count,
      status: c.status,
      joinUrl: null
    }));

    return res.json(JSON_OK({ liveClasses }));
  } catch (e) {
    return res.status(500).json(JSON_ERR("Failed to fetch schedule", "LIVE_500"));
  }
};

export const join = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const userId = req.user.id;
    const db = await getDb();

    const cls = await db.get(`SELECT * FROM live_classes WHERE id = ?`, [id]);
    if (!cls) return res.status(404).json(JSON_ERR("Live class not found", "LIVE_404"));


    const enr = await db.get(`SELECT 1 FROM enrollments WHERE user_id = ? AND course_id = ? AND date(expiry_date) >= date('now')`, [userId, cls.course_id]);
    if (!enr) return res.status(403).json(JSON_ERR("Not enrolled for this course", "LIVE_403"));

    if (cls.enrolled_count >= cls.max_students) return res.status(403).json(JSON_ERR("Class at capacity", "LIVE_409"));


    await db.run(`UPDATE live_classes SET enrolled_count = enrolled_count + 1 WHERE id = ?`, [id]);

    const token = nanoid();
    const joinUrl = `https://live.example.com/join/${id}?t=${token}`;

    return res.json(JSON_OK({
      liveClass: { joinUrl, token, chatEnabled: true, pollsEnabled: true }
    }));
  } catch (e) {
    return res.status(500).json(JSON_ERR("Failed to join class", "LIVE_500"));
  }
};

export const askQuestion = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { question, timestamp } = req.body;
    const userId = req.user.id;
    const db = await getDb();

    const cls = await db.get(`SELECT * FROM live_classes WHERE id = ?`, [id]);
    if (!cls) return res.status(404).json(JSON_ERR("Live class not found", "LIVE_404"));

    const enr = await db.get(`SELECT 1 FROM enrollments WHERE user_id = ? AND course_id = ?`, [userId, cls.course_id]);
    if (!enr) return res.status(403).json(JSON_ERR("Not enrolled", "LIVE_403"));

    await db.run(
      `INSERT INTO live_questions (live_class_id, user_id, question, timestamp_sec, created_at) VALUES (?, ?, ?, ?, datetime('now'))`,
      [id, userId, String(question || "").slice(0, 1000), Math.max(0, parseInt(timestamp || 0, 10))]
    );

    return res.status(201).json(JSON_OK({ message: "Question posted" }));
  } catch (e) {
    return res.status(500).json(JSON_ERR("Failed to post question", "LIVE_500"));
  }
};
