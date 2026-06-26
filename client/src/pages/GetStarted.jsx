import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/get-started.css';

/* ═══════════════════════════════════════════════════════════════════
   NEXORA — Luxury Brand Reveal  v5
   ───────────────────────────────────────────────────────────────────
   • Cormorant Garamond — brand wordmark
   • Outfit            — supporting copy
   • Canvas compositing — shine confined strictly to logo pixels
   • Single RAF loop    — drives tilt, float & 4-layer parallax
═══════════════════════════════════════════════════════════════════ */

/* ── Gold Dust Particles ──────────────────────────────────────── */
function ParticleCanvas({ mouseRef }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let W = (canvas.width = window.innerWidth);
    let H = (canvas.height = window.innerHeight);
    let raf;

    const pts = Array.from({ length: 90 }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 1.2 + 0.2,
      vy: -(Math.random() * 0.18 + 0.05),
      vx: (Math.random() - 0.5) * 0.06,
      a: Math.random() * 0.3 + 0.06,
      da: (Math.random() - 0.5) * 0.002,
      ph: Math.random() * Math.PI * 2,
      depth: Math.random(),          // parallax depth: 0=distant, 1=close
    }));

    const onResize = () => {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', onResize);

    let t = 0;
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      t += 0.005;

      const mx = mouseRef?.current?.sx ?? 0;
      const my = mouseRef?.current?.sy ?? 0;

      for (const p of pts) {
        const ox = mx * p.depth * 14;
        const oy = my * p.depth * 9;
        const px = p.x + ox;
        const py = p.y + oy;

        p.a += p.da;
        if (p.a > 0.45 || p.a < 0.04) p.da *= -1;
        p.y += p.vy;
        p.x += Math.sin(t + p.ph) * 0.12 + p.vx;
        if (p.y < -8) { p.y = H + 8; p.x = Math.random() * W; }
        if (p.x < -8) p.x = W + 8;
        if (p.x > W + 8) p.x = -8;

        const g = ctx.createRadialGradient(px, py, 0, px, py, p.r * 4);
        g.addColorStop(0, `rgba(255,235,130,${p.a})`);
        g.addColorStop(0.5, `rgba(212,175,55,${p.a * 0.35})`);
        g.addColorStop(1, 'rgba(212,175,55,0)');
        ctx.beginPath();
        ctx.arc(px, py, p.r * 4, 0, Math.PI * 2);
        ctx.fillStyle = g;
        ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    };

    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', onResize); };
  }, [mouseRef]);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none' }}
    />
  );
}

