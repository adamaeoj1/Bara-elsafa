import React from 'react';
import { Player } from '../../types/game';
import { Vote, Users, ArrowLeft } from 'lucide-react';
import { PlayerPawn } from '../PlayerPawn';
import { useTranslation } from '../../i18n/LanguageContext';

interface VotingPhaseProps {
  players: Player[];
  activePlayerId: string;
  votes: Record<string, string>;
  votingRevealed: boolean;
  onSubmitVote: (voterId: string, targetId: string) => void;
}

export const VotingPhase: React.FC<VotingPhaseProps> = ({
  players,
  activePlayerId,
  votes,
  votingRevealed,
  onSubmitVote,
}) => {
  const { t } = useTranslation();
  const myVoteTargetId = votes[activePlayerId];
  const totalVotesCast = Object.keys(votes).length;
  const totalPlayers = players.length;

  const voteCounts: Record<string, number> = {};
  Object.values(votes).forEach((targetId) => {
    voteCounts[targetId] = (voteCounts[targetId] || 0) + 1;
  });

  return (
    <div className="flex flex-col items-center justify-between min-h-[460px] max-w-sm mx-auto w-full gap-3.5 select-none">
      {/* Top Header Card */}
      <div className="w-full text-center">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-brand-yellow rounded-full border-2 border-black font-black text-xs shadow-brutal-sm mb-1.5">
          <Vote className="w-4 h-4 text-black" />
          <span>{t('votingPhaseTitle')}</span>
        </div>

        <p className="text-xs font-bold text-gray-700 max-w-[280px] mx-auto">
          {t('votingNote')}
        </p>
      </div>

      {!votingRevealed ? (
        /* SUB-STATE A: SECRET VOTING */
        <div className="w-full flex flex-col gap-2.5">
          {/* Progress Pill */}
          <div className="bg-white rounded-xl border-2 border-black p-2 shadow-brutal-sm flex items-center justify-between text-xs font-black">
            <span className="flex items-center gap-1 text-gray-700">
              <Users className="w-4 h-4" />
              <span>{t('votesProgress')}</span>
            </span>
            <span className="bg-brand-pink px-2 py-0.5 rounded-full border border-black text-black">
              {t('votedCount', { voted: totalVotesCast, total: totalPlayers })}
            </span>
          </div>

          {/* Voting Options */}
          <div className="bg-white rounded-3xl border-3 sm:border-4 border-black p-3.5 shadow-brutal">
            <span className="text-xs font-black text-gray-800 block mb-2 text-start">
              {myVoteTargetId ? t('voteRecorded') : t('chooseSuspect')}
            </span>

            <div className="grid grid-cols-1 gap-1.5">
              {players
                .filter((p) => p.id !== activePlayerId)
                .map((target) => {
                  const isSelected = myVoteTargetId === target.id;

                  return (
                    <button
                      key={target.id}
                      onClick={() => onSubmitVote(activePlayerId, target.id)}
                      className={`flex items-center justify-between p-2.5 rounded-xl border-2 border-black transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-brand-pink text-black shadow-brutal-sm scale-[1.01] font-black'
                          : 'bg-[#FAF8F5] hover:bg-[#F3EFE6] text-black font-bold'
                      } active:translate-x-[1px] active:translate-y-[1px]`}
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
                        <div className="flex items-center gap-1 bg-white px-2 py-0.5 rounded-full border border-black text-xs font-black">
                          <span>{t('yourVoteHere')}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-500 font-bold">{t('voteBtn')}</span>
                      )}
                    </button>
                  );
                })}
            </div>
          </div>

          {/* Player Voting Status Indicators */}
          <div className="bg-[#FFF9E6] rounded-2xl border-2 border-black p-2.5 shadow-brutal-sm">
            <div className="flex flex-wrap gap-1.5 justify-center">
              {players.map((p) => {
                const hasVoted = Boolean(votes[p.id]);
                return (
                  <div
                    key={p.id}
                    className={`flex items-center gap-1 px-2 py-0.5 rounded-lg border border-black text-[11px] font-bold ${
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
          <div className="bg-white rounded-3xl border-3 sm:border-4 border-black p-3.5 shadow-brutal">
            <h3 className="text-sm font-black text-black mb-2.5 text-center border-b-2 border-black pb-2">
              {t('whoVotedWho')}
            </h3>

            <div className="grid grid-cols-1 gap-2 max-h-[220px] overflow-y-auto pr-1">
              {Object.entries(votes).map(([voterId, targetId]) => {
                const voter = players.find((p) => p.id === voterId);
                const target = players.find((p) => p.id === targetId);
                if (!voter || !target) return null;

                return (
                  <div
                    key={voterId}
                    className="flex items-center justify-between bg-[#F8F5ED] p-2 rounded-xl border-2 border-black shadow-brutal-sm text-xs font-black"
                  >
                    <div className="flex items-center gap-1.5">
                      <div
                        className="w-5 h-5 rounded-full border border-black shrink-0"
                        style={{ backgroundColor: voter.color }}
                      />
                      <span className="truncate max-w-[85px]">{voter.name}</span>
                    </div>

                    <ArrowLeft className="w-4 h-4 text-black stroke-[3] mx-1 shrink-0 rtl:rotate-0 ltr:rotate-180" />

                    <div className="flex items-center gap-1.5 bg-white px-2 py-0.5 rounded-lg border border-black">
                      <div
                        className="w-5 h-5 rounded-full border border-black shrink-0"
                        style={{ backgroundColor: target.color }}
                      />
                      <span className="truncate max-w-[85px] text-brand-purple">{target.name}</span>
                      <span className="text-[10px] bg-brand-yellow px-1 rounded border border-black">
                        {t('votesTally', { count: voteCounts[target.id] || 0 })}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="text-center bg-brand-yellow/30 border-2 border-black rounded-xl p-2.5">
            <span className="text-xs font-black text-black">
              {t('movingToResults')}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
