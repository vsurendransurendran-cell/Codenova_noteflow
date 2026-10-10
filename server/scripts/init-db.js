/**
 * Database Initialization Script
 * 
 * Reads `schema.sql`, executes it against SQLite, and optionally seeds initial
 * notes if the table is currently empty.
 * Run with: node server/scripts/init-db.js or npm run db:init
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getDatabase } from '../src/db/connection.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function initDatabase() {
  console.log('--- Initializing SQLite Notes Database ---');
  
  const schemaPath = path.resolve(__dirname, '../schema.sql');
  if (!fs.existsSync(schemaPath)) {
    console.error(`Error: Schema file not found at ${schemaPath}`);
    process.exit(1);
  }

  const schemaSql = fs.readFileSync(schemaPath, 'utf8');
  const db = await getDatabase();

  console.log('Executing schema.sql...');
  db.exec(schemaSql);
  console.log('Schema executed successfully.');

  // Check if notes table already has records
  const existingNotes = db.prepare('SELECT COUNT(*) as count FROM notes;').get();
  const count = existingNotes ? (existingNotes.count || existingNotes['COUNT(*)'] || 0) : 0;

  if (Number(count) === 0) {
    console.log('Seeding initial notes...');
    const insertStmt = db.prepare(`
      INSERT INTO notes (title, content, created_at, updated_at)
      VALUES (?, ?, datetime('now'), datetime('now'));
    `);

    const seedNotes = [
      {
        title: 'Welcome to Notes App',
        content: 'This is your full-stack notes dashboard with real-time search, responsive card & list views, and SQLite persistence.'
      },
      {
        title: 'Keyboard Shortcuts & Tips',
        content: 'Press "/" to focus the search bar instantly. When writing a note, press Ctrl+Enter (or Cmd+Enter) to save immediately. Hit Esc to close any dialog.'
      },
      {
        title: 'Architecture & Features',
        content: 'Built with React (pure CSS, no heavy UI framework) and Node.js + Express with SQLite. Automatic debounce (~250ms) ensures instant search queries across title and body.'
      }
    ];

    for (const note of seedNotes) {
      insertStmt.run(note.title, note.content);
    }
    console.log(`Seeded ${seedNotes.length} initial notes.`);
  } else {
    console.log(`Database already contains ${count} note(s). Skipping seeding.`);
  }

  console.log('Database initialization complete!');
}

initDatabase().catch((err) => {
  console.error('Initialization failed:', err);
  process.exit(1);
});
