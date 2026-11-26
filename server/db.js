// sqlite through sql.js
// the database lives in memory so save it to a file after writes
const fs = require('fs');
const path = require('path');
const initSqlJs = require('sql.js');

// make sure the data folder is there first
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// use the env path if one was set
const dbPath = process.env.DATABASE_PATH || path.join(dataDir, 'capsules.db');

let SQL; // sql.js once its loaded
let db; // the open database in memory

// save the current database to disk for the next start
function persist() {
  const data = db.export();
  fs.writeFileSync(dbPath, Buffer.from(data));
}

// pair column names with their values to build a row
function mapColumns(columns, values) {
  const row = {};
  columns.forEach((col, i) => {
    row[col] = values[i];
  });
  return row;
}

// give the routes a simple way to read and write rows
function prepare(sql) {
  return {
    // get every matching row
    all(...params) {
      const stmt = db.prepare(sql);
      if (params.length) stmt.bind(params);
      const rows = [];
      while (stmt.step()) {
        rows.push(mapColumns(stmt.getColumnNames(), stmt.get()));
      }
      stmt.free(); // free the statement so it doesnt hold onto memory
      return rows;
    },
    // get the first match if there is one
    get(...params) {
      const rows = this.all(...params);
      return rows[0] || undefined;
    },
    // run the write and report what changed
    run(...params) {
      db.run(sql, params);
      const changes = db.getRowsModified();
      // ask sqlite for the id of the last insert
      const idRow = db.exec('SELECT last_insert_rowid() AS id');
      const lastInsertRowid =
        idRow[0] && idRow[0].values[0] ? idRow[0].values[0][0] : 0;
      persist(); // save after the write
      return { changes, lastInsertRowid };
    }
  };
}

// open the database and set up the table if needed
// give the server helpers for running queries
async function initDb() {
  if (db) return { prepare, exec: (sql) => db.run(sql) }; // reuse the database if its already open

  SQL = await initSqlJs();
  if (fs.existsSync(dbPath)) {
    // read the saved database into memory
    const fileBuffer = fs.readFileSync(dbPath);
    db = new SQL.Database(fileBuffer);
  } else {
    // start empty if theres no saved file
    db = new SQL.Database();
  }

  // only create the table if it doesnt exist yet
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
  persist(); // save the schema to disk

  return { prepare, exec: (sql) => db.run(sql) };
}

module.exports = { initDb };