/* ── Logo Canvas — shine stays inside logo geometry via source-atop ── */
function LogoCanvas({ size, onReady }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    canvas.width  = size;
    canvas.height = size;

    // Offscreen: stripped logo
    const offscreen = document.createElement('canvas');
    const octx = offscreen.getContext('2d');
    offscreen.width  = size;
    offscreen.height = size;

    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      // 1. Draw raw logo
      octx.drawImage(img, 0, 0, size, size);

      // 2. Strip BLACK background (logo-nexora-dark.jpg has black bg)
      const id = octx.getImageData(0, 0, size, size);
      const d  = id.data;
      for (let i = 0; i < d.length; i += 4) {
        const r = d[i], g = d[i+1], b = d[i+2];
        const br = r * 0.299 + g * 0.587 + b * 0.114;
        // Pure black → fully transparent
        if (br < 14 && r < 18 && g < 18 && b < 18) {
          d[i+3] = 0;
        // Near-black edge → smooth fade
        } else if (br < 38 && r < 42 && g < 42 && b < 42) {
          d[i+3] = Math.round(255 * ((br - 14) / 24));
        }
      }
      octx.putImageData(new ImageData(d, size, size), 0, 0);

      // 3. Animate
      let shineX       = -size * 0.8;
      let isShining    = false;
      let initDelay    = true;
      let raf;

      const BEAM_ANGLE  = -24;                 // degrees — N diagonal
      const PAUSE_SECS  = 5.5;                // gap between sweeps
      let lastShineEnd  = -PAUSE_SECS * 1000;

      const startShine = () => { isShining = true; shineX = -size * 0.7; };

      // Trigger first shine at 3 s
      const firstTimer = setTimeout(() => { startShine(); initDelay = false; }, 3000);

      const draw = (now) => {
        ctx.clearRect(0, 0, size, size);

        // Draw the stripped logo
        ctx.drawImage(offscreen, 0, 0);

        // Periodic shine trigger (after init)
        if (!initDelay && !isShining && (now - lastShineEnd) >= PAUSE_SECS * 1000) {
          startShine();
        }

        if (isShining) {
          ctx.save();
          ctx.globalCompositeOperation = 'source-atop';          // ONLY on logo pixels

          const cx = shineX;
          const cy = size * 0.5;
          const bw = size * 0.22;                                // narrow beam

          ctx.translate(cx, cy);
          ctx.rotate((BEAM_ANGLE * Math.PI) / 180);

          const grad = ctx.createLinearGradient(-bw, 0, bw, 0);
          grad.addColorStop(0,    'rgba(255,255,210,0)');
          grad.addColorStop(0.3,  'rgba(255,248,185,0.15)');
          grad.addColorStop(0.48, 'rgba(255,255,255,0.72)');     // bright peak
          grad.addColorStop(0.52, 'rgba(255,255,255,0.72)');
          grad.addColorStop(0.7,  'rgba(255,248,185,0.15)');
          grad.addColorStop(1,    'rgba(255,255,210,0)');

          ctx.fillStyle = grad;
          ctx.fillRect(-bw, -size, bw * 2, size * 2.5);
          ctx.restore();

          shineX += (size * 1.8) / 48;                          // speed
          if (shineX > size * 1.1) {
            isShining    = false;
            lastShineEnd = now;
          }
        }

        raf = requestAnimationFrame(draw);
      };

      raf = requestAnimationFrame(draw);
      if (onReady) onReady();

      return () => { cancelAnimationFrame(raf); clearTimeout(firstTimer); };
    };

    img.onerror = () => console.error('Logo failed to load');
    img.src = '/logo-nexora-dark.jpg';
  }, [size, onReady]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width:  size,
        height: size,
        display: 'block',
        filter: [
          'drop-shadow(0 0 22px rgba(212,175,55,0.38))',
          'drop-shadow(0 0 55px rgba(212,175,55,0.12))',
          'drop-shadow(0 6px 14px rgba(0,0,0,0.6))',
        ].join(' '),
        transformOrigin: 'center center',
        willChange: 'transform',
        userSelect: 'none',
        pointerEvents: 'none',
      }}
    />
  );
}

