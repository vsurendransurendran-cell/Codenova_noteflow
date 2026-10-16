/**
 * Database Connection & Adapter Layer
 * 
 * Supports native `better-sqlite3` when installed, with an automatic
 * in-process WebAssembly SQLite (`sql.js`) fallback that persists standard
 * binary SQLite database files (.db) to disk.
 * 
 * Exposes the standard better-sqlite3 API:
 *   - db.prepare(sql).all(...params)
 *   - db.prepare(sql).get(...params)
 *   - db.prepare(sql).run(...params)
 *   - db.exec(sql)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Default DB path points to server/data/notes.db or root notes.db
const defaultDbDir = path.resolve(__dirname, '../../data');
const defaultDbPath = path.resolve(defaultDbDir, 'notes.db');

class WasmSqliteWrapper {
  constructor(sqlInstance, dbFilePath) {
    this.SQL = sqlInstance;
    this.dbFilePath = dbFilePath;

    const dir = path.dirname(this.dbFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    if (fs.existsSync(this.dbFilePath)) {
      try {
        const fileBuffer = fs.readFileSync(this.dbFilePath);
        this.db = new this.SQL.Database(fileBuffer);
      } catch (err) {
        console.warn('Could not read existing DB file, starting fresh:', err.message);
        this.db = new this.SQL.Database();
      }
    } else {
      this.db = new this.SQL.Database();
      this.persist();
    }
  }

  persist() {
    try {
      const data = this.db.export();
      const buffer = Buffer.from(data);
      fs.writeFileSync(this.dbFilePath, buffer);
    } catch (err) {
      console.error('Failed to persist SQLite database to disk:', err.message);
    }
  }

  exec(sql) {
    this.db.run(sql);
    this.persist();
  }

  prepare(sql) {
    const self = this;
    return {
      run(...params) {
        // Flatten params array if passed as [p1, p2] or p1, p2
        const flatParams = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
        self.db.run(sql, flatParams);
        self.persist();

        // Get last inserted id and changes
        let lastInsertRowid = 0;
        let changes = 0;
        try {
          const idRes = self.db.exec('SELECT last_insert_rowid() AS id;');
          if (idRes && idRes[0] && idRes[0].values && idRes[0].values[0]) {
            lastInsertRowid = idRes[0].values[0][0];
          }
          const chRes = self.db.exec('SELECT changes() AS ch;');
          if (chRes && chRes[0] && chRes[0].values && chRes[0].values[0]) {
            changes = chRes[0].values[0][0];
          }
        } catch {
          // Ignore
        }

        return { changes, lastInsertRowid };
      },

      get(...params) {
        const flatParams = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
        const stmt = self.db.prepare(sql);
        try {
          if (flatParams && flatParams.length > 0) {
            stmt.bind(flatParams);
          }
          if (stmt.step()) {
            return stmt.getAsObject();
          }
          return undefined;
        } finally {
          stmt.free();
        }
      },

      all(...params) {
        const flatParams = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
        const stmt = self.db.prepare(sql);
        const rows = [];
        try {
          if (flatParams && flatParams.length > 0) {
            stmt.bind(flatParams);
          }
          while (stmt.step()) {
            rows.push(stmt.getAsObject());
          }
          return rows;
        } finally {
          stmt.free();
        }
      }
    };
  }

  close() {
    this.persist();
    this.db.close();
  }
}

let activeDb = null;

export async function runMigrations(db) {
  // 1. Ensure table exists with all columns
  db.exec(`
    CREATE TABLE IF NOT EXISTS notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      category TEXT DEFAULT 'Personal',
      tags TEXT DEFAULT '[]',
      pinned INTEGER DEFAULT 0,
      favorite INTEGER DEFAULT 0,
      color TEXT DEFAULT 'default',
      is_trashed INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 2. Safely add any missing columns to existing database
  try {
    const columns = db.prepare("PRAGMA table_info(notes);").all();
    const colNames = new Set(columns.map(c => c.name));

    if (!colNames.has('category')) {
      db.exec("ALTER TABLE notes ADD COLUMN category TEXT DEFAULT 'Personal';");
    }
    if (!colNames.has('tags')) {
      db.exec("ALTER TABLE notes ADD COLUMN tags TEXT DEFAULT '[]';");
    }
    if (!colNames.has('pinned')) {
      db.exec("ALTER TABLE notes ADD COLUMN pinned INTEGER DEFAULT 0;");
    }
    if (!colNames.has('favorite')) {
      db.exec("ALTER TABLE notes ADD COLUMN favorite INTEGER DEFAULT 0;");
    }
    if (!colNames.has('color')) {
      db.exec("ALTER TABLE notes ADD COLUMN color TEXT DEFAULT 'default';");
    }
    if (!colNames.has('is_trashed')) {
      db.exec("ALTER TABLE notes ADD COLUMN is_trashed INTEGER DEFAULT 0;");
    }
  } catch (err) {
    console.warn('[DB Migration Warning]', err.message);
  }

  // 3. Seed initial rich demo notes if table is completely empty
  try {
    const countRow = db.prepare("SELECT COUNT(*) as count FROM notes;").get();
    if (countRow && countRow.count === 0) {
      console.log('[Database] Seeding initial CodeNova portfolio notes...');
      const seedNotes = [
        {
          title: "🚀 Welcome to NoteFlow — CodeNova Project",
          content: "Welcome to NoteFlow! Designed for maximum productivity with:\n\n- 📌 Pin important notes to keep them on top\n- ⭐ Star favorites for instant filtering\n- 🏷️ Categorize by Work, Study, Ideas, and CodeNova\n- ✍️ Rich Markdown, checklists, & color accents\n- 🌙 Dark Mode support\n- 🤖 AI Summarization & Note Assistant\n- ↩️ Trash with instant Undo recovery",
          category: "CodeNova",
          tags: JSON.stringify(["internship", "portfolio", "getting-started"]),
          pinned: 1,
          favorite: 1,
          color: "blue"
        },
        {
          title: "📋 CodeNova Internship Milestones & Checklist",
          content: "Track project deliverables and internship goals:\n\n[x] Initialize full-stack SQLite WASM architecture\n[x] Implement responsive layout & sidebar navigation\n[x] Add Pinning, Favorites, and Categories\n[x] Build real-time multi-field search and tags\n[x] Implement Trash Bin with 1-click Undo\n[ ] Record portfolio demo walkthrough video\n[ ] Publish LinkedIn project showcase post",
          category: "Work",
          tags: JSON.stringify(["roadmap", "checklist", "goals"]),
          pinned: 1,
          favorite: 0,
          color: "purple"
        },
        {
          title: "💡 Architecture & Tech Stack Highlights",
          content: "NoteFlow Technical Specifications:\n\n- Frontend: React 19, Lucide Icons, Custom CSS Design System\n- Backend: Express, Parameterized SQLite WASM with file persistence\n- Features: Debounced real-time search, responsive mobile drawer, JSON/MD import/export\n- AI: Server-side Gemini API integration for instant summaries and action item extraction",
          category: "Study",
          tags: JSON.stringify(["architecture", "react", "sqlite", "node"]),
          pinned: 0,
          favorite: 1,
          color: "emerald"
        },
        {
          title: "🎯 Weekly Sprint Ideas & Innovation",
          content: "Brainstorming future enhancements:\n\n1. Graph view showing inter-connected notes with tag clustering\n2. Voice dictation note capture\n3. Export to PDF and Notion markdown format",
          category: "Ideas",
          tags: JSON.stringify(["brainstorming", "ideas"]),
          pinned: 0,
          favorite: 0,
          color: "amber"
        }
      ];

      for (const item of seedNotes) {
        db.prepare(`
          INSERT INTO notes (title, content, category, tags, pinned, favorite, color, is_trashed, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, 0, datetime('now'), datetime('now'));
        `).run(item.title, item.content, item.category, item.tags, item.pinned, item.favorite, item.color);
      }
    }
  } catch (seedErr) {
    console.warn('[Database Seed Warning]', seedErr.message);
  }
}

/**
 * Initializes and returns the SQLite database connection.
 * @param {string} [customPath] Optional custom database file path
 * @returns {Promise<any>}
 */
