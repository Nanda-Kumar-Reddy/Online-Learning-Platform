import { getDb } from "../config/database.js";
import { JSON_ERR, JSON_OK, ROLES } from "../utils/constants.js";

export const addReview = async (req, res) => {
  try {
    const { id: courseId } = req.params;
    const { rating, review } = req.body;
    const userId = req.user.id;
    const db = await getDb();
console.log("Adding review for course:", { courseId, userId, rating, review });
    
    const enrolled = await db.get(
      "SELECT 1 AS enrolled FROM enrollments WHERE user_id = ? AND course_id = ?",
      [userId, courseId]
    );

    console.log("Enrolled status:", enrolled);
    if (!enrolled) {
      return res
        .status(403)
        .json(JSON_ERR("You must be enrolled to review this course", "REVIEW_403"));
    }

    await db.run(
      `INSERT INTO reviews (user_id, course_id, rating, review)
       VALUES (?, ?, ?, ?)`,
      [userId, Number(courseId), rating, review]
    );
console.log("Review added successfully");
    return res
      .status(201)
      .json(JSON_OK({ message: "Review submitted successfully" }));
  } catch (err) {
    if (err.message.includes("UNIQUE constraint failed")) {
      return res
        .status(400)
        .json(JSON_ERR("You have already reviewed this course", "REVIEW_DUPLICATE"));
    }
    console.error("Review error:", err);
    return res.status(500).json(JSON_ERR("Failed to submit review", "REVIEW_500"));
  }
};

