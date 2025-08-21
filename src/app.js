import express from "express";
import dotenv from "dotenv";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import rateLimit from "express-rate-limit";

import authRoutes from "./routes/authRoutes.js";
import courseRoutes from "./routes/courseRoutes.js";
import lessonRoutes from "./routes/lessonRoutes.js";
import liveClassRoutes from "./routes/liveClassRoutes.js";
import testRoutes from "./routes/testRoutes.js";
import educatorRoutes from "./routes/educatorRoutes.js";
import progressRoutes from "./routes/progressRoutes.js";
import subscriptionRoutes from "./routes/subscriptionRoutes.js";
import materialRoutes from "./routes/materialRoutes.js";
import doubtRoutes from "./routes/doubtRoutes.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";
import { runSchemaIfNeeded } from "./config/database.js";
import searchRoutes from "./routes/searchRoutes.js";
import reviewRouter from "./routes/reviewRoutes.js";
dotenv.config();
const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));

const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000", 10),
  max: parseInt(process.env.RATE_LIMIT_MAX || "300", 10),
  standardHeaders: true,
  legacyHeaders: false
});
app.use(limiter);

runSchemaIfNeeded()

app.use("/api", reviewRouter);
app.use("/api/auth", authRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/lessons", lessonRoutes);
app.use("/api/live-classes", liveClassRoutes);
app.use("/api/tests", testRoutes);
app.use("/api/educators", educatorRoutes);
app.use("/api/progress", progressRoutes);
app.use("/api/subscriptions", subscriptionRoutes);
app.use("/api/materials", materialRoutes);
app.use("/api/doubts", doubtRoutes);
app.use("/api/search", searchRoutes);


app.get("/health", (_req, res) => res.json({ ok: true, uptime: process.uptime() }));


app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 4000;

const boot = async () => {
  try {

    app.listen(PORT, () => console.log(`API running on :${PORT}`));
  } catch (e) {
    console.error("Failed to start", e);
    process.exit(1);
  }
};

boot();
