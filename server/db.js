const fs = require('fs');
const path = require('path');
const initSqlJs = require('sql.js');

const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = process.env.DATABASE_PATH || path.join(dataDir, 'capsules.db');

let SQL;
let db;

function persist() {
  const data = db.export();
  fs.writeFileSync(dbPath, Buffer.from(data));
}

function mapColumns(columns, values) {
  const row = {};
  columns.forEach((col, i) => {
    row[col] = values[i];
  });
  return row;
}

function prepare(sql) {
  return {
    all(...params) {
      const stmt = db.prepare(sql);
      if (params.length) stmt.bind(params);
      const rows = [];
      while (stmt.step()) {
        rows.push(mapColumns(stmt.getColumnNames(), stmt.get()));
      }
      stmt.free();
      return rows;
    },
    get(...params) {
      const rows = this.all(...params);
      return rows[0] || undefined;
    },
    run(...params) {
      db.run(sql, params);
      const changes = db.getRowsModified();
      const idRow = db.exec('SELECT last_insert_rowid() AS id');
      const lastInsertRowid =
        idRow[0] && idRow[0].values[0] ? idRow[0].values[0][0] : 0;
      persist();
      return { changes, lastInsertRowid };
    }
  };
}

async function initDb() {
  if (db) return { prepare, exec: (sql) => db.run(sql) };

  SQL = await initSqlJs();
  if (fs.existsSync(dbPath)) {
    const fileBuffer = fs.readFileSync(dbPath);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

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
  persist();

  return { prepare, exec: (sql) => db.run(sql) };
}

module.exports = { initDb };
