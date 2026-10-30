import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  RoomState, 
  Player, 
  GamePhase, 
  QuestionPair, 
  PlayerColor, 
  SyncMessage,
  UserProfile,
  GameSettings,
  CustomCategory
} from '../types/game';
import { CATEGORIES, DEFAULT_CATEGORY_ID, PLAYER_COLORS, getCategoriesWithLockStatus } from '../data/categories';
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
  isSupabaseConfigured,
  testSupabaseConnection
} from '../services/supabaseService';
import { soundFx } from '../utils/soundFx';

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
  } catch (e) {}

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

export const DEFAULT_GAME_SETTINGS: GameSettings = {
  timerDuration: 25,
  impostorCount: 'auto',
  impostorCategoryHint: true,
};

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
  settings: DEFAULT_GAME_SETTINGS,
};

export function useGameEngine() {
  const [profile, setProfile] = useState<UserProfile>(loadStoredProfile);
  const [isInRoom, setIsInRoom] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [isOnline, setIsOnline] = useState<boolean>(false);
  const [isLocallyVip, setIsLocallyVip] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('showtime_vip_unlocked') === 'true';
    }
    return false;
  });
  const [roomState, setRoomState] = useState<RoomState>(EMPTY_ROOM_STATE);
  const [kickedNotice, setKickedNotice] = useState<string | null>(null);

  const syncEngineRef = useRef<RealtimeSyncEngine | null>(null);
  const realtimeUnsubRef = useRef<(() => void) | null>(null);

  // 1. Connection check & fallback monitoring
  useEffect(() => {
    let isMounted = true;
    const verifyConnection = async () => {
      if (!isSupabaseConfigured()) {
        if (isMounted) setIsOnline(false);
        return;
      }
      const ok = await testSupabaseConnection();
      if (isMounted) setIsOnline(ok);
    };

    verifyConnection();
    const interval = setInterval(verifyConnection, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

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
  const isHost = activePlayer?.isHost ?? (roomState.players.length > 0 && roomState.players[0].id === profile.id);

  // Refresh room from DB
  const refreshRoomFromDb = useCallback(async (code: string) => {
    if (!code) return;
    const data = await fetchRoomDataFromDb(code);
    if (!data) return;

    setRoomState((prev) => {
      const mapped = mapDbRoomToRoomState(data.room, data.players);
      const votes: Record<string, string> = {};
      data.players.forEach((p) => {
        if (p.hasVoted && p.votedTargetId) {
          votes[p.id] = p.votedTargetId;
        }
      });
      mapped.votes = votes;
      mapped.settings = data.room.settings || prev.settings || DEFAULT_GAME_SETTINGS;
      mapped.customCategory = data.room.custom_category || prev.customCategory;

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

  // Connect Realtime & Multi-tab Subscriptions
  const bindRealtime = useCallback((code: string) => {
    if (realtimeUnsubRef.current) {
      realtimeUnsubRef.current();
      realtimeUnsubRef.current = null;
    }
    if (syncEngineRef.current) {
      syncEngineRef.current.cleanup();
      syncEngineRef.current = null;
    }

    // 1. Dual fallback sync engine (broadcast channel & localStorage)
    const engine = new RealtimeSyncEngine(code);
    syncEngineRef.current = engine;

    engine.subscribe((msg: SyncMessage) => {
      if (msg.roomCode !== code) return;

      if (msg.type === 'PLAYER_KICKED' && msg.payload?.playerId === profile.id) {
        leaveRoom();
        setKickedNotice('لقد تم طردك من الغرفة من قِبل المضيف');
      } else if (msg.type === 'ROOM_STATE_SYNC' && msg.payload) {
        setRoomState(msg.payload as RoomState);
      } else if (msg.type === 'PLAYER_JOIN' && msg.payload) {
        const joiningPlayer = msg.payload as Player;
        setRoomState((prev) => {
          if (prev.roomCode !== code) return prev;
          const exists = prev.players.some((p) => p.id === joiningPlayer.id);
          const updatedPlayers = exists
            ? prev.players.map((p) => (p.id === joiningPlayer.id ? joiningPlayer : p))
            : [...prev.players, joiningPlayer];

          const nextState: RoomState = { ...prev, players: updatedPlayers };

          if (prev.players.length > 0 && prev.players[0].id === profile.id) {
            engine.saveRoomState(nextState);
            engine.broadcast({
              type: 'ROOM_STATE_SYNC',
              roomCode: code,
              senderId: profile.id,
              timestamp: Date.now(),
              payload: nextState,
            });
          }
          return nextState;
        });
      } else if (msg.type === 'REQUEST_ROOM_SYNC') {
        setRoomState((prev) => {
          if (prev.roomCode === code) {
            engine.broadcast({
              type: 'ROOM_STATE_SYNC',
              roomCode: code,
              senderId: profile.id,
              timestamp: Date.now(),
              payload: prev,
            });
          }
          return prev;
        });
      }
    });

    // 2. Supabase Realtime Postgres Changes
    if (isOnline && isSupabaseConfigured()) {
      const unsub = subscribeToRoomRealtime(
        code,
        (newRoom) => {
          setRoomState((prev) => ({
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
            isPremiumRoom: Boolean(newRoom.is_premium_room) || prev.isPremiumRoom,
            settings: newRoom.settings || prev.settings,
            customCategory: newRoom.custom_category || prev.customCategory,
          }));
        },
        () => {
          refreshRoomFromDb(code);
        }
      );
      realtimeUnsubRef.current = unsub;
    }
  }, [profile.id, refreshRoomFromDb, isOnline]);

  // Attempt auto-reconnect on mount
  useEffect(() => {
    const attemptReconnect = async () => {
      let codeToRestore = '';
      try {
        codeToRestore = localStorage.getItem('showtime_active_room') || '';
      } catch (e) {}

      if (!codeToRestore) return;

      // 1. Try Supabase
      if (isSupabaseConfigured()) {
        try {
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
              mapped.settings = data.room.settings || DEFAULT_GAME_SETTINGS;
              mapped.customCategory = data.room.custom_category;
              if (isLocallyVip) mapped.isPremiumRoom = true;

              setRoomState(mapped);
              setIsInRoom(true);
              bindRealtime(codeToRestore);
              return;
            }
          }
        } catch (e) {}
      }

      // 2. Try LocalStorage fallback
      try {
        const raw = localStorage.getItem(`showtime_state_${codeToRestore}`);
        if (raw) {
          const localState = JSON.parse(raw) as RoomState;
          if (localState && localState.roomCode === codeToRestore) {
            if (isLocallyVip) localState.isPremiumRoom = true;
            if (!localState.settings) localState.settings = DEFAULT_GAME_SETTINGS;
            setRoomState(localState);
            setIsInRoom(true);
            bindRealtime(codeToRestore);
            return;
          }
        }
      } catch (e) {}

      try {
        localStorage.removeItem('showtime_active_room');
      } catch (e) {}
    };

    attemptReconnect();

    return () => {
      if (realtimeUnsubRef.current) realtimeUnsubRef.current();
      if (syncEngineRef.current) syncEngineRef.current.cleanup();
    };
  }, [isLocallyVip]);

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
      isPremiumRoom: isLocallyVip,
      settings: DEFAULT_GAME_SETTINGS,
    };

    updateProfile({ name: hostName.trim(), color: hostColor });

    try {
      localStorage.setItem('showtime_active_room', code);
      localStorage.setItem(`showtime_state_${code}`, JSON.stringify(initialRoom));
    } catch (e) {}

    if (isOnline && isSupabaseConfigured()) {
      try {
        await createRoomInDb(code, hostPlayer, DEFAULT_CATEGORY_ID);
      } catch (err) {
        console.warn('[Showtime] Supabase room creation failed, falling back locally', err);
      }
    }

    setRoomState(initialRoom);
    setIsInRoom(true);
    bindRealtime(code);
    setIsConnecting(false);
  }, [profile.id, updateProfile, bindRealtime, isOnline, isLocallyVip]);

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

    let joinedState: RoomState | null = null;

    if (isOnline && isSupabaseConfigured()) {
      try {
        const res = await joinRoomInDb(cleanCode, newPlayer);
        if (res.success && res.room) {
          joinedState = mapDbRoomToRoomState(res.room, res.players || [newPlayer]);
          if (res.room.settings) joinedState.settings = res.room.settings;
          if (res.room.custom_category) joinedState.customCategory = res.room.custom_category;
        }
      } catch (err) {
        console.warn('[Showtime] Supabase join error, checking local fallback:', err);
      }
    }

    if (!joinedState) {
      let localSaved: RoomState | null = null;
      try {
        const raw = localStorage.getItem(`showtime_state_${cleanCode}`);
        if (raw) localSaved = JSON.parse(raw);
      } catch (e) {}

      if (localSaved && localSaved.roomCode === cleanCode) {
        const playerExists = localSaved.players.some((p) => p.id === newPlayer.id);
        const updatedPlayers = playerExists
          ? localSaved.players.map((p) => (p.id === newPlayer.id ? { ...p, name: newPlayer.name, color: newPlayer.color } : p))
          : [...localSaved.players, newPlayer];

        joinedState = {
          ...localSaved,
          players: updatedPlayers,
          settings: localSaved.settings || DEFAULT_GAME_SETTINGS,
        };
      }
    }

    if (!joinedState) {
      console.info(`[Showtime] Room ${cleanCode} initialized as local fallback instance.`);
      const fallbackHost: Player = {
        id: profile.id,
        name: playerName.trim() || 'المضيف',
        color: playerColor,
        isHost: true,
        isImpostor: false,
      };

      joinedState = {
        ...EMPTY_ROOM_STATE,
        roomCode: cleanCode,
        players: [fallbackHost],
        settings: DEFAULT_GAME_SETTINGS,
      };
    }

    if (isLocallyVip) {
      joinedState.isPremiumRoom = true;
    }

    try {
      localStorage.setItem('showtime_active_room', cleanCode);
      localStorage.setItem(`showtime_state_${cleanCode}`, JSON.stringify(joinedState));
    } catch (e) {}

    setRoomState(joinedState);
    setIsInRoom(true);
    bindRealtime(cleanCode);

    setTimeout(() => {
      if (syncEngineRef.current) {
        syncEngineRef.current.broadcast({
          type: 'PLAYER_JOIN',
          roomCode: cleanCode,
          senderId: profile.id,
          timestamp: Date.now(),
          payload: newPlayer,
        });
        syncEngineRef.current.broadcast({
          type: 'REQUEST_ROOM_SYNC',
          roomCode: cleanCode,
          senderId: profile.id,
          timestamp: Date.now(),
        });
      }
    }, 150);

    setIsConnecting(false);
    return { success: true };
  }, [profile.id, updateProfile, bindRealtime, isOnline, isLocallyVip]);

  // 3. Leave Room
  const leaveRoom = useCallback(async () => {
    if (roomState.roomCode) {
      if (isOnline && isSupabaseConfigured()) {
        try {
          await removePlayerFromDb(roomState.roomCode, profile.id);
        } catch (e) {}
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
  }, [roomState.roomCode, profile.id, isOnline]);

  // 4. Kick Player
  const kickPlayer = useCallback(async (playerId: string) => {
    if (!isHost || !roomState.roomCode) return;

    if (isOnline && isSupabaseConfigured()) {
      try {
        await removePlayerFromDb(roomState.roomCode, playerId);
      } catch (e) {}
    }

    if (syncEngineRef.current) {
      syncEngineRef.current.broadcast({
        type: 'PLAYER_KICKED',
        roomCode: roomState.roomCode,
        senderId: profile.id,
        timestamp: Date.now(),
        payload: { playerId },
      });
    }

    const updatedPlayers = roomState.players.filter((p) => p.id !== playerId);
    const updatedState = { ...roomState, players: updatedPlayers };
    broadcastRoomState(updatedState);
  }, [isHost, roomState, profile.id, broadcastRoomState, isOnline]);

  // 5. Select Category
  const setCategory = useCallback(async (categoryId: string) => {
    if (!isHost || !roomState.roomCode) return;

    if (isOnline && isSupabaseConfigured()) {
      try {
        await updateRoomInDb(roomState.roomCode, { selected_category_id: categoryId });
      } catch (e) {}
    }

    const next = { ...roomState, selectedCategoryId: categoryId };
    broadcastRoomState(next);
  }, [isHost, roomState, broadcastRoomState, isOnline]);

  // 6. Update Game Settings
  const updateSettings = useCallback(async (newSettings: Partial<GameSettings>) => {
    if (!isHost || !roomState.roomCode) return;

    const mergedSettings = { ...roomState.settings, ...newSettings };
    const next = { ...roomState, settings: mergedSettings };
    broadcastRoomState(next);

    if (isOnline && isSupabaseConfigured()) {
      try {
        await updateRoomInDb(roomState.roomCode, { settings: mergedSettings });
      } catch (e) {}
    }
  }, [isHost, roomState, broadcastRoomState, isOnline]);

  // 7. Update Custom Category
  const updateCustomCategory = useCallback(async (custom: CustomCategory) => {
    if (!isHost || !roomState.roomCode) return;

    const next = { ...roomState, customCategory: custom };
    broadcastRoomState(next);

    if (isOnline && isSupabaseConfigured()) {
      try {
        await updateRoomInDb(roomState.roomCode, { custom_category: custom });
      } catch (e) {}
    }
  }, [isHost, roomState, broadcastRoomState, isOnline]);

  // 8. Activate VIP Room
  const activateVipRoom = useCallback(async () => {
    setIsLocallyVip(true);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('showtime_vip_unlocked', 'true');
      } catch (e) {}
    }

    if (!roomState.roomCode) return;

    if (isOnline && isSupabaseConfigured()) {
      try {
        await updateRoomInDb(roomState.roomCode, { is_premium_room: true });
      } catch (e) {}
    }

    const next = { ...roomState, isPremiumRoom: true };
    broadcastRoomState(next);
  }, [roomState, broadcastRoomState, isOnline]);

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

  // 9. Start Game
  const startGame = useCallback(async () => {
    if (!isHost || roomState.players.length < 3) return;

    // Pick secret word
    let secretWord = '';
    if (roomState.selectedCategoryId === 'custom' && roomState.customCategory && roomState.customCategory.words?.length >= 8) {
      const words = roomState.customCategory.words;
      secretWord = words[Math.floor(Math.random() * words.length)];
    } else {
      const catList = getCategoriesWithLockStatus(roomState.isPremiumRoom || isLocallyVip);
      const currentCategory = catList.find((c) => c.id === roomState.selectedCategoryId) || catList[0];
      secretWord = currentCategory.words[Math.floor(Math.random() * currentCategory.words.length)];
    }

    // Determine Impostor count based on settings
    const playerCount = roomState.players.length;
    let impostorCount = 1;
    if (roomState.settings?.impostorCount === 'auto') {
      impostorCount = playerCount >= 7 ? 2 : 1;
    } else if (typeof roomState.settings?.impostorCount === 'number') {
      impostorCount = roomState.settings.impostorCount;
      if (impostorCount === 2 && playerCount < 5) impostorCount = 1;
      if (impostorCount === 3 && playerCount < 8) impostorCount = playerCount >= 5 ? 2 : 1;
    }

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

    if (isOnline && isSupabaseConfigured()) {
      try {
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
      } catch (e) {}
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
  }, [isHost, roomState, broadcastRoomState, isOnline, isLocallyVip]);

  // 10. Start Questions
  const startQuestions = useCallback(async () => {
    if (!isHost) return;

    const timerDur = roomState.settings?.timerDuration ?? 25;
    const turnStartedAt = timerDur > 0 ? new Date().toISOString() : null;

    if (isOnline && isSupabaseConfigured()) {
      try {
        await updateRoomInDb(roomState.roomCode, {
          phase: 'QUESTIONS',
          current_pair_index: 0,
          turn_started_at: turnStartedAt,
        });
      } catch (e) {}
    }

    const newState: RoomState = {
      ...roomState,
      phase: 'QUESTIONS',
      currentPairIndex: 0,
      turnStartedAt,
      questionTimeRemaining: timerDur,
    };
    broadcastRoomState(newState);
  }, [isHost, roomState, broadcastRoomState, isOnline]);

  // 11. Next Question Pair
  const nextQuestionPair = useCallback(async () => {
    if (!isHost) return;

    const timerDur = roomState.settings?.timerDuration ?? 25;
    const nextIndex = roomState.currentPairIndex + 1;

    if (nextIndex < roomState.questionPairs.length) {
      const turnStartedAt = timerDur > 0 ? new Date().toISOString() : null;

      if (isOnline && isSupabaseConfigured()) {
        try {
          await updateRoomInDb(roomState.roomCode, {
            current_pair_index: nextIndex,
            turn_started_at: turnStartedAt,
          });
        } catch (e) {}
      }

      const newState: RoomState = {
        ...roomState,
        currentPairIndex: nextIndex,
        turnStartedAt,
        questionTimeRemaining: timerDur,
      };
      broadcastRoomState(newState);
    } else {
      const resetPlayers = roomState.players.map((p) => ({
        ...p,
        hasVoted: false,
        votedTargetId: undefined,
      }));

      if (isOnline && isSupabaseConfigured()) {
        try {
          await updatePlayersBatchInDb(resetPlayers);
          await updateRoomInDb(roomState.roomCode, {
            phase: 'VOTING',
            turn_started_at: null,
            voting_revealed: false,
          });
        } catch (e) {}
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
  }, [isHost, roomState, broadcastRoomState, isOnline]);

  // Helper: Generate 8 word options for Last Chance
  const generateLastChanceOptions = (secretWord: string, categoryId: string, custom?: CustomCategory): string[] => {
    let decoys: string[] = [];

    if (categoryId === 'custom' && custom && custom.words?.length >= 8) {
      decoys = custom.words.filter((w) => w !== secretWord);
    } else {
      const catList = getCategoriesWithLockStatus(true);
      const cat = catList.find((c) => c.id === categoryId) || catList[0];
      decoys = cat.words.filter((w) => w !== secretWord);
    }

    const shuffledDecoys = [...decoys].sort(() => Math.random() - 0.5).slice(0, 7);
    return [secretWord, ...shuffledDecoys].sort(() => Math.random() - 0.5);
  };

  // 12. Submit Vote
  const submitVote = useCallback(async (voterId: string, targetId: string) => {
    if (voterId === targetId) return;

    soundFx.playVoteClick();

    const nextVotes = { ...roomState.votes, [voterId]: targetId };
    const updatedPlayers = roomState.players.map((p) =>
      p.id === voterId ? { ...p, hasVoted: true, votedTargetId: targetId } : p
    );

    const allVoted = updatedPlayers.every((p) => Boolean(nextVotes[p.id]));

    if (!allVoted) {
      if (isOnline && isSupabaseConfigured()) {
        try {
          await updatePlayersBatchInDb([
            { ...updatedPlayers.find((p) => p.id === voterId)!, hasVoted: true, votedTargetId: targetId },
          ]);
        } catch (e) {}
      }

      const intermediateState: RoomState = {
        ...roomState,
        votes: nextVotes,
        players: updatedPlayers,
      };
      broadcastRoomState(intermediateState);
      return;
    }

    // All players voted -> resolve catch condition
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
      const caughtImpostor = tiedImpostors[0];
      const lastChanceOptions = generateLastChanceOptions(
        roomState.secretWord,
        roomState.selectedCategoryId,
        roomState.customCategory
      );

      if (isOnline && isSupabaseConfigured()) {
        try {
          await updatePlayersBatchInDb(updatedPlayers);
          await updateRoomInDb(roomState.roomCode, {
            phase: 'LAST_CHANCE',
            voting_revealed: true,
            caught_impostor_id: caughtImpostor.id,
            last_chance_options: lastChanceOptions,
          });
        } catch (e) {}
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
      soundFx.playVictory();

      if (isOnline && isSupabaseConfigured()) {
        try {
          await updatePlayersBatchInDb(updatedPlayers);
          await updateRoomInDb(roomState.roomCode, {
            phase: 'GAME_OVER',
            voting_revealed: true,
            winner: 'IMPOSTOR',
            win_reason: 'ESCAPED',
            caught_impostor_id: null,
          });
        } catch (e) {}
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
  }, [roomState, broadcastRoomState, isOnline]);

  // 13. Impostor Guess
  const submitImpostorGuess = useCallback(async (guess: string) => {
    if (roomState.phase !== 'LAST_CHANCE') return;

    soundFx.playVictory();

    const isCorrect = guess === roomState.secretWord;
    const winner: 'IMPOSTOR' | 'CIVILIANS' = isCorrect ? 'IMPOSTOR' : 'CIVILIANS';
    const winReason: 'GUESSED_WORD' | 'WRONG_GUESS' = isCorrect ? 'GUESSED_WORD' : 'WRONG_GUESS';

    if (isOnline && isSupabaseConfigured()) {
      try {
        await updateRoomInDb(roomState.roomCode, {
          phase: 'GAME_OVER',
          impostor_guess: guess,
          winner,
          win_reason: winReason,
        });
      } catch (e) {}
    }

    const finalState: RoomState = {
      ...roomState,
      phase: 'GAME_OVER',
      impostorGuess: guess,
      winner,
      winReason,
    };
    broadcastRoomState(finalState);
  }, [roomState, broadcastRoomState, isOnline]);

  // 14. Play Again
  const playAgain = useCallback(async () => {
    if (!isHost || roomState.players.length < 3) return;

    let secretWord = '';
    if (roomState.selectedCategoryId === 'custom' && roomState.customCategory && roomState.customCategory.words?.length >= 8) {
      const words = roomState.customCategory.words;
      secretWord = words[Math.floor(Math.random() * words.length)];
    } else {
      const catList = getCategoriesWithLockStatus(roomState.isPremiumRoom || isLocallyVip);
      const currentCategory = catList.find((c) => c.id === roomState.selectedCategoryId) || catList[0];
      secretWord = currentCategory.words[Math.floor(Math.random() * currentCategory.words.length)];
    }

    const playerCount = roomState.players.length;
    let impostorCount = 1;
    if (roomState.settings?.impostorCount === 'auto') {
      impostorCount = playerCount >= 7 ? 2 : 1;
    } else if (typeof roomState.settings?.impostorCount === 'number') {
      impostorCount = roomState.settings.impostorCount;
      if (impostorCount === 2 && playerCount < 5) impostorCount = 1;
      if (impostorCount === 3 && playerCount < 8) impostorCount = playerCount >= 5 ? 2 : 1;
    }

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

    if (isOnline && isSupabaseConfigured()) {
      try {
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
      } catch (e) {}
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
  }, [isHost, roomState, broadcastRoomState, isOnline, isLocallyVip]);

  // 15. Back to Lobby
  const backToLobby = useCallback(async () => {
    if (!isHost) return;

    const resetPlayers = roomState.players.map((p) => ({
      ...p,
      isImpostor: false,
      impostorPartnerId: undefined,
      hasVoted: false,
      votedTargetId: undefined,
    }));

    if (isOnline && isSupabaseConfigured()) {
      try {
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
      } catch (e) {}
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
  }, [isHost, roomState, broadcastRoomState, isOnline]);

  return {
    profile,
    isInRoom,
    isConnecting,
    isOnline,
    isLocallyVip,
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
  };
}
