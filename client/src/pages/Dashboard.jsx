import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createCapsule, deleteCapsule, getMe, listCapsules, logout, updateCapsule } from '../api';
import CapsuleForm from '../components/CapsuleForm';
import CapsuleList from '../components/CapsuleList';

// starting values for a new capsule
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

// dashboard for signed in users
export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null); // the signed in github user
  const [capsules, setCapsules] = useState([]); // capsules saved by this user
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(emptyForm);
  const [editError, setEditError] = useState('');
  const editDialog = useRef(null);
  const [error, setError] = useState(''); // error to show above the create form
  const [busy, setBusy] = useState(false); // keep the buttons disabled while saving or deleting

  useEffect(() => {
    const dialog = editDialog.current;
    if (editingId !== null && !dialog.open) dialog.showModal();
    if (editingId === null && dialog.open) dialog.close();
  }, [editingId]);

  // get the latest capsule list
  async function refresh() {
    const data = await listCapsules();
    setCapsules(data);
  }

  // check the session and load the list when the page opens
  useEffect(() => {
    let cancelled = false; // skip updates if we already left the page
    (async () => {
      try {
        const me = await getMe();
        if (cancelled) return;
        setUser(me.user);
        await refresh();
      } catch {
        // go back to login if the session check fails
        if (!cancelled) navigate('/login', { replace: true });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  // fill the popup with the saved values and keep the create draft
  function startEdit(capsule) {
    setEditingId(capsule.id);
    setEditForm({
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
    setEditError('');
  }

  function cancelEdit() {
    if (!busy) setEditingId(null);
  }

  // save either form and update the list
  async function handleSubmit(event, isEdit = false) {
    event.preventDefault();
    if (busy) return;
    const setSaveError = isEdit ? setEditError : setError;
    setBusy(true);
    setSaveError('');
    try {
      if (isEdit) {
        const updated = await updateCapsule(editingId, editForm);
        setCapsules((current) => current.map((capsule) => capsule.id === updated.id ? updated : capsule));
        setEditingId(null);
      } else {
        await createCapsule(form);
        setForm(emptyForm);
        await refresh();
      }
    } catch (err) {
      setSaveError(err.message || 'Save failed');
    } finally {
      setBusy(false); // turn the buttons back on even if the save failed
    }
  }

  // ask before deleting the capsule
  async function handleDelete(id) {
    if (!window.confirm('Delete this capsule?')) return;
    setBusy(true);
    setError('');
    try {
      await deleteCapsule(id);
      await refresh();
    } catch (err) {
      setError(err.message || 'Delete failed');
    } finally {
      setBusy(false);
    }
  }

  // clear the session and go back home
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

      {/* create form on the left and saved capsules on the right */}
      <main className="dashboard-grid">
        <section>
          <h1>Create new prompt capsule</h1>
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
            busy={busy}
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
      <dialog
        ref={editDialog}
        className="edit-dialog"
        aria-labelledby="edit-capsule-title"
        onCancel={(event) => {
          event.preventDefault();
          cancelEdit();
        }}
      >
        <h2 id="edit-capsule-title">Edit prompt capsule</h2>
        {editError && <p className="alert" role="alert">{editError}</p>}
        <CapsuleForm
          form={editForm}
          setForm={setEditForm}
          onSubmit={(event) => handleSubmit(event, true)}
          onCancel={cancelEdit}
          busy={busy}
          editing
        />
      </dialog>
    </div>
  );
}
