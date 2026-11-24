import { Link } from 'react-router-dom';

export default function Landing() {
  return (
    <div className="page-shell landing">
      <header className="topbar">
        <span className="brand-mark">AI Capsule</span>
        <nav>
          <Link to="/login" className="btn btn-ghost">
            Sign in
          </Link>
        </nav>
      </header>

      <main className="hero">
        <p className="eyebrow">Private prompt library</p>
        <h1 className="brand-hero">AI Capsule</h1>
        <p className="lede">
          Keep the prompts that actually work — project, version, notes and review
          status in one place, locked behind your GitHub account.
        </p>
        <div className="cta-row">
          <Link to="/login" className="btn btn-primary">
            Open with GitHub
          </Link>
          <a href="/api/health" className="btn btn-ghost">
            Check API health
          </a>
        </div>
      </main>

      <section className="feature-strip" aria-label="What you can do">
        <div>
          <h2>Save</h2>
          <p>Store prompt text with project, category and usefulness.</p>
        </div>
        <div>
          <h2>Review</h2>
          <p>Track whether you checked and improved the AI response.</p>
        </div>
        <div>
          <h2>Own</h2>
          <p>Each capsule belongs only to the signed-in GitHub user.</p>
        </div>
      </section>
    </div>
  );
}
