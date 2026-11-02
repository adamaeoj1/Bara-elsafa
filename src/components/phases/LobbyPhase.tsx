import React, { useState } from 'react';
import { Player, GameSettings, CustomCategory, GameMode } from '../../types/game';
import { getCategoriesWithLockStatus } from '../../data/categories';
import { Users, Play, Copy, Check, Share2, LogOut, UserMinus, Sparkles, QrCode, RotateCcw } from 'lucide-react';
import { PlayerPawn } from '../PlayerPawn';
import { GameSettingsCard } from '../GameSettingsCard';
import { useTranslation } from '../../i18n/LanguageContext';

interface LobbyPhaseProps {
  roomCode: string;
  gameMode?: GameMode;
  players: Player[];
  activePlayerId: string;
  selectedCategoryId: string;
  isHost: boolean;
  isPremiumRoom?: boolean;
  settings: GameSettings;
  customCategory?: CustomCategory;
  onSelectGameMode?: (mode: GameMode) => void;
  onSelectCategory: (categoryId: string) => void;
  onOpenLockedCategory: () => void;
  onStartGame: () => void;
  onKickPlayer?: (playerId: string) => void;
  onLeaveRoom?: () => void;
  onOpenQrModal: () => void;
  onUpdateSettings: (settings: Partial<GameSettings>) => void;
  onUpdateCustomCategory?: (custom: CustomCategory) => void;
  onResetScores?: () => void;
}

