// Database layer built on sql.js (SQLite compiled to WebAssembly).
// sql.js keeps the database in memory, so we persist it to a file after every write.
const fs = require('fs');
const path = require('path');
const initSqlJs = require('sql.js');

// Ensure the data directory exists before we try to read/write the db file.
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Location of the on-disk database file (overridable via env for tests/deploys).
const dbPath = process.env.DATABASE_PATH || path.join(dataDir, 'capsules.db');

let SQL; // The initialized sql.js module.
let db; // The in-memory database instance.

// Dump the in-memory database to disk so data survives restarts.
function persist() {
  const data = db.export();
  fs.writeFileSync(dbPath, Buffer.from(data));
}

// Combine sql.js's separate column-name and value arrays into a plain row object.
function mapColumns(columns, values) {
  const row = {};
  columns.forEach((col, i) => {
    row[col] = values[i];
  });
  return row;
}

// Thin wrapper giving sql.js a better-sqlite3-like .all/.get/.run API.
function prepare(sql) {
  return {
    // Run the query and return all matching rows as objects.
    all(...params) {
      const stmt = db.prepare(sql);
      if (params.length) stmt.bind(params);
      const rows = [];
      while (stmt.step()) {
        rows.push(mapColumns(stmt.getColumnNames(), stmt.get()));
      }
      stmt.free(); // Release the statement to avoid leaking WASM memory.
      return rows;
    },
    // Return just the first matching row, or undefined.
    get(...params) {
      const rows = this.all(...params);
      return rows[0] || undefined;
    },
    // Execute an insert/update/delete, then report changes and the new row id.
    run(...params) {
      db.run(sql, params);
      const changes = db.getRowsModified();
      // sql.js has no lastInsertRowid helper, so query it explicitly.
      const idRow = db.exec('SELECT last_insert_rowid() AS id');
      const lastInsertRowid =
        idRow[0] && idRow[0].values[0] ? idRow[0].values[0][0] : 0;
      persist(); // Save to disk since this was a write.
      return { changes, lastInsertRowid };
    }
  };
}

// Initialize the database once and create the schema if needed.
// Returns an object exposing prepare() and a raw exec() helper.
async function initDb() {
  if (db) return { prepare, exec: (sql) => db.run(sql) }; // Reuse an already-open db.

  SQL = await initSqlJs();
  if (fs.existsSync(dbPath)) {
    // Load the existing database file into memory.
    const fileBuffer = fs.readFileSync(dbPath);
    db = new SQL.Database(fileBuffer);
  } else {
    // First run: start with an empty database.
    db = new SQL.Database();
  }

  // Create the capsules table on first run (no-op if it already exists).
  db.run(`
    CREATE TABLE IF NOT EXISTS capsules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      project_name TEXT NOT NULL,
      prompt_title TEXT NOT NULL,
      prompt_version TEXT,
      prompt_text TEXT NOT NULL,
      response_summary TEXT,
      category TEXT,
      usefulness TEXT,
      reviewed INTEGER DEFAULT 0,
      improved INTEGER DEFAULT 0,
      screenshot_url TEXT,
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);
  persist(); // Write the (possibly newly created) schema to disk.

  return { prepare, exec: (sql) => db.run(sql) };
}

module.exports = { initDb };
