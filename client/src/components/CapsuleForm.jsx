const CATEGORIES = ['Coding', 'Writing', 'Research', 'Debugging', 'Study', 'Other'];
const USEFULNESS = ['Good', 'Needs Improvement'];
const YES_NO = ['Yes', 'No'];

export default function CapsuleForm({ form, setForm, onSubmit, onCancel, busy, editing }) {
  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  return (
    <form className="capsule-form" onSubmit={onSubmit}>
      <label>
        Project name
        <input
          required
          value={form.project_name}
          onChange={(e) => update('project_name', e.target.value)}
          placeholder="SmartFarm Irrigation"
        />
      </label>

      <label>
        Prompt title
        <input
          required
          value={form.prompt_title}
          onChange={(e) => update('prompt_title', e.target.value)}
          placeholder="Debug cloud deployment"
        />
      </label>

      <div className="form-row">
        <label>
          Version
          <input
            value={form.prompt_version}
            onChange={(e) => update('prompt_version', e.target.value)}
            placeholder="v1"
          />
        </label>
        <label>
          Category
          <select value={form.category} onChange={(e) => update('category', e.target.value)}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label>
        Prompt text
        <textarea
          required
          rows={5}
          value={form.prompt_text}
          onChange={(e) => update('prompt_text', e.target.value)}
          placeholder="Paste the prompt you used…"
        />
      </label>

      <label>
        Response summary
        <textarea
          rows={3}
          value={form.response_summary}
          onChange={(e) => update('response_summary', e.target.value)}
          placeholder="What the AI suggested…"
        />
      </label>

      <div className="form-row">
        <label>
          Usefulness
          <select value={form.usefulness} onChange={(e) => update('usefulness', e.target.value)}>
            {USEFULNESS.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
        </label>
        <label>
          Reviewed
          <select value={form.reviewed} onChange={(e) => update('reviewed', e.target.value)}>
            {YES_NO.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </label>
        <label>
          Improved
          <select value={form.improved} onChange={(e) => update('improved', e.target.value)}>
            {YES_NO.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label>
        Screenshot evidence (URL)
        <input
          type="url"
          value={form.screenshot_url}
          onChange={(e) => update('screenshot_url', e.target.value)}
          placeholder="https://…"
        />
      </label>

      <label>
        Notes
        <textarea
          rows={2}
          value={form.notes}
          onChange={(e) => update('notes', e.target.value)}
          placeholder="Reflection / comment"
        />
      </label>

      <div className="form-actions">
        <button className="btn btn-primary" type="submit" disabled={busy}>
          {busy ? 'Saving…' : editing ? 'Update record' : 'Create record'}
        </button>
        {onCancel && (
          <button className="btn btn-ghost" type="button" onClick={onCancel} disabled={busy}>
            Cancel edit
          </button>
        )}
      </div>
    </form>
  );
}
