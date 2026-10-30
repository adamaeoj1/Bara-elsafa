import React from 'react';
import { Player } from '../../types/game';
import { Vote, CheckCircle, ShieldAlert, Users, ArrowLeft } from 'lucide-react';
import { PlayerPawn } from '../PlayerPawn';

interface VotingPhaseProps {
  players: Player[];
  activePlayerId: string;
  votes: Record<string, string>;
  votingRevealed: boolean;
  onSubmitVote: (voterId: string, targetId: string) => void;
  onAutoVoteRemaining?: () => void;
}

export const VotingPhase: React.FC<VotingPhaseProps> = ({
  players,
  activePlayerId,
  votes,
  votingRevealed,
  onSubmitVote,
  onAutoVoteRemaining,
}) => {
  const activePlayer = players.find((p) => p.id === activePlayerId);
  const myVoteTargetId = votes[activePlayerId];
  const totalVotesCast = Object.keys(votes).length;
  const totalPlayers = players.length;

  // Calculate vote counts per player for summary
  const voteCounts: Record<string, number> = {};
  Object.values(votes).forEach((targetId) => {
    voteCounts[targetId] = (voteCounts[targetId] || 0) + 1;
  });

  return (
    <div className="flex flex-col items-center justify-between min-h-[460px] max-w-sm mx-auto w-full gap-4">
      {/* Top Header Card */}
      <div className="w-full text-center">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-brand-yellow rounded-full border-2 border-black font-black text-xs shadow-brutal-sm mb-2">
          <Vote className="w-4 h-4 text-black" />
          <span>مرحلة التصويت السري</span>
        </div>

        <h2 className="text-xl font-black text-black leading-tight">
          مين الإمبوستر برأيك؟
        </h2>
        <p className="text-xs font-bold text-gray-600 mt-1 max-w-[280px] mx-auto">
          تصويتك سري - النتائج تنعرض للكل مرة وحدة بعد اكتمال التصويت!
        </p>
      </div>

      {!votingRevealed ? (
        /* SUB-STATE A: SECRET VOTING */
        <div className="w-full flex flex-col gap-3">
          {/* Progress Pill */}
          <div className="bg-white rounded-xl border-2 border-black p-2.5 shadow-brutal-sm flex items-center justify-between text-xs font-black">
            <span className="flex items-center gap-1 text-gray-700">
              <Users className="w-4 h-4" />
              <span>اكتمال الأصوات:</span>
            </span>
            <span className="bg-brand-pink px-2 py-0.5 rounded-full border border-black">
              {totalVotesCast} / {totalPlayers} صوّتوا
            </span>
          </div>

          {/* Voting Options for Current Player */}
          <div className="bg-white rounded-2xl border-3 border-black p-4 shadow-brutal">
            <span className="text-xs font-black text-gray-700 block mb-2.5">
              {myVoteTargetId ? '✓ تم تسجيل صوتك! يمكنك تغييره قبل اكتمال الجميع:' : 'اختر المشتبه به لتصوّت عليه:'}
            </span>

            <div className="grid grid-cols-1 gap-2">
              {players
                .filter((p) => p.id !== activePlayerId) // cannot vote for self
                .map((target) => {
                  const isSelected = myVoteTargetId === target.id;

                  return (
                    <button
                      key={target.id}
                      onClick={() => onSubmitVote(activePlayerId, target.id)}
                      className={`flex items-center justify-between p-3 rounded-xl border-2 border-black transition-all ${
                        isSelected
                          ? 'bg-brand-pink text-black shadow-brutal-sm scale-[1.02] font-black'
                          : 'bg-[#FAF8F5] hover:bg-[#F3EFE6] text-black font-bold'
                      } active:translate-x-[1px] active:translate-y-[1px]`}
                    >
                      <div className="flex items-center gap-3">
                        <PlayerPawn
                          color={target.color}
                          size="sm"
                          showName={false}
                          isActive={true}
                        />
                        <span className="text-sm font-black">{target.name}</span>
                      </div>

                      {isSelected ? (
                        <div className="flex items-center gap-1 bg-white px-2 py-0.5 rounded-full border border-black text-xs font-black">
                          <span>صوتك هنا</span>
                          <span>🎯</span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-500 font-bold">صوّت</span>
                      )}
                    </button>
                  );
                })}
            </div>
          </div>

          {/* Player Voting Status Indicators */}
          <div className="bg-[#FFF9E6] rounded-xl border-2 border-black p-3 shadow-brutal-sm">
            <span className="text-[11px] font-black text-gray-700 block mb-2">
              حالة تصويت اللاعبين:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {players.map((p) => {
                const hasVoted = Boolean(votes[p.id]);
                return (
                  <div
                    key={p.id}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border border-black text-[11px] font-bold ${
                      hasVoted
                        ? 'bg-brand-green text-black font-black'
                        : 'bg-white text-gray-500'
                    }`}
                  >
                    <span>{p.name}</span>
                    <span>{hasVoted ? '✓' : '...'}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* SUB-STATE B: SIMULTANEOUS REVEAL GRID */
        <div className="w-full flex flex-col gap-3 animate-fade-in">
          <div className="bg-white rounded-2xl border-3 border-black p-4 shadow-brutal">
            <h3 className="text-sm font-black text-black mb-3 text-center border-b-2 border-black pb-2">
              مين صوت على مين؟ 🔍
            </h3>

            {/* 2-Column Grid: [Voter Badge] ⬅ [Target Badge] */}
            <div className="grid grid-cols-1 gap-2 max-h-[220px] overflow-y-auto pr-1">
              {Object.entries(votes).map(([voterId, targetId]) => {
                const voter = players.find((p) => p.id === voterId);
                const target = players.find((p) => p.id === targetId);
                if (!voter || !target) return null;

                return (
                  <div
                    key={voterId}
                    className="flex items-center justify-between bg-[#F8F5ED] p-2.5 rounded-xl border-2 border-black shadow-brutal-sm text-xs font-black"
                  >
                    {/* Voter Badge */}
                    <div className="flex items-center gap-1.5">
                      <div
                        className="w-5 h-5 rounded-full border border-black shrink-0"
                        style={{ backgroundColor: voter.color }}
                      />
                      <span className="truncate max-w-[80px]">{voter.name}</span>
                    </div>

                    {/* Arrow */}
                    <ArrowLeft className="w-4 h-4 text-black stroke-[3] mx-1 shrink-0" />

                    {/* Target Badge */}
                    <div className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-lg border border-black">
                      <div
                        className="w-5 h-5 rounded-full border border-black shrink-0"
                        style={{ backgroundColor: target.color }}
                      />
                      <span className="truncate max-w-[80px] text-brand-purple">{target.name}</span>
                      <span className="text-[10px] bg-brand-yellow px-1 rounded border border-black">
                        {voteCounts[target.id] || 0}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="text-center bg-brand-yellow/30 border-2 border-black rounded-xl p-2.5">
            <span className="text-xs font-black text-black">
              جاري الانتقال للنتيجة... ⚖️
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
