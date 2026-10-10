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
    // Enable WAL mode and foreign keys for better-sqlite3
    try {
      activeDb.pragma('journal_mode = WAL');
      activeDb.pragma('foreign_keys = ON');
    } catch {
      // pragma is optional
    }
    console.log(`[Database] Connected using native better-sqlite3 at ${dbPath}`);
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
    return activeDb;
  } catch (wasmError) {
    console.error('[Database] Failed to initialize SQLite engine:', wasmError);
    throw wasmError;
  }
}

export default { getDatabase };
