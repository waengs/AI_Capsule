import { useState } from 'react';

function PromptPreview({ prompt }) {
  const [copyStatus, setCopyStatus] = useState('');

  async function copyPrompt() {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopyStatus('Prompt copied.');
    } catch {
      setCopyStatus('Could not copy. Select the prompt to copy it manually.');
    }
  }

  return (
    <div className="prompt-preview">
      <pre>{prompt}</pre>
      <button type="button" className="btn btn-ghost btn-small" onClick={copyPrompt} aria-label="Copy prompt">
        Copy
      </button>
      <span className="prompt-copy-status" role="status">{copyStatus}</span>
    </div>
  );
}

// saved capsules with edit and delete buttons
// pause edit and delete while a request is running
export default function CapsuleList({ capsules, onEdit, onDelete, busy }) {
  // show this when there are no saved capsules
  if (!capsules.length) {
    return <p className="muted empty-state">No prompt records yet. Use the form to save your first AI capsule.</p>;
  }

  return (
    <ul className="capsule-list">
      {/* use the capsule id so react can keep track of each card */}
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
          <PromptPreview key={c.prompt_text} prompt={c.prompt_text} />
          {/* only show optional details when they have a value */}
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
