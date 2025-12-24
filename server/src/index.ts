import express from "express";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { authRouter } from "./routes/auth.js";
import { pitchesRouter } from "./routes/pitches.js";
import { bookingsRouter } from "./routes/bookings.js";
import { adminRouter } from "./routes/admin.js";
import { teamsRouter } from "./routes/teams.js";
import { leaguesRouter } from "./routes/leagues.js";
import { matchesRouter } from "./routes/matches.js";
import { usersRouter } from "./routes/users.js";
import { uploadsRouter } from "./routes/uploads.js";
import { communityRouter } from "./routes/community.js";
import { challengesRouter } from "./routes/challenges.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

// Validate required environment variables
if (!process.env.JWT_SECRET || !process.env.JWT_REFRESH_SECRET) {
  console.error(
    "ERROR: JWT_SECRET and JWT_REFRESH_SECRET must be set in .env file"
  );
  process.exit(1);
}

if (!process.env.DATABASE_URL) {
  console.error("ERROR: DATABASE_URL must be set in .env file");
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());

// Serve static files from public/uploads
const uploadsStaticPath = path.resolve(__dirname, "../public/uploads");
console.log(`Serving static uploads from: ${uploadsStaticPath}`);
app.use("/uploads", express.static(uploadsStaticPath));

// CORS middleware
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (
    origin &&
    (origin.includes("localhost") || origin.includes("127.0.0.1"))
  ) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PATCH, DELETE, OPTIONS"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, Accept-Language"
  );

  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Routes
app.use("/api/auth", authRouter);
app.use("/api/pitches", pitchesRouter);
app.use("/api/bookings", bookingsRouter);
app.use("/api/admin", adminRouter);
app.use("/api/teams", teamsRouter);
app.use("/api/leagues", leaguesRouter);
app.use("/api/matches", matchesRouter);
app.use("/api/users", usersRouter);
app.use("/api/uploads", uploadsRouter);
app.use("/community", communityRouter);
app.use("/challenges", challengesRouter);
// Error handler
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error("Error:", err);
    res.status(err.status || 500).json({
      message: err.message || "Internal server error",
      code: err.code || "INTERNAL_ERROR",
      ...(process.env.NODE_ENV === "development" && { details: err.stack }),
    });
  }
);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
