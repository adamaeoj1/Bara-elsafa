import React, { useEffect } from 'react';
import { Player } from '../../types/game';
import { RotateCcw, Home, Crown, Check, X, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { PlayerPawn } from '../PlayerPawn';

interface GameOverPhaseProps {
  winner: 'IMPOSTOR' | 'CIVILIANS' | null;
  winReason: 'ESCAPED' | 'GUESSED_WORD' | 'WRONG_GUESS' | null;
  secretWord: string;
  impostorGuess: string | null;
  players: Player[];
  caughtImpostorId: string | null;
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
  caughtImpostorId,
  isHost,
  onPlayAgain,
  onBackToLobby,
}) => {
  const impostors = players.filter((p) => p.isImpostor);
  const primaryImpostor = impostors[0];
  const civilians = players.filter((p) => !p.isImpostor);

  const impostorWon = winner === 'IMPOSTOR';

  // Confetti burst on mount
  useEffect(() => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: impostorWon ? ['#FF80AB', '#B388FF', '#FAD85D'] : ['#7CE38B', '#6FD8F2', '#FAD85D'],
      });
    } catch (e) {
      // Ignore if confetti not supported
    }
  }, [impostorWon]);

  return (
    <div className="flex flex-col items-center justify-between min-h-[460px] max-w-sm mx-auto w-full gap-4">
      {/* Victory Banner Card */}
      {impostorWon ? (
        /* IMPOSTOR VICTORY CARD (Pink #F8BBD0) */
        <div className="w-full bg-[#F8BBD0] rounded-3xl border-4 border-black p-5 shadow-brutal-xl text-center relative overflow-hidden animate-fade-in">
          <div className="absolute -top-3 -right-3 text-4xl">👑</div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white rounded-full border-2 border-black font-black text-xs shadow-brutal-sm mb-2">
            <Sparkles className="w-3.5 h-3.5 text-brand-pink fill-brand-pink" />
            <span>نهاية الجولة</span>
          </div>

          <h2 className="text-2xl font-black text-black">
            فاز الإمبوستر! 🕵️
          </h2>

          <div className="my-3 flex items-center justify-center gap-2">
            {impostors.map((imp) => (
              <div key={imp.id} className="flex flex-col items-center">
                <PlayerPawn
                  color={imp.color}
                  name={imp.name}
                  size="md"
                  isWinner={true}
                  isActive={true}
                />
              </div>
            ))}
          </div>

          <p className="text-xs font-black text-gray-800 bg-white/70 rounded-xl p-2 border border-black/40">
            {winReason === 'GUESSED_WORD'
              ? 'انكشف الإمبوستر وعرف الكلمة في الفرصة الأخيرة! 🔥'
              : 'ما قدرتوا تصيدون الإمبوستر وهرب بنجاح! 🏃‍♂️💨'}
          </p>
        </div>
      ) : (
        /* CIVILIANS VICTORY CARD (Green #A5D6A7) */
        <div className="w-full bg-[#A5D6A7] rounded-3xl border-4 border-black p-5 shadow-brutal-xl text-center relative overflow-hidden animate-fade-in">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white rounded-full border-2 border-black font-black text-xs shadow-brutal-sm mb-2">
            <Sparkles className="w-3.5 h-3.5 text-brand-green fill-brand-green" />
            <span>نهاية الجولة</span>
          </div>

          <h2 className="text-2xl font-black text-black">
            فازوا اللاعبين! 🛡️🎉
          </h2>

          <div className="my-3 flex flex-wrap items-center justify-center gap-2">
            {civilians.slice(0, 4).map((civ) => (
              <div key={civ.id} className="flex flex-col items-center">
                <PlayerPawn
                  color={civ.color}
                  name={civ.name}
                  size="sm"
                  isWinner={true}
                  isActive={true}
                />
              </div>
            ))}
          </div>

          <p className="text-xs font-black text-gray-800 bg-white/70 rounded-xl p-2 border border-black/40">
            انكشف الإمبوستر وما عرف الكلمة في الفرصة الأخيرة! 🎯👏
          </p>
        </div>
      )}

      {/* Two Side-by-Side Summary Boxes */}
      <div className="grid grid-cols-2 gap-3 w-full">
        {/* Right Box: The Secret Word */}
        <div className="bg-white rounded-2xl border-3 border-black p-3.5 shadow-brutal flex flex-col justify-between text-right">
          <span className="text-[11px] font-bold text-gray-500 block mb-1">
            الكلمة كانت:
          </span>
          <div className="text-lg font-black text-brand-purple tracking-wide truncate">
            {secretWord}
          </div>
          <span className="text-[10px] text-gray-400 font-bold mt-1">
            السالفة الأصلية
          </span>
        </div>

        {/* Left Box: The Impostor & Their Guess */}
        <div className="bg-white rounded-2xl border-3 border-black p-3.5 shadow-brutal flex flex-col justify-between text-right">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] bg-brand-pink font-black text-black px-2 py-0.5 rounded-full border border-black">
              الإمبوستر
            </span>
          </div>
          <div className="text-sm font-black text-black truncate">
            {primaryImpostor?.name || 'مجهول'}
          </div>
          <div className="text-[10px] font-bold mt-1 flex items-center gap-1">
            {impostorGuess ? (
              impostorGuess === secretWord ? (
                <span className="text-green-700 font-black flex items-center gap-0.5">
                  <Check className="w-3 h-3 stroke-[3]" /> خمن: {impostorGuess}
                </span>
              ) : (
                <span className="text-red-600 font-black flex items-center gap-0.5">
                  <X className="w-3 h-3 stroke-[3]" /> خمن: {impostorGuess}
                </span>
              )
            ) : (
              <span className="text-gray-500">لم يخمن (هرب)</span>
            )}
          </div>
        </div>
      </div>

      {/* Host Controls */}
      <div className="w-full flex flex-col gap-2.5">
        {isHost ? (
          <>
            <button
              onClick={onPlayAgain}
              className="w-full py-3.5 bg-brand-yellow hover:bg-[#ffe175] text-black font-black text-base rounded-2xl border-3 border-black shadow-brutal active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-5 h-5 stroke-[2.5]" />
              <span>العب مرة ثانية 🔄</span>
            </button>

            <button
              onClick={onBackToLobby}
              className="w-full py-2.5 bg-white hover:bg-gray-100 text-black font-bold text-xs rounded-xl border-2 border-black shadow-brutal-sm active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all flex items-center justify-center gap-1.5"
            >
              <Home className="w-4 h-4 stroke-[2]" />
              <span>تغيير السالفة / اللوبي</span>
            </button>
          </>
        ) : (
          <div className="bg-white rounded-xl border-2 border-black p-3 text-center shadow-brutal-sm">
            <span className="text-xs font-black text-gray-700">
              في انتظار المضيف لبدء جولة جديدة أو العودة للوبي... ⏳
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
