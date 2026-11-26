// capsule routes only work with the signed in users records
const express = require('express');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// check the session before running any capsule route
router.use(requireAuth);

// use the shared database from the app
function getDb(req) {
  return req.app.locals.db;
}

// store yes and no as 1 and 0 in sqlite
function toBoolInt(value) {
  if (value === true || value === 1 || value === '1' || value === 'Yes' || value === 'yes') return 1;
  return 0;
}

// turn the stored flags back into yes and no for the app
function mapRow(row) {
  return {
    ...row,
    reviewed: row.reviewed ? 'Yes' : 'No',
    improved: row.improved ? 'Yes' : 'No'
  };
}

// list this users capsules with the newest first
router.get('/', (req, res) => {
  const rows = getDb(req)
    .prepare('SELECT * FROM capsules WHERE user_id = ? ORDER BY datetime(created_at) DESC, id DESC')
    .all(req.user.id);
  res.json(rows.map(mapRow));
});

// create a capsule for the signed in user
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

  // these are the three required fields
  if (!project_name || !prompt_title || !prompt_text) {
    return res.status(400).json({
      error: 'project_name, prompt_title and prompt_text are required'
    });
  }

  const db = getDb(req);
  // bind values to the query and store empty optional fields as null
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

  // send the saved row back to the app
  const created = db.prepare('SELECT * FROM capsules WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(mapRow(created));
});

// update a capsule owned by this user
router.put('/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ error: 'Invalid id' });
  }

  const db = getDb(req);
  // look up the capsule by id and owner together
  const existing = db
    .prepare('SELECT * FROM capsules WHERE id = ? AND user_id = ?')
    .get(id, req.user.id);

  if (!existing) {
    return res.status(404).json({ error: 'Capsule not found' });
  }

  // keep the saved values for fields the request leaves out
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

  // send the updated row back to the app
  const updated = db.prepare('SELECT * FROM capsules WHERE id = ?').get(id);
  res.json(mapRow(updated));
});

// delete a capsule owned by this user
router.delete('/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ error: 'Invalid id' });
  }

  // check the owner in the delete query too
  const result = getDb(req)
    .prepare('DELETE FROM capsules WHERE id = ? AND user_id = ?')
    .run(id, req.user.id);

  // no match means the capsule is missing or belongs to someone else
  if (result.changes === 0) {
    return res.status(404).json({ error: 'Capsule not found' });
  }

  res.json({ ok: true, id });
});

module.exports = router;
