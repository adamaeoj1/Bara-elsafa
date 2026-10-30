import React, { useState } from 'react';
import { Player } from '../../types/game';
import { Eye, EyeOff, ArrowLeft, HelpCircle, ShieldAlert, Sparkles } from 'lucide-react';
import { PlayerPawn } from '../PlayerPawn';

interface RoleRevealPhaseProps {
  player: Player;
  players: Player[];
  secretWord: string;
  isHost: boolean;
  onStartQuestions: () => void;
}

export const RoleRevealPhase: React.FC<RoleRevealPhaseProps> = ({
  player,
  players,
  secretWord,
  isHost,
  onStartQuestions,
}) => {
  const [isFlipped, setIsFlipped] = useState(false);

  // If 7+ players and this player is impostor, find partner's name
  const partner = player.impostorPartnerId 
    ? players.find((p) => p.id === player.impostorPartnerId) 
    : undefined;

  return (
    <div className="flex flex-col items-center justify-between min-h-[460px] max-w-sm mx-auto w-full gap-5">
      {/* Top Phase Header */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-yellow rounded-full border-2 border-black font-black text-xs shadow-brutal-sm mb-2">
          <Sparkles className="w-3.5 h-3.5 text-black" />
          <span>البطاقات السرية</span>
        </div>
        <h2 className="text-xl font-black text-black">
          من أنت في هذه الجولة؟
        </h2>
        <p className="text-xs font-bold text-gray-600 mt-1">
          تأكد أن لا أحد ينظر إلى شاشتك قبل الكشف! 🤫
        </p>
      </div>

      {/* 3D Flip Card Container */}
      <div
        className="relative w-full max-w-[300px] h-[340px] perspective-1000 cursor-pointer select-none"
        onClick={() => setIsFlipped((prev) => !prev)}
      >
        <div
          className={`w-full h-full transition-transform duration-500 transform-style-3d ${
            isFlipped ? 'rotate-y-180' : ''
          }`}
        >
          {/* FRONT OF CARD (Unflipped Purple Card #6D4AFF) */}
          <div className="absolute inset-0 w-full h-full backface-hidden bg-[#6D4AFF] rounded-3xl border-4 border-black p-6 shadow-brutal-xl flex flex-col items-center justify-between text-white">
            {/* Top decorative pill */}
            <div className="bg-white/20 backdrop-blur-sm border-2 border-white/60 px-3 py-1 rounded-full text-xs font-black">
              بطاقة سرية 🔒
            </div>

            {/* Central '?' Box */}
            <div className="flex flex-col items-center gap-3">
              <div className="w-24 h-24 bg-brand-yellow rounded-2xl border-4 border-black shadow-brutal flex items-center justify-center animate-pulse">
                <span className="text-5xl font-black text-black">؟</span>
              </div>
              <span className="text-sm font-black text-center text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
                اضغط لكشف بطاقتك السرية
              </span>
            </div>

            {/* Bottom helper */}
            <div className="flex items-center gap-1.5 text-xs font-bold bg-black/30 px-3 py-1.5 rounded-xl border border-white/30">
              <Eye className="w-4 h-4 text-brand-yellow" />
              <span>المس للقلب</span>
            </div>
          </div>

          {/* BACK OF CARD (Flipped: Civilian or Impostor) */}
          <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180 bg-white rounded-3xl border-4 border-black p-5 shadow-brutal-xl flex flex-col items-center justify-between text-black">
            {player.isImpostor ? (
              /* IMPOSTOR VIEW */
              <div className="flex flex-col items-center justify-between h-full w-full py-1">
                {/* Impostor Banner */}
                <div className="w-full bg-brand-pink border-2 border-black rounded-xl py-1.5 px-3 text-center shadow-brutal-sm">
                  <span className="text-xs font-black text-black">🚨 مطلوب للعدالة!</span>
                </div>

                {/* Impostor Identity */}
                <div className="flex flex-col items-center gap-2 my-auto">
                  <div className="w-20 h-20 bg-brand-pink/30 rounded-2xl border-3 border-black shadow-brutal flex items-center justify-center">
                    <ShieldAlert className="w-12 h-12 text-[#D81B60] stroke-[2.5]" />
                  </div>

                  <h3 className="text-xl font-black text-black">
                    {player.name}
                  </h3>

                  <div className="bg-black text-white px-3 py-1 rounded-full text-sm font-black">
                    أنت الإمبوستر 🕵️
                  </div>

                  <p className="text-xs font-bold text-gray-700 text-center max-w-[220px] leading-relaxed mt-1">
                    ما تعرف الكلمة - ركّز وحاول تعرفها بدون ما ينكشف أمرك!
                  </p>

                  {/* Co-aware Impostor Partner Badge (7+ players) */}
                  {partner && (
                    <div className="mt-2 bg-brand-yellow px-3 py-1.5 rounded-xl border-2 border-black shadow-brutal-sm text-xs font-black text-black flex items-center gap-1.5 animate-bounce">
                      <span>🤝 خويك:</span>
                      <span className="underline">{partner.name}</span>
                    </div>
                  )}
                </div>

                <div className="text-[11px] font-bold text-gray-500 flex items-center gap-1">
                  <EyeOff className="w-3.5 h-3.5" />
                  <span>اضغط للإخفاء مجدداً</span>
                </div>
              </div>
            ) : (
              /* CIVILIAN VIEW */
              <div className="flex flex-col items-center justify-between h-full w-full py-1">
                {/* Civilian Banner */}
                <div className="w-full bg-brand-green border-2 border-black rounded-xl py-1.5 px-3 text-center shadow-brutal-sm">
                  <span className="text-xs font-black text-black">🛡️ أنت داخل السالفة!</span>
                </div>

                {/* Secret Word Presentation */}
                <div className="flex flex-col items-center gap-2 my-auto">
                  <span className="text-xs font-bold text-gray-500">
                    الكلمة هي:
                  </span>

                  <div className="bg-[#6D4AFF] text-white px-6 py-4 rounded-2xl border-3 border-black shadow-brutal text-2xl font-black text-center min-w-[200px] tracking-wide">
                    {secretWord}
                  </div>

                  <p className="text-xs font-bold text-gray-600 text-center max-w-[220px] leading-relaxed mt-2">
                    جاوب بذكاء عشان ما تكشف الكلمة للإمبوستر، وما يشكون فيك الباقين!
                  </p>
                </div>

                <div className="text-[11px] font-bold text-gray-500 flex items-center gap-1">
                  <EyeOff className="w-3.5 h-3.5" />
                  <span>اضغط للإخفاء مجدداً</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Host Controls or Waiting Notice */}
      <div className="w-full mt-2">
        {isHost ? (
          <button
            onClick={onStartQuestions}
            className="w-full py-3.5 bg-brand-purple hover:bg-[#5b3adb] text-white font-black text-base rounded-2xl border-3 border-black shadow-brutal active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all flex items-center justify-center gap-2"
          >
            <span>ابدأ الأسئلة</span>
            <ArrowLeft className="w-5 h-5 stroke-[3]" />
          </button>
        ) : (
          <div className="bg-white rounded-xl border-2 border-black p-3 text-center shadow-brutal-sm">
            <span className="text-xs font-black text-gray-700 animate-pulse">
              في انتظار المضيف لبدء دورة الأسئلة... 💬
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
