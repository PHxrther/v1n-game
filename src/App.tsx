/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { GameState, GameSettings } from './types';
import { audio } from './utils/audio';

import MainMenu from './components/MainMenu';
import OptionsMenu from './components/OptionsMenu';
import LoreMenu from './components/LoreMenu';
import CreditsMenu from './components/CreditsMenu';
import GameScreen from './components/GameScreen';

export default function App() {
  const [gameState, setGameState] = useState<GameState>('MENU');
  
  // Default game configurations
  const [settings, setSettings] = useState<GameSettings>({
    soundEnabled: true,
    musicEnabled: true,
    difficulty: 'normal',
    bindings: {
      left: 'ArrowLeft',
      right: 'ArrowRight',
      jump: ' ', // space bar
      action: 'f',
    }
  });

  // Load settings on mount
  useEffect(() => {
    const saved = localStorage.getItem('dansai_game_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSettings(parsed);
      } catch (err) {
        console.error('Error parsing settings:', err);
      }
    }
  }, []);

  // Sync background music based on user state change and music selection
  useEffect(() => {
    if (gameState === 'PLAYING') {
      // Keep music running or trigger it
      if (settings.musicEnabled) {
        audio.startMusic();
      }
    } else if (gameState === 'MENU') {
      // Standard main menu checks
      if (settings.musicEnabled) {
        audio.startMusic();
      }
    }
  }, [gameState, settings.musicEnabled]);

  // Update & persist settings
  const handleSaveSettings = (newSettings: GameSettings) => {
    setSettings(newSettings);
    localStorage.setItem('dansai_game_settings', JSON.stringify(newSettings));
  };

  return (
    <div 
      className="relative min-h-screen bg-black text-white flex flex-col justify-between overflow-x-hidden font-sans select-none"
      style={{
        backgroundImage: 'radial-gradient(circle at 50% 40%, rgba(215, 25, 32, 0.18) 0%, #000000 80%)',
      }}
    >
      {/* Dynamic Background Star Field/Ember decoration in alignment with Artistic Flair */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[10%] left-[20%] w-1.5 h-1.5 bg-red-500/30 rounded-full animate-pulse" />
        <div className="absolute top-[35%] left-[85%] w-1 h-1 bg-white/35 rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-[55%] left-[12%] w-1 h-1 bg-red-600/25 rounded-full animate-pulse" style={{ animationDelay: '1.5s' }} />
        <div className="absolute top-[75%] left-[75%] w-2 h-2 bg-red-500/20 rounded-full animate-pulse" style={{ animationDelay: '2.5s' }} />
      </div>

      {/* Main Container Wrapper */}
      <main className="flex-1 flex items-center justify-center p-4 md:p-6 z-10 w-full max-w-5xl mx-auto">
        <AnimatePresence mode="wait">
          {gameState === 'MENU' && (
            <motion.div
              key="menu"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="w-full flex justify-center"
            >
              <MainMenu
                settings={settings}
                onStateChange={setGameState}
                onSettingsUpdate={handleSaveSettings}
              />
            </motion.div>
          )}

          {gameState === 'OPTIONS' && (
            <motion.div
              key="options"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="w-full flex justify-center"
            >
              <OptionsMenu
                settings={settings}
                onSave={handleSaveSettings}
                onClose={() => setGameState('MENU')}
              />
            </motion.div>
          )}

          {gameState === 'LORE' && (
            <motion.div
              key="lore"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="w-full flex justify-center"
            >
              <LoreMenu
                onClose={() => setGameState('MENU')}
              />
            </motion.div>
          )}

          {gameState === 'CREDITS' && (
            <motion.div
              key="credits"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="w-full flex justify-center"
            >
              <CreditsMenu
                onClose={() => setGameState('MENU')}
              />
            </motion.div>
          )}

          {gameState === 'PLAYING' && (
            <motion.div
              key="playing"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4 }}
              className="w-full flex justify-center"
            >
              <GameScreen
                settings={settings}
                onClose={() => setGameState('MENU')}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Cultural Footer */}
      <footer className="w-full bg-black/80 border-t border-white/10 py-4 px-4 text-center text-[10px] md:text-xs text-stone-500 font-kanit font-medium tracking-wide z-10 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 px-4">
          <p>© ๒๕๖๙ Dan Sai Adventure. สงวนลิขสิทธิ์</p>
          <p className="text-red-600 font-bold tracking-[0.2em] uppercase">
            Thailand Folklore Series
          </p>
        </div>
      </footer>
    </div>
  );
}
