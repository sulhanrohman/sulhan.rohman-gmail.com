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

  let isDbConnected = false;

  // Database Connection
  const pool = new Pool({
    user: process.env.DB_USER || 'notary_user',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'notary_db',
    password: process.env.DB_PASS || 'secure_password_change_me',
    port: 5432,
    connectionTimeoutMillis: 2000,
  });

  // Database Migration
  async function migrate() {
    try {
      console.log("Checking DB connection...");
      const client = await pool.connect();
      console.log("DB connected! Running migrations...");
      client.release();
      
      await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          role TEXT NOT NULL DEFAULT 'member',
          password TEXT -- In a real app we'd hash these
        );

        CREATE TABLE IF NOT EXISTS tasks (
          id SERIAL PRIMARY KEY,
          title TEXT NOT NULL,
          description TEXT,
          assigned_to INTEGER REFERENCES users(id),
          assigned_to_name TEXT,
          status TEXT DEFAULT 'pending',
          created_at BIGINT,
          updated_at BIGINT,
          result_url TEXT,
          result_notes TEXT,
          feedback TEXT,
          due_date BIGINT
        );

        -- Insert seed admin if no users exist
        INSERT INTO users (name, email, role, password)
        SELECT 'John Notary', 'notary@bank.com', 'notary', 'password'
        WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'notary@bank.com');
      `);
      isDbConnected = true;
      console.log("Migrations completed.");
    } catch (err) {
      console.error("⚠️ Database connection failed. Running in mock mode.");
      console.error("Error details:", err instanceof Error ? err.message : err);
      isDbConnected = false;
    }
  }

  await migrate();

  // Handle pool errors
  pool.on('error', (err) => {
    console.error('Unexpected error on idle database client', err);
    isDbConnected = false;
  });

  app.use(express.json());

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: isDbConnected ? "ok" : "degraded", 
      message: isDbConnected ? "Banking Notary API is active" : "API active, DB offline",
      time: new Date().toISOString(),
      env: process.env.NODE_ENV || 'development',
      db: isDbConnected
    });
  });

  // Auth / Login Mock
  app.post("/api/login", async (req, res) => {
    const { email } = req.body;
    if (!isDbConnected) {
      return res.json({ id: '1', name: 'John Notary', email, role: 'notary' });
    }
    try {
      const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
      if (result.rows.length > 0) {
        res.json(result.rows[0]);
      } else {
        res.status(401).json({ error: "User not found" });
      }
    } catch (err) {
      res.status(500).json({ error: "Login error" });
    }
  });

  // Users / Team Management
  app.get("/api/users", async (req, res) => {
    if (!isDbConnected) return res.json([]);
    try {
      const result = await pool.query('SELECT id, name, email, role FROM users ORDER BY id ASC');
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: "Error fetching users" });
    }
  });

  app.post("/api/users", async (req, res) => {
    const { name, email, role } = req.body;
    if (!isDbConnected) return res.status(503).json({ error: "DB unavailable" });
    try {
      const result = await pool.query(
        'INSERT INTO users (name, email, role) VALUES ($1, $2, $3) RETURNING *',
        [name, email, role || 'member']
      );
      res.status(201).json(result.rows[0]);
    } catch (err: any) {
      if (err.code === '23505') {
        res.status(400).json({ error: "Email already exists" });
      } else {
        res.status(500).json({ error: "Error creating user" });
      }
    }
  });

  app.delete("/api/users/:id", async (req, res) => {
    const { id } = req.params;
    if (!isDbConnected) return res.status(503).json({ error: "DB unavailable" });
    try {
      await pool.query('DELETE FROM users WHERE id = $1', [id]);
      res.status(204).send();
    } catch (err) {
      res.status(500).json({ error: "Error deleting user" });
    }
  });

  // Tasks API
  app.get("/api/tasks", async (req, res) => {
    if (!isDbConnected) return res.json([]);
    try {
      const result = await pool.query('SELECT * FROM tasks ORDER BY created_at DESC');
      // Map DB names to camelCase for frontend
      const tasks = result.rows.map(row => ({
        id: row.id.toString(),
        title: row.title,
        description: row.description,
        assignedTo: row.assigned_to?.toString(),
        assignedToName: row.assigned_to_name,
        status: row.status,
        createdAt: Number(row.created_at),
        updatedAt: Number(row.updated_at),
        resultUrl: row.result_url,
        resultNotes: row.result_notes,
        feedback: row.feedback,
        dueDate: Number(row.due_date)
      }));
      res.json(tasks);
    } catch (err) {
      console.error("DB Error:", err);
      res.status(500).json({ error: "Database error" });
    }
  });

  app.post("/api/tasks", async (req, res) => {
    const { title, description, assignedTo, assignedToName, dueDate } = req.body;
    try {
      const result = await pool.query(
        `INSERT INTO tasks (title, description, assigned_to, assigned_to_name, status, created_at, updated_at, due_date)
         VALUES ($1, $2, $3, $4, 'pending', $5, $5, $6) RETURNING *`,
        [title, description, assignedTo, assignedToName, Date.now(), dueDate]
      );
      res.status(201).json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: "Error creating task" });
    }
  });

  app.patch("/api/tasks/:id", async (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    
    const fields: string[] = [];
    const values: any[] = [];
    let i = 1;

    // Mapping camelCase to snake_case for DB
    const mapping: Record<string, string> = {
      status: 'status',
      feedback: 'feedback',
      resultUrl: 'result_url',
      resultNotes: 'result_notes',
      updatedAt: 'updated_at'
    };

    Object.keys(updates).forEach(key => {
      if (mapping[key]) {
        fields.push(`${mapping[key]} = $${i++}`);
        values.push(updates[key]);
      }
    });

    if (fields.length === 0) return res.status(400).send("No valid fields to update");

    values.push(id);
    const query = `UPDATE tasks SET ${fields.join(', ')} WHERE id = $${i} RETURNING *`;
    
    try {
      const result = await pool.query(query, values);
      res.json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: "Error updating task" });
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
