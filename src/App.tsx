import React, { useState, useEffect } from 'react';
import { useGameEngine } from './hooks/useGameEngine';
import { WelcomeScreen } from './components/WelcomeScreen';
import { CharacterStage } from './components/CharacterStage';
import { PaywallModal } from './components/PaywallModal';
import { QrCodeModal } from './components/QrCodeModal';
import { ConnectionStatusBadge } from './components/ConnectionStatusBadge';
import { LobbyPhase } from './components/phases/LobbyPhase';
import { RoleRevealPhase } from './components/phases/RoleRevealPhase';
import { QuestionsPhase } from './components/phases/QuestionsPhase';
import { VotingPhase } from './components/phases/VotingPhase';
import { LastChancePhase } from './components/phases/LastChancePhase';
import { GameOverPhase } from './components/phases/GameOverPhase';
import { CATEGORIES } from './data/categories';
import { soundFx } from './utils/soundFx';
import { useTranslation } from './i18n/LanguageContext';
import { LogOut, Sparkles, Globe, Volume2, VolumeX } from 'lucide-react';

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

  // 1. If not currently in an active room, render the Welcome Onboarding Screen
  if (!isInRoom) {
    return (
      <>
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
      </>
    );
  }

  // 2. Active Game Screen
  return (
    <div className={`min-h-screen bg-[#F7F4EB] flex flex-col justify-between text-black ${language === 'en' ? 'font-jakarta' : 'font-cairo'} select-none`}>
      {/* Main Container */}
      <main className="flex-1 flex flex-col justify-between max-w-md w-full mx-auto px-4 py-3">
        {/* Header Bar */}
        <header className="flex items-center justify-between mb-3 border-b-2 border-black/10 pb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-brand-yellow border-2 border-black shadow-brutal-sm flex items-center justify-center font-black text-sm">
              🎭
            </div>
            <div>
              <h1 className="text-base font-black tracking-tight leading-none text-black">
                {t('appTitle')} <span className="text-brand-purple">| {t('appSubtitle')}</span>
              </h1>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[10px] font-bold text-gray-500">
                  {t('categoryLabel')} {categoryDisplayName} {activeCategory.icon}
                </span>
                <span className="text-gray-400 text-[10px]">•</span>
                <ConnectionStatusBadge isOnline={isOnline} />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Language Switcher */}
            <button
              onClick={toggleLanguage}
              className="bg-white hover:bg-gray-100 text-black border-2 border-black px-2 py-0.5 rounded-lg text-xs font-black shadow-brutal-sm active:translate-x-[1px] active:translate-y-[1px] transition-all flex items-center gap-1"
              title={language === 'ar' ? 'Switch to English' : 'التحويل للعربية'}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>{language === 'ar' ? 'EN' : 'عربي'}</span>
            </button>

            {/* Sound Mute/Unmute Toggle */}
            <button
              onClick={handleToggleSound}
              className="bg-white hover:bg-gray-100 text-black border-2 border-black p-1 rounded-lg text-xs font-black shadow-brutal-sm active:translate-x-[1px] active:translate-y-[1px] transition-all flex items-center justify-center"
              title={isMuted ? t('soundUnmuted') : t('soundMuted')}
            >
              {isMuted ? (
                <VolumeX className="w-3.5 h-3.5 text-gray-400" />
              ) : (
                <Volume2 className="w-3.5 h-3.5 text-black" />
              )}
            </button>

            {/* VIP Status or Unlock Button */}
            {isVip ? (
              <span className="bg-brand-yellow text-black text-[10px] font-black px-2 py-0.5 rounded-full border-2 border-black shadow-brutal-sm flex items-center gap-1 animate-pulse">
                <Sparkles className="w-3 h-3 fill-yellow-500" />
                <span>{t('vipActive')}</span>
              </span>
            ) : (
              <button
                onClick={() => setIsPaywallOpen(true)}
                className="bg-brand-yellow hover:bg-[#ffe175] text-black text-[10px] font-black px-2 py-0.5 rounded-full border-2 border-black shadow-brutal-sm active:translate-x-[1px] active:translate-y-[1px] transition-all flex items-center gap-1"
                title={t('unlockVipBtn')}
              >
                <span>{t('unlockVipBtn')}</span>
              </button>
            )}

            {/* Room Code Badge */}
            <div className="bg-white px-2 py-0.5 rounded-full border-2 border-black text-[11px] font-black shadow-brutal-sm">
              <span className="font-mono text-brand-purple">{roomState.roomCode}</span>
            </div>

            {/* Leave Room Button */}
            <button
              onClick={leaveRoom}
              className="p-1.5 text-gray-500 hover:text-red-600 rounded-lg transition-colors"
              title={t('leaveRoom')}
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Phase Viewport */}
        <div className="flex-1 flex flex-col justify-center my-auto">
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

      {/* Persistent Character Stage (Bottom Dock - Real Connected Players Only) */}
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
