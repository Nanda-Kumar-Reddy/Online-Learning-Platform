import { getDb } from "../config/database.js";
import { JSON_ERR, JSON_OK } from "../utils/constants.js";

export const dashboard = async (req, res) => {
  try {
    const userId = req.user.id;
    const db = await getDb();

    const { totalWatchTime } = await db.get(`SELECT COALESCE(SUM(watched_sec),0) as totalWatchTime FROM watch_history WHERE user_id = ?`, [userId]);
    const { coursesEnrolled } = await db.get(`SELECT COUNT(*) as coursesEnrolled FROM enrollments WHERE user_id = ?`, [userId]);
    const { coursesCompleted } = await db.get(`SELECT COUNT(*) as coursesCompleted FROM enrollments WHERE user_id = ? AND progress_percent >= 100`, [userId]);


    const weeklyProgress = { watchTime: [120,95,110,130,140,90,105], lessonsCompleted: [3,2,3,4,3,2,3] };

    return res.json(JSON_OK({
      dashboard: {
        streakDays: 7,
        totalWatchTime,
        coursesEnrolled,
        coursesCompleted,
        upcomingClasses: 2,
        pendingTests: 3,
        weeklyProgress
      }
    }));
  } catch (e) {
    return res.status(500).json(JSON_ERR("Failed to fetch dashboard", "PROG_500"));
  }
};

export const courseProgress = async (req, res) => {
  try {
    const userId = req.user.id;
    const courseId = parseInt(req.params.courseId, 10);
    const db = await getDb();

    const enr = await db.get(`SELECT * FROM enrollments WHERE user_id = ? AND course_id = ?`, [userId, courseId]);
    if (!enr) return res.status(404).json(JSON_ERR("Not enrolled", "PROG_404"));

    const chapters = await db.all(`
      SELECT l.chapter as name,
             SUM(CASE WHEN wh.completed=1 THEN 1 ELSE 0 END) as completedLessons,
             COUNT(*) as totalLessons
      FROM lessons l
      LEFT JOIN watch_history wh ON wh.lesson_id = l.id AND wh.user_id = ?
      WHERE l.course_id = ?
      GROUP BY l.chapter
    `, [userId, courseId]);

    const tests = await db.all(`SELECT COUNT(*) as c FROM tests WHERE course_id = ?`, [courseId]);
    const attempts = await db.all(`SELECT COUNT(*) as a, AVG(score) as avg FROM test_attempts ta JOIN tests t ON t.id = ta.test_id WHERE ta.user_id = ? AND t.course_id = ? AND ta.status='submitted'`, [userId, courseId]);
    const testsAttempted = attempts[0]?.a || 0;
    const avgTestScore = Math.round(attempts[0]?.avg || 0);

    return res.json(JSON_OK({
      progress: {
        courseId,
        enrolledOn: enr.purchase_date,
        validity: enr.expiry_date,
        overallProgress: enr.progress_percent,
        chapters: chapters.map(c => ({
          name: c.name,
          progress: c.totalLessons ? Math.round((c.completedLessons / c.totalLessons) * 100) : 0,
          completedLessons: c.completedLessons,
          totalLessons: c.totalLessons
        })),
        testsAttempted,
        avgTestScore,
        certificateEligible: enr.progress_percent >= 90
      }
    }));
  } catch (e) {
    return res.status(500).json(JSON_ERR("Failed to fetch progress", "PROG_500"));
  }
};
