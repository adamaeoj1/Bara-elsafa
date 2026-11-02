import React, { useEffect } from 'react';
import { Player } from '../../types/game';
import { Vote, Users, ArrowLeft, Zap } from 'lucide-react';
import { PlayerPawn } from '../PlayerPawn';
import { useTranslation } from '../../i18n/LanguageContext';

interface VotingPhaseProps {
  players: Player[];
  activePlayerId: string;
  votes: Record<string, string>;
  votingRevealed: boolean;
  isHost?: boolean;
  onSubmitVote: (voterId: string, targetId: string) => void;
  onForceResolve?: () => void;
}

export const VotingPhase: React.FC<VotingPhaseProps> = ({
  players,
  activePlayerId,
  votes,
  votingRevealed,
  isHost = false,
  onSubmitVote,
  onForceResolve,
}) => {
  const { t, language } = useTranslation();

  // Mandatory Fix #3: Calculate activeVoters and votesCast directly from players' voted_for
  const activeVoters = players.filter((p) => p.is_alive !== false && p.isAlive !== false);
  const votesCast = activeVoters.filter((p) => {
    const val = p.voted_for ?? p.votedTargetId ?? votes[p.id];
    return val !== null && val !== undefined && val !== '';
  });

  const me = players.find((p) => p.id === activePlayerId);
  const myVoteTargetId = me?.voted_for ?? me?.votedTargetId ?? votes[activePlayerId] ?? null;
  const allVoted = activeVoters.length > 0 && votesCast.length >= activeVoters.length;

  useEffect(() => {
    if (allVoted && !votingRevealed && onForceResolve) {
      const timer = setTimeout(() => {
        onForceResolve();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [allVoted, votingRevealed, onForceResolve]);

  const effectiveVotes: Record<string, string> = { ...votes };
  activeVoters.forEach((p) => {
    const vf = p.voted_for ?? p.votedTargetId ?? votes[p.id];
    if (vf) effectiveVotes[p.id] = vf;
  });

  const voteCounts: Record<string, number> = {};
  Object.values(effectiveVotes).forEach((targetId) => {
    if (targetId && targetId !== 'SKIP') {
      voteCounts[targetId] = (voteCounts[targetId] || 0) + 1;
    }
  });

  return (
    <div className="flex flex-col items-center justify-between w-full gap-4 select-none animate-fade-in">
      {/* Top Header Card */}
      <div className="w-full text-center">
        <div className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-brand-yellow rounded-full border-2 border-black font-black text-xs sm:text-sm shadow-brutal-sm mb-1.5">
          <Vote className="w-4 h-4 text-black" />
          <span>{t('votingPhaseTitle')}</span>
        </div>

        <p className="text-xs sm:text-sm font-bold text-gray-700 max-w-md mx-auto">
          {t('votingNote')}
        </p>
      </div>

      {!votingRevealed ? (
        /* SUB-STATE A: SECRET VOTING */
        <div className="w-full flex flex-col gap-3">
          {/* Progress Pill */}
          <div className="bg-white rounded-2xl border-2 border-black p-3 shadow-brutal-sm flex items-center justify-between text-xs sm:text-sm font-black">
            <span className="flex items-center gap-1.5 text-gray-800">
              <Users className="w-4 h-4" />
              <span>{t('votesProgress')}</span>
            </span>
            <span className="bg-brand-pink px-3 py-0.5 rounded-full border border-black text-black font-mono">
              {votesCast.length}/{activeVoters.length}
            </span>
          </div>

          {/* Voting Options */}
          <div className="bg-white rounded-3xl border-3 border-black p-4 shadow-brutal">
            <span className="text-xs sm:text-sm font-black text-gray-800 block mb-3 text-start">
              {myVoteTargetId ? t('voteRecorded') : t('chooseSuspect')}
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {activeVoters
                .filter((p) => p.id !== activePlayerId)
                .map((target) => {
                  const isSelected = myVoteTargetId === target.id;

                  return (
                    <button
                      key={target.id}
                      type="button"
                      onClick={() => onSubmitVote(activePlayerId, target.id)}
                      className={`flex items-center justify-between p-3 rounded-2xl border-2 border-black transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#FAD85D] text-black shadow-brutal scale-[1.01] font-black'
                          : 'bg-[#FAF8F5] hover:bg-[#FFF8E7] text-black font-bold active:translate-x-[1px] active:translate-y-[1px]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <PlayerPawn
                          color={target.color}
                          size="sm"
                          showName={false}
                          isActive={true}
                        />
                        <span className="text-sm font-black">{target.name}</span>
                      </div>

                      {isSelected ? (
                        <div className="flex items-center gap-1 bg-white px-2.5 py-0.5 rounded-full border border-black text-xs font-black">
                          <span>✓</span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-600 font-black bg-white px-2.5 py-1 rounded-lg border border-black/30">
                          {t('voteBtn')}
                        </span>
                      )}
                    </button>
                  );
                })}
            </div>
          </div>

          {/* Player Voting Status Indicators */}
          <div className="bg-[#FFF9E6] rounded-2xl border-2 border-black p-3 shadow-brutal-sm">
            <div className="flex flex-wrap gap-2 justify-center">
              {activeVoters.map((p) => {
                const vf = p.voted_for ?? p.votedTargetId ?? votes[p.id];
                const hasVoted = vf !== null && vf !== undefined && vf !== '';
                return (
                  <div
                    key={p.id}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border border-black text-xs font-bold ${
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

          {/* Manual Host Fallback Button if all players voted */}
          {isHost && allVoted && onForceResolve && (
            <button
              type="button"
              onClick={onForceResolve}
              className="w-full py-3 bg-brand-green hover:bg-[#68d778] text-black font-black text-sm rounded-2xl border-2 border-black shadow-[3px_3px_0px_0px_#000] flex items-center justify-center gap-2 cursor-pointer"
            >
              <Zap className="w-4 h-4 fill-black" />
              <span>{language === 'ar' ? 'إظهار نتائج التصويت ⚡' : 'Reveal Vote Results ⚡'}</span>
            </button>
          )}
        </div>
      ) : (
        /* SUB-STATE B: SIMULTANEOUS REVEAL GRID (No nested scrollbar!) */
        <div className="w-full flex flex-col gap-3 animate-fade-in">
          <div className="bg-white rounded-3xl border-3 border-black p-4 shadow-brutal">
            <h3 className="text-sm sm:text-base font-black text-black mb-3 text-center border-b-2 border-black pb-2">
              {t('whoVotedWho')}
            </h3>

            <div className="grid grid-cols-1 gap-2">
              {Object.entries(effectiveVotes).map(([voterId, targetId]) => {
                const voter = players.find((p) => p.id === voterId);
                const target = players.find((p) => p.id === targetId);
                if (!voter || !target) return null;

                return (
                  <div
                    key={voterId}
                    className="flex items-center justify-between bg-[#F8F5ED] p-2.5 rounded-xl border-2 border-black shadow-brutal-sm text-xs sm:text-sm font-black"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-5 h-5 rounded-full border border-black shrink-0"
                        style={{ backgroundColor: voter.color }}
                      />
                      <span className="truncate">{voter.name}</span>
                    </div>

                    <ArrowLeft className="w-4 h-4 text-black stroke-[3] mx-2 shrink-0 rtl:rotate-0 ltr:rotate-180" />

                    <div className="flex items-center gap-2 bg-white px-2.5 py-1 rounded-lg border border-black">
                      <div
                        className="w-5 h-5 rounded-full border border-black shrink-0"
                        style={{ backgroundColor: target.color }}
                      />
                      <span className="truncate text-brand-purple">{target.name}</span>
                      <span className="text-[11px] bg-brand-yellow px-1.5 py-0.2 rounded border border-black">
                        {t('votesTally', { count: voteCounts[target.id] || 0 })}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="text-center bg-brand-yellow/40 border-2 border-black rounded-2xl p-3">
            <span className="text-xs sm:text-sm font-black text-black">
              {t('movingToResults')}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
