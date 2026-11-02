import React, { useState, useEffect } from 'react';
import { Player, GameMode } from '../../types/game';
import { RotateCcw, Home, Sparkles, Check, X, Trophy, Dices } from 'lucide-react';
import confetti from 'canvas-confetti';
import { PlayerPawn } from '../PlayerPawn';
import { useTranslation } from '../../i18n/LanguageContext';
import { PunishmentWheelModal } from '../PunishmentWheelModal';

interface GameOverPhaseProps {
  winner: 'IMPOSTOR' | 'CIVILIANS' | null;
  winReason: 'ESCAPED' | 'GUESSED_WORD' | 'WRONG_GUESS' | null;
  secretWord: string;
  impostorGuess: string | null;
  players: Player[];
  caughtImpostorId: string | null;
  gameMode?: GameMode;
  isHost: boolean;
  onPlayAgain: () => void;
  onBackToLobby: () => void;
}

export const GameOverPhase: React.FC<GameOverPhaseProps> = ({
  winner,
  winReason,
  secretWord,
  impostorGuess,
  players,
  gameMode = 'OUT_OF_THE_LOOP',
  isHost,
  onPlayAgain,
  onBackToLobby,
}) => {
  const { t, language } = useTranslation();
  const [isDareModalOpen, setIsDareModalOpen] = useState<boolean>(false);

  const isMafia = gameMode === 'MAFIA';
  const impostorWon = winner === 'IMPOSTOR';

  // Ensure every player has accurate round_points & score even if a client received a partial sync
  const normalizedPlayers: Player[] = players.map((p) => {
    const isImp = Boolean(p.isImpostor || p.is_impostor || p.mafiaRole === 'IMPOSTOR');
    let roundPts = p.round_points ?? p.roundPointsEarned ?? 0;
    let totalScore = p.score ?? 0;

    // Safety guarantee: if roundPts is 0, recalculate exact points for this game over
    if (roundPts === 0) {
      if (isMafia) {
        if (impostorWon && isImp) {
          roundPts = 250;
        } else if (!impostorWon && !isImp) {
          roundPts = 150;
        }
      } else {
        if (impostorWon && isImp) {
          roundPts = winReason === 'GUESSED_WORD' ? 150 : 200;
        } else if (!impostorWon && !isImp) {
          const impostorIds = players
            .filter((pl) => pl.isImpostor || pl.is_impostor)
            .map((pl) => pl.id);
          const votedCorrectly = Boolean(p.voted_for && impostorIds.includes(p.voted_for));
          roundPts = (winReason === 'WRONG_GUESS' ? 50 : 0) + (votedCorrectly ? 100 : 0);
          if (roundPts === 0 && !impostorWon) {
            roundPts = 50;
          }
        }
      }
      if (totalScore === 0) {
        totalScore = roundPts;
      }
    }

    return {
      ...p,
      isImpostor: isImp,
      score: Math.max(totalScore, roundPts),
      round_points: roundPts,
      roundPointsEarned: roundPts,
    };
  });

  const impostors = normalizedPlayers.filter((p) => p.isImpostor || p.mafiaRole === 'IMPOSTOR');
  const primaryImpostor = impostors[0];
  const civilians = normalizedPlayers.filter((p) => !p.isImpostor && p.mafiaRole !== 'IMPOSTOR');

  // Confetti burst on mount
  useEffect(() => {
    try {
      confetti({
        particleCount: 90,
        spread: 75,
        origin: { y: 0.6 },
        colors: impostorWon ? ['#FF80AB', '#B388FF', '#FAD85D'] : ['#7CE38B', '#6FD8F2', '#FAD85D'],
      });
    } catch (e) {}
  }, [impostorWon]);

  // Mandatory Fix #4: Always sort Leaderboard by b.score - a.score (with tie-break by round_points)
  const sortedPlayers = [...normalizedPlayers].sort((a, b) => {
    const scoreDiff = (b.score || 0) - (a.score || 0);
    if (scoreDiff !== 0) return scoreDiff;
    return (b.round_points ?? b.roundPointsEarned ?? 0) - (a.round_points ?? a.roundPointsEarned ?? 0);
  });

  // Determine the loser for the dare wheel
  let loserPlayer: Player = sortedPlayers[sortedPlayers.length - 1] || normalizedPlayers[0];
  if (!impostorWon && primaryImpostor) {
    loserPlayer = primaryImpostor;
  } else if (impostorWon) {
    const losingCivilians = [...civilians].sort((a, b) => (a.score || 0) - (b.score || 0));
    if (losingCivilians.length > 0) loserPlayer = losingCivilians[0];
  }

  return (
    <div className="flex flex-col items-center justify-between w-full gap-4 select-none pb-2 animate-fade-in">
      {/* 1. Victory Banner Card */}
      {impostorWon ? (
        /* IMPOSTOR VICTORY CARD (Pink #F8BBD0) */
        <div className="w-full bg-[#F8BBD0] rounded-3xl border-3 border-black p-5 shadow-brutal text-center relative overflow-hidden">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 bg-white rounded-full border-2 border-black font-black text-xs shadow-brutal-sm mb-2">
            <Sparkles className="w-3.5 h-3.5 text-brand-pink fill-brand-pink" />
            <span>{t('endOfRound')}</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-black">
            {isMafia ? t('mafiaImpostorWin') : t('impostorWonTitle')}
          </h2>

          <div className="my-3 flex flex-wrap items-center justify-center gap-3">
            {impostors.map((imp) => (
              <div key={imp.id} className="flex flex-col items-center">
                <PlayerPawn
                  color={imp.color}
                  name={imp.name}
                  size="md"
                  isWinner={true}
                  isActive={true}
                  score={imp.score}
                />
              </div>
            ))}
          </div>

          <p className="text-xs sm:text-sm font-black text-gray-900 bg-white/90 rounded-xl p-2.5 border-2 border-black">
            {isMafia
              ? language === 'ar'
                ? 'الإمبوستر تخلص من المواطنين وسيطر على مقاليد المدينة بالكامل! 🔪👑'
                : 'The Impostor eliminated citizens and took total control of town! 🔪👑'
              : winReason === 'GUESSED_WORD'
              ? t('impostorGuessedCorrectly')
              : t('impostorEscaped')}
          </p>
        </div>
      ) : (
        /* CIVILIANS VICTORY CARD (Green #A5D6A7) */
        <div className="w-full bg-[#A5D6A7] rounded-3xl border-3 border-black p-5 shadow-brutal text-center relative overflow-hidden">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 bg-white rounded-full border-2 border-black font-black text-xs shadow-brutal-sm mb-2">
            <Sparkles className="w-3.5 h-3.5 text-brand-green fill-brand-green" />
            <span>{t('endOfRound')}</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-black">
            {isMafia ? t('mafiaCiviliansWin') : t('civiliansWonTitle')}
          </h2>

          <div className="my-3 flex flex-wrap items-center justify-center gap-3">
            {civilians.map((civ) => (
              <div key={civ.id} className="flex flex-col items-center">
                <PlayerPawn
                  color={civ.color}
                  name={civ.name}
                  size="sm"
                  isWinner={true}
                  isActive={true}
                  score={civ.score}
                />
              </div>
            ))}
          </div>

          <p className="text-xs sm:text-sm font-black text-gray-900 bg-white/90 rounded-xl p-2.5 border-2 border-black">
            {isMafia
              ? language === 'ar'
                ? 'اتحد المواطنون والدكتور والمحقق وكشفوا الإمبوستر ونفوه من المدينة! 🛡️⚖️'
                : 'Town citizens, Doctor & Detective united to exile the Impostor! 🛡️⚖️'
              : t('impostorFailedGuess')}
          </p>
        </div>
      )}

      {/* 2. Out of the Loop Summary Boxes (or Mafia Role Summary) */}
      {!isMafia ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
          {/* Secret Word */}
          <div className="bg-white rounded-2xl border-2 border-black p-3.5 shadow-brutal flex flex-col justify-between text-start">
            <span className="text-xs font-black text-gray-500 block mb-1">
              {t('secretWordWas')}
            </span>
            <div className="text-lg sm:text-xl font-black text-brand-purple tracking-wide truncate">
              {secretWord}
            </div>
            <span className="text-[11px] text-gray-400 font-bold mt-1">
              {language === 'ar' ? 'السالفة الأصلية' : 'Original Topic'}
            </span>
          </div>

          {/* The Impostor & Their Guess */}
          <div className="bg-white rounded-2xl border-2 border-black p-3.5 shadow-brutal flex flex-col justify-between text-start">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] bg-brand-pink font-black text-black px-2 py-0.5 rounded-full border border-black">
                {language === 'ar' ? 'الإمبوستر' : 'Impostor'}
              </span>
            </div>
            <div className="text-base font-black text-black truncate">
              {primaryImpostor?.name || '...'}
            </div>
            <div className="text-xs font-black mt-1 flex items-center gap-1 truncate">
              {impostorGuess ? (
                impostorGuess === secretWord ? (
                  <span className="text-green-700 font-black flex items-center gap-1 truncate">
                    <Check className="w-3.5 h-3.5 stroke-[3] shrink-0" /> {t('impostorGuessedSummary')} {impostorGuess}
                  </span>
                ) : (
                  <span className="text-red-600 font-black flex items-center gap-1 truncate">
                    <X className="w-3.5 h-3.5 stroke-[3] shrink-0" /> {t('impostorGuessedSummary')} {impostorGuess}
                  </span>
                )
              ) : (
                <span className="text-gray-500">{t('didNotGuess')}</span>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Mafia Roles Breakdown */
        <div className="bg-white rounded-2xl border-2 border-black p-4 shadow-brutal w-full text-start">
          <span className="text-xs font-black text-gray-500 block mb-2">
            {language === 'ar' ? 'كشف جميع أدوار المافيا السرية:' : 'All Secret Mafia Roles Revealed:'}
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {normalizedPlayers.map((p) => (
              <div key={p.id} className="flex items-center gap-2 p-2 rounded-xl bg-[#FAF8F5] border border-black/30">
                <PlayerPawn color={p.color} size="sm" showName={false} isActive={true} />
                <div className="truncate">
                  <span className="text-xs font-black block truncate">{p.name}</span>
                  <span className="text-[11px] font-bold text-gray-700">
                    {p.mafiaRole === 'IMPOSTOR' || p.isImpostor
                      ? '🔪 إمبوستر'
                      : p.mafiaRole === 'DOCTOR'
                      ? '🩺 دكتور'
                      : p.mafiaRole === 'DETECTIVE'
                      ? '🕵️‍♂️ محقق'
                      : '🛡️ مواطن'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Leaderboard Card (NO internal scrollbar so all players are visible!) */}
      <div className="bg-white rounded-3xl border-3 border-black p-4 shadow-brutal w-full text-start">
        <div className="flex items-center justify-between mb-3 pb-2 border-b-2 border-black/10">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-brand-yellow fill-brand-yellow stroke-black stroke-[1.5]" />
            <h3 className="text-sm sm:text-base font-black text-black">
              {t('leaderboardTitle')}
            </h3>
          </div>
          <span className="text-xs font-bold text-gray-500">
            {language === 'ar' ? 'النقاط التراكمية' : 'Cumulative Points'}
          </span>
        </div>

        <div className="flex flex-col gap-2">
          {sortedPlayers.map((p, idx) => {
            const rankMedal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`;
            const roundPts = p.round_points ?? p.roundPointsEarned ?? 0;

            return (
              <div
                key={p.id}
                className={`flex items-center justify-between p-2.5 rounded-2xl border-2 border-black transition-all ${
                  idx === 0
                    ? 'bg-brand-yellow/40 font-black shadow-brutal-sm'
                    : 'bg-[#FAF8F5] font-bold'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <span className="text-base font-black w-6 text-center shrink-0">
                    {rankMedal}
                  </span>
                  <PlayerPawn
                    color={p.color}
                    size="sm"
                    showName={false}
                    isActive={true}
                  />
                  <span className="text-xs sm:text-sm font-black truncate">{p.name}</span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {roundPts > 0 && (
                    <span className="text-xs font-black bg-brand-green text-black px-2 py-0.5 rounded-full border border-black shadow-[1px_1px_0px_#000]">
                      (+{roundPts})
                    </span>
                  )}
                  <span className="text-xs sm:text-sm font-black text-black min-w-[60px] text-end">
                    {p.score || 0} {language === 'ar' ? 'نقطة' : 'pts'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Loser Punishment Wheel Button */}
      <button
        onClick={() => setIsDareModalOpen(true)}
        className="w-full py-3.5 bg-brand-pink hover:bg-[#ff6599] text-black font-black text-sm sm:text-base rounded-2xl border-3 border-black shadow-brutal active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all flex items-center justify-center gap-2 cursor-pointer"
      >
        <Dices className="w-5 h-5 stroke-[2.5]" />
        <span>{t('spinDareBtn')}</span>
      </button>

      {/* 5. Host Controls or Non-Host Replay Notice */}
      <div className="w-full flex flex-col gap-2.5">
        {isHost ? (
          <>
            <button
              onClick={onPlayAgain}
              className="w-full py-3.5 bg-brand-yellow hover:bg-[#ffe175] text-black font-black text-base rounded-2xl border-3 border-black shadow-brutal active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-5 h-5 stroke-[2.5]" />
              <span>{t('playAgainBtn')}</span>
            </button>

            <button
              onClick={onBackToLobby}
              className="w-full py-3 bg-white hover:bg-gray-100 text-black font-bold text-xs sm:text-sm rounded-xl border-2 border-black shadow-brutal-sm active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Home className="w-4 h-4 stroke-[2]" />
              <span>{t('backToLobbyBtn')}</span>
            </button>
          </>
        ) : (
          <div className="bg-white rounded-2xl border-2 border-black p-3.5 text-center shadow-brutal-sm">
            <span className="text-xs sm:text-sm font-black text-gray-700 animate-pulse">
              {t('waitingForHostReplay')}
            </span>
          </div>
        )}
      </div>

      {/* Loser Dare Modal */}
      <PunishmentWheelModal
        isOpen={isDareModalOpen}
        onClose={() => setIsDareModalOpen(false)}
        loser={loserPlayer}
      />
    </div>
  );
};
