import { getDb } from "../config/database.js";
import { JSON_ERR, JSON_OK } from "../utils/constants.js";

export const listTests = async (req, res) => {
  try {
    const { courseId, type, subject } = req.query;
    const db = await getDb();
    const where = [];
    const params = [];
    if (courseId) { where.push("t.course_id = ?"); params.push(+courseId); }
    if (type) { where.push("t.type = ?"); params.push(type); }
    if (subject) { where.push("t.subject = ?"); params.push(subject); }

    const rows = await db.all(`
      SELECT t.*, (SELECT COUNT(*) FROM test_attempts ta WHERE ta.test_id = t.id) as attemptedBy,
             ROUND((SELECT AVG(score) FROM test_attempts ta WHERE ta.test_id = t.id), 1) as avgScore
      FROM tests t
      ${where.length ? "WHERE " + where.join(" AND ") : ""}
      ORDER BY t.created_at DESC
    `, params);

    const tests = rows.map(r => ({
      id: r.id, title: r.title, type: r.type, questions: r.questions_count,
      duration: r.duration_min, maxMarks: r.max_marks, attemptedBy: r.attemptedBy, avgScore: r.avgScore, difficulty: r.difficulty
    }));
    return res.json(JSON_OK({ tests }));
  } catch (e) {
    return res.status(500).json(JSON_ERR("Failed to fetch tests", "TEST_500"));
  }
};

export const startTest = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const userId = req.user.id;
    const db = await getDb();

    const test = await db.get(`SELECT * FROM tests WHERE id = ?`, [id]);
    if (!test) return res.status(404).json(JSON_ERR("Test not found", "TEST_404"));


    if (test.course_id) {
      const enr = await db.get(`SELECT 1 FROM enrollments WHERE user_id = ? AND course_id = ?`, [userId, test.course_id]);
      if (!enr) return res.status(403).json(JSON_ERR("Not enrolled for this course", "TEST_403"));
    }

    const qs = await db.all(`SELECT id, question, options_json, marks, negative_marks FROM test_questions WHERE test_id = ? ORDER BY id`, [id]);

    const sessionId = `TEST_${userId}_${Date.now()}`;
    await db.run(
      `INSERT INTO test_attempts (user_id, test_id, session_id, started_at, status) VALUES (?, ?, ?, datetime('now'), 'in_progress')`,
      [userId, id, sessionId]
    );

    const questions = qs.map(q => ({
      id: q.id,
      question: q.question,
      options: JSON.parse(q.options_json),
      marks: q.marks,
      negativeMarks: q.negative_marks
    }));

    const startTime = new Date().toISOString();
    const endTime = new Date(Date.now() + test.duration_min * 60000).toISOString();

    return res.status(201).json(JSON_OK({
      testSession: { sessionId, startTime, endTime, questions }
    }));
  } catch (e) {
    return res.status(500).json(JSON_ERR("Failed to start test", "TEST_500"));
  }
};

export const submitTest = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { answers, timeSpent } = req.body;
    const userId = req.user.id;
    const db = await getDb();

    const attempt = await db.get(`SELECT * FROM test_attempts WHERE session_id = ? AND user_id = ?`, [sessionId, userId]);
    if (!attempt) return res.status(404).json(JSON_ERR("Session not found", "TEST_404"));
    if (attempt.status === "submitted") return res.status(409).json(JSON_ERR("Already submitted", "TEST_409"));

    const test = await db.get(`SELECT * FROM tests WHERE id = ?`, [attempt.test_id]);
    const qs = await db.all(`SELECT * FROM test_questions WHERE test_id = ?`, [test.id]);

    let score = 0, correct = 0, incorrect = 0, unattempted = 0;
    const answerMap = new Map(answers.map(a => [a.questionId, a.selectedOption]));

    for (const q of qs) {
      const selected = answerMap.get(q.id);
      if (selected == null) { unattempted++; continue; }
      if (selected === q.correct_option) { score += q.marks; correct++; }
      else { score -= q.negative_marks; incorrect++; }
      await db.run(
        `INSERT INTO test_attempt_answers (attempt_id, question_id, selected_option) VALUES (?, ?, ?)`,
        [attempt.id, q.id, selected]
      );
    }

    await db.run(
      `UPDATE test_attempts SET status='submitted', finished_at=datetime('now'), time_spent_sec=?, score=? WHERE id=?`,
      [Math.max(0, parseInt(timeSpent || 0, 10)), score, attempt.id]
    );

    const analysis = {
      physics: { score, accuracy: `${qs.length ? Math.round((correct / qs.length) * 100) : 0}%` }
    };


    const peers = await db.all(`SELECT score FROM test_attempts WHERE test_id = ? AND status='submitted'`, [test.id]);
    const better = peers.filter(p => p.score > score).length;
    const rank = better + 1;
    const percentile = peers.length ? Math.round(((peers.length - better) / peers.length) * 1000) / 10 : 100;

    return res.json(JSON_OK({
      result: {
        score, maxScore: test.max_marks, rank, percentile, correct, incorrect, unattempted, analysis
      }
    }));
  } catch (e) {
    return res.status(500).json(JSON_ERR("Failed to submit test", "TEST_500"));
  }
};
