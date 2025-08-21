import { getDb } from "../config/database.js";
import { JSON_ERR, JSON_OK } from "../utils/constants.js";
import { buildFilters, pagination } from "../utils/helpers.js";

export const listCourses = async (req, res) => {
  try {
    const filters = buildFilters(req.query, ["exam", "subject", "language", "type", "educator", "sort"]);
    const { limit, offset } = pagination(req.query);

    const where = [];
    const params = [];
    if (filters.exam) { where.push("c.target_exam = ?"); params.push(filters.exam); }
    if (filters.language) { where.push("c.language = ?"); params.push(filters.language); }
    if (filters.type) { where.push("c.course_type = ?"); params.push(filters.type); }
    if (filters.educator) { where.push("c.educator_id = ?"); params.push(+filters.educator); }
    if (filters.subject) { where.push("EXISTS (SELECT 1 FROM course_subjects cs WHERE cs.course_id = c.id AND cs.subject = ?)"); params.push(filters.subject); }

    const orderBy =
      filters.sort === "price" ? "c.discounted_price ASC"
      : filters.sort === "rating" ? "c.rating DESC"
      : "c.popularity DESC";

    const db = await getDb();
    const sql = `
      SELECT c.*, e.id as educatorId, u.name as educatorName, e.rating as educatorRating
      FROM courses c
      JOIN educators e ON e.id = c.educator_id
      JOIN users u ON u.id = e.user_id
      ${where.length ? "WHERE " + where.join(" AND ") : ""}
      ORDER BY ${orderBy}
      LIMIT ? OFFSET ?
    `;
    const rows = await db.all(sql, [...params, limit, offset]);

    const courses = rows.map(r => ({
      id: r.id,
      title: r.title,
      educator: { id: r.educatorId, name: r.educatorName, rating: r.educatorRating },
      targetExam: r.target_exam,
      duration: r.duration_text,
      totalLessons: r.total_lessons,
      language: r.language,
      price: r.price,
      discountedPrice: r.discounted_price,
      rating: r.rating,
      enrolledStudents: r.popularity,
      thumbnail: r.thumbnail_url,
      highlights: r.highlights ? JSON.parse(r.highlights) : []
    }));

    return res.json(JSON_OK({ courses }));
  } catch (e) {
    return res.status(500).json(JSON_ERR("Failed to fetch courses", "COURSE_500"));
  }
};

export const getCourseDetails = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const db = await getDb();

    const c = await db.get(`
      SELECT c.*, e.id as educatorId, u.name as educatorName, e.qualification, e.experience_years, e.rating as educatorRating
      FROM courses c
      JOIN educators e ON e.id = c.educator_id
      JOIN users u ON u.id = e.user_id
      WHERE c.id = ?`, [id]);
    if (!c) return res.status(404).json(JSON_ERR("Course not found", "COURSE_404"));

    const syllabus = await db.all(`
      SELECT chapter, id as lessonId, title, duration_sec, is_free 
      FROM lessons WHERE course_id = ? ORDER BY chapter_order, lesson_order`, [id]);

    const grouped = {};
    for (const l of syllabus) {
      if (!grouped[l.chapter]) grouped[l.chapter] = [];
      grouped[l.chapter].push({
        id: l.lessonId,
        title: l.title,
        duration: `${Math.round(l.duration_sec/60)} mins`,
        isFree: !!l.is_free
      });
    }
    const syllabusArr = Object.entries(grouped).map(([chapter, lessons]) => ({ chapter, lessons }));

    const features = {
      liveClasses: c.live_count,
      recordedVideos: c.total_lessons,
      mockTests: c.mock_tests,
      pdfNotes: !!c.pdf_notes,
      doubtSupport: !!c.doubt_support
    };

    const course = {
      id: c.id,
      title: c.title,
      description: c.description,
      educator: { id: c.educatorId, name: c.educatorName, qualification: c.qualification, experience: `${c.experience_years} years`, rating: c.educatorRating },
      syllabus: syllabusArr,
      features,
      validity: c.validity_text,
      price: c.price,
      reviews: [] 
    };

    return res.json(JSON_OK({ course }));
  } catch (e) {
    return res.status(500).json(JSON_ERR("Failed to fetch course", "COURSE_500"));
  }
};

export const enrollCourse = async (req, res) => {
  try {
    const courseId = parseInt(req.params.id, 10);
    const userId = req.user.id;
    const db = await getDb();

    const already = await db.get(`SELECT 1 FROM enrollments WHERE user_id = ? AND course_id = ?`, [userId, courseId]);
    if (already) return res.status(409).json(JSON_ERR("Already enrolled", "ENROLL_409"));

    const course = await db.get(`SELECT validity_days FROM courses WHERE id = ?`, [courseId]);
    if (!course) return res.status(404).json(JSON_ERR("Course not found", "COURSE_404"));

    await db.run(
      `INSERT INTO enrollments (user_id, course_id, purchase_date, expiry_date, progress_percent) 
       VALUES (?, ?, date('now'), date('now', ?), 0)`,
      [userId, courseId, `+${course.validity_days} days`]
    );
    return res.status(201).json(JSON_OK({ message: "Enrolled successfully" }));
  } catch (e) {
    return res.status(500).json(JSON_ERR("Enrollment failed", "ENROLL_500"));
  }
};