export async function getDatabase(customPath) {
  if (activeDb) {
    return activeDb;
  }

  const dbPath = customPath || process.env.DB_PATH || defaultDbPath;
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // 1. Attempt to load native better-sqlite3 first (standard Windows/dev environment)
  try {
    const { default: Database } = await import('better-sqlite3');
    activeDb = new Database(dbPath);
    try {
      activeDb.pragma('journal_mode = WAL');
      activeDb.pragma('foreign_keys = ON');
    } catch {
      // pragma is optional
    }
    console.log(`[Database] Connected using native better-sqlite3 at ${dbPath}`);
    await runMigrations(activeDb);
    return activeDb;
  } catch {
    // Fall through to Wasm SQLite engine
  }

  // 2. Fallback to sql.js (WebAssembly SQLite)
  try {
    const { default: initSqlJs } = await import('sql.js');
    const SQL = await initSqlJs();
    activeDb = new WasmSqliteWrapper(SQL, dbPath);
    console.log(`[Database] Connected using SQLite WASM engine with persistent storage at ${dbPath}`);
    await runMigrations(activeDb);
    return activeDb;
  } catch (wasmError) {
    console.error('[Database] Failed to initialize SQLite engine:', wasmError);
    throw wasmError;
  }
}

export default { getDatabase, runMigrations };
