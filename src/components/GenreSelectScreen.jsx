import React from 'react';
import { motion } from 'framer-motion';
import { Heart, Briefcase, Zap, Star, Coffee, Globe, Flame, Music } from 'lucide-react';

const GENRES = [
  { id: '恋愛', label: '恋愛・感情', icon: Heart, color: '#db2777', glow: 'rgba(219,39,119,0.35)' },
  { id: '仕事・キャリア', label: '仕事・キャリア', icon: Briefcase, color: '#7c3aed', glow: 'rgba(124,58,237,0.35)' },
  { id: '人生・哲学', label: '人生・哲学', icon: Globe, color: '#0891b2', glow: 'rgba(8,145,178,0.35)' },
  { id: 'シュール・ユーモア', label: 'シュール', icon: Zap, color: '#f59e0b', glow: 'rgba(245,158,11,0.35)' },
  { id: '友情・人間関係', label: '友情・人間関係', icon: Star, color: '#10b981', glow: 'rgba(16,185,129,0.35)' },
  { id: '食べ物・グルメ', label: '食・グルメ', icon: Coffee, color: '#f97316', glow: 'rgba(249,115,22,0.35)' },
  { id: 'サバイバル・極限', label: 'サバイバル', icon: Flame, color: '#ef4444', glow: 'rgba(239,68,68,0.35)' },
  { id: 'エンタメ・音楽', label: 'エンタメ', icon: Music, color: '#8b5cf6', glow: 'rgba(139,92,246,0.35)' },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.07, delayChildren: 0.2 },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: { duration: 0.3 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.9 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 300, damping: 20 } },
};

export default function GenreSelectScreen({ onSelect, isLoading, error }) {
  return (
    <motion.div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-12"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      {/* Header */}
      <motion.div className="text-center mb-12" variants={cardVariants}>
        <motion.div
          className="inline-block mb-4 px-4 py-1.5 rounded-full text-xs font-semibold tracking-widest uppercase"
          style={{ background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(124,58,237,0.4)', color: '#a78bfa' }}
          animate={{ boxShadow: ['0 0 10px rgba(124,58,237,0.2)', '0 0 20px rgba(124,58,237,0.4)', '0 0 10px rgba(124,58,237,0.2)'] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          究極の2択アプリ
        </motion.div>
        <h1 className="text-5xl font-black mb-3 leading-tight" style={{ color: '#f1f5f9' }}>
          あなたなら<br />
          <span style={{ background: 'linear-gradient(135deg, #7c3aed, #db2777)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            どっちを選ぶ？
          </span>
        </h1>
        <p className="text-base" style={{ color: '#64748b' }}>
          ジャンルを選んでAIが究極の2択を生成します
        </p>
      </motion.div>

      {/* Error */}
      {error && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-6 px-6 py-3 rounded-xl text-sm font-medium"
          style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5' }}
        >
          {error}
        </motion.div>
      )}

      {/* Genre Grid */}
      <motion.div
        className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full max-w-2xl"
        variants={containerVariants}
      >
        {GENRES.map((genre) => (
          <GenreCard
            key={genre.id}
            genre={genre}
            onSelect={onSelect}
            isLoading={isLoading}
          />
        ))}
      </motion.div>

      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-10 flex flex-col items-center gap-3"
        >
          <div className="flex gap-2">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-3 h-3 rounded-full"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #db2777)' }}
                animate={{ y: [0, -12, 0], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
              />
            ))}
          </div>
          <p className="text-sm font-medium" style={{ color: '#7c3aed' }}>AIが究極の2択を思考中...</p>
        </motion.div>
      )}
    </motion.div>
  );
}

function GenreCard({ genre, onSelect, isLoading }) {
  const Icon = genre.icon;
  return (
    <motion.button
      variants={cardVariants}
      onClick={() => !isLoading && onSelect(genre.id)}
      disabled={isLoading}
      className="option-card relative flex flex-col items-center justify-center gap-3 p-5 rounded-2xl"
      style={{
        background: 'rgba(13,13,26,0.9)',
        border: `1px solid rgba(255,255,255,0.06)`,
        minHeight: '110px',
        cursor: isLoading ? 'not-allowed' : 'pointer',
        opacity: isLoading ? 0.6 : 1,
      }}
      whileHover={{
        scale: 1.06,
        boxShadow: `0 0 30px ${genre.glow}`,
        borderColor: genre.color + '80',
        background: 'rgba(20,20,40,0.95)',
      }}
      whileTap={{ scale: 0.94 }}
    >
      <motion.div
        className="w-12 h-12 rounded-xl flex items-center justify-center"
        style={{ background: `${genre.color}20` }}
        whileHover={{ rotate: [0, -8, 8, 0] }}
        transition={{ duration: 0.4 }}
      >
        <Icon size={22} style={{ color: genre.color }} />
      </motion.div>
      <span className="text-sm font-semibold text-center leading-tight" style={{ color: '#e2e8f0' }}>
        {genre.label}
      </span>
    </motion.button>
  );
}
