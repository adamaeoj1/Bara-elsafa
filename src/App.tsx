import React, { useState, useEffect } from 'react';
import { useGameEngine } from './hooks/useGameEngine';
import { WelcomeScreen } from './components/WelcomeScreen';
import { CharacterStage } from './components/CharacterStage';
import { PaywallModal } from './components/PaywallModal';
import { QrCodeModal } from './components/QrCodeModal';
import { LiveReactionsBar } from './components/LiveReactionsBar';
import { LobbyPhase } from './components/phases/LobbyPhase';
import { RoleRevealPhase } from './components/phases/RoleRevealPhase';
import { QuestionsPhase } from './components/phases/QuestionsPhase';
import { VotingPhase } from './components/phases/VotingPhase';
import { LastChancePhase } from './components/phases/LastChancePhase';
import { GameOverPhase } from './components/phases/GameOverPhase';
import { MafiaRoleRevealPhase } from './components/phases/MafiaRoleRevealPhase';
import { MafiaNightPhase } from './components/phases/MafiaNightPhase';
import { MafiaMorningPhase } from './components/phases/MafiaMorningPhase';
import { MafiaVotingPhase } from './components/phases/MafiaVotingPhase';
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
    activeReactions,
    sendReaction,
    updateProfile,
    createRoom,
    joinRoom,
    leaveRoom,
    kickPlayer,
    setCategory,
    setGameMode,
    resetScores,
    updateSettings,
    updateCustomCategory,
    activateVipRoom,
    // Out of the loop controls
    startGame,
    startQuestions,
    nextQuestionPair,
    submitVote,
    resolveVotingRound,
    submitImpostorGuess,
    playAgain,
    backToLobby,
    // Mafia controls
    startMafiaGame,
    startMafiaNight,
    submitMafiaNightAction,
    resolveMafiaNight,
    startMafiaVoting,
    submitMafiaVote,
    resolveMafiaVotingRound,
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

  const activeCategory =
    CATEGORIES.find((c) => c.id === roomState.selectedCategoryId) || CATEGORIES[0];
  const currentPair = roomState.questionPairs[roomState.currentPairIndex];
  const isVip = roomState.isPremiumRoom || isLocallyVip;

  const categoryDisplayName =
    language === 'en'
      ? roomState.customCategory?.title || roomState.customCategory?.name || activeCategory.nameEn
      : roomState.customCategory?.title || roomState.customCategory?.name || activeCategory.nameAr;

  // 1. If not currently in an active room, render Welcome / Onboarding Screen
  if (!isInRoom) {
    return (
      <div
        className={`min-h-screen w-full bg-[#F7F4EB] text-black select-none ${
          language === 'en' ? 'font-jakarta' : 'font-cairo'
        }`}
      >
        {kickedNotice && (
          <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 bg-red-500 text-white font-black text-xs px-4 py-2 rounded-xl border-2 border-black shadow-brutal animate-bounce">
            ⚠️ {kickedNotice}
          </div>
        )}
        <div className="max-w-2xl mx-auto min-h-screen px-4 py-4 flex flex-col justify-between">
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
      </div>
    );
  }

  // Determine if theme should be dark night (for Mafia Night phase)
  const isDarkNight = roomState.phase === 'MAFIA_NIGHT';

  // Determine if Live Reactions Bar should show
  const showReactionsBar =
    roomState.phase === 'QUESTIONS' ||
    roomState.phase === 'VOTING' ||
    roomState.phase === 'GAME_OVER' ||
    roomState.phase === 'MAFIA_MORNING_DISCUSSION' ||
    roomState.phase === 'MAFIA_VOTING';

  // 2. Active Game Screen (Full-screen warm cream #F7F4EB, responsive max-w-2xl container, NO fake phone frame)
  return (
    <div
      className={`min-h-screen w-full transition-colors duration-500 select-none ${
        isDarkNight ? 'bg-[#161324] text-white' : 'bg-[#F7F4EB] text-black'
      } ${language === 'en' ? 'font-jakarta' : 'font-cairo'}`}
    >
      <div className="max-w-2xl mx-auto min-h-screen px-4 py-4 flex flex-col justify-between relative">
        {/* Top Header */}
        <header
          className={`h-14 px-4 rounded-2xl border-2 border-black shadow-[3px_3px_0px_0px_#000] flex items-center justify-between shrink-0 sticky top-3 z-40 transition-colors ${
            isDarkNight
              ? 'bg-[#1E1B2E] border-white/30 text-white'
              : 'bg-white text-black'
          }`}
        >
          {/* Brand Side (Start) */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-brand-yellow border-2 border-black shadow-brutal-sm flex items-center justify-center font-black text-base shrink-0 text-black">
              {roomState.gameMode === 'MAFIA' ? '🕵️‍♂️' : '🎭'}
            </div>
            <span
              className={`text-base sm:text-lg font-black tracking-tight leading-none whitespace-nowrap ${
                isDarkNight ? 'text-white' : 'text-black'
              }`}
            >
              {t('appTitle')}
            </span>
          </div>

          {/* Controls Side (End) */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* 1. VIP / Pro Button */}
            <button
              onClick={() => setIsPaywallOpen(true)}
              className="h-9 px-2.5 rounded-lg border-2 border-black bg-brand-yellow hover:bg-[#ffe175] shadow-brutal-sm flex items-center gap-1 font-black text-xs text-black active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer whitespace-nowrap"
              title={isVip ? t('vipActive') : t('proUpgradeBtn')}
            >
              <span>{isVip ? t('vipActive') : t('proUpgradeBtn')}</span>
            </button>

            {/* 2. Audio Mute/Unmute Button */}
            <button
              onClick={handleToggleSound}
              className="w-9 h-9 rounded-lg border-2 border-black bg-white hover:bg-gray-100 shadow-brutal-sm flex items-center justify-center text-black active:translate-x-[1px] active:translate-y-[1px] transition-all shrink-0 cursor-pointer"
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
              className="px-3 h-9 rounded-lg border-2 border-black bg-white hover:bg-gray-100 shadow-brutal-sm flex items-center justify-center font-black text-xs text-black active:translate-x-[1px] active:translate-y-[1px] transition-all shrink-0 cursor-pointer whitespace-nowrap"
              title={language === 'ar' ? 'Switch to English' : 'التحويل للعربية'}
            >
              <span>{t('langToggle')}</span>
            </button>
          </div>
        </header>

        {/* Main Viewport Container (No internal nested scrollbar!) */}
        <main className="flex-1 w-full py-4 flex flex-col justify-start">
          <div className="flex-1 flex flex-col justify-start w-full">
            {/* LOBBY PHASE */}
            {roomState.phase === 'LOBBY' && (
              <LobbyPhase
                roomCode={roomState.roomCode}
                gameMode={roomState.gameMode || 'OUT_OF_THE_LOOP'}
                players={roomState.players}
                activePlayerId={activePlayerId}
                selectedCategoryId={roomState.selectedCategoryId}
                isHost={isHost}
                isPremiumRoom={isVip}
                settings={
                  roomState.settings || {
                    timer: 25,
                    timerDuration: 25,
                    impostorCount: 'auto',
                    impostorCategoryHint: true,
                  }
                }
                customCategory={roomState.customCategory}
                onSelectGameMode={setGameMode}
                onSelectCategory={setCategory}
                onOpenLockedCategory={() => setIsPaywallOpen(true)}
                onStartGame={roomState.gameMode === 'MAFIA' ? startMafiaGame : startGame}
                onKickPlayer={kickPlayer}
                onLeaveRoom={leaveRoom}
                onOpenQrModal={() => setIsQrModalOpen(true)}
                onUpdateSettings={updateSettings}
                onUpdateCustomCategory={updateCustomCategory}
                onResetScores={resetScores}
              />
            )}

            {/* ========================================= */}
            {/* MODE 1: OUT OF THE LOOP PHASES */}
            {/* ========================================= */}
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
                maxDuration={roomState.settings?.timer ?? roomState.settings?.timerDuration ?? 25}
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
                isHost={isHost}
                onSubmitVote={submitVote}
                onForceResolve={resolveVotingRound}
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

            {/* ========================================= */}
            {/* MODE 2: MAFIA PHASES */}
            {/* ========================================= */}
            {roomState.phase === 'MAFIA_ROLE_REVEAL' && activePlayer && (
              <MafiaRoleRevealPhase
                player={activePlayer}
                players={roomState.players}
                isHost={isHost}
                onStartNight={startMafiaNight}
              />
            )}

            {roomState.phase === 'MAFIA_NIGHT' && activePlayer && (
              <MafiaNightPhase
                player={activePlayer}
                players={roomState.players}
                turnStartedAt={roomState.turnStartedAt}
                isHost={isHost}
                onSubmitAction={submitMafiaNightAction}
                onResolveNight={resolveMafiaNight}
              />
            )}

            {roomState.phase === 'MAFIA_MORNING_DISCUSSION' && activePlayer && (
              <MafiaMorningPhase
                player={activePlayer}
                players={roomState.players}
                killedPlayerId={roomState.mafiaNightKilledPlayerId}
                saved={roomState.mafiaNightSaved}
                turnStartedAt={roomState.turnStartedAt}
                isHost={isHost}
                onGoToVoting={startMafiaVoting}
              />
            )}

            {roomState.phase === 'MAFIA_VOTING' && activePlayer && (
              <MafiaVotingPhase
                player={activePlayer}
                players={roomState.players}
                votes={roomState.votes}
                votingRevealed={roomState.votingRevealed}
                exiledPlayerId={roomState.mafiaExiledPlayerId}
                isHost={isHost}
                onSubmitVote={submitMafiaVote}
                onForceResolve={resolveMafiaVotingRound}
                onStartNextNight={startMafiaNight}
              />
            )}

            {/* ========================================= */}
            {/* UNIFIED GAME OVER PHASE (Both Modes) */}
            {/* ========================================= */}
            {roomState.phase === 'GAME_OVER' && (
              <GameOverPhase
                winner={roomState.winner}
                winReason={roomState.winReason}
                secretWord={roomState.secretWord}
                impostorGuess={roomState.impostorGuess}
                players={roomState.players}
                caughtImpostorId={roomState.caughtImpostorId}
                gameMode={roomState.gameMode}
                isHost={isHost}
                onPlayAgain={roomState.gameMode === 'MAFIA' ? startMafiaGame : playAgain}
                onBackToLobby={backToLobby}
              />
            )}
          </div>
        </main>

        {/* Bottom Dock: Reactions + Character Stage */}
        <div className="w-full flex flex-col gap-2 mt-2">
          {showReactionsBar && (
            <LiveReactionsBar
              onSendReaction={sendReaction}
              activeReactions={activeReactions}
              players={roomState.players}
            />
          )}

          <CharacterStage
            players={roomState.players}
            activePlayerId={activePlayerId}
            phase={roomState.phase}
            currentPair={currentPair}
            caughtImpostorId={roomState.caughtImpostorId}
            winner={roomState.winner}
            votes={roomState.votes}
          />
        </div>

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
    </div>
  );
}

export default App;
