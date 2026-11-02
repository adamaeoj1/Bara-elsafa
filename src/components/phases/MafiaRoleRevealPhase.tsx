import React, { useState } from 'react';
import { Player } from '../../types/game';
import { useTranslation } from '../../i18n/LanguageContext';
import { soundFx } from '../../utils/soundFx';
import { Sparkles } from 'lucide-react';

interface MafiaRoleRevealPhaseProps {
  player: Player;
  players: Player[];
  isHost: boolean;
  onStartNight: () => void;
}

// Custom Neo-Brutalist SVGs for Mafia Roles
const RoleKnifeSvg: React.FC<{ className?: string }> = ({ className = 'w-14 h-14' }) => (
  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M16 10C26 14 38 22 44 34L32 40L16 10Z" fill="#FFFFFF" stroke="#000000" strokeWidth="3" strokeLinejoin="round" />
    <path d="M22 18L34 32" stroke="#FF6B6B" strokeWidth="2.5" strokeLinecap="round" />
    <rect x="28" y="36" width="16" height="5" rx="2" transform="rotate(-30 28 36)" fill="#FFE66D" stroke="#000000" strokeWidth="2.5" />
    <path d="M35 42L46 53C48 55 51 55 53 53L55 51C57 49 57 46 55 44L44 33" fill="#1E1B2E" stroke="#000000" strokeWidth="3" strokeLinejoin="round" />
    <circle cx="50" cy="48" r="1.5" fill="#FFE66D" />
  </svg>
);

const RoleDoctorSvg: React.FC<{ className?: string }> = ({ className = 'w-14 h-14' }) => (
  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M32 6L14 14V30C14 42 22 52 32 58C42 52 50 42 50 30V14L32 6Z" fill="#FFFFFF" stroke="#000000" strokeWidth="3" strokeLinejoin="round" />
    <rect x="27" y="19" width="10" height="26" rx="2" fill="#4ECDC4" stroke="#000000" strokeWidth="2.5" />
    <rect x="19" y="27" width="26" height="10" rx="2" fill="#4ECDC4" stroke="#000000" strokeWidth="2.5" />
    <circle cx="32" cy="32" r="2.5" fill="#FFFFFF" />
  </svg>
);

const RoleDetectiveSvg: React.FC<{ className?: string }> = ({ className = 'w-14 h-14' }) => (
  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="28" cy="28" r="18" fill="#FFFFFF" stroke="#000000" strokeWidth="3" />
    <circle cx="28" cy="28" r="9" fill="#FFE66D" stroke="#000000" strokeWidth="2.5" />
    <circle cx="30" cy="26" r="3" fill="#000000" />
    <rect x="40" y="40" width="8" height="18" rx="3" transform="rotate(-45 40 40)" fill="#8B5A2B" stroke="#000000" strokeWidth="3" />
  </svg>
);

const RoleCivilianSvg: React.FC<{ className?: string }> = ({ className = 'w-14 h-14' }) => (
  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="32" cy="18" r="9" fill="#FFFFFF" stroke="#000000" strokeWidth="3" />
    <path d="M20 52C20 40 25 32 32 32C39 32 44 40 44 52H20Z" fill="#7CE38B" stroke="#000000" strokeWidth="3" strokeLinejoin="round" />
    <rect x="16" y="52" width="32" height="6" rx="2" fill="#FFFFFF" stroke="#000000" strokeWidth="3" />
  </svg>
);

