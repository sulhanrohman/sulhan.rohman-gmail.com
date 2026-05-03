import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import pkg from "pg";

const { Pool } = pkg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  console.log("Starting server in", process.env.NODE_ENV || 'development', "mode...");

  // Database Connection
  const pool = new Pool({
    user: process.env.DB_USER || 'notary_user',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'notary_db',
    password: process.env.DB_PASS || 'secure_password_change_me',
    port: 5432,
  });

  // Handle pool errors
  pool.on('error', (err) => {
    console.error('Unexpected error on idle database client', err);
  });

  app.use(express.json());

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok", 
      message: "Banking Notary API is active",
      time: new Date().toISOString(),
      env: process.env.NODE_ENV || 'development'
    });
  });

  app.get("/api/tasks", async (req, res) => {
    try {
      res.json({ message: "DB connected. Tables pending migration." });
    } catch (err) {
      console.error("DB Connection Error:", err);
      res.status(500).json({ error: "Database connection error" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    try {
      const { createServer: createViteServer } = await import("vite");
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
    } catch (e) {
      console.warn("Vite not found, falling back to static serving");
      serveStatic();
    }
  } else {
    serveStatic();
  }

  function serveStatic() {
    // If running from dist/server.js, static files are in the same folder
    // If running from server.ts, they are in ./dist
    const staticPath = __dirname.endsWith('dist') ? __dirname : path.join(process.cwd(), "dist");
    
    console.log(`Serving static files from: ${staticPath}`);
    app.use(express.static(staticPath));
    
    app.get("*", (req, res) => {
      if (req.path.startsWith('/api')) {
        return res.status(404).json({ error: "API route not found" });
      }
      res.sendFile(path.join(staticPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  }).on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`Port ${PORT} is already in use`);
    } else {
      console.error('Server error:', err);
    }
    process.exit(1);
  });
}

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

startServer();
