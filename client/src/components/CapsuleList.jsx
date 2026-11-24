export default function CapsuleList({ capsules, onEdit, onDelete, busy }) {
  if (!capsules.length) {
    return <p className="muted empty-state">No capsules yet. Create your first prompt record.</p>;
  }

  return (
    <ul className="capsule-list">
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
          <pre className="prompt-preview">{c.prompt_text}</pre>
          <dl className="capsule-meta">
            {c.response_summary && (
              <>
                <dt>Response</dt>
                <dd>{c.response_summary}</dd>
              </>
            )}
            <dt>Usefulness</dt>
            <dd>{c.usefulness || '—'}</dd>
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
                    Screenshot
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
