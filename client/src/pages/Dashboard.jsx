import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  createCapsule,
  deleteCapsule,
  getMe,
  listCapsules,
  logout,
  updateCapsule
} from '../api';
import CapsuleForm from '../components/CapsuleForm';
import CapsuleList from '../components/CapsuleList';

// Default values for a blank "create capsule" form.
const emptyForm = {
  project_name: '',
  prompt_title: '',
  prompt_version: 'v1',
  prompt_text: '',
  response_summary: '',
  category: 'Coding',
  usefulness: 'Good',
  reviewed: 'No',
  improved: 'No',
  screenshot_url: '',
  notes: ''
};

// Main authenticated screen: shows the user, the create/edit form, and their capsule list.
export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null); // The logged-in GitHub user.
  const [capsules, setCapsules] = useState([]); // The user's saved capsules.
  const [form, setForm] = useState(emptyForm); // Current form values (create or edit).
  const [editingId, setEditingId] = useState(null); // Non-null when editing an existing capsule.
  const [error, setError] = useState(''); // Last error message to display.
  const [busy, setBusy] = useState(false); // True while a save/delete request is in flight.

  // Reload the capsule list from the server.
  async function refresh() {
    const data = await listCapsules();
    setCapsules(data);
  }

  // On mount: confirm the session and load data; redirect to login if the session is gone.
  useEffect(() => {
    let cancelled = false; // Avoids state updates after unmount.
    (async () => {
      try {
        const me = await getMe();
        if (cancelled) return;
        setUser(me.user);
        await refresh();
      } catch {
        // Session invalid/expired: send the user back to login.
        if (!cancelled) navigate('/login', { replace: true });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  // Switch the form into edit mode, pre-filled with the chosen capsule's values.
  function startEdit(capsule) {
    setEditingId(capsule.id);
    setForm({
      project_name: capsule.project_name || '',
      prompt_title: capsule.prompt_title || '',
      prompt_version: capsule.prompt_version || '',
      prompt_text: capsule.prompt_text || '',
      response_summary: capsule.response_summary || '',
      category: capsule.category || 'Coding',
      usefulness: capsule.usefulness || 'Good',
      reviewed: capsule.reviewed || 'No',
      improved: capsule.improved || 'No',
      screenshot_url: capsule.screenshot_url || '',
      notes: capsule.notes || ''
    });
    setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' }); // Bring the form into view.
  }

  // Clear the form and leave edit mode (back to "create" state).
  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
    setError('');
  }

  // Handle form submit for both create and update, then refresh the list.
  async function handleSubmit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      if (editingId) {
        await updateCapsule(editingId, form); // Edit mode.
      } else {
        await createCapsule(form); // Create mode.
      }
      resetForm();
      await refresh();
    } catch (err) {
      setError(err.message || 'Save failed');
    } finally {
      setBusy(false); // Always re-enable the UI.
    }
  }

  // Delete a capsule after a confirmation prompt.
  async function handleDelete(id) {
    if (!window.confirm('Delete this capsule?')) return;
    setBusy(true);
    setError('');
    try {
      await deleteCapsule(id);
      if (editingId === id) resetForm(); // If editing the deleted one, clear the form.
      await refresh();
    } catch (err) {
      setError(err.message || 'Delete failed');
    } finally {
      setBusy(false);
    }
  }

  // Log out and return to the landing page.
  async function handleLogout() {
    await logout();
    navigate('/');
  }

  return (
    <div className="page-shell dashboard">
      <header className="topbar">
        <Link to="/" className="brand-mark">
          AI Capsule
        </Link>
        <div className="user-chip">
          {user?.avatar && <img src={user.avatar} alt="" width={28} height={28} />}
          <span>{user?.login || '…'}</span>
          <button type="button" className="btn btn-ghost btn-small" onClick={handleLogout}>
            Log out
          </button>
        </div>
      </header>

      {/* Two-column layout: the form on the left, the capsule list on the right. */}
      <main className="dashboard-grid">
        <section>
          {/* Heading reflects whether we are creating or editing. */}
          <h1>{editingId ? 'Edit prompt capsule' : 'Create new prompt capsule'}</h1>
          <p className="muted">
            All records are stored privately under your account and cannot be seen or modified by other users.
          </p>
          {error && (
            <p className="alert" role="alert">
              {error}
            </p>
          )}
          <CapsuleForm
            form={form}
            setForm={setForm}
            onSubmit={handleSubmit}
            onCancel={editingId ? resetForm : null}
            busy={busy}
            editing={Boolean(editingId)}
          />
        </section>

        <section>
          <div className="section-head">
            <h2>Your capsules</h2>
            <span className="muted">{capsules.length} saved</span>
          </div>
          <CapsuleList
            capsules={capsules}
            onEdit={startEdit}
            onDelete={handleDelete}
            busy={busy}
          />
        </section>
      </main>
    </div>
  );
}
