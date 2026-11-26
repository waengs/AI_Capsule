// Renders the user's saved capsules with edit/delete controls.
// Props: capsules (array), onEdit/onDelete (callbacks), busy (disables buttons during requests).
export default function CapsuleList({ capsules, onEdit, onDelete, busy }) {
  // Empty state shown before the user has created anything.
  if (!capsules.length) {
    return <p className="muted empty-state">No prompt records yet. Use the form to save your first AI capsule.</p>;
  }

  return (
    <ul className="capsule-list">
      {/* One list item per capsule; key by id for stable React reconciliation. */}
      {capsules.map((c) => (
        <li key={c.id}>
          <div className="capsule-head">
            <div>
              <h3>{c.prompt_title}</h3>
              <p className="meta">
                {c.project_name}
                {c.prompt_version ? ` · ${c.prompt_version}` : ''}
                {c.category ? ` · ${c.category}` : ''}
              </p>
            </div>
            <div className="capsule-actions">
              <button
                type="button"
                className="btn btn-ghost btn-small"
                onClick={() => onEdit(c)}
                disabled={busy}
              >
                Edit
              </button>
              <button
                type="button"
                className="btn btn-danger btn-small"
                onClick={() => onDelete(c.id)}
                disabled={busy}
              >
                Delete
              </button>
            </div>
          </div>
          {/* <pre> preserves the prompt's original whitespace and line breaks. */}
          <pre className="prompt-preview">{c.prompt_text}</pre>
          {/* Metadata; optional fields are only rendered when present. */}
          <dl className="capsule-meta">
            {c.response_summary && (
              <>
                <dt>Response</dt>
                <dd>{c.response_summary}</dd>
              </>
            )}
            <dt>Usefulness</dt>
            <dd>{c.usefulness || 'Not rated'}</dd>
            <dt>Reviewed</dt>
            <dd>{c.reviewed}</dd>
            <dt>Improved</dt>
            <dd>{c.improved}</dd>
            {c.notes && (
              <>
                <dt>Notes</dt>
                <dd>{c.notes}</dd>
              </>
            )}
            {c.screenshot_url && (
              <>
                <dt>Evidence</dt>
                <dd>
                  <a href={c.screenshot_url} target="_blank" rel="noreferrer">
                    View screenshot
                  </a>
                </dd>
              </>
            )}
            <dt>Created</dt>
            <dd>{c.created_at}</dd>
          </dl>
        </li>
      ))}
    </ul>
  );
}
