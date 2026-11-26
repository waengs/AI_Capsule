// CRUD routes for prompt "capsules". Every row is scoped to the logged-in user.
const express = require('express');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// Every capsule route requires a valid session.
router.use(requireAuth);

// Pull the shared database handle off the Express app.
function getDb(req) {
  return req.app.locals.db;
}

// Normalize the various truthy forms (checkbox, "Yes", 1, etc.) into a SQLite 0/1.
function toBoolInt(value) {
  if (value === true || value === 1 || value === '1' || value === 'Yes' || value === 'yes') return 1;
  return 0;
}

// Convert stored 0/1 flags back into the "Yes"/"No" strings the UI expects.
function mapRow(row) {
  return {
    ...row,
    reviewed: row.reviewed ? 'Yes' : 'No',
    improved: row.improved ? 'Yes' : 'No'
  };
}

// GET /api/capsules — list the current user's capsules, newest first.
router.get('/', (req, res) => {
  const rows = getDb(req)
    .prepare('SELECT * FROM capsules WHERE user_id = ? ORDER BY datetime(created_at) DESC, id DESC')
    .all(req.user.id);
  res.json(rows.map(mapRow));
});

// POST /api/capsules — create a new capsule for the current user.
router.post('/', (req, res) => {
  const {
    project_name,
    prompt_title,
    prompt_version,
    prompt_text,
    response_summary,
    category,
    usefulness,
    reviewed,
    improved,
    screenshot_url,
    notes
  } = req.body || {};

  // These three fields are the minimum a capsule needs to be meaningful.
  if (!project_name || !prompt_title || !prompt_text) {
    return res.status(400).json({
      error: 'project_name, prompt_title and prompt_text are required'
    });
  }

  const db = getDb(req);
  // Parameterized insert; optional fields fall back to null when empty.
  const result = db
    .prepare(
      `INSERT INTO capsules (
        user_id, project_name, prompt_title, prompt_version, prompt_text,
        response_summary, category, usefulness, reviewed, improved,
        screenshot_url, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      req.user.id,
      String(project_name).trim(),
      String(prompt_title).trim(),
      prompt_version ? String(prompt_version).trim() : null,
      String(prompt_text).trim(),
      response_summary ? String(response_summary).trim() : null,
      category ? String(category).trim() : null,
      usefulness ? String(usefulness).trim() : null,
      toBoolInt(reviewed),
      toBoolInt(improved),
      screenshot_url ? String(screenshot_url).trim() : null,
      notes ? String(notes).trim() : null
    );

  // Return the freshly created row so the client can render it immediately.
  const created = db.prepare('SELECT * FROM capsules WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(mapRow(created));
});

// PUT /api/capsules/:id — update an existing capsule the user owns.
router.put('/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ error: 'Invalid id' });
  }

  const db = getDb(req);
  // Fetch scoped by user_id so one user cannot read/edit another's capsule.
  const existing = db
    .prepare('SELECT * FROM capsules WHERE id = ? AND user_id = ?')
    .get(id, req.user.id);

  if (!existing) {
    return res.status(404).json({ error: 'Capsule not found' });
  }

  // Fall back to the existing values for any field the request omits (partial update).
  const {
    project_name = existing.project_name,
    prompt_title = existing.prompt_title,
    prompt_version = existing.prompt_version,
    prompt_text = existing.prompt_text,
    response_summary = existing.response_summary,
    category = existing.category,
    usefulness = existing.usefulness,
    reviewed = existing.reviewed,
    improved = existing.improved,
    screenshot_url = existing.screenshot_url,
    notes = existing.notes
  } = req.body || {};

  if (!project_name || !prompt_title || !prompt_text) {
    return res.status(400).json({
      error: 'project_name, prompt_title and prompt_text are required'
    });
  }

  db.prepare(
    `UPDATE capsules SET
      project_name = ?,
      prompt_title = ?,
      prompt_version = ?,
      prompt_text = ?,
      response_summary = ?,
      category = ?,
      usefulness = ?,
      reviewed = ?,
      improved = ?,
      screenshot_url = ?,
      notes = ?
    WHERE id = ? AND user_id = ?`
  ).run(
    String(project_name).trim(),
    String(prompt_title).trim(),
    prompt_version ? String(prompt_version).trim() : null,
    String(prompt_text).trim(),
    response_summary ? String(response_summary).trim() : null,
    category ? String(category).trim() : null,
    usefulness ? String(usefulness).trim() : null,
    toBoolInt(reviewed),
    toBoolInt(improved),
    screenshot_url ? String(screenshot_url).trim() : null,
    notes ? String(notes).trim() : null,
    id,
    req.user.id
  );

  // Return the updated row.
  const updated = db.prepare('SELECT * FROM capsules WHERE id = ?').get(id);
  res.json(mapRow(updated));
});

// DELETE /api/capsules/:id — remove a capsule the user owns.
router.delete('/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ error: 'Invalid id' });
  }

  // user_id in the WHERE clause doubles as the ownership check.
  const result = getDb(req)
    .prepare('DELETE FROM capsules WHERE id = ? AND user_id = ?')
    .run(id, req.user.id);

  // No rows changed means it did not exist or belonged to someone else.
  if (result.changes === 0) {
    return res.status(404).json({ error: 'Capsule not found' });
  }

  res.json({ ok: true, id });
});

module.exports = router;
