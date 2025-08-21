import { getDb } from "../config/database.js";
import { JSON_ERR, JSON_OK, ROLES } from "../utils/constants.js";

export const createDoubt = async (req, res) => {
  try {
    const { courseId, lessonId, question, attachments } = req.body;
    const userId = req.user.id;
    const db = await getDb();

    const enr = await db.get(`SELECT 1 FROM enrollments WHERE user_id = ? AND course_id = ?`, [userId, courseId]);
    if (!enr) return res.status(403).json(JSON_ERR("Not enrolled", "DBT_403"));

    await db.run(
      `INSERT INTO doubts (user_id, course_id, lesson_id, question, attachments_json, status, created_at)
       VALUES (?, ?, ?, ?, ?, 'open', datetime('now'))`,
      [userId, courseId, lessonId || null, String(question).slice(0, 2000), JSON.stringify(attachments || [])]
    );
    return res.status(201).json(JSON_OK({ message: "Doubt posted" }));
  } catch {
    return res.status(500).json(JSON_ERR("Failed to post doubt", "DBT_500"));
  }
};

export const myDoubts = async (req, res) => {
  try {
    const userId = req.user.id;
    const db = await getDb();
    const rows = await db.all(`SELECT * FROM doubts WHERE user_id = ? ORDER BY created_at DESC`, [userId]);
    return res.json(JSON_OK({ doubts: rows }));
  } catch {
    return res.status(500).json(JSON_ERR("Failed to fetch doubts", "DBT_500"));
  }
};

export const answerDoubt = async (req, res) => {
  try {
    const doubtId = parseInt(req.params.id, 10);
    const { answer } = req.body;
    const user = req.user;
    if (user.role !== ROLES.EDUCATOR) return res.status(403).json(JSON_ERR("Educator required", "DBT_403"));

    const db = await getDb();
    await db.run(
      `INSERT INTO doubt_answers (doubt_id, educator_user_id, answer, created_at) VALUES (?, ?, ?, datetime('now'))`,
      [doubtId, user.id, String(answer || "").slice(0, 4000)]
    );
    await db.run(`UPDATE doubts SET status='answered' WHERE id = ?`, [doubtId]);
    return res.status(201).json(JSON_OK({ message: "Answer posted" }));
  } catch {
    return res.status(500).json(JSON_ERR("Failed to answer doubt", "DBT_500"));
  }
};
