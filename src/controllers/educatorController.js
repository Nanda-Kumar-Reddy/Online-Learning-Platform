import { getDb } from "../config/database.js";
import { JSON_ERR, JSON_OK } from "../utils/constants.js";

export const listEducators = async (req, res) => {
  try {
    const { subject, exam, rating } = req.query;
    const db = await getDb();

    const where = [];
    const params = [];
    if (subject) { where.push("EXISTS (SELECT 1 FROM educator_subjects es WHERE es.educator_id = e.id AND es.subject = ?)"); params.push(subject); }
    if (exam) { where.push("EXISTS (SELECT 1 FROM courses c WHERE c.educator_id = e.id AND c.target_exam = ?)"); params.push(exam); }
    if (rating) { where.push("e.rating >= ?"); params.push(parseFloat(rating)); }

    const rows = await db.all(`
      SELECT e.*, u.name, 
        (SELECT COUNT(*) FROM enrollments en JOIN courses c ON c.id = en.course_id WHERE c.educator_id = e.id) as totalStudents,
        (SELECT COUNT(*) FROM courses c WHERE c.educator_id = e.id) as coursesCount
      FROM educators e 
      JOIN users u ON u.id = e.user_id
      ${where.length ? "WHERE " + where.join(" AND ") : ""}
      ORDER BY e.rating DESC
    `, params);

    const educators = rows.map(r => ({
      id: r.id, name: r.name, subjects: [], experience: `${r.experience_years} years`, rating: r.rating,
      totalStudents: r.totalStudents, courses: r.coursesCount, image: null, isVerified: !!r.is_verified
    }));

    return res.json(JSON_OK({ educators }));
  } catch (e) {
    return res.status(500).json(JSON_ERR("Failed to fetch educators", "EDU_500"));
  }
};

export const getEducator = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const db = await getDb();
    const e = await db.get(`
      SELECT e.*, u.name FROM educators e JOIN users u ON u.id = e.user_id WHERE e.id = ?`, [id]);
    if (!e) return res.status(404).json(JSON_ERR("Educator not found", "EDU_404"));
    const subjects = await db.all(`SELECT subject FROM educator_subjects WHERE educator_id = ?`, [id]);
    return res.json(JSON_OK({
      educator: {
        id: e.id, name: e.name, subjects: subjects.map(s => s.subject),
        experience: e.experience_years, rating: e.rating, isVerified: !!e.is_verified, bio: e.bio
      }
    }));
  } catch {
    return res.status(500).json(JSON_ERR("Failed to fetch educator", "EDU_500"));
  }
};

export const followEducator = async (req, res) => {
  try {
    const educatorId = parseInt(req.params.id, 10);
    const userId = req.user.id;
    const db = await getDb();

    const exists = await db.get(`SELECT 1 FROM educators WHERE id = ?`, [educatorId]);
    if (!exists) return res.status(404).json(JSON_ERR("Educator not found", "EDU_404"));

    await db.run(`INSERT OR IGNORE INTO follows (user_id, educator_id) VALUES (?, ?)`, [userId, educatorId]);
    return res.status(201).json(JSON_OK({ message: "Followed" }));
  } catch {
    return res.status(500).json(JSON_ERR("Failed to follow", "EDU_500"));
  }
};
