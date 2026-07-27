// NexORA — Top-level render-error fallback (shown by Sentry's ErrorBoundary)

export default function ErrorFallback() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem', fontFamily: 'sans-serif', textAlign: 'center', padding: '2rem' }}>
      <h1 style={{ fontSize: '1.5rem' }}>Something went wrong</h1>
      <p style={{ color: '#6B7280' }}>We&apos;ve been notified and are looking into it.</p>
      <button onClick={() => window.location.assign('/')} style={{ padding: '0.75rem 1.5rem', borderRadius: '9999px', background: '#D4AF37', color: '#000', fontWeight: 600, border: 'none', cursor: 'pointer' }}>
        Return Home
      </button>
    </div>
  );
}
