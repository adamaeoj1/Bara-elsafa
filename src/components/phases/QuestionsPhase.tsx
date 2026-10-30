import React, { useState, useEffect, useRef } from 'react';
import { Player, QuestionPair } from '../../types/game';
import { Clock, MessageSquare, ArrowLeft } from 'lucide-react';
import { soundFx } from '../../utils/soundFx';
import { useTranslation } from '../../i18n/LanguageContext';

interface QuestionsPhaseProps {
  currentPair: QuestionPair;
  pairIndex: number;
  totalPairs: number;
  timeLeft: number;
  turnStartedAt?: string | null;
  maxDuration?: number; // 15, 25, 45, or 0 (infinite)
  players: Player[];
  isHost: boolean;
  onNextPair: () => void;
}

export const QuestionsPhase: React.FC<QuestionsPhaseProps> = ({
  currentPair,
  pairIndex,
  totalPairs,
  timeLeft: fallbackTimeLeft,
  turnStartedAt,
  maxDuration = 25,
  players,
  isHost,
  onNextPair,
}) => {
  const { t, language } = useTranslation();
  const asker = players.find((p) => p.id === currentPair?.askerId);
  const answerer = players.find((p) => p.id === currentPair?.answererId);
  const lastTickedSecond = useRef<number | null>(null);

  const isInfinite = maxDuration === 0;

  // Dynamic Server-Timestamp Timer Sync
  const calculateRemaining = (): number => {
    if (isInfinite) return 0;
    if (turnStartedAt) {
      const elapsed = Math.floor((Date.now() - new Date(turnStartedAt).getTime()) / 1000);
      return Math.max(0, maxDuration - elapsed);
    }
    return fallbackTimeLeft;
  };

  const [currentTimeLeft, setCurrentTimeLeft] = useState<number>(calculateRemaining);

  useEffect(() => {
    if (isInfinite) return;

    const update = () => {
      const remaining = calculateRemaining();
      setCurrentTimeLeft(remaining);

      // Play audio tick in last 5 seconds (only once per second)
      if (remaining <= 5 && remaining > 0 && lastTickedSecond.current !== remaining) {
        lastTickedSecond.current = remaining;
        soundFx.playTimerTick();
      }

      // If time runs out and current client is host, advance to next pair automatically
      if (remaining === 0 && isHost) {
        onNextPair();
      }
    };

    update();
    const interval = setInterval(update, 500);
    return () => clearInterval(interval);
  }, [turnStartedAt, isHost, onNextPair, isInfinite, maxDuration]);

  // Timer percentage calculation
  const timerPercentage = isInfinite ? 100 : Math.max(0, Math.min(100, (currentTimeLeft / (maxDuration || 25)) * 100));

  const askerName = asker?.name || '...';
  const answererName = answerer?.name || '...';

  return (
    <div className="flex flex-col items-center justify-between min-h-[460px] max-w-sm mx-auto w-full gap-3.5 select-none">
      {/* Top Header Row with round counter & timer */}
      <div className="w-full flex items-center justify-between">
        <div className="bg-brand-pink text-black px-3 py-1.5 rounded-full border-2 border-black font-black text-xs shadow-brutal-sm flex items-center gap-1.5">
          <MessageSquare className="w-3.5 h-3.5 stroke-[3]" />
          <span>{t('questionsPhaseTitle')}</span>
        </div>

        <div className="text-xs font-black text-gray-800 bg-white px-3 py-1 rounded-full border-2 border-black shadow-brutal-sm">
          {t('turnProgress', { current: pairIndex + 1, total: totalPairs })}
        </div>

        {/* Cyan Countdown Badge */}
        <div className={`text-black px-3 py-1.5 rounded-full border-2 border-black font-black text-xs sm:text-sm shadow-brutal-sm flex items-center gap-1.5 ${
          !isInfinite && currentTimeLeft <= 5 ? 'bg-red-400 text-white animate-bounce' : 'bg-brand-cyan animate-pulse'
        }`}>
          <Clock className="w-4 h-4 stroke-[3]" />
          <span className="font-mono font-black">
            {isInfinite ? '∞' : t('timeSeconds', { time: currentTimeLeft })}
          </span>
        </div>
      </div>

      {/* Prominent Directional Q&A Action Banner */}
      <div className="w-full bg-[#FFF9E6] border-3 border-black rounded-2xl py-2.5 px-3 text-center font-black text-xs sm:text-sm shadow-brutal flex items-center justify-center gap-2">
        <span className="text-black font-black">{askerName}</span>
        <span className="text-brand-purple font-black">
          {language === 'ar' ? 'يسأل ⬅' : 'Asks ➡'}
        </span>
        <span className="text-black font-black">{answererName}</span>
        <span className="text-brand-cyan font-black">
          {language === 'ar' ? 'يجاوب' : 'Answers'}
        </span>
      </div>

      {/* Center Card UI with Question & Answer details */}
      <div className="relative w-full bg-white rounded-3xl border-3 sm:border-4 border-black p-4 shadow-brutal-xl flex flex-col items-center justify-between">
        <div className="text-center mb-1">
          <h3 className="text-base font-black text-black">
            {t('qaTime')}
          </h3>
          <p className="text-xs font-bold text-gray-500">
            {t('qaDesc')}
          </p>
        </div>

        {/* Connection Visual Diagram */}
        <div className="w-full flex flex-col items-center my-2.5 relative">
          {/* Asker Block */}
          <div className="w-full bg-[#FFF3E0] rounded-2xl border-2 border-black p-3 shadow-brutal-sm flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full border-2 border-black flex items-center justify-center font-black text-sm shadow-brutal-sm shrink-0"
              style={{ backgroundColor: asker?.color || '#FFAB73' }}
            >
              {asker?.name ? asker.name.slice(0, 1) : (language === 'ar' ? '؟' : '?')}
            </div>
            <div className="flex-1 truncate text-start">
              <span className="text-[10px] font-black text-orange-700 block">
                {language === 'ar' ? 'السائل' : 'Asker'}
              </span>
              <div className="text-sm font-black text-black truncate">
                {askerName}
              </div>
            </div>
            <span className="text-2xl">🗣️</span>
          </div>

          {/* Directional Connector Arrow */}
          <div className="my-1.5 flex items-center justify-center">
            <div className="bg-black text-white px-2 py-0.5 rounded-full text-[10px] font-black flex items-center gap-1 shadow-brutal-sm">
              <span>{language === 'ar' ? '⬇ سؤال' : '⬇ Question'}</span>
            </div>
          </div>

          {/* Answerer Block */}
          <div className="w-full bg-[#E0F7FA] rounded-2xl border-2 border-black p-3 shadow-brutal-sm flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full border-2 border-black flex items-center justify-center font-black text-sm shadow-brutal-sm shrink-0"
              style={{ backgroundColor: answerer?.color || '#6FD8F2' }}
            >
              {answerer?.name ? answerer.name.slice(0, 1) : (language === 'ar' ? '؟' : '?')}
            </div>
            <div className="flex-1 truncate text-start">
              <span className="text-[10px] font-black text-cyan-800 block">
                {language === 'ar' ? 'المجيب' : 'Answerer'}
              </span>
              <div className="text-sm font-black text-black truncate">
                {answererName}
              </div>
            </div>
            <span className="text-2xl">👂</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full mt-2">
          <div className="w-full h-3 bg-gray-200 rounded-full border-2 border-black overflow-hidden p-0.5">
            <div
              className={`h-full rounded-full transition-all duration-500 ease-linear border-r border-black ${
                !isInfinite && currentTimeLeft <= 5 ? 'bg-red-500' : 'bg-brand-cyan'
              }`}
              style={{ width: `${timerPercentage}%` }}
            />
          </div>
          <p className="text-[10px] font-bold text-gray-500 text-center mt-1">
            {isInfinite ? t('timerInf') : t('timerSyncNote')}
          </p>
        </div>
      </div>

      {/* Host Skip / Next Button */}
      <div className="w-full">
        {isHost ? (
          <button
            onClick={onNextPair}
            className="w-full py-3.5 bg-brand-yellow hover:bg-[#ffe175] text-black font-black text-sm rounded-2xl border-3 border-black shadow-brutal active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>
              {pairIndex + 1 === totalPairs ? t('finishQuestionsBtn') : t('nextTurnBtn')}
            </span>
            <ArrowLeft className="w-4 h-4 rtl:rotate-0 ltr:rotate-180" />
          </button>
        ) : (
          <div className="bg-white/90 rounded-xl border-2 border-black p-2.5 text-center shadow-brutal-sm">
            <span className="text-xs font-bold text-gray-700">
              {language === 'ar' ? 'استمع للإجابات بتركيز واكتشف مين مسوي فاهم! 👀' : 'Listen carefully to discover who is faking it! 👀'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
