import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import Database from "better-sqlite3";
import dotenv from "dotenv";
import admin from "firebase-admin";
import firebaseConfig from "./firebase-applet-config.json";

dotenv.config();

// Initialize Firebase Admin
admin.initializeApp({
  projectId: firebaseConfig.projectId,
});

const app = express();
const PORT = 3000;

app.use(express.json());

// Database setup (Only for weeks now)
const db = new Database("mamakeya.db");

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS pregnancy_weeks (
    week_number INTEGER PRIMARY KEY,
    baby_size TEXT,
    baby_development TEXT,
    mother_changes TEXT,
    health_tips TEXT,
    nutrition_tips TEXT
  );
`);

// Middleware for auth verification using Firebase Admin
const authenticateToken = async (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.sendStatus(401);

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error("Token verification failed:", error);
    res.sendStatus(403);
  }
};

// Pregnancy Week Info
app.get("/api/weeks/:week", authenticateToken, (req, res) => {
  const week = db.prepare("SELECT * FROM pregnancy_weeks WHERE week_number = ?").get(req.params.week);
  res.json(week);
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
