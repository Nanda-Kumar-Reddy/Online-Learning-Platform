import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { getDb } from "../config/database.js";
import { JSON_ERR, JSON_OK, ROLES } from "../utils/constants.js";
dotenv.config();

function signToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || "1d" });
}

export const registerLearner = async (req, res) => {
  try {
    const { name, email, password, mobile, targetExam, preferredLanguage } = req.body;
    console.log("Registering learner:", { name, email, mobile, targetExam, preferredLanguage });
    const db = await getDb();
    console.log('db',db)
    console.log("users", await db.all("SELECT id FROM users"));

    const exist = await db.get("SELECT id FROM users WHERE email = ?", [email]);
    console.log("User exists:", exist);
    if (exist) return res.status(409).json(JSON_ERR("Email already registered", "AUTH_409"));

    const hash = await bcrypt.hash(password, 10);

    const result = await db.run(
      `INSERT INTO users (name, email, password_hash, mobile, role, target_exam, preferred_language, level) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, email, hash, mobile, ROLES.LEARNER, targetExam || null, preferredLanguage || null, "beginner"]
    );
console.log("User registered with ID:", result.lastID);
    const id = result.lastID;
    const token = signToken({ id, role: ROLES.LEARNER, name });

    return res.status(201).json(JSON_OK({ message: "Registration successful", userId: id, token }));
  } catch (e) {
    console.error("Registration error:", e);
    return res.status(500).json(JSON_ERR("Failed to register", "AUTH_500"));
  }
};

export const registerEducator = async (req, res) => {
  try {
    const { name, email, password, mobile, subjects, qualification, experience, bio } = req.body;
    const db = await getDb();

    const exist = await db.get("SELECT id FROM users WHERE email = ?", [email]);
    if (exist) return res.status(409).json(JSON_ERR("Email already registered", "AUTH_409"));

    const hash = await bcrypt.hash(password, 10);
    const tx = await db.exec("BEGIN");
    try {
      const uRes = await db.run(
        `INSERT INTO users (name, email, password_hash, mobile, role) VALUES (?, ?, ?, ?, ?)`,
        [name, email, hash, mobile, ROLES.EDUCATOR]
      );
      const userId = uRes.lastID;
      await db.run(
        `INSERT INTO educators (user_id, qualification, experience_years, bio, is_verified, rating) 
         VALUES (?, ?, ?, ?, 0, 0)`,
        [userId, qualification || null, experience || 0, bio || null]
      );
      if (Array.isArray(subjects) && subjects.length) {
        for (const s of subjects) {
          await db.run(`INSERT INTO educator_subjects (educator_id, subject) VALUES (
            (SELECT id FROM educators WHERE user_id = ?), ?
          )`, [userId, s]);
        }
      }
      await db.exec("COMMIT");
      const token = signToken({ id: userId, role: ROLES.EDUCATOR, name });
      return res.status(201).json(JSON_OK({ message: "Educator registered", userId, token }));
    } catch (err) {
      await db.exec("ROLLBACK");
      throw err;
    }
  } catch (e) {
    return res.status(500).json(JSON_ERR("Failed to register educator", "AUTH_500"));
  }
};

export const login = async (req, res) => {
  try {
    const { email, password, role } = req.body;
    const db = await getDb();
    const user = await db.get("SELECT * FROM users WHERE email = ?", [email]);
    if (!user) return res.status(401).json(JSON_ERR("Invalid credentials", "AUTH_401"));
    if (role && user.role !== role) return res.status(403).json(JSON_ERR("Role mismatch", "AUTH_403"));

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json(JSON_ERR("Invalid credentials", "AUTH_401"));

    const token = signToken({ id: user.id, role: user.role, name: user.name });
    return res.status(200).json(JSON_OK({ token, user: { id: user.id, name: user.name, role: user.role } }));
  } catch (e) {
    return res.status(500).json(JSON_ERR("Login failed", "AUTH_500"));
  }
};
