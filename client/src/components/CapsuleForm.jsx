// Fixed option lists for the form's dropdowns.
const CATEGORIES = ['Coding', 'Writing', 'Research', 'Debugging', 'Study', 'Other'];
const USEFULNESS = ['Good', 'Needs Improvement'];
const YES_NO = ['Yes', 'No'];

// Controlled form for creating or editing a capsule.
// State lives in the parent (Dashboard); this component just reads `form` and reports changes.
// Props: form (values), setForm (updater), onSubmit, onCancel (null hides the cancel button),
//        busy (disables inputs while saving), editing (toggles button labels).
export default function CapsuleForm({ form, setForm, onSubmit, onCancel, busy, editing }) {
  // Update a single field while preserving the rest of the form state.
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

      <label>
        Usefulness
        <select value={form.usefulness} onChange={(e) => update('usefulness', e.target.value)}>
          {USEFULNESS.map((usefulness) => (
            <option key={usefulness} value={usefulness}>
              {usefulness}
            </option>
          ))}
        </select>
      </label>
      <div className="form-row">
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
          placeholder="https://example.com/screenshot.png"
        />
      </label>

      <label>
        Notes and reflections
        <textarea
          rows={2}
          value={form.notes}
          onChange={(e) => update('notes', e.target.value)}
          placeholder="What worked well, personal reflections, or ideas for the next iteration..."
        />
      </label>

      <div className="form-actions">
        {/* Label reflects state: saving, editing an existing capsule, or creating a new one. */}
        <button className="btn btn-primary" type="submit" disabled={busy}>
          {busy ? 'Saving...' : editing ? 'Save changes' : 'Save capsule'}
        </button>
        {/* Cancel is only shown while editing (onCancel is null in create mode). */}
        {onCancel && (
          <button className="btn btn-ghost" type="button" onClick={onCancel} disabled={busy}>
            Cancel edit
          </button>
        )}
      </div>
    </form>
  );
}
