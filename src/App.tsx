import React, { useState, useEffect } from 'react';
import { useGameEngine } from './hooks/useGameEngine';
import { DevToolbar } from './components/DevToolbar';
import { CharacterStage } from './components/CharacterStage';
import { LockedCategoryModal } from './components/LockedCategoryModal';
import { LobbyPhase } from './components/phases/LobbyPhase';
import { RoleRevealPhase } from './components/phases/RoleRevealPhase';
import { QuestionsPhase } from './components/phases/QuestionsPhase';
import { VotingPhase } from './components/phases/VotingPhase';
import { LastChancePhase } from './components/phases/LastChancePhase';
import { GameOverPhase } from './components/phases/GameOverPhase';
import { CATEGORIES } from './data/categories';
import { Sparkles, HelpCircle } from 'lucide-react';

export function App() {
  const {
    roomState,
    activePlayerId,
    activePlayer,
    isHost,
    setActivePlayerId,
    createRoom,
    joinRoom,
    setCategory,
    setupPreset,
    startGame,
    startQuestions,
    nextQuestionPair,
    submitVote,
    submitImpostorGuess,
    playAgain,
    backToLobby,
    autoVoteAll,
    runSelfTest,
  } = useGameEngine();

  const [isLockedModalOpen, setIsLockedModalOpen] = useState(false);

  // Initialize with 4 players preset on first load if room is empty
  useEffect(() => {
    if (roomState.players.length === 0) {
      setupPreset(4);
    }
  }, []);

  const activeCategory = CATEGORIES.find((c) => c.id === roomState.selectedCategoryId) || CATEGORIES[0];
  const currentPair = roomState.questionPairs[roomState.currentPairIndex];

  return (
    <div className="min-h-screen bg-[#F7F4EB] flex flex-col justify-between text-black font-cairo">
      {/* 1. Top Developer Switcher & E2E Automated Runner */}
      <DevToolbar
        players={roomState.players}
        activePlayerId={activePlayerId}
        currentPhase={roomState.phase}
        onSelectPlayer={setActivePlayerId}
        onAutoVoteAll={autoVoteAll}
        onRunTest={runSelfTest}
      />

      {/* 2. Main Mobile Screen Viewport */}
      <main className="flex-1 flex flex-col justify-between max-w-md w-full mx-auto px-4 py-4">
        {/* App Title & Status Bar */}
        <header className="flex items-center justify-between mb-4 border-b-2 border-black/10 pb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand-yellow border-2 border-black shadow-brutal-sm flex items-center justify-center font-black text-sm">
              🎭
            </div>
            <div>
              <h1 className="text-base font-black tracking-tight leading-none text-black">
                شوتايم <span className="text-brand-purple">| برا السالفة</span>
              </h1>
              <span className="text-[10px] font-bold text-gray-500">
                الفئة: {activeCategory.name} {activeCategory.icon}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="bg-white px-2.5 py-1 rounded-full border-2 border-black text-[11px] font-black shadow-brutal-sm flex items-center gap-1">
              <span className="text-gray-500 font-bold">غرفة:</span>
              <span className="font-mono text-brand-purple">{roomState.roomCode}</span>
            </div>
          </div>
        </header>

        {/* 3. Dynamic Phase Views */}
        <div className="flex-1 flex flex-col justify-center my-auto">
          {roomState.phase === 'LOBBY' && (
            <LobbyPhase
              roomCode={roomState.roomCode}
              players={roomState.players}
              activePlayerId={activePlayerId}
              selectedCategoryId={roomState.selectedCategoryId}
              isHost={isHost}
              onSelectCategory={setCategory}
              onOpenLockedCategory={() => setIsLockedModalOpen(true)}
              onStartGame={startGame}
              onQuickPreset={setupPreset}
              onCreateRoom={createRoom}
              onJoinRoom={joinRoom}
            />
          )}

          {roomState.phase === 'ROLE_REVEAL' && activePlayer && (
            <RoleRevealPhase
              player={activePlayer}
              players={roomState.players}
              secretWord={roomState.secretWord}
              isHost={isHost}
              onStartQuestions={startQuestions}
            />
          )}

          {roomState.phase === 'QUESTIONS' && (
            <QuestionsPhase
              currentPair={currentPair}
              pairIndex={roomState.currentPairIndex}
              totalPairs={roomState.questionPairs.length}
              timeLeft={roomState.questionTimeRemaining}
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
              onAutoVoteRemaining={autoVoteAll}
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

      {/* 4. Persistent Character Stage (Bottom Dock) */}
      <CharacterStage
        players={roomState.players}
        activePlayerId={activePlayerId}
        phase={roomState.phase}
        currentPair={currentPair}
        caughtImpostorId={roomState.caughtImpostorId}
        winner={roomState.winner}
        onSelectPlayer={setActivePlayerId}
      />

      {/* 5. Neo-Brutalist Locked Category Modal */}
      <LockedCategoryModal
        isOpen={isLockedModalOpen}
        onClose={() => setIsLockedModalOpen(false)}
        onSubscribe={() => {
          alert('شكراً لاهتمامك! تم إرسال طلب الاشتراك بنجاح 🎉');
        }}
      />
    </div>
  );
}

export default App;
