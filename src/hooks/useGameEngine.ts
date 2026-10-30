import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  RoomState, 
  Player, 
  GamePhase, 
  QuestionPair, 
  PlayerColor, 
  SyncMessage,
  UserProfile
} from '../types/game';
import { CATEGORIES, DEFAULT_CATEGORY_ID, PLAYER_COLORS } from '../data/categories';
import { RealtimeSyncEngine } from '../services/syncEngine';
import { 
  createRoomInDb, 
  fetchRoomDataFromDb, 
  joinRoomInDb, 
  removePlayerFromDb, 
  updateRoomInDb, 
  updatePlayersBatchInDb, 
  subscribeToRoomRealtime,
  mapDbRoomToRoomState,
  isSupabaseConfigured
} from '../services/supabaseService';

// Helper to generate UUID
function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'usr_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now();
}

// Load or initialize user profile from localStorage
function loadStoredProfile(): UserProfile {
  if (typeof window === 'undefined') {
    return { id: 'p_temp', name: '', color: PLAYER_COLORS[0].hex };
  }
  try {
    const raw = localStorage.getItem('showtime_user_profile');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.id) return parsed;
    }
  } catch (e) {
    // ignore
  }

  const newProfile: UserProfile = {
    id: generateUUID(),
    name: '',
    color: PLAYER_COLORS[0].hex,
  };
  try {
    localStorage.setItem('showtime_user_profile', JSON.stringify(newProfile));
  } catch (e) {}
  return newProfile;
}

const EMPTY_ROOM_STATE: RoomState = {
  roomCode: '',
  phase: 'LOBBY',
  players: [],
  selectedCategoryId: DEFAULT_CATEGORY_ID,
  secretWord: '',
  currentPairIndex: 0,
  questionPairs: [],
  questionTimeRemaining: 25,
  turnStartedAt: null,
  votes: {},
  votingRevealed: false,
  caughtImpostorId: null,
  lastChanceOptions: [],
  impostorGuess: null,
  winner: null,
  winReason: null,
  roundNumber: 1,
  isPremiumRoom: false,
};

