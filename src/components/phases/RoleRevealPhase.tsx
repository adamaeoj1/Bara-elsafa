import React, { useState } from 'react';
import { Player } from '../../types/game';
import { Eye, EyeOff, ArrowLeft, ShieldAlert, Sparkles, Tag } from 'lucide-react';
import { soundFx } from '../../utils/soundFx';
import { useTranslation } from '../../i18n/LanguageContext';

interface RoleRevealPhaseProps {
  player: Player;
  players: Player[];
  secretWord: string;
  categoryName?: string;
  impostorCategoryHint?: boolean;
  isHost: boolean;
  onStartQuestions: () => void;
}

export const RoleRevealPhase: React.FC<RoleRevealPhaseProps> = ({
  player,
  players,
  secretWord,
  categoryName,
  impostorCategoryHint = true,
  isHost,
  onStartQuestions,
}) => {
  const { t } = useTranslation();
  const [isFlipped, setIsFlipped] = useState(false);

  // Find partner's name if impostor
  const partner = player.impostorPartnerId 
    ? players.find((p) => p.id === player.impostorPartnerId) 
    : undefined;

  const handleFlip = () => {
    soundFx.playCardFlip();
    setIsFlipped((prev) => !prev);
  };

  return (
    <div className="flex flex-col items-center justify-between min-h-[460px] max-w-sm mx-auto w-full gap-5">
      {/* Top Phase Header */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-yellow rounded-full border-2 border-black font-black text-xs shadow-brutal-sm mb-2">
          <Sparkles className="w-3.5 h-3.5 text-black" />
          <span>{t('secretCardsTitle')}</span>
        </div>
        <h2 className="text-xl font-black text-black">
          {t('whoAreYou')}
        </h2>
        <p className="text-xs font-bold text-gray-600 mt-1">
          {t('dontLookNote')}
        </p>
      </div>

      {/* 3D Flip Card Container */}
      <div
        className="relative w-full max-w-[300px] h-[340px] perspective-1000 cursor-pointer select-none"
        onClick={handleFlip}
      >
        <div
          className={`w-full h-full transition-transform duration-500 transform-style-3d ${
            isFlipped ? 'rotate-y-180' : ''
          }`}
        >
          {/* FRONT OF CARD (Unflipped Purple Card #6D4AFF) */}
          <div className="absolute inset-0 w-full h-full backface-hidden bg-[#6D4AFF] rounded-3xl border-4 border-black p-6 shadow-brutal-xl flex flex-col items-center justify-between text-white">
            <div className="bg-white/20 backdrop-blur-sm border-2 border-white/60 px-3 py-1 rounded-full text-xs font-black">
              {t('secretCardPill')}
            </div>

            {/* Central '?' Box */}
            <div className="flex flex-col items-center gap-3">
              <div className="w-24 h-24 bg-brand-yellow rounded-2xl border-4 border-black shadow-brutal flex items-center justify-center animate-pulse">
                <span className="text-5xl font-black text-black">؟</span>
              </div>
              <span className="text-sm font-black text-center text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
                {t('tapToReveal')}
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-xs font-bold bg-black/30 px-3 py-1.5 rounded-xl border border-white/30">
              <Eye className="w-4 h-4 text-brand-yellow" />
              <span>{t('tapToFlip')}</span>
            </div>
          </div>

          {/* BACK OF CARD (Flipped: Civilian or Impostor) */}
          <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180 bg-white rounded-3xl border-4 border-black p-5 shadow-brutal-xl flex flex-col items-center justify-between text-black">
            {player.isImpostor ? (
              /* IMPOSTOR VIEW */
              <div className="flex flex-col items-center justify-between h-full w-full py-1">
                <div className="w-full bg-brand-pink border-2 border-black rounded-xl py-1.5 px-3 text-center shadow-brutal-sm">
                  <span className="text-xs font-black text-black">{t('wantedNotice')}</span>
                </div>

                <div className="flex flex-col items-center gap-1.5 my-auto">
                  <div className="w-16 h-16 bg-brand-pink/30 rounded-2xl border-3 border-black shadow-brutal flex items-center justify-center">
                    <ShieldAlert className="w-10 h-10 text-[#D81B60] stroke-[2.5]" />
                  </div>

                  <h3 className="text-lg font-black text-black">
                    {player.name}
                  </h3>

                  <div className="bg-black text-white px-3 py-0.5 rounded-full text-xs font-black">
                    {t('youAreImpostor')}
                  </div>

                  <p className="text-[11px] font-bold text-gray-700 text-center max-w-[220px] leading-relaxed">
                    {t('impostorDesc')}
                  </p>

                  {/* Optional Category Hint */}
                  {impostorCategoryHint && categoryName && (
                    <div className="bg-brand-cyan/20 border border-brand-cyan px-2.5 py-0.5 rounded-lg text-[10px] font-bold text-cyan-900 flex items-center gap-1">
                      <Tag className="w-3 h-3" />
                      <span>{categoryName}</span>
                    </div>
                  )}

                  {/* Co-aware Impostor Partner Badge */}
                  {partner && (
                    <div className="bg-brand-yellow px-2.5 py-1 rounded-xl border-2 border-black shadow-brutal-sm text-[11px] font-black text-black flex items-center gap-1 animate-bounce">
                      <span>🤝 {t('impostorPartner')}</span>
                      <span className="underline">{partner.name}</span>
                    </div>
                  )}
                </div>

                <div className="text-[10px] font-bold text-gray-500 flex items-center gap-1">
                  <EyeOff className="w-3 h-3" />
                  <span>{t('tapToHide')}</span>
                </div>
              </div>
            ) : (
              /* CIVILIAN VIEW */
              <div className="flex flex-col items-center justify-between h-full w-full py-1">
                <div className="w-full bg-brand-green border-2 border-black rounded-xl py-1.5 px-3 text-center shadow-brutal-sm">
                  <span className="text-xs font-black text-black">{t('inTheLoop')}</span>
                </div>

                <div className="flex flex-col items-center gap-2 my-auto">
                  <span className="text-xs font-bold text-gray-500">
                    {t('wordIs')}
                  </span>

                  <div className="bg-[#6D4AFF] text-white px-5 py-3.5 rounded-2xl border-3 border-black shadow-brutal text-2xl font-black text-center min-w-[190px] tracking-wide">
                    {secretWord}
                  </div>

                  <p className="text-xs font-bold text-gray-600 text-center max-w-[220px] leading-relaxed mt-1">
                    {t('civilianDesc')}
                  </p>
                </div>

                <div className="text-[10px] font-bold text-gray-500 flex items-center gap-1">
                  <EyeOff className="w-3 h-3" />
                  <span>{t('tapToHide')}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Host Controls or Waiting Notice */}
      <div className="w-full mt-2">
        {isHost ? (
          <button
            onClick={onStartQuestions}
            className="w-full py-3.5 bg-brand-purple hover:bg-[#5b3adb] text-white font-black text-base rounded-2xl border-3 border-black shadow-brutal active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all flex items-center justify-center gap-2"
          >
            <span>{t('startQuestionsBtn')}</span>
            <ArrowLeft className="w-5 h-5 stroke-[3] rtl:rotate-0 ltr:rotate-180" />
          </button>
        ) : (
          <div className="bg-white rounded-xl border-2 border-black p-3 text-center shadow-brutal-sm">
            <span className="text-xs font-black text-gray-700 animate-pulse">
              {t('waitingQuestions')}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
