import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { GameState, GameSettings } from '../types';
import { audio } from '../utils/audio';
import { Play, Settings, BookOpen, User, Volume2, VolumeX } from 'lucide-react';

interface MainMenuProps {
  settings: GameSettings;
  onStateChange: (state: GameState) => void;
  onSettingsUpdate: (settings: GameSettings) => void;
}

export default function MainMenu({ settings, onStateChange, onSettingsUpdate }: MainMenuProps) {
  const [menuHovered, setMenuHovered] = useState<string | null>(null);
  
  // Start standard bg music when user interacts
  const handleStartMusic = () => {
    audio.init();
    if (settings.musicEnabled) {
      audio.startMusic();
    }
  };

  const handleSelectState = (state: GameState) => {
    audio.playClick();
    onStateChange(state);
  };

  const toggleSound = () => {
    const updated = { ...settings, soundEnabled: !settings.soundEnabled };
    onSettingsUpdate(updated);
    audio.playClick();
  };

  const toggleMusic = () => {
    const updated = { ...settings, musicEnabled: !settings.musicEnabled };
    onSettingsUpdate(updated);
    audio.playClick();
    if (updated.musicEnabled) {
      audio.startMusic();
    } else {
      audio.stopMusic();
    }
  };

  // Format keys for helper info
  const formatKeyName = (key: string) => {
    if (key === ' ') return 'SPACE';
    if (key === 'Space') return 'SPACE';
    if (key.startsWith('Arrow')) return key.replace('Arrow', '↑ ').toUpperCase();
    return key.toUpperCase();
  };

  return (
    <div 
      onClick={handleStartMusic}
      className="relative flex flex-col items-center justify-center min-h-[580px] w-full max-w-2xl bg-black border border-white/10 rounded-2xl p-6 md:p-10 shadow-[0_0_80px_rgba(215,25,32,0.15)] overflow-hidden font-sans"
    >
      
      {/* 1. Ambient Background Particles */}
      <div className="absolute inset-0 pointer-events-none opacity-40">
        <div className="absolute top-[20%] left-[10%] w-2 h-2 bg-red-600 rounded-full blur-[1px] animate-bounce" style={{ animationDuration: '4s' }} />
        <div className="absolute bottom-[30%] right-[15%] w-3 h-3 bg-red-800 rounded-full blur-[1.5px] animate-bounce" style={{ animationDuration: '5s' }} />
        <div className="absolute bottom-[15%] left-[25%] w-1.5 h-1.5 bg-red-500 rounded-full blur-[0.5px] animate-bounce" style={{ animationDuration: '3s' }} />
        <div className="absolute top-[40%] right-[30%] w-2.5 h-2.5 bg-red-700 rounded-full blur-[1px] animate-bounce" style={{ animationDuration: '6s' }} />
      </div>

      {/* 2. Audio Control Panel (Top-Right) */}
      <div className="absolute top-4 right-4 flex items-center gap-2 bg-[#111]/80 backdrop-blur border border-white/10 px-3 py-1.5 rounded-xl z-20">
        <button
          onClick={(e) => { e.stopPropagation(); toggleSound(); }}
          className={`p-1.5 rounded-lg transition-colors ${settings.soundEnabled ? 'text-red-500 hover:bg-stone-800' : 'text-stone-600'}`}
          title="สลับเสียงประกอบ"
        >
          {settings.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); toggleMusic(); }}
          className={`p-1.5 rounded-lg transition-colors ${settings.musicEnabled ? 'text-red-500 hover:bg-stone-800' : 'text-stone-600'}`}
          title="สลับเพลงประกอบ"
        >
          {settings.musicEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>
      </div>

      {/* 3. Game Logo & Title Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="flex flex-col items-center text-center mt-4 z-10"
      >
        {/* Game Logo with Referrer Policy and artistic red drop-shadow */}
        <div className="relative group mb-5">
          <div className="absolute -inset-2 bg-red-600/30 rounded-full blur-xl group-hover:bg-red-600/50 transition duration-1000" />
          <img 
            id="game-logo"
            src="https://res.cloudinary.com/dsucg33fv/image/upload/v1782439979/logo_fj2ctz.png" 
            referrerPolicy="no-referrer"
            alt="Dan Sai Adventure Logo" 
            className="relative w-28 h-28 md:w-32 md:h-32 object-contain rounded-full border-2 border-red-600 bg-black p-2 transform group-hover:scale-105 transition-all duration-300 drop-shadow-[0_0_30px_rgba(215,25,32,0.4)]"
          />
        </div>

        {/* Game Title: "Dan Sai Adventure" in stacked high-fashion look */}
        <h1 className="text-5xl md:text-6xl font-black uppercase tracking-tighter mb-4 flex flex-col items-center leading-none">
          <span className="text-red-600 tracking-wider">Dan Sai</span>
          <span className="text-4xl md:text-5xl -mt-1 border-t-2 border-white pt-2 tracking-widest text-white">Adventure</span>
        </h1>
        <p className="font-kanit text-[10px] md:text-xs text-stone-400 font-semibold tracking-[0.3em] uppercase">
          ผจญภัยดินแดนหน้ากากผีตาโขน ด่านซ้าย
        </p>
      </motion.div>

      {/* 4. Menu Selection Items - High-contrast boxy flat design */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.6 }}
        className="flex flex-col w-full max-w-xs gap-3 mt-8 z-10"
      >
        {/* PLAY GAME - White primary button */}
        <button
          id="btn-play"
          onClick={() => handleSelectState('PLAYING')}
          onMouseEnter={() => setMenuHovered('play')}
          onMouseLeave={() => setMenuHovered(null)}
          className="group relative flex items-center justify-center gap-3 w-full py-4 bg-white text-black font-extrabold uppercase tracking-[0.2em] hover:bg-red-600 hover:text-white border-2 border-transparent hover:border-white transition-all duration-300"
        >
          <Play className="w-5 h-5 fill-current" />
          <span className="text-base font-bold">เข้าผจญภัย (PLAY)</span>
        </button>

        {/* OPTIONS - Translucent white outlines */}
        <button
          id="btn-options"
          onClick={() => handleSelectState('OPTIONS')}
          className="group flex items-center justify-center gap-3 w-full py-3.5 border-2 border-white/30 text-white font-bold uppercase tracking-[0.15em] hover:bg-white hover:text-black hover:border-white transition-all duration-300"
        >
          <Settings className="w-4.5 h-4.5 group-hover:rotate-45 transition-transform duration-300" />
          <span className="text-sm">ตั้งค่าการบังคับ (OPTIONS)</span>
        </button>

        {/* LORE */}
        <button
          id="btn-lore"
          onClick={() => handleSelectState('LORE')}
          className="group flex items-center justify-center gap-3 w-full py-3.5 border-2 border-white/20 text-white font-bold uppercase tracking-[0.15em] hover:bg-white hover:text-black hover:border-white transition-all duration-300"
        >
          <BookOpen className="w-4.5 h-4.5" />
          <span className="text-sm">ตำนานด่านซ้าย (LORE)</span>
        </button>

        {/* CREDITS */}
        <button
          id="btn-credits"
          onClick={() => handleSelectState('CREDITS')}
          className="group flex items-center justify-center gap-3 w-full py-3.5 border-2 border-white/10 text-white/60 font-bold uppercase tracking-[0.15em] hover:text-white hover:border-white/40 transition-all duration-300"
        >
          <User className="w-4.5 h-4.5" />
          <span className="text-sm">ผู้จัดทำ (CREDITS)</span>
        </button>
      </motion.div>

      {/* 5. How To Play & Keybind helper card */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.6 }}
        className="w-full max-w-sm mt-8 p-4 bg-white/5 border border-white/10 rounded-lg font-kanit z-10 text-center"
      >
        <h4 className="text-red-500 font-bold text-xs uppercase mb-2 tracking-widest">
          การบังคับตัวละครปัจจุบัน
        </h4>
        <div className="grid grid-cols-2 gap-2 text-[11px] text-stone-400">
          <div className="bg-black/40 py-1.5 px-2 rounded border border-white/5 flex justify-between items-center">
            <span>เดินซ้าย:</span>
            <kbd className="font-mono text-red-400 font-bold bg-[#111] px-1.5 rounded">{formatKeyName(settings.bindings.left)}</kbd>
          </div>
          <div className="bg-black/40 py-1.5 px-2 rounded border border-white/5 flex justify-between items-center">
            <span>เดินขวา:</span>
            <kbd className="font-mono text-red-400 font-bold bg-[#111] px-1.5 rounded">{formatKeyName(settings.bindings.right)}</kbd>
          </div>
          <div className="bg-black/40 py-1.5 px-2 rounded border border-white/5 flex justify-between items-center col-span-2">
            <span>กระโดดหลบ:</span>
            <kbd className="font-mono text-red-400 font-bold bg-[#111] px-2 rounded">{formatKeyName(settings.bindings.jump)}</kbd>
          </div>
          <div className="bg-black/40 py-1.5 px-2 rounded border border-white/5 flex justify-between items-center col-span-2">
            <span>สั่นกระดิ่งไล่ผี:</span>
            <kbd className="font-mono text-red-400 font-bold bg-[#111] px-2 rounded">{formatKeyName(settings.bindings.action)}</kbd>
          </div>
        </div>
        <p className="text-[9px] text-stone-500 mt-2.5 uppercase tracking-wider">
          *ปรับแต่งความถนัดของปุ่มควบคุมได้ตลอดเวลาในหน้า OPTIONS*
        </p>
      </motion.div>

    </div>
  );
}
