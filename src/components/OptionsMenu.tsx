import React, { useState, useEffect } from 'react';
import { GameSettings, KeyBindings } from '../types';
import { audio } from '../utils/audio';
import { Keyboard, Volume2, VolumeX, RotateCcw, ShieldAlert, Check } from 'lucide-react';

interface OptionsMenuProps {
  settings: GameSettings;
  onSave: (settings: GameSettings) => void;
  onClose: () => void;
}

export default function OptionsMenu({ settings, onSave, onClose }: OptionsMenuProps) {
  const [currentSettings, setCurrentSettings] = useState<GameSettings>({ ...settings });
  const [activeBindingField, setActiveBindingField] = useState<keyof KeyBindings | null>(null);

  const defaultBindings: KeyBindings = {
    left: 'ArrowLeft',
    right: 'ArrowRight',
    jump: ' ',
    action: 'f'
  };

  useEffect(() => {
    if (!activeBindingField) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      
      // Stop some system keys from being bound
      if (['Escape', 'Tab'].includes(e.key)) {
        setActiveBindingField(null);
        return;
      }

      // Format key nicely for display
      let boundKey = e.key;
      if (boundKey === ' ') boundKey = 'Space';

      const updatedBindings = {
        ...currentSettings.bindings,
        [activeBindingField]: boundKey
      };

      const newSettings = {
        ...currentSettings,
        bindings: updatedBindings
      };

      setCurrentSettings(newSettings);
      setActiveBindingField(null);
      audio.playClick();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeBindingField, currentSettings]);

  const toggleSound = () => {
    const updated = {
      ...currentSettings,
      soundEnabled: !currentSettings.soundEnabled
    };
    setCurrentSettings(updated);
    audio.playClick();
  };

  const toggleMusic = () => {
    const updated = {
      ...currentSettings,
      musicEnabled: !currentSettings.musicEnabled
    };
    setCurrentSettings(updated);
    audio.playClick();
    
    if (updated.musicEnabled) {
      audio.startMusic();
    } else {
      audio.stopMusic();
    }
  };

  const setDifficulty = (difficulty: 'easy' | 'normal' | 'hard') => {
    setCurrentSettings({ ...currentSettings, difficulty });
    audio.playClick();
  };

  const handleReset = () => {
    setCurrentSettings({
      ...currentSettings,
      bindings: { ...defaultBindings }
    });
    audio.playClick();
  };

  const handleSave = () => {
    onSave(currentSettings);
    audio.playClick();
    onClose();
  };

  const formatKeyName = (key: string) => {
    if (key === ' ') return 'SPACE';
    if (key === 'Space') return 'SPACE';
    if (key.startsWith('Arrow')) return key.replace('Arrow', '↑ ').toUpperCase();
    return key.toUpperCase();
  };

  return (
    <div className="w-full max-w-2xl bg-black/90 border border-white/10 rounded-2xl p-6 md:p-8 shadow-[0_0_80px_rgba(215,25,32,0.15)] backdrop-blur-md font-sans">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-4">
        <Keyboard className="w-8 h-8 text-red-600 animate-pulse" />
        <h2 className="text-2xl md:text-3xl font-kanit font-black text-white tracking-widest uppercase">
          ตั้งค่าการบังคับ & ตัวเลือก <span className="text-red-600">(OPTIONS)</span>
        </h2>
      </div>

      <div className="space-y-6">
        {/* Audio Toggle */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-[#111] border border-white/5 p-4 rounded-xl flex items-center justify-between">
            <span className="text-stone-300 font-kanit flex items-center gap-2">
              {currentSettings.soundEnabled ? <Volume2 className="w-5 h-5 text-red-500" /> : <VolumeX className="w-5 h-5 text-stone-500" />}
              เสียงเอฟเฟกต์ (SFX)
            </span>
            <button
              onClick={toggleSound}
              className={`px-4 py-1.5 rounded text-sm font-kanit font-bold transition-all duration-300 border uppercase ${
                currentSettings.soundEnabled
                  ? 'bg-red-600/20 text-red-500 border-red-500 hover:bg-red-600/30'
                  : 'bg-stone-800 text-stone-400 border-stone-700 hover:bg-stone-700'
              }`}
            >
              {currentSettings.soundEnabled ? 'เปิด (ON)' : 'ปิด (OFF)'}
            </button>
          </div>

          <div className="bg-[#111] border border-white/5 p-4 rounded-xl flex items-center justify-between">
            <span className="text-stone-300 font-kanit flex items-center gap-2">
              {currentSettings.musicEnabled ? <Volume2 className="w-5 h-5 text-red-500" /> : <VolumeX className="w-5 h-5 text-stone-500" />}
              เพลงประกอบ (BGM)
            </span>
            <button
              onClick={toggleMusic}
              className={`px-4 py-1.5 rounded text-sm font-kanit font-bold transition-all duration-300 border uppercase ${
                currentSettings.musicEnabled
                  ? 'bg-red-600/20 text-red-500 border-red-500 hover:bg-red-600/30'
                  : 'bg-stone-800 text-stone-400 border-stone-700 hover:bg-stone-700'
              }`}
            >
              {currentSettings.musicEnabled ? 'เปิด (ON)' : 'ปิด (OFF)'}
            </button>
          </div>
        </div>

        {/* Difficulty */}
        <div className="bg-[#111] border border-white/5 p-4 rounded-xl">
          <h3 className="text-stone-400 font-kanit text-sm mb-3">ระดับความยาก (DIFFICULTY)</h3>
          <div className="grid grid-cols-3 gap-2">
            {(['easy', 'normal', 'hard'] as const).map((diff) => (
              <button
                key={diff}
                onClick={() => setDifficulty(diff)}
                className={`py-2 rounded font-kanit text-sm font-bold border transition-all uppercase ${
                  currentSettings.difficulty === diff
                    ? 'bg-red-600 text-white border-red-500'
                    : 'bg-[#151515] text-stone-500 border-stone-800 hover:text-stone-300 hover:border-stone-700'
                }`}
              >
                {diff === 'easy' ? 'ง่าย' : diff === 'normal' ? 'ปกติ' : 'ยาก'}
              </button>
            ))}
          </div>
        </div>

        {/* Key Bindings section */}
        <div className="bg-[#111] border border-white/5 p-4 rounded-xl">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-white font-kanit font-semibold text-base">ปรับปุ่มคีย์บอร์ดการบังคับ</h3>
            <button
              onClick={handleReset}
              className="text-stone-500 hover:text-stone-300 flex items-center gap-1.5 text-xs font-kanit transition-all"
              title="คืนค่าเดิม"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              คืนค่าเดิม
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { label: 'เดินซ้าย (Walk Left)', field: 'left' as const },
              { label: 'เดินขวา (Walk Right)', field: 'right' as const },
              { label: 'กระโดด (Jump)', field: 'jump' as const },
              { label: 'สั่นกระดิ่งไล่ผี (Ward Off Spirits)', field: 'action' as const },
            ].map(({ label, field }) => (
              <div
                key={field}
                className="bg-[#161616] border border-white/5 px-4 py-3 rounded flex items-center justify-between"
              >
                <span className="text-stone-300 font-kanit text-sm">{label}</span>
                <button
                  onClick={() => {
                    audio.playClick();
                    setActiveBindingField(field);
                  }}
                  className={`min-w-[100px] px-3 py-1.5 rounded text-xs font-mono font-bold transition-all border ${
                    activeBindingField === field
                      ? 'bg-red-600/30 text-red-400 border-red-500 animate-pulse'
                      : 'bg-black text-white hover:bg-stone-900 border-stone-700 hover:border-red-500'
                  }`}
                >
                  {activeBindingField === field ? 'กดปุ่มคีย์บอร์ด...' : formatKeyName(currentSettings.bindings[field])}
                </button>
              </div>
            ))}
          </div>

          {activeBindingField && (
            <div className="mt-3 flex items-center gap-2 text-red-500 text-xs font-kanit justify-center bg-red-950/20 py-2 border border-red-500/20 rounded animate-pulse">
              <ShieldAlert className="w-4 h-4" />
              <span>กดปุ่มใดก็ได้บนคีย์บอร์ดเพื่อบันทึกการตั้งค่า หรือกด Esc เพื่อยกเลิก</span>
            </div>
          )}
        </div>
      </div>

      {/* Footer Buttons */}
      <div className="flex gap-4 mt-8 border-t border-white/10 pt-5">
        <button
          onClick={() => {
            audio.playClick();
            onClose();
          }}
          className="flex-1 py-3 border-2 border-white/30 text-white font-bold uppercase tracking-wider hover:bg-white hover:text-black hover:border-white transition-all duration-300"
        >
          กลับหน้าหลัก
        </button>
        <button
          onClick={handleSave}
          className="flex-1 py-3 bg-white text-black font-extrabold uppercase tracking-wider hover:bg-red-600 hover:text-white border-2 border-transparent hover:border-white transition-all duration-300 flex items-center justify-center gap-2"
        >
          <Check className="w-5 h-5" />
          บันทึกการตั้งค่า
        </button>
      </div>
    </div>
  );
}
