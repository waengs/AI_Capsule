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

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [capsules, setCapsules] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function refresh() {
    const data = await listCapsules();
    setCapsules(data);
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const me = await getMe();
        if (cancelled) return;
        setUser(me.user);
        await refresh();
      } catch {
        if (!cancelled) navigate('/login', { replace: true });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

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
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
    setError('');
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      if (editingId) {
        await updateCapsule(editingId, form);
      } else {
        await createCapsule(form);
      }
      resetForm();
      await refresh();
    } catch (err) {
      setError(err.message || 'Save failed');
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this capsule?')) return;
    setBusy(true);
    setError('');
    try {
      await deleteCapsule(id);
      if (editingId === id) resetForm();
      await refresh();
    } catch (err) {
      setError(err.message || 'Delete failed');
    } finally {
      setBusy(false);
    }
  }

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

      <main className="dashboard-grid">
        <section>
          <h1>{editingId ? 'Update capsule' : 'Create capsule'}</h1>
          <p className="muted">
            Records are saved to your account only. Ownership comes from the verified JWT.
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
