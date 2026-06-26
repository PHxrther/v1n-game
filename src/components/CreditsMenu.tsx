import React from 'react';
import { User, ShieldCheck, Heart, Sparkles, MapPin } from 'lucide-react';
import { audio } from '../utils/audio';

interface CreditsMenuProps {
  onClose: () => void;
}

export default function CreditsMenu({ onClose }: CreditsMenuProps) {
  return (
    <div className="w-full max-w-2xl bg-black/95 border border-white/10 rounded-2xl p-6 md:p-8 shadow-[0_0_80px_rgba(215,25,32,0.15)] backdrop-blur-md font-sans">
      
      {/* Header */}
      <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-4">
        <User className="w-8 h-8 text-red-600" />
        <h2 className="text-2xl md:text-3xl font-kanit font-black text-white tracking-widest uppercase">
          ผู้พัฒนาและจัดทำ <span className="text-red-600">(CREDITS)</span>
        </h2>
      </div>

      <div className="space-y-6 text-stone-300 font-kanit">
        
        {/* Creator Profile */}
        <div className="bg-[#111] border border-white/5 p-5 rounded-xl flex items-center gap-4">
          <div className="w-12 h-12 bg-red-600/10 border border-red-500/30 rounded-full flex items-center justify-center text-red-500">
            <User className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white leading-tight">คณะผู้จัดทำเกียรติยศ</h3>
            <p className="text-sm text-red-500 mt-0.5">ผู้สืบสานงานบุญหลวงและการผจญภัยด่านซ้าย</p>
          </div>
        </div>

        {/* Detailed listings */}
        <div className="space-y-4 text-sm leading-relaxed">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            <div className="bg-[#151515] p-4 rounded-xl border border-white/5">
              <h4 className="text-red-500 font-bold flex items-center gap-1.5 mb-2">
                <Sparkles className="w-4 h-4" /> แนวคิดและพัฒนาโปรแกรม
              </h4>
              <ul className="space-y-1 text-stone-400">
                <li>• ออกแบบเกมลุยด่าน: <strong className="text-stone-300">Dan Sai Adventure</strong></li>
                <li>• ระบบควบคุมปุ่มกดแบบคีย์แมปปิ้งอิสระ</li>
                <li>• เสียงดนตรีสังเคราะห์แปดบิตและเอฟเฟกต์</li>
                <li>• ระบบภาพกราฟิกด้วยผืนผ้าใบ HTML5 2D</li>
              </ul>
            </div>

            <div className="bg-[#151515] p-4 rounded-xl border border-white/5">
              <h4 className="text-red-500 font-bold flex items-center gap-1.5 mb-2">
                <MapPin className="w-4 h-4" /> แหล่งข้อมูลและแรงบันดาลใจ
              </h4>
              <p className="text-stone-400">
                ประเพณีการละเล่นผีตาโขน, อำเภอด่านซ้าย จังหวัดเลย, ประเทศไทย 
                วัดพระธาตุศรีสองรัก และพิพิธภัณฑ์ท้องถิ่นด่านซ้าย แหล่งท่องเที่ยวศิลปวัฒนธรรมที่มีคุณค่ายิ่ง
              </p>
            </div>

          </div>

          <div className="bg-[#111] p-4 rounded border border-white/5 text-center">
            <span className="text-stone-400 text-xs flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-red-500" />
              โลโก้เกมลิขสิทธิ์: <strong>logo_fj2ctz.png</strong> ผ่านคลาวด์จัดเก็บ Cloudinary ปลอดภัย
            </span>
          </div>

          <p className="text-xs text-stone-500 text-center flex items-center justify-center gap-1 mt-4">
            สร้างสรรค์ด้วยความรักและอนุรักษ์ประเพณีไทย <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500 animate-pulse" /> ปีพุทธศักราช ๒๕๖๙
          </p>
        </div>

      </div>

      {/* Footer */}
      <div className="mt-8 border-t border-white/10 pt-5 flex justify-end">
        <button
          onClick={() => {
            audio.playClick();
            onClose();
          }}
          className="px-8 py-3 bg-white text-black font-extrabold uppercase tracking-widest hover:bg-red-600 hover:text-white border-2 border-transparent hover:border-white transition-all duration-300"
        >
          กลับหน้าหลัก
        </button>
      </div>
    </div>
  );
}
