import React from 'react';
import { EmojiReaction, Player } from '../types/game';

interface LiveReactionsBarProps {
  onSendReaction: (emoji: string) => void;
  activeReactions: EmojiReaction[];
  players: Player[];
}

const REACTION_EMOJIS = ['🤨', '😂', '🔥', '🤥', '👏'];

export const LiveReactionsBar: React.FC<LiveReactionsBarProps> = ({
  onSendReaction,
  activeReactions,
  players,
}) => {
  return (
    <>
      {/* Floating Animated Reaction Bubbles Overlay */}
      <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
        {activeReactions.map((reaction) => {
          const player = players.find((p) => p.id === reaction.playerId);
          const hash = reaction.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
          const leftPercent = 20 + (hash % 60);

          return (
            <div
              key={reaction.id}
              className="absolute bottom-28 flex flex-col items-center animate-reaction-float pointer-events-none"
              style={{
                left: `${leftPercent}%`,
              }}
            >
              <span className="text-3xl filter drop-shadow-[2px_2px_0px_#000]">
                {reaction.emoji}
              </span>
              {player && (
                <span className="text-[10px] font-black bg-white/95 text-black px-2 py-0.5 rounded-md border border-black shadow-brutal-xs whitespace-nowrap mt-0.5">
                  {player.name}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Dedicated compact emoji row */}
      <div className="w-full bg-white rounded-2xl border-2 border-black py-1.5 px-3 shadow-[2px_2px_0px_0px_#000] flex items-center justify-center gap-2 shrink-0 z-30 select-none">
        <span className="text-xs font-black text-gray-500 whitespace-nowrap">
          ⚡
        </span>
        <div className="flex items-center gap-2">
          {REACTION_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => onSendReaction(emoji)}
              className="w-8 h-8 flex items-center justify-center text-lg rounded-xl bg-[#FAF8F5] hover:bg-brand-yellow border border-black shadow-[1px_1px_0px_#000] active:scale-125 transition-transform cursor-pointer select-none"
              title={emoji}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </>
  );
};
