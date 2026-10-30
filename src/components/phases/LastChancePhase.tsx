import React from 'react';
import { Player } from '../../types/game';
import { Sparkles, Target, Eye } from 'lucide-react';
import { PlayerPawn } from '../PlayerPawn';
import { useTranslation } from '../../i18n/LanguageContext';

interface LastChancePhaseProps {
  caughtImpostorId: string | null;
  players: Player[];
  activePlayerId: string;
  wordOptions: string[];
  onSubmitGuess: (guess: string) => void;
}

export const LastChancePhase: React.FC<LastChancePhaseProps> = ({
  caughtImpostorId,
  players,
  activePlayerId,
  wordOptions,
  onSubmitGuess,
}) => {
  const { t, language } = useTranslation();
  const caughtImpostor = players.find((p) => p.id === caughtImpostorId);
  const isMeCaughtImpostor = activePlayerId === caughtImpostorId;
  const impostorName = caughtImpostor?.name || (language === 'ar' ? 'الإمبوستر' : 'The Impostor');

  return (
    <div className="flex flex-col items-center justify-between min-h-[460px] max-w-sm mx-auto w-full gap-4 select-none">
      {/* Top Header Row with Cyan Pill */}
      <div className="w-full text-center">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 bg-brand-cyan text-black rounded-full border-2 border-black font-black text-xs shadow-brutal-sm mb-2 animate-bounce">
          <Sparkles className="w-4 h-4 stroke-[3]" />
          <span>{t('lastChanceTitle')}</span>
        </div>

        <h2 className="text-lg sm:text-xl font-black text-black leading-snug">
          {t('caughtHeader', { name: impostorName })}
        </h2>
        <p className="text-xs font-bold text-gray-700 mt-1 max-w-[290px] mx-auto">
          {isMeCaughtImpostor
            ? t('caughtSubtitleImpostor')
            : t('caughtSubtitleCivilian')}
        </p>
      </div>

      {/* Caught Impostor Visual Spotlight */}
      <div className="bg-[#FFF0F5] rounded-2xl border-3 border-black p-3 shadow-brutal flex items-center justify-center gap-3 w-full">
        {caughtImpostor && (
          <PlayerPawn
            color={caughtImpostor.color}
            size="sm"
            showName={false}
            isActive={true}
          />
        )}
        <div className="text-start">
          <div className="text-sm font-black text-black">
            {impostorName}
          </div>
          <div className="text-xs font-black text-brand-pink">
            {language === 'ar' ? 'حصل على أعلى تصويت!' : 'Received the most votes!'}
          </div>
        </div>
      </div>

      {/* Word Options in 2-Column Neo-brutalist Grid */}
      <div className="w-full bg-white rounded-3xl border-3 sm:border-4 border-black p-4 shadow-brutal-xl">
        <div className="flex items-center justify-between mb-3 border-b-2 border-black pb-2">
          <span className="text-xs font-black text-black flex items-center gap-1">
            <Target className="w-4 h-4 text-brand-purple" />
            <span>{t('wordOptionsTitle')}</span>
          </span>
          <span className="text-[10px] bg-brand-yellow font-black px-2 py-0.5 rounded-full border border-black">
            {language === 'ar' ? 'اختر كلمة واحدة' : 'Pick 1 word'}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {wordOptions.map((word, idx) => {
            return (
              <button
                key={idx}
                disabled={!isMeCaughtImpostor}
                onClick={() => isMeCaughtImpostor && onSubmitGuess(word)}
                className={`py-2.5 px-2 rounded-xl border-2 border-black font-black text-xs sm:text-sm text-center transition-all ${
                  isMeCaughtImpostor
                    ? 'bg-[#FFF8E7] hover:bg-brand-yellow hover:scale-[1.02] active:translate-x-[1px] active:translate-y-[1px] shadow-brutal-sm cursor-pointer'
                    : 'bg-gray-100 text-gray-500 border-gray-400 cursor-not-allowed shadow-none'
                }`}
              >
                {word}
              </button>
            );
          })}
        </div>
      </div>

      {/* Status Notice */}
      <div className="w-full">
        {isMeCaughtImpostor ? (
          <div className="bg-brand-yellow/50 rounded-xl border-2 border-black p-2.5 text-center shadow-brutal-sm">
            <span className="text-xs font-black text-black">
              {t('tapCorrectWord')}
            </span>
          </div>
        ) : (
          <div className="bg-[#E8F5E9] rounded-xl border-2 border-black p-2.5 text-center shadow-brutal-sm">
            <span className="text-xs font-black text-green-900 flex items-center justify-center gap-1.5 animate-pulse">
              <Eye className="w-4 h-4" />
              <span>{t('spectatorWaiting')}</span>
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
