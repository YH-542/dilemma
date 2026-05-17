import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, ArrowLeft, Sparkles, Lightbulb } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL ?? '';

const pageVariants = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } },
  exit: { opacity: 0, y: -16, transition: { duration: 0.25 } },
};

export default function DilemmaScreen({ genre, data, onRetry, onBack }) {
  const [chosen, setChosen] = useState(null);
  const [explanation, setExplanation] = useState(null);
  const [loadingExplanation, setLoadingExplanation] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    setChosen(null);
    setExplanation(null);
    setShowExplanation(false);
  }, [data]);

  const handleChoice = async (choice) => {
    if (chosen) return;
    setChosen(choice);

    const newParticles = Array.from({ length: 18 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      vx: (Math.random() - 0.5) * 7,
      vy: -(Math.random() * 9 + 4),
      color: choice === 'A' ? '#7c3aed' : '#db2777',
      size: Math.random() * 8 + 4,
    }));
    setParticles(newParticles);
    setTimeout(() => setParticles([]), 1500);

    setLoadingExplanation(true);
    try {
      const chosenText = choice === 'A' ? data.optionA : data.optionB;
      const otherText  = choice === 'A' ? data.optionB : data.optionA;
      const res = await fetch(`${API_BASE}/api/explain`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ genre, chosen: chosenText, other: otherText }),
      });
      const json = await res.json();
      setExplanation(json.text);
    } catch {
      setExplanation('AIからの解説を取得できませんでした。');
    } finally {
      setLoadingExplanation(false);
      setShowExplanation(true);
    }
  };

  const handleRetry = () => {
    setChosen(null);
    setExplanation(null);
    setShowExplanation(false);
    onRetry();
  };

  return (
    <motion.div
      className="min-h-screen flex flex-col items-center px-4 pt-8 pb-12"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      {/* Particles */}
      <AnimatePresence>
        {particles.map((p) => (
          <motion.div
            key={p.id}
            className="fixed rounded-full pointer-events-none z-50"
            style={{ width: p.size, height: p.size, background: p.color, left: `${p.x}%`, top: '50%' }}
            initial={{ y: 0, x: 0, opacity: 1, scale: 1 }}
            animate={{ y: p.vy * 80, x: p.vx * 60, opacity: 0, scale: 0.2 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
          />
        ))}
      </AnimatePresence>

      {/* Nav — always at the top */}
      <div className="flex items-center justify-between w-full mb-0" style={{ maxWidth: '44rem' }}>
        <motion.button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium"
          style={{ background: 'rgba(255,255,255,0.05)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.08)' }}
          whileHover={{ background: 'rgba(255,255,255,0.1)', color: '#e2e8f0' }}
          whileTap={{ scale: 0.96 }}
        >
          <ArrowLeft size={16} />
          ジャンル選択へ
        </motion.button>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium"
          style={{ background: 'rgba(124,58,237,0.15)', color: '#a78bfa', border: '1px solid rgba(124,58,237,0.3)' }}>
          <Sparkles size={12} />
          {genre}
        </div>
      </div>

      {/* ── Centered content area ── */}
      <div
        className="flex-1 flex flex-col items-center justify-center w-full"
        style={{ maxWidth: '44rem' }}
      >
        {/* Title & Theme */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="text-center mb-8 w-full"
        >
          <p className="text-xs font-bold tracking-[0.2em] uppercase mb-3" style={{ color: '#f59e0b' }}>
            究極の選択
          </p>
          <h2 className="text-2xl lg:text-3xl font-black mb-3" style={{ color: '#f1f5f9' }}>
            {data.title ?? data.tagline}
          </h2>
          {data.theme && (
            <p className="text-sm leading-relaxed" style={{ color: '#64748b' }}>{data.theme}</p>
          )}
        </motion.div>

        {/* Choice Cards */}
        <div className="w-full flex flex-col gap-4">
          <OptionCard side="A" label={data.optionA} chosen={chosen} onChoose={() => handleChoice('A')} />
          <OptionCard side="B" label={data.optionB} chosen={chosen} onChoose={() => handleChoice('B')} />
        </div>

        {/* Hint */}
        {!chosen && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="mt-5 text-xs text-center"
            style={{ color: '#334155' }}
          >
            どちらかを選ぶと、AIがあなたの選択を分析します
          </motion.p>
        )}

        {/* Result Panel */}
        <AnimatePresence>
          {showExplanation && (
            <ExplanationPanel
              chosen={chosen}
              explanation={explanation}
              insight={data.insight}
              loading={loadingExplanation}
              onRetry={handleRetry}
            />
          )}
        </AnimatePresence>

        {/* Retry (before choice) */}
        {!chosen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
            className="flex justify-center mt-5"
          >
            <motion.button
              onClick={handleRetry}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium"
              style={{ background: 'rgba(255,255,255,0.05)', color: '#64748b', border: '1px solid rgba(255,255,255,0.07)' }}
              whileHover={{ background: 'rgba(255,255,255,0.09)', color: '#94a3b8' }}
              whileTap={{ scale: 0.96 }}
            >
              <RefreshCw size={13} />
              別の2択を生成
            </motion.button>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

/* ─── Option Card ─────────────────────────────────────── */
const STYLES = {
  A: {
    accent:       '#7c3aed',
    accentLight:  'rgba(124,58,237,0.12)',
    accentBorder: 'rgba(124,58,237,0.45)',
    accentGlow:   'rgba(124,58,237,0.55)',
    pill:         'linear-gradient(135deg,#7c3aed,#4f46e5)',
    pillGlow:     'rgba(124,58,237,0.45)',
    labelColor:   '#a78bfa',
  },
  B: {
    accent:       '#db2777',
    accentLight:  'rgba(219,39,119,0.12)',
    accentBorder: 'rgba(219,39,119,0.45)',
    accentGlow:   'rgba(219,39,119,0.55)',
    pill:         'linear-gradient(135deg,#db2777,#be185d)',
    pillGlow:     'rgba(219,39,119,0.45)',
    labelColor:   '#f472b6',
  },
};

function OptionCard({ side, label, chosen, onChoose }) {
  const s         = STYLES[side];
  const isChosen  = chosen === side;
  const isOther   = chosen && chosen !== side;
  const idle      = !chosen;

  return (
    <motion.button
      onClick={idle ? onChoose : undefined}
      style={{
        background:  isChosen ? s.accentLight : 'rgba(255,255,255,0.03)',
        border:      `1.5px solid ${isChosen ? s.accentBorder : 'rgba(255,255,255,0.07)'}`,
        borderRadius: '20px',
        cursor:      idle ? 'pointer' : 'default',
        width:       '100%',
      }}
      animate={{
        opacity:   isOther ? 0.3 : 1,
        scale:     isOther ? 0.97 : 1,
        boxShadow: isChosen
          ? `0 0 0 1px ${s.accentBorder}, 0 8px 40px ${s.accentGlow}`
          : '0 0 0 transparent',
      }}
      transition={{ type: 'spring', stiffness: 260, damping: 24 }}
      whileHover={idle ? {
        background:  s.accentLight,
        borderColor: s.accentBorder,
        scale: 1.015,
      } : {}}
      whileTap={idle ? { scale: 0.98 } : {}}
    >
      <div className="flex items-center gap-5 px-6 py-5">
        {/* Side pill */}
        <motion.div
          style={{
            background:  s.pill,
            boxShadow:   isChosen ? `0 0 18px ${s.pillGlow}` : 'none',
            borderRadius: '12px',
            width: '2.75rem',
            height: '2.75rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1rem',
            fontWeight: 900,
            color: '#fff',
            flexShrink: 0,
          }}
          animate={isChosen ? { scale: [1, 1.18, 1] } : {}}
          transition={{ duration: 0.4 }}
        >
          {side}
        </motion.div>

        {/* Label */}
        <span
          style={{
            flex: 1,
            textAlign: 'left',
            fontSize: 'clamp(1.1rem, 4vw, 1.4rem)',
            fontWeight: 800,
            lineHeight: 1.3,
            color: isChosen ? '#f1f5f9' : '#cbd5e1',
            letterSpacing: '-0.01em',
          }}
        >
          {label}
        </span>

        {/* Chosen badge */}
        <AnimatePresence>
          {isChosen && (
            <motion.span
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ type: 'spring', stiffness: 320 }}
              style={{
                background: s.pill,
                color: '#fff',
                fontSize: '0.7rem',
                fontWeight: 700,
                padding: '3px 10px',
                borderRadius: '999px',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              ✓ 選択
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    </motion.button>
  );
}

/* ─── Explanation Panel ───────────────────────────────── */
function ExplanationPanel({ chosen, explanation, insight, loading, onRetry }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 16 }}
      transition={{ type: 'spring', stiffness: 220, damping: 26 }}
      className="mt-8 w-full"
      style={{ maxWidth: '44rem' }}
    >
      <div
        style={{
          background: 'rgba(10,10,22,0.97)',
          border: '1px solid rgba(124,58,237,0.2)',
          borderRadius: '20px',
          backdropFilter: 'blur(24px)',
          padding: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.1rem',
        }}
      >
        {/* AI analysis */}
        <div>
          <div className="flex items-center gap-2 mb-2.5">
            <Sparkles size={14} style={{ color: '#a78bfa' }} />
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#a78bfa' }}>AIからの分析</span>
          </div>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {[1, 0.75, 0.88].map((w, i) => (
                <div key={i} className="shimmer" style={{ height: '0.9rem', width: `${w * 100}%`, borderRadius: '8px' }} />
              ))}
            </div>
          ) : (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{ fontSize: '0.875rem', lineHeight: 1.75, color: '#94a3b8' }}
            >
              {explanation}
            </motion.p>
          )}
        </div>

        {/* Insight */}
        {!loading && insight && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.6rem',
              background: 'rgba(245,158,11,0.07)',
              border: '1px solid rgba(245,158,11,0.18)',
              borderRadius: '14px',
              padding: '0.75rem 1rem',
            }}
          >
            <Lightbulb size={14} style={{ color: '#f59e0b', marginTop: '2px', flexShrink: 0 }} />
            <p style={{ fontSize: '0.825rem', lineHeight: 1.7, color: '#ca8a04' }}>{insight}</p>
          </motion.div>
        )}

        {/* Next button */}
        {!loading && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            onClick={onRetry}
            style={{
              background: 'linear-gradient(135deg,#7c3aed,#db2777)',
              color: '#fff',
              border: 'none',
              borderRadius: '14px',
              padding: '0.75rem',
              fontSize: '0.875rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              boxShadow: '0 4px 24px rgba(124,58,237,0.35)',
            }}
            whileHover={{ scale: 1.02, boxShadow: '0 6px 32px rgba(124,58,237,0.55)' }}
            whileTap={{ scale: 0.98 }}
          >
            <RefreshCw size={14} />
            もう一問！（同じジャンル）
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}
