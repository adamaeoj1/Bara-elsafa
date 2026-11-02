import React, { useState, useEffect, useRef } from 'react';
import { Player } from '../../types/game';
import { PlayerPawn } from '../PlayerPawn';
import { useTranslation } from '../../i18n/LanguageContext';
import { soundFx } from '../../utils/soundFx';
import { Clock, Scale, Sparkles } from 'lucide-react';

interface MafiaMorningPhaseProps {
  player: Player;
  players: Player[];
  killedPlayerId?: string | null;
  saved?: boolean;
  turnStartedAt?: string | null;
  isHost: boolean;
  onGoToVoting: () => void;
}

export const MafiaMorningPhase: React.FC<MafiaMorningPhaseProps> = ({
  player,
  players,
  killedPlayerId,
  saved,
  turnStartedAt,
  isHost,
  onGoToVoting,
}) => {
  const { t, language } = useTranslation();
  const maxDiscussionDuration = 60;
  const lastTickedSecond = useRef<number | null>(null);

  const calculateRemaining = (): number => {
    if (turnStartedAt) {
      const elapsed = Math.floor((Date.now() - new Date(turnStartedAt).getTime()) / 1000);
      return Math.max(0, maxDiscussionDuration - elapsed);
    }
    return 60;
  };

  const [timeLeft, setTimeLeft] = useState<number>(calculateRemaining);

  useEffect(() => {
    const update = () => {
      const rem = calculateRemaining();
      setTimeLeft(rem);

      if (rem <= 5 && rem > 0 && lastTickedSecond.current !== rem) {
        lastTickedSecond.current = rem;
        soundFx.playTimerTick();
      }

      if (rem === 0 && isHost) {
        onGoToVoting();
      }
    };

    update();
    const interval = setInterval(update, 500);
    return () => clearInterval(interval);
  }, [turnStartedAt, isHost, onGoToVoting]);

  const killedPlayer = killedPlayerId ? players.find((p) => p.id === killedPlayerId) : null;
  const isMeGhost = player.isAlive === false || player.is_alive === false;

  return (
    <div className="flex flex-col items-center justify-between w-full gap-4 select-none animate-fade-in pb-2">
      {/* 1. Morning Header & 60s Discussion Timer */}
      <div className="w-full bg-white rounded-3xl border-3 border-black p-4 shadow-brutal flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-brand-yellow border-2 border-black shadow-brutal-xs flex items-center justify-center text-xl">
            ☀️
          </div>
          <div className="text-start">
            <span className="text-xs font-black text-gray-500 block leading-tight">
              {t('morningTitle')}
            </span>
            <span className="text-sm font-black text-black">
              {language === 'ar' ? 'حلّ الصباح على المدينة!' : 'Morning in town!'}
            </span>
          </div>
        </div>

        {/* 60s Discussion Timer Pill */}
        <div className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#FAF8F5] rounded-xl border-2 border-black font-mono font-black text-sm text-black">
          <Clock className="w-4 h-4" />
          <span>{timeLeft}s</span>
        </div>
      </div>

      {/* 2. Dramatic Overnight Event Banner */}
      {killedPlayer ? (
        <div className="w-full bg-[#F8BBD0] rounded-3xl border-3 border-black p-5 shadow-brutal text-center animate-fade-in">
          <div className="w-12 h-12 rounded-2xl bg-white border-2 border-black flex items-center justify-center text-2xl mx-auto mb-2 shadow-brutal-xs">
            💀
          </div>
          <h3 className="text-lg sm:text-xl font-black text-black">
            {t('playerAssassinated', { name: killedPlayer.name })}
          </h3>
          <div className="my-3 flex justify-center">
            <PlayerPawn
              color={killedPlayer.color}
              name={killedPlayer.name}
              isDead={true}
              size="md"
            />
          </div>
          <p className="text-xs sm:text-sm font-black text-red-900 bg-white/80 p-2.5 rounded-xl border-2 border-black">
            {language === 'ar'
              ? 'أصبح الآن شبحاً متفرجاً 👻 ولا يحق له التصويت في المحكمة!'
              : 'They are now a spectator ghost 👻 and cannot vote in court!'}
          </p>
        </div>
      ) : saved ? (
        <div className="w-full bg-[#A5D6A7] rounded-3xl border-3 border-black p-5 shadow-brutal text-center animate-fade-in">
          <div className="w-12 h-12 rounded-2xl bg-white border-2 border-black flex items-center justify-center text-2xl mx-auto mb-2 shadow-brutal-xs">
            🛡️
          </div>
          <h3 className="text-base sm:text-lg font-black text-black leading-snug">
            {t('doctorSavedVictim')}
          </h3>
          <p className="text-xs sm:text-sm font-black text-green-900 bg-white/80 p-2.5 rounded-xl border-2 border-black mt-2">
            {language === 'ar'
              ? 'تدخل الدكتور في اللحظة المناسبة وأنقذ حياة الضحية من الاغتيال!'
              : 'The Doctor arrived in the nick of time and shielded the victim!'}
          </p>
        </div>
      ) : (
        <div className="w-full bg-[#FFF9C4] rounded-3xl border-3 border-black p-5 shadow-brutal text-center animate-fade-in">
          <div className="w-12 h-12 rounded-2xl bg-white border-2 border-black flex items-center justify-center text-2xl mx-auto mb-2 shadow-brutal-xs">
            🕊️
          </div>
          <h3 className="text-base sm:text-lg font-black text-black">
            {t('peacefulNight')}
          </h3>
        </div>
      )}

      {isMeGhost && (
        <div className="w-full bg-black/85 text-white rounded-2xl p-3 border-2 border-black flex items-center gap-2 text-xs sm:text-sm font-black">
          <span className="text-xl">👻</span>
          <span>{t('ghostSpectatorNotice')}</span>
        </div>
      )}

      {/* 3. Town Debate & Detective Advice Card */}
      <div className="w-full bg-white rounded-3xl border-3 border-black p-4 shadow-brutal text-start">
        <div className="flex items-center gap-2 mb-1.5">
          <Sparkles className="w-4 h-4 text-brand-purple fill-brand-purple" />
          <h4 className="text-xs sm:text-sm font-black text-black">
            {language === 'ar' ? 'نقاش المدينة المفتوح 💬' : 'Open Town Debate 💬'}
          </h4>
        </div>
        <p className="text-xs sm:text-sm text-gray-700 font-bold leading-relaxed">
          {language === 'ar'
            ? 'تناقشوا بصوت عالٍ! يمكن للمحقق إسقاط تلميحات ذكية بدون أن يفضح نفسه مبكراً للإمبوستر، ويمكن للمواطنين مراقبة المتلعثمين قبل بدء المحكمة!'
            : 'Debate aloud! The Detective can drop subtle clues without exposing themselves too early to the Impostor!'}
        </p>
      </div>

      {/* 4. Host Go to Court Voting */}
      {isHost ? (
        <button
          onClick={onGoToVoting}
          className="w-full py-3.5 bg-brand-yellow hover:bg-[#ffe175] text-black font-black text-base rounded-2xl border-3 border-black shadow-brutal active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <Scale className="w-5 h-5 stroke-[2.5]" />
          <span>{t('goToCourtBtn')}</span>
        </button>
      ) : (
        <div className="bg-white rounded-2xl border-2 border-black p-3.5 text-center shadow-brutal-sm w-full">
          <span className="text-xs sm:text-sm font-black text-gray-700 animate-pulse">
            {language === 'ar'
              ? '⏳ في انتظار المضيف لبدء جلسة تصويت المحكمة... ⚖️'
              : '⏳ Waiting for Host to start court voting... ⚖️'}
          </span>
        </div>
      )}
    </div>
  );
};
