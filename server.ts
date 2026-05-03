import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import pg from "pg";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Database Connection (using variables from deploy.sh)
  const pool = new pg.Pool({
    user: process.env.DB_USER || 'notary_user',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'notary_db',
    password: process.env.DB_PASS || 'secure_password_change_me',
    port: 5432,
  });

  app.use(express.json());

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "Banking Notary API is active" });
  });

  app.get("/api/tasks", async (req, res) => {
    try {
      // For now, returning mock data or attempting DB query if table exists
      // const result = await pool.query('SELECT * FROM tasks');
      // res.json(result.rows);
      res.json({ message: "DB connected. Tables pending migration." });
    } catch (err) {
      res.status(500).json({ error: "Database connection error" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
}

startServer();
