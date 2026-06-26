import React from 'react';
import { BookOpen, Sparkles, Heart } from 'lucide-react';
import { audio } from '../utils/audio';

interface LoreMenuProps {
  onClose: () => void;
}

export default function LoreMenu({ onClose }: LoreMenuProps) {
  return (
    <div className="w-full max-w-3xl bg-black/95 border border-white/10 rounded-2xl p-6 md:p-8 shadow-[0_0_80px_rgba(215,25,32,0.15)] backdrop-blur-md max-h-[85vh] overflow-y-auto custom-scrollbar font-sans">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-4">
        <BookOpen className="w-8 h-8 text-red-600" />
        <h2 className="text-2xl md:text-3xl font-kanit font-black text-white tracking-widest uppercase">
          ตำนานประเพณีผีตาโขน <span className="text-red-600">(LORE)</span>
        </h2>
      </div>

      <div className="space-y-6 text-stone-300 font-kanit text-sm md:text-base leading-relaxed">
        {/* Intro */}
        <div className="bg-[#111] border-l-4 border-red-600 p-4 rounded-r-xl">
          <p className="italic text-stone-200">
            "ต้อนรับสู่ดินแดนแห่งความเชื่อ ประเพณี และการเดินทางผจญภัยใน อำเภอด่านซ้าย จังหวัดเลย!"
          </p>
        </div>

        {/* Section 1 */}
        <div className="space-y-2">
          <h3 className="text-lg font-bold text-red-500 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-red-500" /> 1. ประวัติผีตาโขนและการละเล่นด่านซ้าย
          </h3>
          <p>
            <strong>ประเพณีผีตาโขน</strong> เป็นประเพณีที่มีชื่อเสียงโด่งดังที่สุดของอำเภอด่านซ้าย จังหวัดเลย 
            ซึ่งเป็นส่วนหนึ่งของ 'งานบุญหลวง' หรือ 'บุญพระเวส' ความเชื่อดั้งเดิมกล่าวว่า 
            เมื่อครั้งที่พระเวสสันดรและพระนางมัทรีจะเดินทางออกจากป่ากลับคืนสู่เมืองหลวง 
            เหล่าสัตว์ป่ารวมถึง 'ผีป่า' และ 'เสนาคุต' ต่างอาลัยรัก จึงได้ปลอมตัวจัดขบวนแห่แหนส่งเสด็จอย่างสนุกสนาน 
            ซึ่งนั่นกลายเป็นจุดกำเนิดของหน้ากากสีสันสวยงามที่เราเห็นในปัจจุบัน
          </p>
        </div>

        {/* Section 2 */}
        <div className="space-y-2">
          <h3 className="text-lg font-bold text-red-500 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-red-500" /> 2. หน้ากากหัตถศิลป์เอกลักษณ์ด่านซ้าย
          </h3>
          <p>
            หน้ากากผีตาโขนทำขึ้นจากส่วนผสมของธรรมชาติอันชาญฉลาด:
          </p>
          <ul className="list-disc list-inside space-y-1.5 pl-2 text-stone-400">
            <li><strong className="text-stone-300">หัวหน้ากาก:</strong> ทำจาก "หวดนึ่งข้าวเหนียว" ที่สานด้วยไม้ไผ่ พับและเย็บให้เป็นรูปทรงกระบอกและหมวก</li>
            <li><strong className="text-stone-300">ใบหน้า:</strong> ทำจากโคนก้านมะพร้าวถากแต่งเป็นรูปทรงใบหน้าเจาะตา</li>
            <li><strong className="text-stone-300">จมูก:</strong> มักทำจากไม้แกะสลักเป็นรูปหงอนยาวโค้งงอ</li>
            <li><strong className="text-stone-300">ลวดลาย:</strong> เขียนลวดลายด้วยสีสันสดใส เช่น ลายกนก ลายไทย หรือลายแฟนตาซีด้วยลีลาที่อ่อนช้อยและมีพลัง</li>
          </ul>
        </div>

        {/* Section 3 */}
        <div className="space-y-2">
          <h3 className="text-lg font-bold text-red-500 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-red-500" /> 3. ความศรัทธาของชาวด่านซ้าย
          </h3>
          <p>
            การละเล่นผีตาโขนไม่ได้มีเพื่อความรื่นเริงเพียงอย่างเดียว 
            แต่ยังมีจุดประสงค์เพื่อบวงสรวงบูชาดวงวิญญาณบรรพบุรุษและ 'เจ้าพ่อกวน' 'เจ้าแม่นางเทียม' 
            เพื่อขอฝนให้ตกต้องตามฤดูกาลและพืชพันธุ์ธัญญาหารอุดมสมบูรณ์ หลังจากเสร็จสิ้นพิธีการละเล่นแล้ว 
            ชาวบ้านจะนำหน้ากากผีตาโขนไปลอยน้ำโขงหรือน้ำหมัน เพื่อเป็นการลอยเคราะห์ลอยโศกและสิ่งอัปมงคลออกไป
          </p>
        </div>

        {/* Dynamic Interactive element */}
        <div className="bg-[#151515] p-4 rounded border border-white/5 flex flex-col md:flex-row items-center gap-4">
          <div className="flex-1">
            <h4 className="text-red-500 font-bold text-sm uppercase flex items-center gap-1">
              <Heart className="w-4 h-4 text-red-500 animate-pulse" /> เกร็ดความรู้ในเกม
            </h4>
            <p className="text-xs text-stone-400 mt-1">
              ในเกม <strong>Dan Sai Adventure</strong> ตัวละครของคุณจะต้องสวมหน้ากากผีตาโขนวิ่งตะลุยป่าและวัดด่านซ้ายอันศักดิ์สิทธิ์ 
              เพื่อเก็บรวบรวม "กระดิ่งทองคำ (หมากกระแหล่ง)" และใช้เสียงกระดิ่งบวงสรวงนี้ในการปัดเป่าพลังมืดหรือวิญญาณซุกซนที่เข้ามาป่วน!
            </p>
          </div>
        </div>
      </div>

      {/* Close button */}
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
