import React from 'react';
import { Player, GamePhase, QuestionPair } from '../types/game';
import { PlayerPawn } from './PlayerPawn';

interface CharacterStageProps {
  players: Player[];
  activePlayerId: string;
  phase: GamePhase;
  currentPair?: QuestionPair;
  caughtImpostorId?: string | null;
  winner?: 'IMPOSTOR' | 'CIVILIANS' | null;
  onSelectPlayer?: (playerId: string) => void;
}

export const CharacterStage: React.FC<CharacterStageProps> = ({
  players,
  activePlayerId,
  phase,
  currentPair,
  caughtImpostorId,
  winner,
  onSelectPlayer,
}) => {
  if (!players || players.length === 0) return null;

  // Determine if a player is active based on current phase rules
  const isPlayerActiveInPhase = (player: Player): boolean => {
    switch (phase) {
      case 'LOBBY':
        return true;
      case 'ROLE_REVEAL':
        return true;
      case 'QUESTIONS':
        if (!currentPair) return true;
        return player.id === currentPair.askerId || player.id === currentPair.answererId;
      case 'VOTING':
        // Highlight player if they still need to vote, or if they are the current selected active view
        return true;
      case 'LAST_CHANCE':
        return player.id === caughtImpostorId;
      case 'GAME_OVER':
        if (winner === 'IMPOSTOR') {
          return player.isImpostor;
        } else if (winner === 'CIVILIANS') {
          return !player.isImpostor;
        }
        return true;
      default:
        return true;
    }
  };

  // Determine layout: 1 row for <= 4 players, 2 rows (3 top / 4 bottom) for 7 players or > 4
  const isMultiRow = players.length > 4;
  const topRowPlayers = isMultiRow ? players.slice(0, 3) : players;
  const bottomRowPlayers = isMultiRow ? players.slice(3) : [];

  const renderPawn = (player: Player) => {
    const isActive = isPlayerActiveInPhase(player);
    const isAsker = phase === 'QUESTIONS' && currentPair?.askerId === player.id;
    const isAnswerer = phase === 'QUESTIONS' && currentPair?.answererId === player.id;
    const isCaught = phase === 'LAST_CHANCE' && caughtImpostorId === player.id;
    const isWinnerPawn = phase === 'GAME_OVER' && (
      (winner === 'IMPOSTOR' && player.isImpostor) ||
      (winner === 'CIVILIANS' && !player.isImpostor)
    );

    return (
      <div key={player.id} className="relative flex justify-center">
        <PlayerPawn
          color={player.color}
          name={player.name}
          isActive={isActive}
          isAsker={isAsker}
          isAnswerer={isAnswerer}
          hasVoted={phase === 'VOTING' && player.hasVoted}
          isWinner={isWinnerPawn || isCaught}
          size={isMultiRow ? 'sm' : 'md'}
          badge={player.id === activePlayerId ? 'أنت' : undefined}
          onClick={onSelectPlayer ? () => onSelectPlayer(player.id) : undefined}
          className={`${player.id === activePlayerId ? 'ring-2 ring-black rounded-xl p-1 bg-white/40' : ''}`}
        />
      </div>
    );
  };

  return (
    <div className="w-full bg-[#EFE9D9] border-t-3 border-black py-3 px-3 shadow-[0px_-3px_0px_0px_#000] select-none">
      <div className="max-w-md mx-auto">
        {/* Stage Label */}
        <div className="flex items-center justify-between mb-2 px-1 text-[11px] font-black text-gray-700">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-brand-green border border-black animate-pulse" />
            <span>مسرح اللاعبين ({players.length})</span>
          </span>
          <span className="text-[10px] text-gray-500 font-bold">
            {phase === 'QUESTIONS' ? 'المشاركون في السؤال ملوّنون' : 'اضغط على لاعب لتبديل الهاتف'}
          </span>
        </div>

        {/* Players Grid / Rows */}
        {isMultiRow ? (
          <div className="flex flex-col gap-2">
            {/* Top row: 3 players */}
            <div className="flex justify-center items-center gap-4">
              {topRowPlayers.map(renderPawn)}
            </div>
            {/* Bottom row: 4 players */}
            <div className="flex justify-center items-center gap-3">
              {bottomRowPlayers.map(renderPawn)}
            </div>
          </div>
        ) : (
          /* Single row for <= 4 players */
          <div className="flex justify-around items-center">
            {topRowPlayers.map(renderPawn)}
          </div>
        )}
      </div>
    </div>
  );
};
