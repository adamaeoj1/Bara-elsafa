import React, { useState } from 'react';
import { Player, GameSettings, CustomCategory } from '../../types/game';
import { getCategoriesWithLockStatus } from '../../data/categories';
import { Users, Play, Copy, Check, Share2, LogOut, UserMinus, Sparkles, QrCode } from 'lucide-react';
import { PlayerPawn } from '../PlayerPawn';
import { GameSettingsCard } from '../GameSettingsCard';
import { useTranslation } from '../../i18n/LanguageContext';

interface LobbyPhaseProps {
  roomCode: string;
  players: Player[];
  activePlayerId: string;
  selectedCategoryId: string;
  isHost: boolean;
  isPremiumRoom?: boolean;
  settings: GameSettings;
  customCategory?: CustomCategory;
  onSelectCategory: (categoryId: string) => void;
  onOpenLockedCategory: () => void;
  onStartGame: () => void;
  onKickPlayer?: (playerId: string) => void;
  onLeaveRoom?: () => void;
  onOpenQrModal: () => void;
  onUpdateSettings: (settings: Partial<GameSettings>) => void;
  onUpdateCustomCategory?: (custom: CustomCategory) => void;
}

export const LobbyPhase: React.FC<LobbyPhaseProps> = ({
  roomCode,
  players,
  activePlayerId,
  selectedCategoryId,
  isHost,
  isPremiumRoom = false,
  settings,
  customCategory,
  onSelectCategory,
  onOpenLockedCategory,
  onStartGame,
  onKickPlayer,
  onLeaveRoom,
  onOpenQrModal,
  onUpdateSettings,
  onUpdateCustomCategory,
}) => {
  const { t, language } = useTranslation();
  const [copied, setCopied] = useState(false);

  const fullShareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${window.location.pathname}?room=${roomCode}`
    : `https://bara-elsafa.vercel.app/?room=${roomCode}`;

  const copyShareLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(fullShareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shareToWhatsApp = () => {
    const text = encodeURIComponent(
      language === 'ar'
        ? `يلا نلعب شوتايم / برا السالفة! مين برا السالفة ومسوي فاهم؟ 🎭\nادخل الغرفة رقم: ${roomCode}\nالرابط المباشر:\n${fullShareUrl}`
        : `Let's play Showtime / Out of the Loop! Who is faking it? 🎭\nJoin Room: ${roomCode}\nDirect Link:\n${fullShareUrl}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const categories = getCategoriesWithLockStatus(isPremiumRoom, customCategory, language);
  const canStart = players.length >= 3;

  return (
    <div className="flex flex-col gap-3.5 max-w-md mx-auto w-full pb-3 select-none">
      {/* 1. Room Code & Share Header */}
      <div className="bg-white rounded-3xl border-3 sm:border-4 border-black p-3.5 shadow-brutal flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-11 h-11 bg-brand-yellow rounded-2xl border-3 border-black shadow-brutal-sm flex items-center justify-center font-black text-xl shrink-0">
              🎭
            </div>
            <div>
              <span className="text-[11px] font-black text-gray-500 block leading-tight">
                {t('roomCodeHeader')}
              </span>
              <div className="text-2xl font-black font-mono tracking-widest text-black flex items-center gap-1.5 leading-none mt-0.5">
                <span>{roomCode}</span>
                {isPremiumRoom && (
                  <span className="text-[10px] bg-brand-purple text-white px-2 py-0.5 rounded-full border border-black font-black font-sans">
                    {t('vipActive')}
                  </span>
                )}
              </div>
            </div>
          </div>

          {onLeaveRoom && (
            <button
              onClick={onLeaveRoom}
              className="p-2 text-gray-500 hover:text-red-600 rounded-xl hover:bg-red-50 text-xs font-black flex items-center gap-1 transition-colors"
              title={t('leaveRoom')}
            >
              <LogOut className="w-4 h-4 shrink-0" />
              <span>{t('leaveRoom')}</span>
            </button>
          )}
        </div>

        {/* Share Buttons (3 Equal Columns grid-cols-3 gap-2 with ZERO truncation) */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t-2 border-black/10">
          <button
            onClick={copyShareLink}
            className="flex items-center justify-center gap-1 py-2 px-1 bg-brand-cyan hover:bg-[#5bc9e4] rounded-xl border-2 border-black font-black text-xs sm:text-sm whitespace-nowrap shadow-brutal-sm active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 stroke-[3] shrink-0" /> : <Copy className="w-3.5 h-3.5 stroke-[2.5] shrink-0" />}
            <span className="whitespace-nowrap">{copied ? t('linkCopied') : t('copyLink')}</span>
          </button>

          <button
            onClick={shareToWhatsApp}
            className="flex items-center justify-center gap-1 py-2 px-1 bg-brand-green hover:bg-[#68d778] rounded-xl border-2 border-black font-black text-xs sm:text-sm whitespace-nowrap shadow-brutal-sm active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5 stroke-[2.5] shrink-0" />
            <span className="whitespace-nowrap">{t('whatsappShare')}</span>
          </button>

          <button
            onClick={onOpenQrModal}
            className="flex items-center justify-center gap-1 py-2 px-1 bg-brand-yellow hover:bg-[#ffe175] rounded-xl border-2 border-black font-black text-xs sm:text-sm whitespace-nowrap shadow-brutal-sm active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer"
          >
            <QrCode className="w-3.5 h-3.5 stroke-[2.5] shrink-0" />
            <span className="whitespace-nowrap">{t('qrCodeBtn')}</span>
          </button>
        </div>
      </div>

      {/* 2. Round Settings Accordion (Host Only) */}
      {isHost && (
        <GameSettingsCard
          settings={settings}
          playerCount={players.length}
          isHost={isHost}
          selectedCategoryId={selectedCategoryId}
          customCategory={customCategory}
          onUpdateSettings={onUpdateSettings}
          onUpdateCustomCategory={onUpdateCustomCategory}
        />
      )}

      {/* 3. Connected Players Section */}
      <div className="bg-white rounded-3xl border-3 sm:border-4 border-black p-3.5 shadow-brutal">
        <div className="flex items-center justify-between mb-2.5 border-b-2 border-black/10 pb-2">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-black shrink-0" />
            <span className="text-xs sm:text-sm font-black text-black">
              {t('connectedPlayers')} ({players.length})
            </span>
          </div>
          <span className="text-[10px] sm:text-[11px] font-black text-gray-500">
            {t('minPlayersNotice')}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-1.5 max-h-44 overflow-y-auto pr-1">
          {players.map((p) => {
            const isMe = p.id === activePlayerId;
            const canKick = isHost && !isMe;

            return (
              <div
                key={p.id}
                className={`flex items-center justify-between p-2 rounded-xl border-2 border-black transition-all ${
                  isMe ? 'bg-[#FFF8E7] shadow-brutal-sm font-black' : 'bg-[#FAF8F5] font-bold'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <PlayerPawn
                    color={p.color}
                    size="sm"
                    showName={false}
                    isActive={true}
                  />
                  <div className="truncate flex items-center gap-1.5">
                    <span className="text-xs font-black truncate">{p.name}</span>
                    {p.isHost && (
                      <span className="text-[9px] bg-brand-yellow px-1.5 py-0.5 rounded-md border border-black font-black whitespace-nowrap">
                        {t('hostBadge')}
                      </span>
                    )}
                    {isMe && (
                      <span className="text-[10px] text-brand-purple font-black whitespace-nowrap">
                        {t('youBadge')}
                      </span>
                    )}
                  </div>
                </div>

                {canKick && onKickPlayer && (
                  <button
                    onClick={() => onKickPlayer(p.id)}
                    className="px-2 py-0.5 bg-red-100 hover:bg-red-200 text-red-700 text-[10px] font-black rounded-lg border border-red-400 flex items-center gap-1 active:scale-95 transition-all"
                    title={t('kickPlayer')}
                  >
                    <UserMinus className="w-3 h-3" />
                    <span>{t('kickPlayer')}</span>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Topic / Category Grid */}
      <div className="bg-white rounded-3xl border-3 sm:border-4 border-black p-3.5 shadow-brutal">
        <div className="flex items-center justify-between mb-2.5 border-b-2 border-black/10 pb-2">
          <div className="flex items-center gap-2">
            <h2 className="text-xs sm:text-sm font-black text-black">
              {t('categorySectionTitle')}
            </h2>
            {isPremiumRoom ? (
              <span className="text-[10px] bg-brand-green text-black px-2 py-0.5 rounded-full border border-black font-black flex items-center gap-1 whitespace-nowrap">
                <Sparkles className="w-3 h-3 fill-black" />
                <span>{t('allVipUnlocked')}</span>
              </span>
            ) : (
              <span className="text-[10px] bg-brand-yellow text-black px-2 py-0.5 rounded-full border border-black font-black whitespace-nowrap">
                {t('freeCategoriesCount')}
              </span>
            )}
          </div>

          {!isHost && (
            <span className="text-[10px] font-bold text-gray-500 whitespace-nowrap">
              {t('hostPickNote')}
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2">
          {categories.map((cat) => {
            const isSelected = selectedCategoryId === cat.id;

            return (
              <button
                key={cat.id}
                type="button"
                disabled={!isHost && !cat.isLocked}
                onClick={() => {
                  if (cat.isLocked) {
                    onOpenLockedCategory();
                  } else if (isHost) {
                    onSelectCategory(cat.id);
                  }
                }}
                className={`relative flex items-center gap-2 p-2 rounded-xl border-2 border-black text-start transition-all ${
                  cat.isLocked
                    ? 'bg-gray-100 opacity-80 hover:bg-gray-200 cursor-pointer'
                    : isSelected
                    ? 'bg-brand-yellow font-black shadow-brutal-sm scale-[1.02]'
                    : isHost
                    ? 'bg-white hover:bg-gray-50 font-bold cursor-pointer'
                    : 'bg-white font-bold opacity-90'
                } active:translate-x-[1px] active:translate-y-[1px]`}
              >
                <span className="text-xl shrink-0">{cat.icon}</span>
                <div className="flex-1 truncate">
                  <div className="text-xs font-black truncate">{cat.name}</div>
                  <div className="text-[9px] text-gray-600 font-bold">
                    {cat.isLocked ? t('vipCategoryBadge') : t('wordsCount', { count: cat.words.length })}
                  </div>
                </div>

                {isSelected && !cat.isLocked && (
                  <div className="w-4 h-4 bg-black rounded-full text-white flex items-center justify-center text-[10px] shrink-0">
                    ✓
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. Host Start Game Button or Non-Host Waiting Card */}
      {isHost ? (
        <div className="flex flex-col gap-2">
          <button
            onClick={onStartGame}
            disabled={!canStart}
            className={`w-full py-3.5 rounded-2xl border-3 border-black font-black text-base flex items-center justify-center gap-2 shadow-brutal transition-all ${
              canStart
                ? 'bg-brand-green hover:bg-[#68d778] text-black active:translate-x-[2px] active:translate-y-[2px] active:shadow-none cursor-pointer'
                : 'bg-gray-200 text-gray-400 border-gray-400 shadow-none cursor-not-allowed'
            }`}
          >
            <Play className="w-5 h-5 fill-current" />
            <span>{t('startGameBtn')}</span>
          </button>
          {!canStart && (
            <p className="text-center text-xs font-bold text-red-600 bg-red-50 p-2 rounded-xl border border-red-300">
              {t('needMorePlayers')}
            </p>
          )}
        </div>
      ) : (
        <div className="bg-[#E0F7FA] border-3 border-black rounded-2xl p-4 text-center shadow-brutal-sm">
          <div className="text-sm font-black text-black mb-1 animate-pulse">
            {t('waitingForHost')}
          </div>
          <div className="text-xs text-gray-700 font-bold">
            {t('waitingForHostDesc')}
          </div>
        </div>
      )}
    </div>
  );
};
