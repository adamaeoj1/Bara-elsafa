import React, { useState } from 'react';
import { Player } from '../../types/game';
import { ArrowLeft, ShieldAlert, Sparkles, Tag } from 'lucide-react';
import { soundFx } from '../../utils/soundFx';
import { useTranslation } from '../../i18n/LanguageContext';

interface RoleRevealPhaseProps {
  player: Player;
  players: Player[];
  secretWord: string;
  categoryName?: string;
  impostorCategoryHint?: boolean;
  isHost: boolean;
  onStartQuestions: () => void;
}

export const RoleRevealPhase: React.FC<RoleRevealPhaseProps> = ({
  player,
  players,
  secretWord,
  categoryName,
  impostorCategoryHint = true,
  isHost,
  onStartQuestions,
}) => {
  const { t, language } = useTranslation();
  const [isCardRevealed, setIsCardRevealed] = useState(false);

  const partner = player.impostorPartnerId
    ? players.find((p) => p.id === player.impostorPartnerId)
    : undefined;

  const isImpostor = Boolean(player.isImpostor || player.is_impostor);

  const toggleReveal = () => {
    soundFx.playCardFlip();
    setIsCardRevealed((prev) => !prev);
  };

  return (
    <div className="w-full flex flex-col items-center justify-between select-none animate-fade-in py-2">
      {/* Top Phase Header */}
      <div className="text-center w-full mb-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-brand-yellow rounded-full border-2 border-black font-black text-xs sm:text-sm shadow-brutal-sm mb-1.5">
          <Sparkles className="w-4 h-4 text-black" />
          <span>{t('secretCardsTitle')}</span>
        </div>
        <p className="text-xs sm:text-sm font-black text-gray-700">
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
          <div className="w-20 h-20 rounded-2xl border-2 border-black bg-brand-yellow flex items-center justify-center text-4xl font-black text-black shadow-[3px_3px_0px_0px_#000]">
            {language === 'ar' ? '؟' : '?'}
          </div>

          <div className="text-center">
            <h3 className="text-xl sm:text-2xl font-black text-white">
              {language === 'ar' ? 'بطاقة الدور السرية' : 'Secret Role Card'}
            </h3>
            <p className="text-xs sm:text-sm font-bold text-gray-300 mt-1">
              {language === 'ar'
                ? 'اضغط لإظهار الكلمة السرية أو دورك في الجولة'
                : 'Tap to reveal the secret word or your role'}
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
      ) : isImpostor ? (
        /* REVEALED STATE: IMPOSTOR */
        <div
          onClick={toggleReveal}
          className="min-h-[300px] w-full flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border-2 border-black shadow-[4px_4px_0px_0px_#000] transition-all duration-200 text-center bg-[#FF80AB] text-black cursor-pointer"
        >
          {/* Top Pill */}
          <div className="px-4 py-1 rounded-full bg-white border-2 border-black font-black text-xs sm:text-sm text-black shadow-[2px_2px_0px_0px_#000]">
            {language === 'ar' ? 'أنت الإمبوستر 🔪' : 'You are the Impostor 🔪'}
          </div>

          {/* Center Icon Box */}
          <div className="w-20 h-20 rounded-2xl border-2 border-black bg-white flex items-center justify-center shadow-[3px_3px_0px_0px_#000]">
            <ShieldAlert className="w-11 h-11 text-[#D81B60] stroke-[2.5]" />
          </div>

          {/* Role Title */}
          <h2 className="text-2xl font-black text-black">
            {language === 'ar' ? 'أنت برا السالفة!' : 'Out of the Loop!'}
          </h2>

          {/* Optional Topic Hint */}
          {impostorCategoryHint && categoryName && (
            <div className="bg-white border-2 border-black px-3 py-1 rounded-xl text-xs font-black text-black flex items-center gap-1.5 shadow-[2px_2px_0px_0px_#000]">
              <Tag className="w-3.5 h-3.5 text-brand-purple" />
              <span>
                {language === 'ar' ? `الموضوع: ${categoryName}` : `Topic: ${categoryName}`}
              </span>
            </div>
          )}

          {/* Role Mission Box */}
          <div className="bg-white/90 border-2 border-black rounded-xl p-3 text-sm font-bold text-black max-w-md w-full leading-relaxed">
            {t('impostorDesc')}
          </div>

          {/* Partner Badge */}
          {partner && (
            <div className="bg-brand-yellow px-3.5 py-1.5 rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_#000] text-xs font-black text-black">
              🤝 {t('impostorPartner', { name: partner.name })}
            </div>
          )}

          {/* Bottom Hide Button */}
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
      ) : (
        /* REVEALED STATE: CIVILIAN (IN THE LOOP) */
        <div
          onClick={toggleReveal}
          className="min-h-[300px] w-full flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border-2 border-black shadow-[4px_4px_0px_0px_#000] transition-all duration-200 text-center bg-[#7CE38B] text-black cursor-pointer"
        >
          {/* Top Pill */}
          <div className="px-4 py-1 rounded-full bg-white border-2 border-black font-black text-xs sm:text-sm text-black shadow-[2px_2px_0px_0px_#000]">
            {language === 'ar' ? 'أنت مواطن 🛡️' : 'You are in the Loop 🛡️'}
          </div>

          {/* Center Icon Box */}
          <div className="w-20 h-20 rounded-2xl border-2 border-black bg-white flex items-center justify-center text-4xl shadow-[3px_3px_0px_0px_#000]">
            🛡️
          </div>

          <span className="text-xs font-black text-gray-900">
            {t('wordIs')}
          </span>

          {/* Secret Word Title */}
          <h2 className="text-2xl sm:text-3xl font-black text-white bg-[#6D4AFF] px-6 py-2.5 rounded-2xl border-2 border-black shadow-[3px_3px_0px_0px_#000]">
            {secretWord}
          </h2>

          {/* Role Mission Box */}
          <div className="bg-white/90 border-2 border-black rounded-xl p-3 text-sm font-bold text-black max-w-md w-full leading-relaxed">
            {t('civilianDesc')}
          </div>

          {/* Bottom Hide Button */}
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
            onClick={onStartQuestions}
            className="w-full py-3.5 bg-brand-purple hover:bg-[#5b3adb] text-white font-black text-base rounded-2xl border-2 border-black shadow-[4px_4px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>{t('startQuestionsBtn')}</span>
            <ArrowLeft className="w-5 h-5 stroke-[3] rtl:rotate-0 ltr:rotate-180" />
          </button>
        ) : (
          <div className="bg-white rounded-2xl border-2 border-black p-3.5 text-center shadow-[3px_3px_0px_0px_#000] w-full">
            <span className="text-xs sm:text-sm font-black text-gray-800 animate-pulse">
              ⏳ {t('waitingQuestions')}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
