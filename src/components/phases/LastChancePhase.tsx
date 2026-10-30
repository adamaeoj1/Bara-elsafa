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
  const { t } = useTranslation();
  const caughtImpostor = players.find((p) => p.id === caughtImpostorId);
  const isMeCaughtImpostor = activePlayerId === caughtImpostorId;

  return (
    <div className="flex flex-col items-center justify-between min-h-[460px] max-w-sm mx-auto w-full gap-4">
      {/* Top Header Row with Cyan Pill */}
      <div className="w-full text-center">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-brand-cyan text-black rounded-full border-2 border-black font-black text-xs shadow-brutal-sm mb-2 animate-bounce">
          <Sparkles className="w-4 h-4 stroke-[3]" />
          <span>{t('lastChanceTitle')}</span>
        </div>

        <h2 className="text-xl font-black text-black leading-snug">
          {t('caughtTitle', { name: caughtImpostor?.name || t('impostorLabel') })}
        </h2>
        <p className="text-xs font-bold text-gray-700 mt-1 max-w-[280px] mx-auto">
          {isMeCaughtImpostor
            ? t('caughtSubtitleImpostor')
            : t('caughtSubtitleCivilian')}
        </p>
      </div>

      {/* Caught Impostor Visual Spotlight */}
      <div className="bg-[#FFF0F5] rounded-2xl border-3 border-black p-3.5 shadow-brutal flex items-center justify-center gap-3 w-full">
        {caughtImpostor && (
          <PlayerPawn
            color={caughtImpostor.color}
            size="sm"
            showName={false}
            isActive={true}
          />
        )}
        <div className="text-right">
          <div className="text-sm font-black text-black">
            {caughtImpostor?.name}
          </div>
          <div className="text-xs font-bold text-brand-pink">
            {t('highestVotesNotice')}
          </div>
        </div>
      </div>

      {/* 8-Word Options in 2-Column Neo-brutalist Grid */}
      <div className="w-full bg-white rounded-3xl border-4 border-black p-4 shadow-brutal-xl">
        <div className="flex items-center justify-between mb-3 border-b-2 border-black pb-2">
          <span className="text-xs font-black text-black flex items-center gap-1">
            <Target className="w-4 h-4 text-brand-purple" />
            <span>{t('wordOptionsTitle')}</span>
          </span>
          <span className="text-[10px] bg-brand-yellow font-black px-2 py-0.5 rounded-full border border-black">
            {t('pickOneWord')}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {wordOptions.map((word, idx) => {
            return (
              <button
                key={idx}
                disabled={!isMeCaughtImpostor}
                onClick={() => isMeCaughtImpostor && onSubmitGuess(word)}
                className={`py-3 px-2 rounded-xl border-2 border-black font-black text-sm text-center transition-all ${
                  isMeCaughtImpostor
                    ? 'bg-[#FFF8E7] hover:bg-brand-yellow hover:scale-102 active:translate-x-[2px] active:translate-y-[2px] shadow-brutal-sm cursor-pointer'
                    : 'bg-gray-100 text-gray-500 border-gray-400 cursor-not-allowed shadow-none'
                }`}
              >
                {word}
              </button>
            );
          })}
        </div>
      </div>

      {/* Strict Permission Status Notice */}
      <div className="w-full">
        {isMeCaughtImpostor ? (
          <div className="bg-brand-yellow/40 rounded-xl border-2 border-black p-2.5 text-center shadow-brutal-sm">
            <span className="text-xs font-black text-black flex items-center justify-center gap-1.5">
              <span>{t('tapCorrectWord')}</span>
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
