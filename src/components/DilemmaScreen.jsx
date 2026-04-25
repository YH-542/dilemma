import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, ArrowLeft, Sparkles, ChevronRight } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL ?? '';

const pageVariants = {
  initial: { opacity: 0, scale: 0.95, y: 20 },
  animate: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
  exit: { opacity: 0, scale: 0.95, y: -20, transition: { duration: 0.3 } },
};

const OPTION_A_STYLE = {
  gradient: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)',
  glow: 'rgba(124,58,237,0.5)',
  border: 'rgba(124,58,237,0.5)',
  label: 'A',
};
const OPTION_B_STYLE = {
  gradient: 'linear-gradient(135deg, #db2777 0%, #be185d 100%)',
  glow: 'rgba(219,39,119,0.5)',
  border: 'rgba(219,39,119,0.5)',
  label: 'B',
};

export default function DilemmaScreen({ genre, data, onRetry, onBack }) {
  const [chosen, setChosen] = useState(null); // 'A' | 'B' | null
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

    // Generate particles for celebration
    const newParticles = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      vx: (Math.random() - 0.5) * 6,
      vy: -(Math.random() * 8 + 4),
      color: choice === 'A' ? '#7c3aed' : '#db2777',
      size: Math.random() * 8 + 4,
    }));
    setParticles(newParticles);
    setTimeout(() => setParticles([]), 1500);

    // Fetch explanation
    setLoadingExplanation(true);
    try {
      const chosenText = choice === 'A' ? data.optionA : data.optionB;
      const otherText = choice === 'A' ? data.optionB : data.optionA;
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
      className="min-h-screen flex flex-col items-center px-4 py-8"
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

      {/* Nav */}
      <div className="flex items-center justify-between mb-8 w-full" style={{ maxWidth: '48rem' }}>
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

      {/* Tagline */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-center mb-8"
      >
        <p className="text-sm font-medium tracking-widest uppercase mb-1" style={{ color: '#f59e0b' }}>
          究極の選択
        </p>
        <h2 className="text-xl font-bold" style={{ color: '#94a3b8' }}>{data.tagline}</h2>
      </motion.div>

      {/* VS Layout */}
      <div className="flex-1 flex flex-col items-center justify-center w-full" style={{ maxWidth: '48rem' }}>
        <div className="flex flex-col lg:flex-row items-stretch gap-4 lg:gap-6 w-full">
          <OptionCard
            side="A"
            text={data.optionA}
            style={OPTION_A_STYLE}
            chosen={chosen}
            onChoose={() => handleChoice('A')}
          />

          {/* VS Badge */}
          <div className="flex lg:flex-col items-center justify-center shrink-0">
            <motion.div
              className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-black z-10"
              style={{
                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                boxShadow: '0 0 30px rgba(245,158,11,0.5)',
                color: '#000',
              }}
              animate={{
                scale: [1, 1.08, 1],
                boxShadow: [
                  '0 0 20px rgba(245,158,11,0.4)',
                  '0 0 40px rgba(245,158,11,0.7)',
                  '0 0 20px rgba(245,158,11,0.4)',
                ],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              VS
            </motion.div>
            <div className="hidden lg:block w-0.5 h-12 mt-3" style={{ background: 'linear-gradient(to bottom, rgba(245,158,11,0.5), transparent)' }} />
            <div className="lg:hidden h-0.5 w-12 ml-3" style={{ background: 'linear-gradient(to right, rgba(245,158,11,0.5), transparent)' }} />
          </div>

          <OptionCard
            side="B"
            text={data.optionB}
            style={OPTION_B_STYLE}
            chosen={chosen}
            onChoose={() => handleChoice('B')}
          />
        </div>

        {/* Original explanation (before choice) */}
        {!chosen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-8 max-w-xl text-center px-6 py-4 rounded-2xl"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <p className="text-sm leading-relaxed" style={{ color: '#64748b' }}>
              💡 {data.explanation}
            </p>
          </motion.div>
        )}
      </div>

      {/* Explanation after choice */}
      <AnimatePresence>
        {showExplanation && (
          <ExplanationPanel
            chosen={chosen}
            chosenText={chosen === 'A' ? data.optionA : data.optionB}
            explanation={explanation}
            loading={loadingExplanation}
            onRetry={handleRetry}
          />
        )}
      </AnimatePresence>

      {/* Retry when not yet chosen */}
      {!chosen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="flex justify-center mt-6"
        >
          <motion.button
            onClick={handleRetry}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium"
            style={{ background: 'rgba(255,255,255,0.05)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.08)' }}
            whileHover={{ background: 'rgba(255,255,255,0.1)', color: '#e2e8f0' }}
            whileTap={{ scale: 0.96 }}
          >
            <RefreshCw size={14} />
            別の2択を生成
          </motion.button>
        </motion.div>
      )}
    </motion.div>
  );
}

