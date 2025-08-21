import { getDb } from "../config/database.js";
import { JSON_ERR, JSON_OK } from "../utils/constants.js";

export const courseMaterials = async (req, res) => {
  try {
    const courseId = parseInt(req.params.courseId, 10);
    const userId = req.user.id;
    const db = await getDb();

    const enr = await db.get(`SELECT 1 FROM enrollments WHERE user_id = ? AND course_id = ?`, [userId, courseId]);
    if (!enr) return res.status(403).json(JSON_ERR("Not enrolled", "MAT_403"));

    const mats = await db.all(`SELECT * FROM materials WHERE course_id = ?`, [courseId]);
    const materials = mats.map(m => ({
      id: m.id, title: m.title, type: m.type, chapter: m.chapter, size: m.size_label,
      downloadUrl: `https://cdn.example.com/material/${m.id}?u=${userId}`
    }));
    return res.json(JSON_OK({ materials }));
  } catch {
    return res.status(500).json(JSON_ERR("Failed to fetch materials", "MAT_500"));
  }
};

export const trackDownload = async (req, res) => {
  try {
    const materialId = parseInt(req.params.id, 10);
    const userId = req.user.id;
    const db = await getDb();

    await db.run(`INSERT INTO material_downloads (user_id, material_id, downloaded_at) VALUES (?, ?, datetime('now'))`, [userId, materialId]);
    return res.status(201).json(JSON_OK({ message: "Download tracked" }));
  } catch {
    return res.status(500).json(JSON_ERR("Failed to track download", "MAT_500"));
  }
};
