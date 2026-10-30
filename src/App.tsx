import React, { useState, useEffect } from 'react';
import { useGameEngine } from './hooks/useGameEngine';
import { WelcomeScreen } from './components/WelcomeScreen';
import { CharacterStage } from './components/CharacterStage';
import { PaywallModal } from './components/PaywallModal';
import { QrCodeModal } from './components/QrCodeModal';
import { LobbyPhase } from './components/phases/LobbyPhase';
import { RoleRevealPhase } from './components/phases/RoleRevealPhase';
import { QuestionsPhase } from './components/phases/QuestionsPhase';
import { VotingPhase } from './components/phases/VotingPhase';
import { LastChancePhase } from './components/phases/LastChancePhase';
import { GameOverPhase } from './components/phases/GameOverPhase';
import { CATEGORIES } from './data/categories';
import { soundFx } from './utils/soundFx';
import { useTranslation } from './i18n/LanguageContext';
import { Volume2, VolumeX } from 'lucide-react';

export function App() {
  const { t, language, toggleLanguage } = useTranslation();
  const {
    profile,
    isInRoom,
    isConnecting,
    isOnline,
    isLocallyVip,
    roomState,
    activePlayerId,
    activePlayer,
    isHost,
    kickedNotice,
    updateProfile,
    createRoom,
    joinRoom,
    leaveRoom,
    kickPlayer,
    setCategory,
    updateSettings,
    updateCustomCategory,
    activateVipRoom,
    startGame,
    startQuestions,
    nextQuestionPair,
    submitVote,
    submitImpostorGuess,
    playAgain,
    backToLobby,
  } = useGameEngine();

  const [isPaywallOpen, setIsPaywallOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(() => soundFx.isSoundMuted());
  const [initialRoomFromUrl, setInitialRoomFromUrl] = useState<string>('');

  // Extract ?room=XXXX from URL search params on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const roomParam = params.get('room');
      if (roomParam) {
        setInitialRoomFromUrl(roomParam.trim());
      }
    }
  }, []);

  const handleToggleSound = () => {
    const muted = soundFx.toggleMute();
    setIsMuted(muted);
  };

  const activeCategory = CATEGORIES.find((c) => c.id === roomState.selectedCategoryId) || CATEGORIES[0];
  const currentPair = roomState.questionPairs[roomState.currentPairIndex];
  const isVip = roomState.isPremiumRoom || isLocallyVip;

  const categoryDisplayName = language === 'en' 
    ? (roomState.customCategory?.title || roomState.customCategory?.name || activeCategory.nameEn)
    : (roomState.customCategory?.title || roomState.customCategory?.name || activeCategory.nameAr);

  // 1. If not currently in an active room, render Welcome / Onboarding Screen
  if (!isInRoom) {
    return (
      <div className={`min-h-[100dvh] bg-[#F7F4EB] text-black ${language === 'en' ? 'font-jakarta' : 'font-cairo'} select-none overflow-x-hidden`}>
        {kickedNotice && (
          <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 bg-red-500 text-white font-black text-xs px-4 py-2 rounded-xl border-2 border-black shadow-brutal animate-bounce">
            ⚠️ {kickedNotice}
          </div>
        )}
        <WelcomeScreen
          initialRoomCode={initialRoomFromUrl}
          initialProfile={profile}
          isOnline={isOnline}
          onUpdateProfile={updateProfile}
          onCreateRoom={async (name, color) => {
            soundFx.playButtonClick();
            await createRoom(name, color);
          }}
          onJoinRoom={async (code, name, color) => {
            soundFx.playButtonClick();
            return await joinRoom(code, name, color);
          }}
          isConnecting={isConnecting}
        />
      </div>
    );
  }

  // 2. Active Game Screen
  return (
    <div className={`min-h-[100dvh] bg-[#F7F4EB] flex flex-col justify-between text-black ${language === 'en' ? 'font-jakarta' : 'font-cairo'} select-none overflow-x-hidden`}>
      {/* Strict Production Top Header */}
      <header className="h-14 px-3 flex items-center justify-between border-b-2 border-black bg-[#F7F4EB] shrink-0 sticky top-0 z-40">
        {/* Brand Side (Start) */}
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-brand-yellow border-2 border-black shadow-brutal-sm flex items-center justify-center font-black text-base shrink-0">
            🎭
          </div>
          <div className="flex items-center gap-1.5 flex-nowrap">
            <span className="text-base font-black text-black tracking-tight leading-none">
              {t('appTitle')}
            </span>
            <span className="bg-brand-purple/15 text-brand-purple text-[10px] font-black px-1.5 py-0.5 rounded-md border border-black/20 whitespace-nowrap">
              {t('appSubtitle')}
            </span>
          </div>
        </div>

        {/* Controls Side (End) - Strictly 3 compact, uniform buttons (h-9) */}
        <div className="flex items-center gap-1.5">
          {/* 1. VIP / Pro Button */}
          {isVip ? (
            <button
              onClick={() => setIsPaywallOpen(true)}
              className="h-9 px-2.5 rounded-lg border-2 border-black bg-brand-yellow shadow-brutal-sm flex items-center gap-1 font-black text-xs text-black active:translate-x-[1px] active:translate-y-[1px] transition-all"
              title={t('vipActive')}
            >
              <span>{t('vipActive')}</span>
            </button>
          ) : (
            <button
              onClick={() => setIsPaywallOpen(true)}
              className="h-9 px-2.5 rounded-lg border-2 border-black bg-brand-yellow hover:bg-[#ffe175] shadow-brutal-sm flex items-center gap-1 font-black text-xs text-black active:translate-x-[1px] active:translate-y-[1px] transition-all"
              title={t('proUpgradeBtn')}
            >
              <span>{t('proUpgradeBtn')}</span>
            </button>
          )}

          {/* 2. Audio Mute/Unmute Button */}
          <button
            onClick={handleToggleSound}
            className="w-9 h-9 rounded-lg border-2 border-black bg-white hover:bg-gray-100 shadow-brutal-sm flex items-center justify-center text-black active:translate-x-[1px] active:translate-y-[1px] transition-all shrink-0"
            title={isMuted ? t('soundUnmuted') : t('soundMuted')}
            aria-label={t('soundToggle')}
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4 text-gray-400" />
            ) : (
              <Volume2 className="w-4 h-4 text-black" />
            )}
          </button>

          {/* 3. Language Toggle Button */}
          <button
            onClick={toggleLanguage}
            className="px-3 h-9 rounded-lg border-2 border-black bg-white hover:bg-gray-100 shadow-brutal-sm flex items-center justify-center font-black text-xs text-black active:translate-x-[1px] active:translate-y-[1px] transition-all shrink-0"
            title={language === 'ar' ? 'Switch to English' : 'التحويل للعربية'}
          >
            <span>{t('langToggle')}</span>
          </button>
        </div>
      </header>

      {/* Main Viewport Container */}
      <main className="flex-1 flex flex-col justify-between max-w-md w-full mx-auto px-3 py-2 overflow-x-hidden">
        {/* Phase Viewport */}
        <div className="flex-1 flex flex-col justify-center my-auto w-full">
          {roomState.phase === 'LOBBY' && (
            <LobbyPhase
              roomCode={roomState.roomCode}
              players={roomState.players}
              activePlayerId={activePlayerId}
              selectedCategoryId={roomState.selectedCategoryId}
              isHost={isHost}
              isPremiumRoom={isVip}
              settings={roomState.settings || { timerDuration: 25, impostorCount: 'auto', impostorCategoryHint: true }}
              customCategory={roomState.customCategory}
              onSelectCategory={setCategory}
              onOpenLockedCategory={() => setIsPaywallOpen(true)}
              onStartGame={startGame}
              onKickPlayer={kickPlayer}
              onLeaveRoom={leaveRoom}
              onOpenQrModal={() => setIsQrModalOpen(true)}
              onUpdateSettings={updateSettings}
              onUpdateCustomCategory={updateCustomCategory}
            />
          )}

          {roomState.phase === 'ROLE_REVEAL' && activePlayer && (
            <RoleRevealPhase
              player={activePlayer}
              players={roomState.players}
              secretWord={roomState.secretWord}
              categoryName={categoryDisplayName}
              impostorCategoryHint={roomState.settings?.impostorCategoryHint ?? true}
              isHost={isHost}
              onStartQuestions={startQuestions}
            />
          )}

          {roomState.phase === 'QUESTIONS' && currentPair && (
            <QuestionsPhase
              currentPair={currentPair}
              pairIndex={roomState.currentPairIndex}
              totalPairs={roomState.questionPairs.length}
              timeLeft={roomState.questionTimeRemaining}
              turnStartedAt={roomState.turnStartedAt}
              maxDuration={roomState.settings?.timerDuration ?? 25}
              players={roomState.players}
              isHost={isHost}
              onNextPair={nextQuestionPair}
            />
          )}

          {roomState.phase === 'VOTING' && (
            <VotingPhase
              players={roomState.players}
              activePlayerId={activePlayerId}
              votes={roomState.votes}
              votingRevealed={roomState.votingRevealed}
              onSubmitVote={submitVote}
            />
          )}

          {roomState.phase === 'LAST_CHANCE' && (
            <LastChancePhase
              caughtImpostorId={roomState.caughtImpostorId}
              players={roomState.players}
              activePlayerId={activePlayerId}
              wordOptions={roomState.lastChanceOptions}
              onSubmitGuess={submitImpostorGuess}
            />
          )}

          {roomState.phase === 'GAME_OVER' && (
            <GameOverPhase
              winner={roomState.winner}
              winReason={roomState.winReason}
              secretWord={roomState.secretWord}
              impostorGuess={roomState.impostorGuess}
              players={roomState.players}
              caughtImpostorId={roomState.caughtImpostorId}
              isHost={isHost}
              onPlayAgain={playAgain}
              onBackToLobby={backToLobby}
            />
          )}
        </div>
      </main>

      {/* Persistent Character Stage (Bottom Dock) */}
      <CharacterStage
        players={roomState.players}
        activePlayerId={activePlayerId}
        phase={roomState.phase}
        currentPair={currentPair}
        caughtImpostorId={roomState.caughtImpostorId}
        winner={roomState.winner}
      />

      {/* High-Converting Paywall & VIP Room Unlock Modal */}
      <PaywallModal
        isOpen={isPaywallOpen}
        onClose={() => setIsPaywallOpen(false)}
        onUnlockSuccess={activateVipRoom}
      />

      {/* Scannable Room QR Code Modal */}
      <QrCodeModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        roomCode={roomState.roomCode}
      />
    </div>
  );
}

export default App;
