import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import GenreSelectScreen from './components/GenreSelectScreen';
import DilemmaScreen from './components/DilemmaScreen';

const API_BASE = import.meta.env.VITE_API_URL ?? '';

function App() {
  const [screen, setScreen] = useState('genre'); // 'genre' | 'loading' | 'dilemma'
  const [selectedGenre, setSelectedGenre] = useState('');
  const [dilemmaData, setDilemmaData] = useState(null);
  const [error, setError] = useState(null);

  const handleGenreSelect = async (genre) => {
    setSelectedGenre(genre);
    setScreen('loading');
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/dilemma`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ genre }),
      });
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      setDilemmaData(data);
      setScreen('dilemma');
    } catch {
      setError('AIとの接続に失敗しました。サーバーを確認してください。');
      setScreen('genre');
    }
  };

  const handleRetry = async () => {
    await handleGenreSelect(selectedGenre);
  };

  const handleBackToGenre = () => {
    setScreen('genre');
    setDilemmaData(null);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <AnimatePresence mode="wait">
        {(screen === 'genre' || screen === 'loading') && (
          <GenreSelectScreen
            key="genre"
            onSelect={handleGenreSelect}
            isLoading={screen === 'loading'}
            error={error}
          />
        )}
        {screen === 'dilemma' && dilemmaData && (
          <DilemmaScreen
            key="dilemma"
            genre={selectedGenre}
            data={dilemmaData}
            onRetry={handleRetry}
            onBack={handleBackToGenre}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