export const MafiaRoleRevealPhase: React.FC<MafiaRoleRevealPhaseProps> = ({
  player,
  players,
  isHost,
  onStartNight,
}) => {
  const { t, language } = useTranslation();
  const [isCardRevealed, setIsCardRevealed] = useState(false);

  const toggleReveal = () => {
    soundFx.playCardFlip();
    setIsCardRevealed((prev) => !prev);
  };

  const role = player.mafiaRole || player.mafia_role || (player.isImpostor ? 'IMPOSTOR' : 'CIVILIAN');
  const partner = player.impostorPartnerId
    ? players.find((p) => p.id === player.impostorPartnerId)
    : null;

  const roleMeta = {
    IMPOSTOR: {
      topPill: language === 'ar' ? 'أنت الإمبوستر 🔪' : 'You are the Impostor 🔪',
      roleName: language === 'ar' ? 'الإمبوستر (القاتل)' : 'The Impostor (Killer)',
      svg: <RoleKnifeSvg className="w-14 h-14" />,
      bg: 'bg-[#FF6B6B]',
      mission:
        language === 'ar'
          ? 'اغتال المدنيين سراً كل ليلة دون أن ينكشف أمرك، وضلل المحكمة في النهار!'
          : 'Assassinate civilians secretly every night without getting caught, and mislead the court during the day!',
    },
    DOCTOR: {
      topPill: language === 'ar' ? 'أنت الدكتور 🩺' : 'You are the Doctor 🩺',
      roleName: language === 'ar' ? 'الدكتور (الطبيب)' : 'The Doctor',
      svg: <RoleDoctorSvg className="w-14 h-14" />,
      bg: 'bg-[#4ECDC4]',
      mission:
        language === 'ar'
          ? 'اختر شخصاً كل ليلة لحمايته من الاغتيال، يمكنك حماية نفسك مرة واحدة فقط!'
          : 'Protect one person each night from assassination. You can protect yourself only once!',
    },
    DETECTIVE: {
      topPill: language === 'ar' ? 'أنت المحقق 🕵️‍♂️' : 'You are the Detective 🕵️‍♂️',
      roleName: language === 'ar' ? 'المحقق' : 'The Detective',
      svg: <RoleDetectiveSvg className="w-14 h-14" />,
      bg: 'bg-[#FFE66D]',
      mission:
        language === 'ar'
          ? 'تحرَّ عن لاعب واحد كل ليلة لكشف هل هو إمبوستر أم بريء، وقد المحكمة نهاراً!'
          : 'Investigate one player each night to uncover if they are an Impostor or innocent, and lead the court during the day!',
    },
    CIVILIAN: {
      topPill: language === 'ar' ? 'أنت مواطن 🛡️' : 'You are a Civilian 🛡️',
      roleName: language === 'ar' ? 'مواطن بريء' : 'Innocent Civilian',
      svg: <RoleCivilianSvg className="w-14 h-14" />,
      bg: 'bg-[#7CE38B]',
      mission:
        language === 'ar'
          ? 'راقب تصرفات اللاعبين، ناقش بحذر في المحكمة، وصوّت لنفي القاتل الحقيقي!'
          : 'Observe players, discuss carefully in court, and vote to exile the real Impostor!',
    },
  }[role];

  return (
    <div className="w-full flex flex-col items-center justify-between select-none animate-fade-in py-2">
      {/* Privacy Warning Header */}
      <div className="text-center w-full mb-4">
        <div className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-white rounded-full border-2 border-black font-black text-xs sm:text-sm shadow-brutal-sm mb-1.5">
          <Sparkles className="w-4 h-4 text-brand-purple fill-brand-purple" />
          <span>{t('mafiaRoleRevealTitle')}</span>
        </div>
        <p className="text-xs sm:text-sm font-black text-gray-800">
          {t('dontLookNote')}
        </p>
      </div>

      {/* Clean Conditional Rendering Card (NO position:absolute or 3D flip bugs!) */}
      {!isCardRevealed ? (
        /* HIDDEN STATE */
        <div
          onClick={toggleReveal}
          className="min-h-[300px] w-full flex flex-col items-center justify-center gap-4 p-6 rounded-2xl border-2 border-black shadow-[4px_4px_0px_0px_#000] transition-all duration-200 bg-[#2D264B] text-white cursor-pointer"
        >
          <div className="w-20 h-20 rounded-2xl border-2 border-black bg-white/15 flex items-center justify-center text-4xl shadow-[2px_2px_0px_0px_#000]">
            🕵️‍♂️
          </div>

          <div className="text-center">
            <h3 className="text-xl sm:text-2xl font-black text-white">
              {language === 'ar' ? 'بطاقة الدور السرية' : 'Secret Role Card'}
            </h3>
            <p className="text-xs sm:text-sm font-bold text-gray-300 mt-1">
              {language === 'ar' ? 'تأكد أن لا أحد ينظر لشاشتك قبل الكشف' : 'Make sure no one is watching your screen'}
            </p>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleReveal();
            }}
            className="mt-1 px-6 py-3 bg-brand-yellow hover:bg-[#ffe175] text-black font-black text-sm rounded-xl border-2 border-black shadow-[3px_3px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer"
          >
            {language === 'ar' ? '👁️ اضغط لإظهار دورك السري' : '👁️ Tap to Reveal Your Secret Role'}
          </button>
        </div>
      ) : (
        /* REVEALED STATE */
        <div
          onClick={toggleReveal}
          className={`min-h-[300px] w-full flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border-2 border-black shadow-[4px_4px_0px_0px_#000] transition-all duration-200 text-center cursor-pointer ${roleMeta.bg} text-black`}
        >
          {/* Top Pill */}
          <div className="px-4 py-1 rounded-full bg-white border-2 border-black font-black text-xs sm:text-sm text-black shadow-[2px_2px_0px_0px_#000]">
            {roleMeta.topPill}
          </div>

          {/* Center Icon Box */}
          <div className="w-20 h-20 rounded-2xl border-2 border-black bg-white flex items-center justify-center shadow-[3px_3px_0px_0px_#000]">
            {roleMeta.svg}
          </div>

          {/* Role Title */}
          <h2 className="text-2xl font-black text-black">
            {roleMeta.roleName}
          </h2>

          {/* Role Mission Box */}
          <div className="bg-white/90 border-2 border-black rounded-xl p-3 text-sm font-bold text-black max-w-md w-full leading-relaxed">
            {roleMeta.mission}
          </div>

          {/* Partner Info (if Impostor has partner) */}
          {role === 'IMPOSTOR' && partner && (
            <div className="bg-brand-yellow text-black text-xs font-black px-3.5 py-1.5 rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_#000]">
              🤝 {t('impostorPartner', { name: partner.name })}
            </div>
          )}

          {/* Bottom Hide Button inside card */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleReveal();
            }}
            className="mt-1 px-5 py-2 bg-white hover:bg-gray-100 text-black font-black text-xs sm:text-sm rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer"
          >
            {language === 'ar' ? '🙈 إخفاء البطاقة' : '🙈 Hide Card'}
          </button>
        </div>
      )}

      {/* Host Action Button cleanly separated below the card (mt-6) */}
      <div className="w-full mt-6">
        {isHost ? (
          <button
            onClick={onStartNight}
            className="w-full py-3.5 bg-[#1E1B2E] hover:bg-[#2b2742] text-white font-black text-base rounded-2xl border-2 border-black shadow-[4px_4px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>{language === 'ar' ? '🌙 ابدأ مرحلة الليل' : '🌙 Start Night Phase'}</span>
          </button>
        ) : (
          <div className="bg-white rounded-2xl border-2 border-black p-3.5 text-center shadow-[3px_3px_0px_0px_#000] w-full">
            <span className="text-xs sm:text-sm font-black text-gray-800 animate-pulse">
              {language === 'ar'
                ? '⏳ في انتظار المضيف لبدء مرحلة الليل...'
                : '⏳ Waiting for Host to start night phase...'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
