import React from 'react';
import { Player, GamePhase, QuestionPair } from '../types/game';
import { PlayerPawn } from './PlayerPawn';
import { useTranslation } from '../i18n/LanguageContext';

interface CharacterStageProps {
  players: Player[];
  activePlayerId: string;
  phase: GamePhase;
  currentPair?: QuestionPair;
  caughtImpostorId?: string | null;
  winner?: 'IMPOSTOR' | 'CIVILIANS' | null;
  votes?: Record<string, string>;
}

export const CharacterStage: React.FC<CharacterStageProps> = ({
  players,
  activePlayerId,
  phase,
  currentPair,
  caughtImpostorId,
  winner,
  votes = {},
}) => {
  const { t } = useTranslation();

  if (!players || players.length === 0) return null;

  // Determine if a player is active based on current phase rules
  const isPlayerActiveInPhase = (player: Player): boolean => {
    if (player.isAlive === false || player.is_alive === false) return false;

    switch (phase) {
      case 'LOBBY':
      case 'ROLE_REVEAL':
      case 'MAFIA_ROLE_REVEAL':
      case 'VOTING':
      case 'MAFIA_VOTING':
      case 'MAFIA_NIGHT':
      case 'MAFIA_MORNING_DISCUSSION':
        return true;
      case 'QUESTIONS':
        if (!currentPair) return true;
        return player.id === currentPair.askerId || player.id === currentPair.answererId;
      case 'LAST_CHANCE':
        return player.id === caughtImpostorId;
      case 'GAME_OVER':
        if (winner === 'IMPOSTOR') {
          return Boolean(player.isImpostor || player.is_impostor || player.mafiaRole === 'IMPOSTOR');
        } else if (winner === 'CIVILIANS') {
          return !player.isImpostor && !player.is_impostor && player.mafiaRole !== 'IMPOSTOR';
        }
        return true;
      default:
        return true;
    }
  };

  const isMultiRow = players.length > 5;
  const topRowPlayers = isMultiRow ? players.slice(0, Math.ceil(players.length / 2)) : players;
  const bottomRowPlayers = isMultiRow ? players.slice(Math.ceil(players.length / 2)) : [];

  const youLabel = t('youBadge');

  const renderPawn = (player: Player) => {
    const isActive = isPlayerActiveInPhase(player);
    const isAsker = phase === 'QUESTIONS' && currentPair?.askerId === player.id;
    const isAnswerer = phase === 'QUESTIONS' && currentPair?.answererId === player.id;
    const isCaught = phase === 'LAST_CHANCE' && caughtImpostorId === player.id;
    const isImp = Boolean(player.isImpostor || player.is_impostor || player.mafiaRole === 'IMPOSTOR');
    const isWinnerPawn =
      phase === 'GAME_OVER' &&
      ((winner === 'IMPOSTOR' && isImp) || (winner === 'CIVILIANS' && !isImp));
    const isMe = player.id === activePlayerId;
    const isDead = player.isAlive === false || player.is_alive === false;

    const playerVoteValue = player.voted_for ?? player.votedTargetId ?? votes[player.id];
    const hasCastVote =
      (phase === 'VOTING' || phase === 'MAFIA_VOTING') &&
      playerVoteValue !== null &&
      playerVoteValue !== undefined &&
      playerVoteValue !== '';

    return (
      <div key={player.id} className="relative flex justify-center">
        <PlayerPawn
          color={player.color}
          name={player.name}
          isActive={isActive}
          isHost={Boolean(player.isHost || player.is_host)}
          isAsker={isAsker}
          isAnswerer={isAnswerer}
          hasVoted={hasCastVote}
          isWinner={isWinnerPawn || isCaught}
          isDead={isDead}
          score={player.score ?? 0}
          size={isMultiRow ? 'sm' : 'md'}
          badge={isMe ? youLabel : undefined}
          className={isMe ? 'ring-2 ring-black rounded-xl p-1 bg-white/60' : ''}
        />
      </div>
    );
  };

  return (
    <div className="w-full bg-[#EFE9D9] rounded-2xl border-2 border-black py-3 px-4 shadow-[3px_3px_0px_0px_#000] select-none text-black">
      {/* Stage Header */}
      <div className="flex items-center justify-between mb-2 px-1 text-xs font-black text-gray-700">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-brand-green border border-black animate-pulse" />
          <span>{t('characterStageTitle', { count: players.length })}</span>
        </span>
        <span className="text-[11px] text-gray-500 font-bold">
          {phase === 'QUESTIONS'
            ? t('stageHint')
            : phase.startsWith('MAFIA')
            ? 'مدينة المافيا'
            : 'برا السالفة'}
        </span>
      </div>

      {/* Players Pawns Grid */}
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap justify-around items-end min-h-[75px] gap-2">
          {topRowPlayers.map(renderPawn)}
        </div>

        {isMultiRow && bottomRowPlayers.length > 0 && (
          <div className="flex flex-wrap justify-around items-end min-h-[75px] pt-2 border-t border-black/10 gap-2">
            {bottomRowPlayers.map(renderPawn)}
          </div>
        )}
      </div>
    </div>
  );
};