function OptionCard({ side, text, style, chosen, onChoose }) {
  const isChosen = chosen === side;
  const isOther = chosen && chosen !== side;

  return (
    <motion.button
      className="option-card flex-1 relative flex flex-col items-center justify-center p-8 rounded-3xl text-center min-h-48 lg:min-h-64"
      style={{
        background: 'rgba(13,13,26,0.9)',
        border: `2px solid ${isChosen ? style.border : 'rgba(255,255,255,0.06)'}`,
        cursor: chosen ? 'default' : 'pointer',
      }}
      onClick={!chosen ? onChoose : undefined}
      animate={{
        scale: isOther ? 0.93 : isChosen ? 1.03 : 1,
        opacity: isOther ? 0.4 : 1,
        boxShadow: isChosen ? `0 0 50px ${style.glow}` : '0 0 0px transparent',
      }}
      transition={{ type: 'spring', stiffness: 300, damping: 22 }}
      whileHover={!chosen ? {
        scale: 1.04,
        boxShadow: `0 0 40px ${style.glow}`,
        borderColor: style.border,
      } : {}}
      whileTap={!chosen ? { scale: 0.97 } : {}}
    >
      {/* Label badge */}
      <motion.div
        className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-black mb-4"
        style={{ background: style.gradient, color: '#fff', boxShadow: `0 0 20px ${style.glow}` }}
        animate={isChosen ? { scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] } : {}}
        transition={{ duration: 0.5 }}
      >
        {style.label}
      </motion.div>

      <p className="text-xl lg:text-2xl font-bold leading-tight" style={{ color: '#f1f5f9' }}>
        {text}
      </p>

      {!chosen && (
        <motion.div
          className="mt-4 flex items-center gap-1 text-xs font-medium"
          style={{ color: side === 'A' ? '#a78bfa' : '#f472b6' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          タップして選択 <ChevronRight size={12} />
        </motion.div>
      )}

      {isChosen && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, delay: 0.1 }}
          className="mt-4 px-3 py-1 rounded-full text-xs font-bold"
          style={{ background: style.gradient, color: '#fff' }}
        >
          ✓ あなたの選択
        </motion.div>
      )}
    </motion.button>
  );
}

function ExplanationPanel({ chosen, chosenText, explanation, loading, onRetry }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ type: 'spring', stiffness: 200, damping: 25 }}
      className="mt-8 w-full"
      style={{ maxWidth: '48rem' }}
    >
      <div
        className="rounded-3xl p-6"
        style={{
          background: 'rgba(13,13,26,0.95)',
          border: '1px solid rgba(124,58,237,0.25)',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 0 40px rgba(124,58,237,0.15)',
        }}
      >
        <div className="flex items-center gap-2 mb-4">
          <Sparkles size={16} className="text-purple-400" style={{ color: '#a78bfa' }} />
          <span className="text-sm font-semibold" style={{ color: '#a78bfa' }}>AIからの洞察</span>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[0.7, 1, 0.8].map((w, i) => (
              <div key={i} className="shimmer h-4 rounded-full" style={{ width: `${w * 100}%` }} />
            ))}
          </div>
        ) : (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm leading-relaxed mb-5"
            style={{ color: '#94a3b8' }}
          >
            {explanation}
          </motion.p>
        )}

        {!loading && (
          <motion.button
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            onClick={onRetry}
            className="flex items-center gap-2 w-full justify-center py-3 rounded-2xl text-sm font-semibold"
            style={{
              background: 'linear-gradient(135deg, #7c3aed, #db2777)',
              color: '#fff',
              boxShadow: '0 0 20px rgba(124,58,237,0.4)',
            }}
            whileHover={{ scale: 1.02, boxShadow: '0 0 30px rgba(124,58,237,0.6)' }}
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
