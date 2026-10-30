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
}

export const CharacterStage: React.FC<CharacterStageProps> = ({
  players,
  activePlayerId,
  phase,
  currentPair,
  caughtImpostorId,
  winner,
}) => {
  const { t, language } = useTranslation();

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

  // Determine layout: 1 row for <= 4 players, 2 rows (3 top / 4 bottom) for > 4 players
  const isMultiRow = players.length > 4;
  const topRowPlayers = isMultiRow ? players.slice(0, 3) : players;
  const bottomRowPlayers = isMultiRow ? players.slice(3) : [];

  const youLabel = t('youBadge');

  const renderPawn = (player: Player) => {
    const isActive = isPlayerActiveInPhase(player);
    const isAsker = phase === 'QUESTIONS' && currentPair?.askerId === player.id;
    const isAnswerer = phase === 'QUESTIONS' && currentPair?.answererId === player.id;
    const isCaught = phase === 'LAST_CHANCE' && caughtImpostorId === player.id;
    const isWinnerPawn = phase === 'GAME_OVER' && (
      (winner === 'IMPOSTOR' && player.isImpostor) ||
      (winner === 'CIVILIANS' && !player.isImpostor)
    );
    const isMe = player.id === activePlayerId;

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
          badge={isMe ? youLabel : undefined}
          className={isMe ? 'ring-2 ring-black rounded-xl p-1 bg-white/50' : ''}
        />
      </div>
    );
  };

  return (
    <div className="w-full bg-[#EFE9D9] border-t-3 border-black py-2.5 px-3 shadow-[0px_-3px_0px_0px_#000] select-none">
      <div className="max-w-md mx-auto">
        {/* Stage Header */}
        <div className="flex items-center justify-between mb-1.5 px-1 text-[11px] font-black text-gray-700">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-brand-green border border-black animate-pulse" />
            <span>{t('characterStageTitle', { count: players.length })}</span>
          </span>
          <span className="text-[10px] text-gray-500 font-bold">
            {phase === 'QUESTIONS'
              ? t('stageHint')
              : (language === 'ar' ? `أنت معلم بـ "${youLabel}"` : `You are tagged with "${youLabel}"`)}
          </span>
        </div>

        {/* Players Layout */}
        {isMultiRow ? (
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-center items-center gap-3">
              {topRowPlayers.map(renderPawn)}
            </div>
            <div className="flex justify-center items-center gap-2.5">
              {bottomRowPlayers.map(renderPawn)}
            </div>
          </div>
        ) : (
          <div className="flex justify-around items-center">
            {topRowPlayers.map(renderPawn)}
          </div>
        )}
      </div>
    </div>
  );
};