export function useGameEngine() {
  const [profile, setProfile] = useState<UserProfile>(loadStoredProfile);
  const [isInRoom, setIsInRoom] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [roomState, setRoomState] = useState<RoomState>(EMPTY_ROOM_STATE);
  const [kickedNotice, setKickedNotice] = useState<string | null>(null);

  const syncEngineRef = useRef<RealtimeSyncEngine | null>(null);
  const realtimeUnsubRef = useRef<(() => void) | null>(null);

  // Update profile
  const updateProfile = useCallback((updates: Partial<UserProfile>) => {
    setProfile((prev) => {
      const next = { ...prev, ...updates };
      try {
        localStorage.setItem('showtime_user_profile', JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  }, []);

  const activePlayer = roomState.players.find((p) => p.id === profile.id);
  const isHost = activePlayer?.isHost ?? false;

  // Refresh room from DB
  const refreshRoomFromDb = useCallback(async (code: string) => {
    if (!code) return;
    const data = await fetchRoomDataFromDb(code);
    if (!data) return;

    setRoomState((prev) => {
      const mapped = mapDbRoomToRoomState(data.room, data.players);
      // Map votes
      const votes: Record<string, string> = {};
      data.players.forEach((p) => {
        if (p.hasVoted && p.votedTargetId) {
          votes[p.id] = p.votedTargetId;
        }
      });
      mapped.votes = votes;

      // Check if current user was kicked
      const amStillIn = data.players.some((p) => p.id === profile.id);
      if (!amStillIn && isInRoom) {
        setIsInRoom(false);
        setKickedNotice('لقد تم طردك من الغرفة من قِبل المضيف');
        try {
          localStorage.removeItem('showtime_active_room');
        } catch (e) {}
      }

      return mapped;
    });
  }, [profile.id, isInRoom]);

  // Connect Realtime Subscriptions
  const bindRealtime = useCallback((code: string) => {
    // 1. Cleanup previous
    if (realtimeUnsubRef.current) {
      realtimeUnsubRef.current();
      realtimeUnsubRef.current = null;
    }
    if (syncEngineRef.current) {
      syncEngineRef.current.cleanup();
      syncEngineRef.current = null;
    }

    // 2. Local fallback sync engine (broadcast channel & storage)
    const engine = new RealtimeSyncEngine(code);
    syncEngineRef.current = engine;
    engine.subscribe((msg: SyncMessage) => {
      if (msg.type === 'PLAYER_KICKED' && msg.payload?.playerId === profile.id) {
        leaveRoom();
        setKickedNotice('لقد تم طردك من الغرفة من قِبل المضيف');
      } else if (msg.type === 'ROOM_STATE_SYNC' && msg.payload) {
        setRoomState(msg.payload as RoomState);
      }
    });

    // 3. Supabase Realtime Postgres Changes
    const unsub = subscribeToRoomRealtime(
      code,
      (newRoom) => {
        setRoomState((prev) => {
          return {
            ...prev,
            phase: (newRoom.phase as GamePhase) || prev.phase,
            selectedCategoryId: newRoom.selected_category_id || prev.selectedCategoryId,
            secretWord: newRoom.secret_word || prev.secretWord,
            currentPairIndex: newRoom.current_pair_index ?? prev.currentPairIndex,
            questionPairs: Array.isArray(newRoom.question_pairs) ? newRoom.question_pairs : prev.questionPairs,
            turnStartedAt: newRoom.turn_started_at,
            votingRevealed: Boolean(newRoom.voting_revealed),
            caughtImpostorId: newRoom.caught_impostor_id || null,
            lastChanceOptions: Array.isArray(newRoom.last_chance_options) ? newRoom.last_chance_options : prev.lastChanceOptions,
            impostorGuess: newRoom.impostor_guess || null,
            winner: newRoom.winner || null,
            winReason: newRoom.win_reason || null,
            roundNumber: newRoom.round_number || prev.roundNumber,
            isPremiumRoom: Boolean(newRoom.is_premium_room),
          };
        });
      },
      () => {
        // Players updated -> refresh players list
        refreshRoomFromDb(code);
      }
    );
    realtimeUnsubRef.current = unsub;
  }, [profile.id, refreshRoomFromDb]);

  // Attempt auto-reconnect on mount
  useEffect(() => {
    const attemptReconnect = async () => {
      let codeToRestore = '';
      try {
        codeToRestore = localStorage.getItem('showtime_active_room') || '';
      } catch (e) {}

      if (!codeToRestore) return;

      const data = await fetchRoomDataFromDb(codeToRestore);
      if (data) {
        const amIn = data.players.some((p) => p.id === profile.id);
        if (amIn) {
          const mapped = mapDbRoomToRoomState(data.room, data.players);
          const votes: Record<string, string> = {};
          data.players.forEach((p) => {
            if (p.hasVoted && p.votedTargetId) votes[p.id] = p.votedTargetId;
          });
          mapped.votes = votes;
          setRoomState(mapped);
          setIsInRoom(true);
          bindRealtime(codeToRestore);
        } else {
          try {
            localStorage.removeItem('showtime_active_room');
          } catch (e) {}
        }
      }
    };

    attemptReconnect();

    return () => {
      if (realtimeUnsubRef.current) realtimeUnsubRef.current();
      if (syncEngineRef.current) syncEngineRef.current.cleanup();
    };
  }, []);

  // Broadcast helper
  const broadcastRoomState = useCallback((state: RoomState) => {
    setRoomState(state);
    if (syncEngineRef.current) {
      syncEngineRef.current.broadcast({
        type: 'ROOM_STATE_SYNC',
        roomCode: state.roomCode,
        senderId: profile.id,
        timestamp: Date.now(),
        payload: state,
      });
      syncEngineRef.current.saveRoomState(state);
    }
  }, [profile.id]);

  // 1. Create Room
  const createRoom = useCallback(async (hostName: string, hostColor: PlayerColor) => {
    setIsConnecting(true);
    setKickedNotice(null);
    const code = Math.floor(1000 + Math.random() * 9000).toString();

    const hostPlayer: Player = {
      id: profile.id,
      name: hostName.trim() || 'المضيف',
      color: hostColor,
      isHost: true,
      isImpostor: false,
    };

    const initialRoom: RoomState = {
      ...EMPTY_ROOM_STATE,
      roomCode: code,
      players: [hostPlayer],
    };

    // Save locally
    updateProfile({ name: hostName.trim(), color: hostColor });
    try {
      localStorage.setItem('showtime_active_room', code);
    } catch (e) {}

    // Save in Supabase
    if (isSupabaseConfigured()) {
      await createRoomInDb(code, hostPlayer, DEFAULT_CATEGORY_ID);
    }

    setRoomState(initialRoom);
    setIsInRoom(true);
    bindRealtime(code);
    setIsConnecting(false);
  }, [profile.id, updateProfile, bindRealtime]);

  // 2. Join Room
  const joinRoom = useCallback(async (code: string, playerName: string, playerColor: PlayerColor) => {
    setIsConnecting(true);
    setKickedNotice(null);

    const cleanCode = code.trim();
    const newPlayer: Player = {
      id: profile.id,
      name: playerName.trim() || 'لاعب',
      color: playerColor,
      isHost: false,
      isImpostor: false,
    };

    updateProfile({ name: playerName.trim(), color: playerColor });

    if (isSupabaseConfigured()) {
      const res = await joinRoomInDb(cleanCode, newPlayer);
      if (!res.success) {
        setIsConnecting(false);
        return { success: false, error: res.error };
      }

      const roomData = await fetchRoomDataFromDb(cleanCode);
      if (roomData) {
        const mapped = mapDbRoomToRoomState(roomData.room, roomData.players);
        setRoomState(mapped);
      }
    } else {
      // Local fallback
      setRoomState((prev) => ({
        ...prev,
        roomCode: cleanCode,
        players: [...prev.players.filter((p) => p.id !== newPlayer.id), newPlayer],
      }));
    }

    try {
      localStorage.setItem('showtime_active_room', cleanCode);
    } catch (e) {}

    setIsInRoom(true);
    bindRealtime(cleanCode);
    setIsConnecting(false);
    return { success: true };
  }, [profile.id, updateProfile, bindRealtime]);

  // 3. Leave Room
  const leaveRoom = useCallback(async () => {
    if (roomState.roomCode) {
      if (isSupabaseConfigured()) {
        await removePlayerFromDb(roomState.roomCode, profile.id);
      }
    }
    if (realtimeUnsubRef.current) {
      realtimeUnsubRef.current();
      realtimeUnsubRef.current = null;
    }
    if (syncEngineRef.current) {
      syncEngineRef.current.cleanup();
      syncEngineRef.current = null;
    }

    try {
      localStorage.removeItem('showtime_active_room');
    } catch (e) {}

    setIsInRoom(false);
    setRoomState(EMPTY_ROOM_STATE);
  }, [roomState.roomCode, profile.id]);

  // 4. Kick Player (Host Only)
  const kickPlayer = useCallback(async (playerId: string) => {
    if (!isHost || !roomState.roomCode) return;

    if (isSupabaseConfigured()) {
      await removePlayerFromDb(roomState.roomCode, playerId);
    }

    // Broadcast kick message so kicked client disconnects immediately
    if (syncEngineRef.current) {
      syncEngineRef.current.broadcast({
        type: 'PLAYER_KICKED',
        roomCode: roomState.roomCode,
        senderId: profile.id,
        timestamp: Date.now(),
        payload: { playerId },
      });
    }

    setRoomState((prev) => ({
      ...prev,
      players: prev.players.filter((p) => p.id !== playerId),
    }));
  }, [isHost, roomState.roomCode, profile.id]);

  // 5. Select Category (Host Only)
  const setCategory = useCallback(async (categoryId: string) => {
    if (!isHost || !roomState.roomCode) return;

    if (isSupabaseConfigured()) {
      await updateRoomInDb(roomState.roomCode, { selected_category_id: categoryId });
    }

    const next = { ...roomState, selectedCategoryId: categoryId };
    broadcastRoomState(next);
  }, [isHost, roomState, broadcastRoomState]);

  // 6. Activate VIP / Premium Room
  const activateVipRoom = useCallback(async () => {
    if (!roomState.roomCode) return;

    if (isSupabaseConfigured()) {
      await updateRoomInDb(roomState.roomCode, { is_premium_room: true });
    }

    const next = { ...roomState, isPremiumRoom: true };
    broadcastRoomState(next);
  }, [roomState, broadcastRoomState]);

  // Helper: Generate randomized question pairs
  const generateQuestionPairs = (players: Player[]): QuestionPair[] => {
    const pairs: QuestionPair[] = [];
    const n = players.length;
    if (n < 2) return [];

    const shuffledAskOrder = [...players].sort(() => Math.random() - 0.5);

    shuffledAskOrder.forEach((asker, index) => {
      const offset = 1 + Math.floor(Math.random() * (n - 1));
      const answererIndex = (index + offset) % n;
      const answerer = shuffledAskOrder[answererIndex];
      pairs.push({
        askerId: asker.id,
        answererId: answerer.id,
      });
    });

    return pairs;
  };

  // 7. Start Game (Host Only)
  const startGame = useCallback(async () => {
    if (!isHost || roomState.players.length < 3) return;

    const currentCategory = CATEGORIES.find((c) => c.id === roomState.selectedCategoryId) || CATEGORIES[0];
    const secretWord = currentCategory.words[Math.floor(Math.random() * currentCategory.words.length)];

    const playerCount = roomState.players.length;
    const impostorCount = playerCount >= 7 ? 2 : 1;

    const indices = Array.from({ length: playerCount }, (_, i) => i).sort(() => Math.random() - 0.5);
    const impostorIndices = new Set(indices.slice(0, impostorCount));

    const impostorIds: string[] = [];
    roomState.players.forEach((p, idx) => {
      if (impostorIndices.has(idx)) impostorIds.push(p.id);
    });

    const updatedPlayers: Player[] = roomState.players.map((p, idx) => {
      const isImp = impostorIndices.has(idx);
      let partnerId: string | undefined = undefined;
      if (isImp && impostorCount > 1) {
        partnerId = impostorIds.find((id) => id !== p.id);
      }
      return {
        ...p,
        isImpostor: isImp,
        impostorPartnerId: partnerId,
        hasVoted: false,
        votedTargetId: undefined,
      };
    });

    const pairs = generateQuestionPairs(updatedPlayers);

    if (isSupabaseConfigured()) {
      await updatePlayersBatchInDb(updatedPlayers);
      await updateRoomInDb(roomState.roomCode, {
        phase: 'ROLE_REVEAL',
        secret_word: secretWord,
        question_pairs: pairs,
        current_pair_index: 0,
        turn_started_at: null,
        voting_revealed: false,
        caught_impostor_id: null,
        last_chance_options: [],
        impostor_guess: null,
        winner: null,
        win_reason: null,
      });
    }

    const newState: RoomState = {
      ...roomState,
      phase: 'ROLE_REVEAL',
      secretWord,
      players: updatedPlayers,
      questionPairs: pairs,
      currentPairIndex: 0,
      turnStartedAt: null,
      votes: {},
      votingRevealed: false,
      caughtImpostorId: null,
      lastChanceOptions: [],
      impostorGuess: null,
      winner: null,
      winReason: null,
    };

    broadcastRoomState(newState);
  }, [isHost, roomState, broadcastRoomState]);

  // 8. Start Questions (Host Only)
  const startQuestions = useCallback(async () => {
    if (!isHost) return;

    const turnStartedAt = new Date().toISOString();

    if (isSupabaseConfigured()) {
      await updateRoomInDb(roomState.roomCode, {
        phase: 'QUESTIONS',
        current_pair_index: 0,
        turn_started_at: turnStartedAt,
      });
    }

    const newState: RoomState = {
      ...roomState,
      phase: 'QUESTIONS',
      currentPairIndex: 0,
      turnStartedAt,
      questionTimeRemaining: 25,
    };
    broadcastRoomState(newState);
  }, [isHost, roomState, broadcastRoomState]);

  // 9. Next Question Pair (Host Only)
  const nextQuestionPair = useCallback(async () => {
    if (!isHost) return;

    const nextIndex = roomState.currentPairIndex + 1;
    if (nextIndex < roomState.questionPairs.length) {
      const turnStartedAt = new Date().toISOString();

      if (isSupabaseConfigured()) {
        await updateRoomInDb(roomState.roomCode, {
          current_pair_index: nextIndex,
          turn_started_at: turnStartedAt,
        });
      }

      const newState: RoomState = {
        ...roomState,
        currentPairIndex: nextIndex,
        turnStartedAt,
        questionTimeRemaining: 25,
      };
      broadcastRoomState(newState);
    } else {
      // Transition to VOTING
      const resetPlayers = roomState.players.map((p) => ({
        ...p,
        hasVoted: false,
        votedTargetId: undefined,
      }));

      if (isSupabaseConfigured()) {
        await updatePlayersBatchInDb(resetPlayers);
        await updateRoomInDb(roomState.roomCode, {
          phase: 'VOTING',
          turn_started_at: null,
          voting_revealed: false,
        });
      }

      const votingState: RoomState = {
        ...roomState,
        phase: 'VOTING',
        votes: {},
        votingRevealed: false,
        turnStartedAt: null,
        players: resetPlayers,
      };
      broadcastRoomState(votingState);
    }
  }, [isHost, roomState, broadcastRoomState]);

  // Helper: Generate 8 word options for Last Chance
  const generateLastChanceOptions = (secretWord: string, categoryId: string): string[] => {
    const cat = CATEGORIES.find((c) => c.id === categoryId) || CATEGORIES[0];
    const decoys = cat.words.filter((w) => w !== secretWord);
    const shuffledDecoys = [...decoys].sort(() => Math.random() - 0.5).slice(0, 7);
    return [secretWord, ...shuffledDecoys].sort(() => Math.random() - 0.5);
  };

  // 10. Submit Vote
  const submitVote = useCallback(async (voterId: string, targetId: string) => {
    if (voterId === targetId) return;

    const nextVotes = { ...roomState.votes, [voterId]: targetId };
    const updatedPlayers = roomState.players.map((p) =>
      p.id === voterId ? { ...p, hasVoted: true, votedTargetId: targetId } : p
    );

    const allVoted = updatedPlayers.every((p) => Boolean(nextVotes[p.id]));

    if (!allVoted) {
      // Partial vote
      if (isSupabaseConfigured()) {
        await updatePlayersBatchInDb([
          { ...updatedPlayers.find((p) => p.id === voterId)!, hasVoted: true, votedTargetId: targetId },
        ]);
      }

      const intermediateState: RoomState = {
        ...roomState,
        votes: nextVotes,
        players: updatedPlayers,
      };
      broadcastRoomState(intermediateState);
      return;
    }

    // All players have voted! Reveal and resolve catch condition
    const voteCounts: Record<string, number> = {};
    Object.values(nextVotes).forEach((tid) => {
      voteCounts[tid] = (voteCounts[tid] || 0) + 1;
    });

    let maxVotes = 0;
    Object.values(voteCounts).forEach((c) => {
      if (c > maxVotes) maxVotes = c;
    });

    const tiedTargetIds = Object.keys(voteCounts).filter((id) => voteCounts[id] === maxVotes);
    const tiedImpostors = roomState.players.filter((p) => tiedTargetIds.includes(p.id) && p.isImpostor);

    if (tiedImpostors.length > 0) {
      // Caught Condition: At least one Impostor caught!
      const caughtImpostor = tiedImpostors[0];
      const lastChanceOptions = generateLastChanceOptions(roomState.secretWord, roomState.selectedCategoryId);

      if (isSupabaseConfigured()) {
        await updatePlayersBatchInDb(updatedPlayers);
        await updateRoomInDb(roomState.roomCode, {
          phase: 'LAST_CHANCE',
          voting_revealed: true,
          caught_impostor_id: caughtImpostor.id,
          last_chance_options: lastChanceOptions,
        });
      }

      const lastChanceState: RoomState = {
        ...roomState,
        votes: nextVotes,
        players: updatedPlayers,
        votingRevealed: true,
        phase: 'LAST_CHANCE',
        caughtImpostorId: caughtImpostor.id,
        lastChanceOptions,
      };
      broadcastRoomState(lastChanceState);
    } else {
      // Escaped Condition: Civilians voted on innocent player -> Impostors Win!
      if (isSupabaseConfigured()) {
        await updatePlayersBatchInDb(updatedPlayers);
        await updateRoomInDb(roomState.roomCode, {
          phase: 'GAME_OVER',
          voting_revealed: true,
          winner: 'IMPOSTOR',
          win_reason: 'ESCAPED',
          caught_impostor_id: null,
        });
      }

      const gameOverState: RoomState = {
        ...roomState,
        votes: nextVotes,
        players: updatedPlayers,
        votingRevealed: true,
        phase: 'GAME_OVER',
        winner: 'IMPOSTOR',
        winReason: 'ESCAPED',
        caughtImpostorId: null,
      };
      broadcastRoomState(gameOverState);
    }
  }, [roomState, broadcastRoomState]);

  // 11. Impostor Guess in LAST_CHANCE
  const submitImpostorGuess = useCallback(async (guess: string) => {
    if (roomState.phase !== 'LAST_CHANCE') return;

    const isCorrect = guess === roomState.secretWord;
    const winner: 'IMPOSTOR' | 'CIVILIANS' = isCorrect ? 'IMPOSTOR' : 'CIVILIANS';
    const winReason: 'GUESSED_WORD' | 'WRONG_GUESS' = isCorrect ? 'GUESSED_WORD' : 'WRONG_GUESS';

    if (isSupabaseConfigured()) {
      await updateRoomInDb(roomState.roomCode, {
        phase: 'GAME_OVER',
        impostor_guess: guess,
        winner,
        win_reason: winReason,
      });
    }

    const finalState: RoomState = {
      ...roomState,
      phase: 'GAME_OVER',
      impostorGuess: guess,
      winner,
      winReason,
    };
    broadcastRoomState(finalState);
  }, [roomState, broadcastRoomState]);

  // 12. Play Again (Host Only)
  const playAgain = useCallback(async () => {
    if (!isHost || roomState.players.length < 3) return;

    const currentCategory = CATEGORIES.find((c) => c.id === roomState.selectedCategoryId) || CATEGORIES[0];
    const secretWord = currentCategory.words[Math.floor(Math.random() * currentCategory.words.length)];

    const playerCount = roomState.players.length;
    const impostorCount = playerCount >= 7 ? 2 : 1;

    const indices = Array.from({ length: playerCount }, (_, i) => i).sort(() => Math.random() - 0.5);
    const impostorIndices = new Set(indices.slice(0, impostorCount));

    const impostorIds: string[] = [];
    roomState.players.forEach((p, idx) => {
      if (impostorIndices.has(idx)) impostorIds.push(p.id);
    });

    const resetPlayers: Player[] = roomState.players.map((p, idx) => {
      const isImp = impostorIndices.has(idx);
      let partnerId: string | undefined = undefined;
      if (isImp && impostorCount > 1) {
        partnerId = impostorIds.find((id) => id !== p.id);
      }
      return {
        ...p,
        isImpostor: isImp,
        impostorPartnerId: partnerId,
        hasVoted: false,
        votedTargetId: undefined,
      };
    });

    const pairs = generateQuestionPairs(resetPlayers);

    if (isSupabaseConfigured()) {
      await updatePlayersBatchInDb(resetPlayers);
      await updateRoomInDb(roomState.roomCode, {
        phase: 'ROLE_REVEAL',
        secret_word: secretWord,
        question_pairs: pairs,
        current_pair_index: 0,
        turn_started_at: null,
        voting_revealed: false,
        caught_impostor_id: null,
        last_chance_options: [],
        impostor_guess: null,
        winner: null,
        win_reason: null,
        round_number: roomState.roundNumber + 1,
      });
    }

    const newState: RoomState = {
      ...roomState,
      phase: 'ROLE_REVEAL',
      secretWord,
      players: resetPlayers,
      questionPairs: pairs,
      currentPairIndex: 0,
      turnStartedAt: null,
      votes: {},
      votingRevealed: false,
      caughtImpostorId: null,
      lastChanceOptions: [],
      impostorGuess: null,
      winner: null,
      winReason: null,
      roundNumber: roomState.roundNumber + 1,
    };

    broadcastRoomState(newState);
  }, [isHost, roomState, broadcastRoomState]);

  // 13. Back to Lobby (Host Only)
  const backToLobby = useCallback(async () => {
    if (!isHost) return;

    const resetPlayers = roomState.players.map((p) => ({
      ...p,
      isImpostor: false,
      impostorPartnerId: undefined,
      hasVoted: false,
      votedTargetId: undefined,
    }));

    if (isSupabaseConfigured()) {
      await updatePlayersBatchInDb(resetPlayers);
      await updateRoomInDb(roomState.roomCode, {
        phase: 'LOBBY',
        turn_started_at: null,
        voting_revealed: false,
        caught_impostor_id: null,
        last_chance_options: [],
        impostor_guess: null,
        winner: null,
        win_reason: null,
      });
    }

    const newState: RoomState = {
      ...roomState,
      phase: 'LOBBY',
      turnStartedAt: null,
      votes: {},
      votingRevealed: false,
      caughtImpostorId: null,
      lastChanceOptions: [],
      impostorGuess: null,
      winner: null,
      winReason: null,
      players: resetPlayers,
    };

    broadcastRoomState(newState);
  }, [isHost, roomState, broadcastRoomState]);

  return {
    profile,
    isInRoom,
    isConnecting,
    roomState,
    activePlayerId: profile.id,
    activePlayer,
    isHost,
    kickedNotice,
    updateProfile,
    createRoom,
    joinRoom,
    leaveRoom,
    kickPlayer,
    setCategory,
    activateVipRoom,
    startGame,
    startQuestions,
    nextQuestionPair,
    submitVote,
    submitImpostorGuess,
    playAgain,
    backToLobby,
  };
}
