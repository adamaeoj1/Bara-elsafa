import React, { useState, useEffect, useRef } from 'react';
import { Player, MafiaRole } from '../../types/game';
import { PlayerPawn } from '../PlayerPawn';
import { useTranslation } from '../../i18n/LanguageContext';
import { soundFx } from '../../utils/soundFx';
import { Clock, Shield, Search, Skull, Check, Sun } from 'lucide-react';

interface MafiaNightPhaseProps {
  player: Player;
  players: Player[];
  turnStartedAt?: string | null;
  isHost: boolean;
  onSubmitAction: (action: { role: MafiaRole; targetId: string }) => void;
  onResolveNight: () => void;
}

export const MafiaNightPhase: React.FC<MafiaNightPhaseProps> = ({
  player,
  players,
  turnStartedAt,
  isHost,
  onSubmitAction,
  onResolveNight,
}) => {
  const { t, language } = useTranslation();
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState<boolean>(false);
  const [detectiveResult, setDetectiveResult] = useState<{ isImpostor: boolean; targetName: string } | null>(null);
  const [decoyCount, setDecoyCount] = useState<number>(0);

  const lastTickedSecond = useRef<number | null>(null);
  const maxNightDuration = 30;

  const calculateRemaining = (): number => {
    if (turnStartedAt) {
      const elapsed = Math.floor((Date.now() - new Date(turnStartedAt).getTime()) / 1000);
      return Math.max(0, maxNightDuration - elapsed);
    }
    return 30;
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
        onResolveNight();
      }
    };

    update();
    const interval = setInterval(update, 500);
    return () => clearInterval(interval);
  }, [turnStartedAt, isHost, onResolveNight]);

  const role = player.mafiaRole || player.mafia_role || (player.isImpostor ? 'IMPOSTOR' : 'CIVILIAN');
  const livingPlayers = players.filter((p) => p.isAlive !== false && p.is_alive !== false);
  const isDoctorSelfSaved = (player.doctorSelfSavedCount || 0) >= 1;

  const handleSelectTarget = (target: Player) => {
    if (hasSubmitted) return;

    if (role === 'DOCTOR' && target.id === player.id && isDoctorSelfSaved) {
      return;
    }

    if (role === 'DETECTIVE' && target.id === player.id) {
      return;
    }

    setSelectedTargetId(target.id);
    setHasSubmitted(true);
    soundFx.playVoteClick();

    onSubmitAction({ role, targetId: target.id });

    if (role === 'DETECTIVE') {
      const isImp = Boolean(target.isImpostor || target.is_impostor || target.mafiaRole === 'IMPOSTOR');
      setDetectiveResult({ isImpostor: isImp, targetName: target.name });
    }
  };

  const handleDecoyTap = () => {
    setDecoyCount((c) => c + 1);
    soundFx.playReactionPop();
  };

  return (
    <div className="flex flex-col items-center justify-between w-full gap-4 select-none text-white animate-fade-in pb-2">
      {/* 1. Night Header & Sync Timer */}
      <div className="w-full bg-[#1E1B2E] rounded-3xl border-2 border-white/30 p-4 shadow-brutal flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-brand-yellow/20 border-2 border-brand-yellow/40 flex items-center justify-center text-xl">
            🌙
          </div>
          <div className="text-start">
            <span className="text-xs font-black text-gray-300 block leading-tight">
              {language === 'ar' ? 'مرحلة الليل السرية' : 'Secret Night Phase'}
            </span>
            <span className="text-sm font-black text-brand-yellow">
              {language === 'ar' ? 'الجميع يغمض عينيه!' : 'Everyone close your eyes!'}
            </span>
          </div>
        </div>

        {/* 30s Countdown Pill */}
        <div className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white/10 rounded-xl border border-white/20 font-mono font-black text-sm text-brand-yellow">
          <Clock className="w-4 h-4" />
          <span>{timeLeft}s</span>
        </div>
      </div>

      {/* 2. Instruction Banner */}
      <div className="text-center w-full px-2">
        <p className="text-xs sm:text-sm font-black text-gray-300 leading-relaxed">
          {t('nightFallsBanner')}
        </p>
      </div>

      {/* 3. Role-Specific Action Card */}
      <div className="w-full bg-[#1E1B2E] rounded-3xl border-2 border-white/30 p-5 shadow-brutal flex flex-col justify-between min-h-[260px]">
        {/* Role: Impostor */}
        {role === 'IMPOSTOR' && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2.5 text-start">
              <Skull className="w-5 h-5 text-brand-pink shrink-0" />
              <div>
                <h4 className="text-sm sm:text-base font-black text-brand-pink">
                  {t('impostorNightTitle')}
                </h4>
                <span className="text-xs text-gray-400 font-bold block">
                  {language === 'ar' ? 'انقر على صورة الضحية لاغتيالها الليلة' : 'Tap a victim to assassinate tonight'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mt-2">
              {livingPlayers
                .filter((p) => p.id !== player.id)
                .map((target) => {
                  const isSelected = selectedTargetId === target.id;
                  return (
                    <button
                      key={target.id}
                      type="button"
                      disabled={hasSubmitted}
                      onClick={() => handleSelectTarget(target)}
                      className={`flex flex-col items-center p-3 rounded-2xl border-2 transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-brand-pink/30 border-brand-pink scale-[1.02]'
                          : 'bg-white/5 border-white/20 hover:bg-white/10'
                      }`}
                    >
                      <PlayerPawn color={target.color} size="sm" showName={false} isActive={true} />
                      <span className="text-xs sm:text-sm font-black text-white truncate max-w-full mt-1">
                        {target.name}
                      </span>
                      {isSelected && (
                        <span className="text-[10px] bg-brand-pink text-black px-2 py-0.5 rounded-full font-black mt-1">
                          🔪 ضحية
                        </span>
                      )}
                    </button>
                  );
                })}
            </div>
          </div>
        )}

        {/* Role: Doctor */}
        {role === 'DOCTOR' && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2.5 text-start">
              <Shield className="w-5 h-5 text-brand-cyan shrink-0" />
              <div>
                <h4 className="text-sm sm:text-base font-black text-brand-cyan">
                  {t('doctorNightTitle')}
                </h4>
                <span className="text-xs text-gray-400 font-bold block">
                  {isDoctorSelfSaved
                    ? t('doctorAlreadySavedSelf')
                    : language === 'ar'
                    ? 'يمكنك حماية نفسك مرة واحدة فقط طوال اللعبة'
                    : 'You can protect yourself once!'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mt-2">
              {livingPlayers.map((target) => {
                const isSelf = target.id === player.id;
                const isDisabled = hasSubmitted || (isSelf && isDoctorSelfSaved);
                const isSelected = selectedTargetId === target.id;

                return (
                  <button
                    key={target.id}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => handleSelectTarget(target)}
                    className={`flex flex-col items-center p-3 rounded-2xl border-2 transition-all ${
                      isDisabled && isSelf
                        ? 'bg-gray-800/40 border-gray-700 opacity-40 cursor-not-allowed'
                        : isSelected
                        ? 'bg-brand-cyan/30 border-brand-cyan scale-[1.02]'
                        : 'bg-white/5 border-white/20 hover:bg-white/10 cursor-pointer'
                    }`}
                  >
                    <PlayerPawn color={target.color} size="sm" showName={false} isActive={true} />
                    <span className="text-xs sm:text-sm font-black text-white truncate max-w-full mt-1">
                      {target.name} {isSelf && '(أنت)'}
                    </span>
                    {isSelected && (
                      <span className="text-[10px] bg-brand-cyan text-black px-2 py-0.5 rounded-full font-black mt-1">
                        🛡️ محمي
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Role: Detective */}
        {role === 'DETECTIVE' && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2.5 text-start">
              <Search className="w-5 h-5 text-brand-yellow shrink-0" />
              <div>
                <h4 className="text-sm sm:text-base font-black text-brand-yellow">
                  {t('detectiveNightTitle')}
                </h4>
                <span className="text-xs text-gray-400 font-bold block">
                  {language === 'ar' ? 'انقر لكشف هوية مشتبه به سراً' : 'Tap to secretly inspect a suspect'}
                </span>
              </div>
            </div>

            {detectiveResult ? (
              <div
                className={`p-4 rounded-2xl border-2 mt-2 text-center animate-fade-in ${
                  detectiveResult.isImpostor
                    ? 'bg-red-500/20 border-red-500 text-red-300'
                    : 'bg-green-500/20 border-green-500 text-green-300'
                }`}
              >
                <div className="text-3xl mb-1">{detectiveResult.isImpostor ? '🔪' : '🛡️'}</div>
                <div className="text-sm font-black">{detectiveResult.targetName}:</div>
                <div className="text-base font-black mt-1">
                  {detectiveResult.isImpostor
                    ? t('detectiveResultImpostor')
                    : t('detectiveResultInnocent')}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mt-2">
                {livingPlayers
                  .filter((p) => p.id !== player.id)
                  .map((target) => (
                    <button
                      key={target.id}
                      type="button"
                      disabled={hasSubmitted}
                      onClick={() => handleSelectTarget(target)}
                      className="flex flex-col items-center p-3 rounded-2xl border-2 bg-white/5 border-white/20 hover:bg-white/10 transition-all cursor-pointer"
                    >
                      <PlayerPawn color={target.color} size="sm" showName={false} isActive={true} />
                      <span className="text-xs sm:text-sm font-black text-white truncate max-w-full mt-1">
                        {target.name}
                      </span>
                    </button>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* Role: Civilian */}
        {role === 'CIVILIAN' && (
          <div className="flex flex-col items-center justify-center text-center my-auto gap-3 py-4">
            <div className="w-16 h-16 rounded-2xl bg-white/10 border-2 border-white/20 flex items-center justify-center text-3xl">
              😴
            </div>
            <div>
              <h4 className="text-base sm:text-lg font-black text-white">
                {t('civilianDecoyTitle')}
              </h4>
              <p className="text-xs sm:text-sm text-gray-300 font-bold max-w-md mx-auto mt-1 leading-relaxed">
                {language === 'ar'
                  ? 'أنت مواطن نائم... اضغط الزر بالأسفل عشوائياً عشان ما يشك أحد بجلسة اللعب إنك مواطن خامل!'
                  : 'You are sleeping! Tap the decoy button below to pretend you have a secret active role!'}
              </p>
            </div>

            <button
              onClick={handleDecoyTap}
              className="py-3 px-6 bg-brand-yellow text-black font-black text-xs sm:text-sm rounded-2xl border-2 border-black shadow-brutal active:scale-95 transition-transform flex items-center gap-2 cursor-pointer"
            >
              <span>😴</span>
              <span>{t('civilianDecoyBtn', { count: decoyCount })}</span>
            </button>
          </div>
        )}

        {hasSubmitted && (
          <div className="mt-3 py-2 px-3 bg-brand-green/20 rounded-xl border border-brand-green/40 text-brand-green font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 animate-fade-in">
            <Check className="w-4 h-4 stroke-[3]" />
            <span>{t('nightWaitingOthers')}</span>
          </div>
        )}
      </div>

      {/* 4. Host Force Next (Break of Dawn) */}
      {isHost && (
        <button
          onClick={onResolveNight}
          className="w-full py-3.5 bg-brand-yellow hover:bg-[#ffe175] text-black font-black text-base rounded-2xl border-2 border-black shadow-brutal active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <Sun className="w-5 h-5 text-black stroke-[2.5]" />
          <span>{t('dawnBtn')}</span>
        </button>
      )}
    </div>
  );
};
