import React from 'react';
import { PlayerColor } from '../types/game';

interface PlayerPawnProps {
  color: PlayerColor | string;
  name?: string;
  isActive?: boolean;
  isAsker?: boolean;
  isAnswerer?: boolean;
  isImpostor?: boolean;
  hasVoted?: boolean;
  isWinner?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showName?: boolean;
  badge?: string;
  className?: string;
  onClick?: () => void;
}

export const PlayerPawn: React.FC<PlayerPawnProps> = ({
  color,
  name,
  isActive = true,
  isAsker = false,
  isAnswerer = false,
  hasVoted = false,
  isWinner = false,
  size = 'md',
  showName = true,
  badge,
  className = '',
  onClick,
}) => {
  // Dimensions
  const sizeMap = {
    sm: { width: 40, height: 52, headR: 12, bodyW: 30, bodyH: 24, fontSize: 'text-[10px]' },
    md: { width: 56, height: 72, headR: 17, bodyW: 42, bodyH: 34, fontSize: 'text-xs' },
    lg: { width: 72, height: 92, headR: 22, bodyW: 54, bodyH: 44, fontSize: 'text-sm' },
    xl: { width: 90, height: 115, headR: 28, bodyW: 68, bodyH: 56, fontSize: 'text-base' },
  };

  const dim = sizeMap[size];

  return (
    <div
      onClick={onClick}
      className={`inline-flex flex-col items-center select-none transition-all duration-300 ${
        isActive ? 'opacity-100 scale-100' : 'opacity-30 scale-95'
      } ${onClick ? 'cursor-pointer hover:scale-105 active:scale-95' : ''} ${className}`}
    >
      <div className="relative">
        {/* SVG Neo-Brutalist Pawn Character */}
        <svg
          width={dim.width}
          height={dim.height}
          viewBox="0 0 100 130"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]"
        >
          {/* Base shadow ellipse */}
          <ellipse cx="50" cy="122" rx="36" ry="7" fill="#000000" opacity="0.18" />

          {/* Rounded Body (Bell shaped pawn bottom) */}
          <path
            d="M 22 120 
               C 22 75, 34 68, 50 68 
               C 66 68, 78 75, 78 120 
               Z"
            fill={color}
            stroke="#000000"
            strokeWidth="5"
            strokeLinejoin="round"
          />

          {/* Body Highlight / Belly shine */}
          <path
            d="M 33 115 C 33 88, 40 80, 50 80 C 42 84, 38 98, 38 115 Z"
            fill="#FFFFFF"
            opacity="0.35"
          />

          {/* Collar / Neck separator */}
          <ellipse
            cx="50"
            cy="68"
            rx="14"
            ry="4"
            fill="#FFFFFF"
            stroke="#000000"
            strokeWidth="3.5"
          />

          {/* Circular Head */}
          <circle
            cx="50"
            cy="36"
            r="30"
            fill={color}
            stroke="#000000"
            strokeWidth="5"
          />

          {/* Head Light highlight */}
          <ellipse
            cx="40"
            cy="22"
            rx="9"
            ry="5"
            transform="rotate(-25 40 22)"
            fill="#FFFFFF"
            opacity="0.45"
          />

          {/* Smiley Face Eyes */}
          <ellipse cx="40" cy="33" rx="3.5" ry="4.5" fill="#000000" />
          <ellipse cx="60" cy="33" rx="3.5" ry="4.5" fill="#000000" />

          {/* Catchlights in eyes */}
          <circle cx="41.5" cy="31.5" r="1.3" fill="#FFFFFF" />
          <circle cx="61.5" cy="31.5" r="1.3" fill="#FFFFFF" />

          {/* Cheeks blush */}
          <ellipse cx="32" cy="40" rx="4" ry="2.5" fill="#FF80AB" opacity="0.6" />
          <ellipse cx="68" cy="40" rx="4" ry="2.5" fill="#FF80AB" opacity="0.6" />

          {/* Friendly Smile */}
          <path
            d="M 43 42 Q 50 51 57 42"
            stroke="#000000"
            strokeWidth="3.5"
            strokeLinecap="round"
            fill="none"
          />

          {/* Winner Crown */}
          {isWinner && (
            <g transform="translate(32, -4) scale(0.9)">
              <polygon
                points="2,16 9,2 20,12 31,2 38,16"
                fill="#FFD700"
                stroke="#000000"
                strokeWidth="3.5"
                strokeLinejoin="round"
              />
              <circle cx="9" cy="3" r="2.5" fill="#FF4081" stroke="#000000" strokeWidth="1.5" />
              <circle cx="20" cy="12" r="2.5" fill="#00E5FF" stroke="#000000" strokeWidth="1.5" />
              <circle cx="31" cy="3" r="2.5" fill="#76FF03" stroke="#000000" strokeWidth="1.5" />
            </g>
          )}
        </svg>

        {/* Floating status badges */}
        {hasVoted && (
          <div className="absolute -top-1 -right-1 bg-brand-green text-black font-black text-[11px] px-1.5 py-0.5 rounded-full border-2 border-black shadow-brutal-sm flex items-center gap-0.5 animate-bounce">
            ✓
          </div>
        )}

        {isAsker && (
          <div className="absolute -bottom-1 -right-2 bg-brand-pink text-black font-black text-[10px] px-1.5 py-0.5 rounded-md border-2 border-black shadow-brutal-sm">
            يسأل 🗣️
          </div>
        )}

        {isAnswerer && (
          <div className="absolute -bottom-1 -left-2 bg-brand-cyan text-black font-black text-[10px] px-1.5 py-0.5 rounded-md border-2 border-black shadow-brutal-sm">
            يجاوب 👂
          </div>
        )}

        {badge && (
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-brand-yellow text-black font-black text-[10px] px-2 py-0.5 rounded-full border-2 border-black shadow-brutal-sm whitespace-nowrap">
            {badge}
          </div>
        )}
      </div>

      {/* Player Name & Active Indicator */}
      {showName && name && (
        <div className="mt-1 flex flex-col items-center max-w-[80px]">
          <span
            className={`font-black truncate max-w-full text-center ${dim.fontSize} ${
              isActive ? 'text-black' : 'text-gray-600'
            }`}
          >
            {name}
          </span>
          {/* Active Colored Underline */}
          {isActive && (
            <div
              className="h-1 w-6 rounded-full mt-0.5 border border-black shadow-[1px_1px_0px_#000]"
              style={{ backgroundColor: color }}
            />
          )}
        </div>
      )}
    </div>
  );
};