export const LobbyPhase: React.FC<LobbyPhaseProps> = ({
  roomCode,
  gameMode = 'OUT_OF_THE_LOOP',
  players,
  activePlayerId,
  selectedCategoryId,
  isHost,
  isPremiumRoom = false,
  settings,
  customCategory,
  onSelectGameMode,
  onSelectCategory,
  onOpenLockedCategory,
  onStartGame,
  onKickPlayer,
  onLeaveRoom,
  onOpenQrModal,
  onUpdateSettings,
  onUpdateCustomCategory,
  onResetScores,
}) => {
  const { t, language } = useTranslation();
  const [copied, setCopied] = useState(false);
  const [resetNotice, setResetNotice] = useState(false);

  const fullShareUrl =
    typeof window !== 'undefined'
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
        ? `يلا نلعب برا السالفة! مين برا السالفة ومسوي فاهم؟ 🎭\nادخل الغرفة رقم: ${roomCode}\nالرابط المباشر:\n${fullShareUrl}`
        : `Let's play Bara Elsalfa! Who is faking it? 🎭\nJoin Room: ${roomCode}\nDirect Link:\n${fullShareUrl}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handleResetScoresClick = () => {
    if (onResetScores) {
      onResetScores();
      setResetNotice(true);
      setTimeout(() => setResetNotice(false), 2500);
    }
  };

  const categories = getCategoriesWithLockStatus(isPremiumRoom, customCategory, language);

  const isMafia = gameMode === 'MAFIA';
  const minRequired = 3;
  const canStart = players.length >= minRequired;

  return (
    <div className="flex flex-col gap-4 w-full pb-28 select-none">
      {/* 1. Room Code & Share Header */}
      <div className="bg-white rounded-3xl border-3 border-black p-4 shadow-brutal flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-brand-yellow rounded-2xl border-2 border-black shadow-brutal-sm flex items-center justify-center font-black text-xl shrink-0">
              {isMafia ? '🕵️‍♂️' : '🎭'}
            </div>
            <div>
              <span className="text-xs font-black text-gray-500 block leading-tight">
                {t('roomCodeHeader')}
              </span>
              <div className="text-2xl font-black font-mono tracking-widest text-black flex items-center gap-2 leading-none mt-0.5">
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
              className="px-3 py-1.5 text-gray-600 hover:text-red-600 rounded-xl hover:bg-red-50 border border-transparent hover:border-red-200 text-xs font-black flex items-center gap-1.5 transition-colors cursor-pointer"
              title={t('leaveRoom')}
            >
              <LogOut className="w-4 h-4 shrink-0" />
              <span>{t('leaveRoom')}</span>
            </button>
          )}
        </div>

        {/* Share Buttons (3 Equal Columns - One Icon Per Button) */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t-2 border-black/10">
          <button
            onClick={copyShareLink}
            className="flex items-center justify-center py-2.5 px-2 bg-brand-cyan hover:bg-[#5bc9e4] rounded-xl border-2 border-black font-black text-xs sm:text-sm whitespace-nowrap shadow-brutal-sm active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer"
          >
            <span className="whitespace-nowrap">{copied ? t('linkCopied') : t('copyLink')}</span>
          </button>

          <button
            onClick={shareToWhatsApp}
            className="flex items-center justify-center py-2.5 px-2 bg-brand-green hover:bg-[#68d778] rounded-xl border-2 border-black font-black text-xs sm:text-sm whitespace-nowrap shadow-brutal-sm active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer"
          >
            <span className="whitespace-nowrap">{t('whatsappShare')}</span>
          </button>

          <button
            onClick={onOpenQrModal}
            className="flex items-center justify-center py-2.5 px-2 bg-brand-yellow hover:bg-[#ffe175] rounded-xl border-2 border-black font-black text-xs sm:text-sm whitespace-nowrap shadow-brutal-sm active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer"
          >
            <span className="whitespace-nowrap">{t('qrCodeBtn')}</span>
          </button>
        </div>
      </div>

      {/* 2. Prominent Game Mode Selector (2-in-1 Party Hub) */}
      <div className="bg-white rounded-3xl border-3 border-black p-4 shadow-brutal">
        <label className="block text-xs font-black text-gray-500 uppercase tracking-wide mb-2 text-start">
          {t('selectGameMode')}
        </label>
        <div className="grid grid-cols-2 gap-3">
          {/* Mode 1: Out of the Loop */}
          <button
            type="button"
            disabled={!isHost}
            onClick={() => onSelectGameMode?.('OUT_OF_THE_LOOP')}
            className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 border-black text-center transition-all ${
              !isMafia
                ? 'bg-brand-yellow text-black shadow-brutal scale-[1.01] font-black'
                : 'bg-gray-50 hover:bg-gray-100 text-gray-700 opacity-80'
            } ${isHost ? 'cursor-pointer active:translate-x-[1px] active:translate-y-[1px]' : 'cursor-default'}`}
          >
            <span className="text-2xl mb-1">🎭</span>
            <span className="text-xs sm:text-sm font-black">{t('modeOutOfTheLoop')}</span>
            <span className="text-[10px] text-gray-600 font-bold mt-0.5 leading-tight">
              {language === 'ar' ? '3+ لاعبين' : '3+ players'}
            </span>
          </button>

          {/* Mode 2: Mafia */}
          <button
            type="button"
            disabled={!isHost}
            onClick={() => onSelectGameMode?.('MAFIA')}
            className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 border-black text-center transition-all ${
              isMafia
                ? 'bg-[#6D4AFF] text-white shadow-brutal scale-[1.01] font-black'
                : 'bg-gray-50 hover:bg-gray-100 text-gray-700 opacity-80'
            } ${isHost ? 'cursor-pointer active:translate-x-[1px] active:translate-y-[1px]' : 'cursor-not-allowed opacity-70'}`}
          >
            <span className="text-2xl mb-1">🕵️‍♂️</span>
            <span className="text-xs sm:text-sm font-black">{t('modeMafia')}</span>
            <span className="text-[10px] text-gray-300 font-bold mt-0.5 leading-tight">
              {language === 'ar' ? '3+ لاعبين' : '3+ players'}
            </span>
          </button>
        </div>
      </div>

      {/* Mafia Mode Info Card (Shown when Mafia is active) */}
      {isMafia && (
        <div className="bg-[#1E1B2E] text-white rounded-3xl border-3 border-black p-4 shadow-brutal animate-fade-in text-start">
          <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-white/20">
            <span className="text-lg">🌙</span>
            <h3 className="text-xs sm:text-sm font-black text-brand-yellow">
              {language === 'ar' ? 'قواعد مدينة المافيا السريعة' : 'Quick Mafia Hub Rules'}
            </h3>
          </div>
          <p className="text-xs text-gray-300 font-bold leading-relaxed mb-3">
            {language === 'ar'
              ? 'اللعبة توزع الأدوار سراً: الإمبوستر 🔪 يغتال ليلاً، الدكتور 🩺 يحمي شخصاً، والمحقق 🕵️‍♂️ يكشف هوية لاعب، بينما المواطنون 🛡️ يناقشون ويصوتون بالمحكمة!'
              : 'Secret roles: Impostor 🔪 kills at night, Doctor 🩺 protects, Detective 🕵️‍♂️ investigates, while Civilians 🛡️ debate and vote in court!'}
          </p>
          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="bg-white/10 rounded-xl p-2 border border-white/20">
              <span className="text-base block">🔪</span>
              <span className="text-[10px] font-black text-brand-pink block">إمبوستر</span>
            </div>
            <div className="bg-white/10 rounded-xl p-2 border border-white/20">
              <span className="text-base block">🩺</span>
              <span className="text-[10px] font-black text-brand-cyan block">دكتور</span>
            </div>
            <div className="bg-white/10 rounded-xl p-2 border border-white/20">
              <span className="text-base block">🕵️‍♂️</span>
              <span className="text-[10px] font-black text-brand-yellow block">محقق</span>
            </div>
            <div className="bg-white/10 rounded-xl p-2 border border-white/20">
              <span className="text-base block">🛡️</span>
              <span className="text-[10px] font-black text-brand-green block">مواطن</span>
            </div>
          </div>
        </div>
      )}

      {/* 3. Round Settings Accordion (Host Only, Out of the Loop) */}
      {!isMafia && isHost && (
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

      {/* 4. Connected Players Section with Subtle Host Badge & Live Points */}
      <div className="bg-white rounded-3xl border-3 border-black p-4 shadow-brutal">
        <div className="flex items-center justify-between mb-3 border-b-2 border-black/10 pb-2">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-black shrink-0" />
            <span className="text-xs sm:text-sm font-black text-black">
              {t('connectedPlayers')} ({players.length})
            </span>
          </div>

          <div className="flex items-center gap-2">
            {isHost && onResetScores && (
              <button
                onClick={handleResetScoresClick}
                className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg border border-black/30 font-black text-[11px] flex items-center gap-1 active:scale-95 transition-all cursor-pointer"
                title={t('resetScoresBtn')}
              >
                <RotateCcw className="w-3 h-3" />
                <span>{t('resetScoresBtn')}</span>
              </button>
            )}
            <span className="text-xs font-black text-gray-500">
              {t('minPlayersNotice')}
            </span>
          </div>
        </div>

        {resetNotice && (
          <div className="mb-2.5 p-2 bg-green-100 border border-green-400 rounded-xl text-green-800 text-xs font-black text-center animate-fade-in">
            ✓ {t('scoresResetNotice')}
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {players.map((p) => {
            const isMe = p.id === activePlayerId;
            const playerIsHost = Boolean(p.isHost || p.is_host);
            const canKick = isHost && !isMe;

            return (
              <div
                key={p.id}
                className={`relative flex items-center justify-between p-2 rounded-2xl border-2 border-black transition-all ${
                  isMe ? 'bg-[#FFF8E7] shadow-brutal-sm font-black' : 'bg-[#FAF8F5] font-bold'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <div className="shrink-0">
                    <PlayerPawn
                      color={p.color}
                      size="sm"
                      showName={false}
                      isActive={true}
                      isHost={playerIsHost}
                    />
                  </div>
                  <div className="min-w-0 flex-1 flex flex-col justify-center">
                    <div className="flex items-center gap-1 flex-wrap">
                      <span className="text-xs sm:text-sm font-black truncate">{p.name}</span>
                      {playerIsHost && (
                        <span className="inline-flex items-center gap-0.5 text-[9px] font-black bg-brand-yellow text-black px-1.5 py-0.2 rounded-full border border-black whitespace-nowrap">
                          👑
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className="text-[10px] font-black bg-brand-yellow text-black px-1.5 py-0.2 rounded-full border border-black shadow-[1px_1px_0px_#000] whitespace-nowrap">
                        ⭐ {p.score || 0}
                      </span>
                      {isMe && (
                        <span className="text-[10px] text-brand-purple font-black whitespace-nowrap">
                          {t('youBadge')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {canKick && onKickPlayer && (
                  <button
                    onClick={() => onKickPlayer(p.id)}
                    className="p-1 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg border border-red-400 active:scale-95 transition-all cursor-pointer shrink-0 ms-1"
                    title={t('kickPlayer')}
                  >
                    <UserMinus className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. Topic / Category Grid (Only for Out of the Loop mode) */}
      {!isMafia && (
        <div className="bg-white rounded-3xl border-3 border-black p-4 shadow-brutal">
          <div className="flex items-center justify-between mb-3 border-b-2 border-black/10 pb-2">
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
              <span className="text-[11px] font-bold text-gray-500 whitespace-nowrap">
                {t('hostPickNote')}
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
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
                  className={`relative flex items-center gap-2.5 p-3 rounded-2xl border-2 border-black text-start transition-all ${
                    cat.isLocked
                      ? 'bg-gray-100 opacity-80 hover:bg-gray-200 cursor-pointer'
                      : isSelected
                      ? 'bg-brand-yellow font-black shadow-brutal-sm scale-[1.01]'
                      : isHost
                      ? 'bg-white hover:bg-gray-50 font-bold cursor-pointer'
                      : 'bg-white font-bold opacity-90'
                  } active:translate-x-[1px] active:translate-y-[1px]`}>
                  <span className="text-2xl shrink-0">{cat.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm sm:text-base font-extrabold leading-snug line-clamp-2 text-start">
                      {cat.name}
                    </div>
                    <div className="text-[10px] text-gray-600 font-bold mt-1">
                      {cat.isLocked ? (
                        <span className="inline-block bg-brand-purple text-white px-2 py-0.5 rounded-full border border-black font-black text-[10px]">
                          {t('vipCategoryBadge')}
                        </span>
                      ) : (
                        t('wordsCount', { count: cat.words.length })
                      )}
                    </div>
                  </div>

                  {isSelected && !cat.isLocked && (
                    <div className="w-5 h-5 bg-black rounded-full text-white flex items-center justify-center text-xs shrink-0 ms-1">
                      ✓
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 6. Sticky Host Start Game Bar or Non-Host Waiting Card */}
      <div className="sticky bottom-3 z-30 w-full bg-white/95 backdrop-blur-sm p-3 rounded-2xl border-2 border-black shadow-[4px_4px_0px_0px_#000]">
        {isHost ? (
          <div className="flex flex-col gap-2">
            <button
              onClick={onStartGame}
              disabled={!canStart}
              className={`w-full py-3.5 rounded-2xl border-3 border-black font-black text-base flex items-center justify-center gap-2 shadow-brutal transition-all ${
                canStart
                  ? isMafia
                    ? 'bg-[#6D4AFF] hover:bg-[#5835eb] text-white active:translate-x-[2px] active:translate-y-[2px] active:shadow-none cursor-pointer'
                    : 'bg-brand-green hover:bg-[#68d778] text-black active:translate-x-[2px] active:translate-y-[2px] active:shadow-none cursor-pointer'
                  : 'bg-gray-200 text-gray-400 border-gray-400 shadow-none cursor-not-allowed'
              }`}
            >
              <Play className="w-5 h-5 fill-current" />
              <span>
                {isMafia
                  ? language === 'ar'
                    ? 'ابدأ لعبة المافيا 🕵️‍♂️'
                    : 'Start Mafia Game 🕵️‍♂️'
                  : t('startGameBtn')}
              </span>
            </button>
            {!canStart && (
              <p className="text-center text-xs font-bold text-red-600 bg-red-50 p-2 rounded-xl border border-red-300">
                {isMafia ? t('need4PlayersMafia') : t('needMorePlayers')}
              </p>
            )}
          </div>
        ) : (
          <div className="bg-[#E0F7FA] border-2 border-black rounded-xl p-3 text-center shadow-brutal-xs">
            <div className="text-xs sm:text-sm font-black text-black animate-pulse">
              ⏳ {t('waitingForHost')}
            </div>
            <div className="text-[11px] text-gray-700 font-bold mt-0.5">
              {t('waitingForHostDesc')}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
