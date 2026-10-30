import React from 'react';
import { Player, QuestionPair } from '../../types/game';
import { Clock, SkipForward, HelpCircle, MessageSquare } from 'lucide-react';
import { PlayerPawn } from '../PlayerPawn';

interface QuestionsPhaseProps {
  currentPair: QuestionPair;
  pairIndex: number;
  totalPairs: number;
  timeLeft: number;
  players: Player[];
  isHost: boolean;
  onNextPair: () => void;
}

export const QuestionsPhase: React.FC<QuestionsPhaseProps> = ({
  currentPair,
  pairIndex,
  totalPairs,
  timeLeft,
  players,
  isHost,
  onNextPair,
}) => {
  const asker = players.find((p) => p.id === currentPair?.askerId);
  const answerer = players.find((p) => p.id === currentPair?.answererId);

  // 25 second timer percentage
  const timerPercentage = Math.max(0, Math.min(100, (timeLeft / 25) * 100));

  return (
    <div className="flex flex-col items-center justify-between min-h-[460px] max-w-sm mx-auto w-full gap-5">
      {/* Top Header Row with round counter */}
      <div className="w-full flex items-center justify-between">
        <div className="bg-brand-pink text-black px-3.5 py-1.5 rounded-full border-2 border-black font-black text-xs shadow-brutal-sm flex items-center gap-1.5">
          <MessageSquare className="w-3.5 h-3.5 stroke-[3]" />
          <span>الأسئلة</span>
        </div>

        <div className="text-xs font-black text-gray-700 bg-white px-3 py-1 rounded-full border-2 border-black shadow-brutal-sm">
          الدور {pairIndex + 1} من {totalPairs}
        </div>

        {/* Cyan Countdown Badge */}
        <div className="bg-brand-cyan text-black px-3.5 py-1.5 rounded-full border-2 border-black font-black text-sm shadow-brutal-sm flex items-center gap-1.5 animate-pulse">
          <Clock className="w-4 h-4 stroke-[3]" />
          <span className="font-mono font-black">{timeLeft} ث</span>
        </div>
      </div>

      {/* Center Card UI with Connection Diagram */}
      <div className="relative w-full bg-white rounded-3xl border-4 border-black p-6 shadow-brutal-xl flex flex-col items-center justify-between">
        <div className="text-center mb-2">
          <h3 className="text-base font-black text-black">
            وقت السؤال والإجابة! 🎤
          </h3>
          <p className="text-xs font-bold text-gray-500">
            اطرح سؤالاً ذكياً لا يكشف الكلمة مباشرة!
          </p>
        </div>

        {/* Connection Diagram */}
        <div className="w-full flex flex-col items-center my-4 relative">
          {/* Asker Block */}
          <div className="w-full bg-[#FFF3E0] rounded-2xl border-3 border-black p-3.5 shadow-brutal-sm flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-full border-3 border-black flex items-center justify-center font-black text-base shadow-brutal-sm shrink-0"
              style={{ backgroundColor: asker?.color || '#FFAB73' }}
            >
              {asker?.name ? asker.name.slice(0, 1) : '؟'}
            </div>
            <div className="flex-1 truncate">
              <span className="text-[11px] font-black text-orange-700 block">
                يسأل:
              </span>
              <div className="text-base font-black text-black truncate">
                {asker?.name || 'غير معروف'}
              </div>
            </div>
            <span className="text-2xl">🗣️</span>
          </div>

          {/* Vertical Dashed Black Line Connector */}
          <div className="h-10 w-0 border-r-3 border-dashed border-black my-1" />

          {/* Answerer Block */}
          <div className="w-full bg-[#E0F7FA] rounded-2xl border-3 border-black p-3.5 shadow-brutal-sm flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-full border-3 border-black flex items-center justify-center font-black text-base shadow-brutal-sm shrink-0"
              style={{ backgroundColor: answerer?.color || '#6FD8F2' }}
            >
              {answerer?.name ? answerer.name.slice(0, 1) : '؟'}
            </div>
            <div className="flex-1 truncate">
              <span className="text-[11px] font-black text-cyan-800 block">
                يجاوب:
              </span>
              <div className="text-base font-black text-black truncate">
                {answerer?.name || 'غير معروف'}
              </div>
            </div>
            <span className="text-2xl">👂</span>
          </div>
        </div>

        {/* Draining Smooth Progress Bar */}
        <div className="w-full mt-2">
          <div className="w-full h-4 bg-gray-200 rounded-full border-2 border-black overflow-hidden p-0.5">
            <div
              className="h-full bg-brand-cyan rounded-full transition-all duration-1000 ease-linear border-r border-black"
              style={{ width: `${timerPercentage}%` }}
            />
          </div>
          <p className="text-[10px] font-bold text-gray-500 text-center mt-1.5">
            25 ثانية لكل دور - ينتقل تلقائياً إذا خلص الوقت
          </p>
        </div>
      </div>

      {/* Host Skip / Next Button */}
      <div className="w-full">
        {isHost ? (
          <button
            onClick={onNextPair}
            className="w-full py-3 bg-brand-yellow hover:bg-[#ffe175] text-black font-black text-sm rounded-2xl border-3 border-black shadow-brutal active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all flex items-center justify-center gap-2"
          >
            <span>
              {pairIndex + 1 === totalPairs ? 'إنهاء الأسئلة والانتقال للتصويت 🗳️' : 'الدور التالي ⏭️'}
            </span>
          </button>
        ) : (
          <div className="bg-white/80 rounded-xl border-2 border-black p-2.5 text-center shadow-brutal-sm">
            <span className="text-xs font-bold text-gray-600">
              استمع للإجابات جيداً لتكتشف من يتهرب من الجواب! 👀
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
