import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion, AnimatePresence } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import '../styles/get-started.css';

/* ═══════════════════════════════════════════════════════════════════
   NEXORA — Luxury Brand Reveal v4 (Cinematic Edition)
   ───────────────────────────────────────────────────────────────────
   • Exact layout: Logo -> Title -> Subtitle -> Button
   • 100vh no scrolling, floating gold waves
   • Seamless sub-400ms transition
═══════════════════════════════════════════════════════════════════ */

/* ── Lightweight Canvas Particles ──────── */
function ParticleLayer({ disableParticles }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (disableParticles) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    let w = canvas.width = window.innerWidth;
    let h = canvas.height = window.innerHeight;
    let raf;

    const particles = Array.from({ length: 45 }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() * 1.5 + 0.5,
      vy: -(Math.random() * 0.15 + 0.05),
      a: Math.random() * 0.3 + 0.05,
      da: (Math.random() - 0.5) * 0.003,
    }));

    const resize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      particles.forEach(p => {
        p.a += p.da;
        if (p.a > 0.4 || p.a < 0.02) p.da *= -1;
        p.y += p.vy;
        if (p.y < -10) p.y = h + 10;
        
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(212, 175, 55, ${p.a})`;
        ctx.fill();
      });
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, [disableParticles]);

  if (disableParticles) return null;
  return <canvas ref={canvasRef} className="gs-particles" />;
}

/* ── Luxury Loader ──────────────────────────────────────────────── */
function LuxuryLoader() {
  return (
    <motion.div
      className="gs-loader-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className="gs-loader-container">
        <motion.img 
          src="/logo-nexora.png" 
          alt="NexORA"
          style={{ width: 90, height: 90, objectFit: 'contain' }}
          animate={{
            y: [-4, 4, -4],
            filter: [
              'drop-shadow(0 0 15px rgba(212,175,55,0.2))', 
              'drop-shadow(0 0 35px rgba(212,175,55,0.7))', 
              'drop-shadow(0 0 15px rgba(212,175,55,0.2))'
            ]
          }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="gs-loader-ring"
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
        />
        {/* Subtle particle orbit could be simulated here, keeping it clean for performance */}
      </div>
    </motion.div>
  );
}

/* ── Main Component ─────────────────────────────────────────────── */
export default function GetStarted() {
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showLoader, setShowLoader] = useState(false);

  useEffect(() => {
    const isPreview = new URLSearchParams(window.location.search).get('preview') === '1';
    if (!isPreview && localStorage.getItem('nexora_intro_seen') === 'true') {
      navigate('/', { replace: true });
    }
  }, [navigate]);

  // Motion Values for Parallax
  const mouseX = useMotionValue(0.5); 
  const mouseY = useMotionValue(0.5); 

  // Springs for faster, snappier luxury parallax feel
  const springConfig = { damping: 20, stiffness: 200, mass: 0.5 };
  const smoothMouseX = useSpring(mouseX, springConfig);
  const smoothMouseY = useSpring(mouseY, springConfig);

  // Parallax Transforms (Logo max 8°, Text 3°, Button 2°)
  const tiltMax = prefersReducedMotion ? 0 : 8;
  const rotateX = useTransform(smoothMouseY, [0, 1], [tiltMax, -tiltMax]);
  const rotateY = useTransform(smoothMouseX, [0, 1], [-tiltMax, tiltMax]);

  const textRotateX = useTransform(smoothMouseY, [0, 1], [3, -3]);
  const textRotateY = useTransform(smoothMouseX, [0, 1], [-3, 3]);

  const btnRotateX = useTransform(smoothMouseY, [0, 1], [2, -2]);
  const btnRotateY = useTransform(smoothMouseX, [0, 1], [-2, 2]);
  
  // Background parallax layers
  const bgX = useTransform(smoothMouseX, [0, 1], [15, -15]);
  const bgY = useTransform(smoothMouseY, [0, 1], [15, -15]);

  const bloomX = useTransform(smoothMouseX, [0, 1], [30, -30]);
  const bloomY = useTransform(smoothMouseY, [0, 1], [30, -30]);

  // Deep Parallax Blurred Logos
  const logoBgTopLeftX = useTransform(smoothMouseX, [0, 1], [-20, 20]);
  const logoBgTopLeftY = useTransform(smoothMouseY, [0, 1], [-20, 20]);
  
  const logoBgBottomRightX = useTransform(smoothMouseX, [0, 1], [40, -40]);
  const logoBgBottomRightY = useTransform(smoothMouseY, [0, 1], [40, -40]);

  useEffect(() => {
    if (prefersReducedMotion) return;
    const handleMouseMove = (e) => {
      const { innerWidth, innerHeight } = window;
      mouseX.set(e.clientX / innerWidth);
      mouseY.set(e.clientY / innerHeight);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY, prefersReducedMotion]);

  // Handle Transition
  const handleEnter = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    localStorage.setItem('nexora_intro_seen', 'true');
    
    // Route to homepage right as the gold flash peaks
    setTimeout(() => {
      navigate('/');
    }, 1200); 
  };

  const mainLogoSize = Math.min(window.innerWidth * 0.35, 280);

  return (
    <div className="gs-root">
      
      {/* ── Background Layers ── */}
      <motion.div className="gs-bg-gradient" style={{ x: bgX, y: bgY }} />
      <motion.div className="gs-bloom" style={{ x: bloomX, y: bloomY }} />
      <div className="gs-stars" />
      <div className="gs-streaks" />
      <div className="gs-gold-waves-img" />

      <div className="gs-vignette" />
      <div className="gs-gold-global-filter" />

      {/* Gold Blowout Overlay */}
      <AnimatePresence>
        {isTransitioning && (
          <motion.div 
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: '#E69A21', // User's Primary Gold
              mixBlendMode: 'screen', // Creates an intense blown-out light effect
              zIndex: 9999,
              pointerEvents: 'none'
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6, ease: "easeIn" }}
          />
        )}
      </AnimatePresence>

      {/* ── Main Scene ── */}
      <motion.div 
        className="gs-stage"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
      >
        <div className="gs-scene">
          
          {/* Logo Layer */}
          <motion.div 
            className="gs-logo-wrap"
            style={isTransitioning ? {} : { rotateX, rotateY }}
            animate={isTransitioning ? { 
              scale: [1, 40],
              opacity: [1, 0],
              filter: ['brightness(1) blur(0px)', 'brightness(10) blur(10px)']
            } : (prefersReducedMotion ? {} : { y: [-6, 6, -6], rotateZ: [-2, 2, -2] })}
            transition={isTransitioning ? { duration: 1.2, ease: "easeIn" } : { duration: 6, repeat: Infinity, ease: "easeInOut" }}
          >
            <div className="gs-logo-sheen-container">
              <img 
                src="/logo-nexora.png" 
                alt="NexORA Logo" 
                style={{ 
                  width: mainLogoSize, 
                  height: mainLogoSize,
                  objectFit: 'contain',
                  pointerEvents: 'none'
                }}
              />
            </div>
          </motion.div>

          {/* Typography Center */}
          <motion.div 
            className="gs-copy"
            style={isTransitioning ? {} : { rotateX: textRotateX, rotateY: textRotateY }}
            initial={{ opacity: 0, y: 20 }}
            animate={isTransitioning ? { opacity: 0, y: 20, scale: 0.9, filter: 'blur(10px)' } : { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
            transition={isTransitioning ? { duration: 0.5, ease: "easeOut" } : { duration: 1.2, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            <h1 className="gs-name">NEXORA</h1>
            
            <div className="gs-tagline-container">
              <span className="gs-line"></span>
              <div className="gs-tagline-content">
                <span className="gs-diamond-icon">◇</span>
                <span className="gs-tagline">CURATED FOR YOU</span>
                <span className="gs-diamond-icon">◇</span>
              </div>
              <span className="gs-line"></span>
            </div>

            <p className="gs-sub-desc">
              Step into a world of luxury. Discover, compare and own<br/>
              extraordinary products, curated just for you.
            </p>
          </motion.div>

          {/* Button Layer */}
          <motion.div 
            className="gs-cta-container"
            style={isTransitioning ? {} : { rotateX: btnRotateX, rotateY: btnRotateY }}
            initial={{ opacity: 0, y: 15 }}
            animate={isTransitioning ? { opacity: 0, y: 15, scale: 0.9, filter: 'blur(10px)' } : { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
            transition={isTransitioning ? { duration: 0.5, ease: "easeOut" } : { duration: 1.2, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            <motion.button
              className="gs-cta"
              onClick={handleEnter}
              whileHover={{ scale: 1.03, boxShadow: "0 10px 40px rgba(212, 175, 55, 0.4)" }}
              whileTap={{ scale: 0.95 }}
              aria-label="Enter NexORA"
            >
              <span className="gs-cta-sheen" />
              <span className="gs-cta-text">
                GET STARTED
                <ArrowRight size={16} strokeWidth={1} className="gs-arrow" />
              </span>
            </motion.button>
          </motion.div>
        </div>
      </motion.div>

    </div>
  );
}
