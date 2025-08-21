import { getDb } from "../config/database.js";

export const globalSearch = async (req, res) => {
  try {
    const db = await getDb();
    const { q, type } = req.query;

    if (!q) {
      return res.status(400).json({ success: false, message: "Query 'q' is required" });
    }

    const results = {
      courses: [],
      educators: [],
      lessons: []
    };

    const searchQuery = `%${q}%`;

    if (!type || type === "course") {
      results.courses = await db.all(
        "SELECT * FROM courses WHERE title LIKE ? OR description LIKE ?",
        [searchQuery, searchQuery]
      );
    }

    if (!type || type === "educator") {
      results.educators = await db.all(
        "SELECT * FROM educators WHERE name LIKE ? OR bio LIKE ?",
        [searchQuery, searchQuery]
      );
    }

    if (!type || type === "lesson") {
      results.lessons = await db.all(
        "SELECT * FROM lessons WHERE title LIKE ? OR content LIKE ?",
        [searchQuery, searchQuery]
      );
    }

    res.json({ success: true, results });
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