/* ── Main page ────────────────────────────────────────────────── */
export default function GetStarted() {
  const navigate = useNavigate();
  const [ctaReady,  setCtaReady]  = useState(false);
  const transRef  = useRef(false);

  // Shared smooth mouse state
  const mouse = useRef({ tx: 0, ty: 0, sx: 0, sy: 0 });

  // Layer element refs
  const logoWrapRef  = useRef(null);   // 3D tilt target
  const glowBlobRef  = useRef(null);   // bg glow
  const textRef      = useRef(null);   // wordmark + CTA

  // Skip if already visited (bypass with ?preview=1 for dev)
  useEffect(() => {
    const isPreview = new URLSearchParams(window.location.search).get('preview') === '1';
    if (!isPreview && localStorage.getItem('nexora_intro_seen') === 'true') {
      navigate('/', { replace: true });
    }
  }, [navigate]);

  // Unlock CTA
  useEffect(() => {
    const t = setTimeout(() => setCtaReady(true), 9500);
    return () => clearTimeout(t);
  }, []);

  // Single RAF — mouse lerp + 3-layer parallax + float
  useEffect(() => {
    const m = mouse.current;
    const lerp = (a, b, f) => a + (b - a) * f;
    const start = performance.now();
    let raf;

    const onMove = (e) => {
      m.tx = (e.clientX / window.innerWidth  - 0.5) * 2;   // –1 … +1
      m.ty = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    const onLeave = () => { m.tx = 0; m.ty = 0; };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseleave', onLeave);

    const tick = (now) => {
      const t = (now - start) * 0.001;

      m.sx = lerp(m.sx, m.tx, 0.046);
      m.sy = lerp(m.sy, m.ty, 0.046);

      // Layer 3: Logo — full tilt + float
      if (logoWrapRef.current && !transRef.current) {
        const rotY    =  m.sx * 12;
        const rotX    = -m.sy * 8;
        const floatY  =  Math.sin(t * 0.68) * 10;
        const autoRY  =  Math.sin(t * 0.35) * 2.2 * (1 - Math.abs(m.sx));
        const tz      =  Math.abs(m.sx * m.sy) * 12;
        logoWrapRef.current.style.transform =
          `perspective(1100px) rotateY(${rotY + autoRY}deg) rotateX(${rotX}deg) translateY(${floatY}px) translateZ(${tz}px)`;
      }

      // Layer 1: Glow blob — slow opposite drift
      if (glowBlobRef.current) {
        const gx = m.sx * -18;
        const gy = m.sy * -10;
        glowBlobRef.current.style.transform =
          `translate(calc(-50% + ${gx}px), calc(-50% + ${gy}px))`;
      }

      // Layer 4: Text — very subtle drift
      if (textRef.current) {
        const tx = m.sx * 4;
        const ty = m.sy * 2.5;
        textRef.current.style.transform = `translate(${tx}px, ${ty}px)`;
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseleave', onLeave);
    };
  }, []);

  // Cinematic enter transition
  const handleEnter = () => {
    if (transRef.current || !ctaReady) return;
    transRef.current = true;
    localStorage.setItem('nexora_intro_seen', 'true');

    if (logoWrapRef.current) {
      logoWrapRef.current.style.transition = 'transform 0.8s cubic-bezier(0.4,0,1,1)';
      logoWrapRef.current.style.transform  = 'perspective(1100px) scale(5) translateZ(160px)';
    }
    setTimeout(() => document.getElementById('nx-gold-flash')?.classList.add('active'), 350);
    setTimeout(() => document.getElementById('nx-black-fade')?.classList.add('active'), 780);
    setTimeout(() => navigate('/'), 1420);
  };

  const logoSize = Math.min(Math.round(Math.min(window.innerWidth, window.innerHeight) * 0.52), 500);

  return (
    <div className="gs-root">

      {/* Layer 2 — Particles */}
      <ParticleCanvas mouseRef={mouse} />

      {/* Layer 1 — Ambient glow */}
      <div className="gs-fog" aria-hidden>
        <div ref={glowBlobRef} className="gs-glow-blob" />
      </div>

      {/* Vignette */}
      <div className="gs-vignette" aria-hidden />

      {/* Stage */}
      <div className="gs-stage">
        <div className="gs-scene">

          {/* Layer 3 — Logo */}
          <div
            ref={logoWrapRef}
            className="gs-logo-wrap"
          >
            <LogoCanvas size={logoSize} />
          </div>

          {/* Layer 4 — Text */}
          <div ref={textRef} className="gs-copy" style={{ willChange: 'transform' }}>

            {/* Brand name */}
            <div className="gs-name-reveal">
              <h1 className="gs-name">NEXORA</h1>
            </div>

            {/* Rule + tagline */}
            <div className="gs-tag-reveal">
              <div className="gs-rule-row">
                <span className="gs-rule" />
                <span className="gs-tagline">Commerce Reimagined</span>
                <span className="gs-rule" />
              </div>
            </div>

            {/* CTA */}
            <div className={`gs-cta-reveal${ctaReady ? ' ready' : ''}`}>
              <button
                className="gs-cta"
                onClick={handleEnter}
                disabled={!ctaReady}
                aria-label="Enter NexORA"
              >
                <span className="gs-cta-sheen" aria-hidden />
                <span className="gs-cta-text">Enter NexORA</span>
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* Transition overlays */}
      <div id="nx-gold-flash" />
      <div id="nx-black-fade" />

    </div>
  );
}
