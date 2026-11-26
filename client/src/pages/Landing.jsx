import { Link } from 'react-router-dom';

// Public landing page: pitch, call-to-action buttons, and a feature summary.
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
        <p className="eyebrow">Personal AI prompt space</p>
        <h1 className="brand-hero">Save prompts that actually work.</h1>
        <p className="lede">
          We often lean on ChatGPT and Claude for coding, writing, debugging, and study, but the prompts that give great results slip away quickly. AI Capsule gives you one dependable place to store, review, and refine your best prompts, securely tied to your GitHub account.
        </p>
        <div className="cta-row">
          <Link to="/login" className="btn btn-primary">
            Sign in with GitHub
          </Link>
          <a href="/api/health" className="btn btn-ghost">
            Check API status
          </a>
        </div>
      </main>

      {/* Three-up summary of the core features: Save, Review, Own. */}
      <section className="feature-strip" aria-label="What you can do">
        <div>
          <h2>Save</h2>
          <p>Keep your prompt text organised by project, task category, and version so you never lose what worked.</p>
        </div>
        <div>
          <h2>Review</h2>
          <p>Reflect on usefulness, record AI summaries, and track whether you checked or improved the final output.</p>
        </div>
        <div>
          <h2>Own</h2>
          <p>Your capsule entries belong entirely to you, protected by verified JWT authentication on the cloud backend.</p>
        </div>
      </section>
    </div>
  );
}
