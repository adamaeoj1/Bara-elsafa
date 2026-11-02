import { useState, useEffect, useRef, useCallback } from 'react';
import {
  RoomState,
  Player,
  GamePhase,
  GameMode,
  QuestionPair,
  PlayerColor,
  SyncMessage,
  UserProfile,
  GameSettings,
  CustomCategory,
  EmojiReaction,
  MafiaRole,
} from '../types/game';
import { DEFAULT_CATEGORY_ID, PLAYER_COLORS, getCategoriesWithLockStatus } from '../data/categories';
import { RealtimeSyncEngine } from '../services/syncEngine';
import {
  createRoomInDb,
  fetchRoomDataFromDb,
  joinRoomInDb,
  removePlayerFromDb,
  updateRoomInDb,
  updatePlayerVoteInDb,
  updatePlayersBatchInDb,
  subscribeToRoomRealtime,
  mapDbRoomToRoomState,
  normalizeSettings,
  isSupabaseConfigured,
  testSupabaseConnection,
} from '../services/supabaseService';
import { soundFx } from '../utils/soundFx';
import { pickSmartImpostors, pickSmartWord, cryptoShuffle } from '../utils/cryptoRng';

// Helper to generate UUID
function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'usr_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now();
}

/**
 * Per-Tab Profile Isolation with sessionStorage:
 * Reads from sessionStorage FIRST so every browser tab on the same laptop
 * is a 100% isolated player with its own UUID and session!
 */
function loadStoredProfile(): UserProfile {
  if (typeof window === 'undefined') {
    return { id: 'p_temp', name: '', color: PLAYER_COLORS[0].hex };
  }

  try {
    const sessionRaw = sessionStorage.getItem('bara_user_profile');
    if (sessionRaw) {
      const parsed = JSON.parse(sessionRaw);
      if (parsed && parsed.id) return parsed;
    }
  } catch (e) {}

  let defaultName = '';
  let defaultColor = PLAYER_COLORS[0].hex;
  try {
    const localRaw = localStorage.getItem('bara_default_profile');
    if (localRaw) {
      const parsed = JSON.parse(localRaw);
      if (parsed.name) defaultName = parsed.name;
      if (parsed.color) defaultColor = parsed.color;
    }
  } catch (e) {}

  const newProfile: UserProfile = {
    id: generateUUID(),
    name: defaultName,
    color: defaultColor,
  };

  try {
    sessionStorage.setItem('bara_user_profile', JSON.stringify(newProfile));
  } catch (e) {}

  return newProfile;
}

export const DEFAULT_GAME_SETTINGS: GameSettings = {
  timer: 25,
  timerDuration: 25,
  impostorCount: 'auto',
  impostorCategoryHint: true,
};

const EMPTY_ROOM_STATE: RoomState = {
  roomCode: '',
  phase: 'LOBBY',
  gameMode: 'OUT_OF_THE_LOOP',
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
  lastImpostorIds: [],
  usedWords: [],
  mafiaNightVictimId: null,
  mafiaNightProtectedId: null,
  mafiaNightInvestigatedId: null,
  mafiaNightKilledPlayerId: null,
  mafiaNightSaved: false,
  mafiaExiledPlayerId: null,
  mafiaRound: 1,
  mafiaNightTimeRemaining: 30,
  mafiaDiscussionTimeRemaining: 60,
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

  const [activeReactions, setActiveReactions] = useState<EmojiReaction[]>([]);

  const syncEngineRef = useRef<RealtimeSyncEngine | null>(null);
  const realtimeUnsubRef = useRef<(() => void) | null>(null);
  const resolvingVoteRef = useRef<boolean>(false);

  // Reset resolution lock whenever phase changes away from voting
  useEffect(() => {
    if (roomState.phase !== 'VOTING' && roomState.phase !== 'MAFIA_VOTING') {
      resolvingVoteRef.current = false;
    }
  }, [roomState.phase]);

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

  // Update profile and persist to sessionStorage
  const updateProfile = useCallback((updates: Partial<UserProfile>) => {
    setProfile((prev) => {
      const next = { ...prev, ...updates };
      try {
        sessionStorage.setItem('bara_user_profile', JSON.stringify(next));
        localStorage.setItem(
          'bara_default_profile',
          JSON.stringify({ name: next.name, color: next.color })
        );
      } catch (e) {}
      return next;
    });
  }, []);

  const activePlayer = roomState.players.find((p) => p.id === profile.id);
  const isHost =
    activePlayer?.isHost ??
    activePlayer?.is_host ??
    (roomState.players.length > 0 && roomState.players[0].id === profile.id);

  // Broadcast helper
  const broadcastRoomState = useCallback(
    (state: RoomState) => {
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
    },
    [profile.id]
  );

  // Refresh room from DB
  const refreshRoomFromDb = useCallback(
    async (code: string) => {
      if (!code) return;
      const data = await fetchRoomDataFromDb(code);
      if (!data) return;

      setRoomState((prev) => {
        const mapped = mapDbRoomToRoomState(data.room, data.players);

        // Preserve local votes during active voting if DB write is still in-flight
        if (
          (prev.phase === 'VOTING' && mapped.phase === 'VOTING') ||
          (prev.phase === 'MAFIA_VOTING' && mapped.phase === 'MAFIA_VOTING')
        ) {
          const mergedVotes: Record<string, string> = { ...prev.votes, ...mapped.votes };
          mapped.players = mapped.players.map((p) => {
            const prevP = prev.players.find((lp) => lp.id === p.id);
            const vf =
              p.voted_for ||
              prevP?.voted_for ||
              mergedVotes[p.id] ||
              null;
            if (vf) {
              mergedVotes[p.id] = vf;
            }
            return {
              ...p,
              voted_for: vf,
              votedTargetId: vf || undefined,
              hasVoted: Boolean(vf),
            };
          });
          mapped.votes = mergedVotes;
        }

        // Preserve scores on GAME_OVER so client scores are never wiped while DB write is in-flight
        if (mapped.phase === 'GAME_OVER') {
          mapped.players = mapped.players.map((p) => {
            const prevP = prev.players.find((lp) => lp.id === p.id);
            const dbScore = typeof p.score === 'number' && !Number.isNaN(p.score) ? p.score : 0;
            const prevScore = typeof prevP?.score === 'number' && !Number.isNaN(prevP.score) ? prevP.score : 0;
            const bestScore = Math.max(dbScore, prevScore);

            const dbRoundPts = (p.round_points ?? p.roundPointsEarned ?? 0);
            const prevRoundPts = (prevP?.round_points ?? prevP?.roundPointsEarned ?? 0);
            const bestRoundPts = Math.max(dbRoundPts, prevRoundPts);

            return {
              ...p,
              score: bestScore,
              round_points: bestRoundPts,
              roundPointsEarned: bestRoundPts,
            };
          });
        }

        mapped.settings = normalizeSettings(data.room.settings || prev.settings);
        mapped.customCategory =
          data.room.settings?.customCategory || data.room.custom_category || prev.customCategory;
        mapped.gameMode = (data.room.game_mode as GameMode) || prev.gameMode || 'OUT_OF_THE_LOOP';
        mapped.lastImpostorIds =
          Array.isArray(data.room.last_impostor_ids) && data.room.last_impostor_ids.length > 0
            ? data.room.last_impostor_ids
            : prev.lastImpostorIds || [];
        mapped.usedWords =
          Array.isArray(data.room.used_words) && data.room.used_words.length > 0
            ? data.room.used_words
            : prev.usedWords || [];

        const amStillIn = data.players.some((p) => p.id === profile.id);
        if (!amStillIn && isInRoom) {
          setIsInRoom(false);
          setKickedNotice('لقد تم طردك من الغرفة من قِبل المضيف');
          try {
            sessionStorage.removeItem('bara_active_room');
            localStorage.removeItem('showtime_active_room');
            localStorage.removeItem('showtime_last_session');
          } catch (e) {}
        }

        return mapped;
      });
    },
    [profile.id, isInRoom]
  );

  // Connect Realtime & Multi-tab Subscriptions
  const bindRealtime = useCallback(
    (code: string) => {
      if (realtimeUnsubRef.current) {
        realtimeUnsubRef.current();
        realtimeUnsubRef.current = null;
      }
      if (syncEngineRef.current) {
        syncEngineRef.current.cleanup();
        syncEngineRef.current = null;
      }

      const engine = new RealtimeSyncEngine(code);
      syncEngineRef.current = engine;

      engine.subscribe((msg: SyncMessage) => {
        if (msg.roomCode !== code) return;

        if (msg.type === 'PLAYER_KICKED' && msg.payload?.playerId === profile.id) {
          leaveRoom();
          setKickedNotice('لقد تم طردك من الغرفة من قِبل المضيف');
        } else if (msg.type === 'SUBMIT_VOTE' && msg.payload) {
          const { voterId, targetId } = msg.payload as { voterId: string; targetId: string };
          setRoomState((prev) => {
            if (prev.roomCode !== code) return prev;
            const nextVotes = { ...prev.votes, [voterId]: targetId };
            const nextPlayers = prev.players.map((p) =>
              p.id === voterId
                ? {
                    ...p,
                    voted_for: targetId,
                    votedTargetId: targetId,
                    hasVoted: true,
                  }
                : p
            );
            const nextState: RoomState = {
              ...prev,
              votes: nextVotes,
              players: nextPlayers,
            };
            engine.saveRoomState(nextState);
            return nextState;
          });
        } else if (msg.type === 'ROOM_STATE_SYNC' && msg.payload) {
          const incoming = msg.payload as RoomState;
          setRoomState((prev) => {
            // If both states are in the same voting phase and not yet revealed, merge votes so no concurrent vote is lost
            if (
              prev.phase === incoming.phase &&
              (incoming.phase === 'VOTING' || incoming.phase === 'MAFIA_VOTING') &&
              !incoming.votingRevealed
            ) {
              const mergedVotes = { ...prev.votes, ...incoming.votes };
              const mergedPlayers = incoming.players.map((p) => {
                const prevP = prev.players.find((lp) => lp.id === p.id);
                const vf = p.voted_for || prevP?.voted_for || mergedVotes[p.id] || null;
                if (vf) mergedVotes[p.id] = vf;
                return {
                  ...p,
                  voted_for: vf,
                  votedTargetId: vf || undefined,
                  hasVoted: Boolean(vf),
                };
              });
              return {
                ...incoming,
                settings: normalizeSettings(incoming.settings),
                votes: mergedVotes,
                players: mergedPlayers,
              };
            }
            return {
              ...incoming,
              settings: normalizeSettings(incoming.settings),
            };
          });
        } else if (msg.type === 'PLAYER_JOIN' && msg.payload) {
          const joiningPlayer = msg.payload as Player;
          setRoomState((prev) => {
            if (prev.roomCode !== code) return prev;
            const exists = prev.players.some((p) => p.id === joiningPlayer.id);
            const updatedPlayers = exists
              ? prev.players.map((p) => (p.id === joiningPlayer.id ? { ...p, ...joiningPlayer } : p))
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
        } else if (msg.type === 'EMOJI_REACTION' && msg.payload) {
          const reaction = msg.payload as EmojiReaction;
          setActiveReactions((prev) => [...prev, reaction]);
          soundFx.playReactionPop();
          setTimeout(() => {
            setActiveReactions((prev) => prev.filter((r) => r.id !== reaction.id));
          }, 2500);
        } else if (msg.type === 'RESET_SCORES') {
          setRoomState((prev) => ({
            ...prev,
            players: prev.players.map((p) => ({
              ...p,
              score: 0,
              round_points: 0,
              roundPointsEarned: 0,
            })),
          }));
        }
      });

      if (isOnline && isSupabaseConfigured()) {
        const unsub = subscribeToRoomRealtime(
          code,
          () => {
            refreshRoomFromDb(code);
          },
          () => {
            refreshRoomFromDb(code);
          }
        );
        realtimeUnsubRef.current = unsub;
      }
    },
    [profile.id, refreshRoomFromDb, isOnline]
  );

  // Tab Reconnection on Refresh using sessionStorage isolation
  useEffect(() => {
    const attemptReconnect = async () => {
      let codeToRestore = '';
      try {
        codeToRestore = sessionStorage.getItem('bara_active_room') || '';
      } catch (e) {}

      if (!codeToRestore) return;

      if (isSupabaseConfigured()) {
        try {
          const data = await fetchRoomDataFromDb(codeToRestore);
          if (data && data.room) {
            const amIn = data.players.some((p) => p.id === profile.id);
            if (amIn) {
              const mapped = mapDbRoomToRoomState(data.room, data.players);
              if (isLocallyVip) mapped.isPremiumRoom = true;

              setRoomState(mapped);
              setIsInRoom(true);
              bindRealtime(codeToRestore);
              return;
            }
          }
        } catch (e) {}
      }

      try {
        const raw = localStorage.getItem(`showtime_state_${codeToRestore}`);
        if (raw) {
          const localState = JSON.parse(raw) as RoomState;
          if (localState && localState.roomCode === codeToRestore) {
            const amIn = localState.players.some((p) => p.id === profile.id);
            if (amIn) {
              localState.settings = normalizeSettings(localState.settings);
              setRoomState(localState);
              setIsInRoom(true);
              bindRealtime(codeToRestore);
              return;
            }
          }
        }
      } catch (e) {}

      try {
        sessionStorage.removeItem('bara_active_room');
      } catch (e) {}
    };

    attemptReconnect();

    return () => {
      if (realtimeUnsubRef.current) realtimeUnsubRef.current();
      if (syncEngineRef.current) syncEngineRef.current.cleanup();
    };
  }, [profile.id, bindRealtime, isLocallyVip]);

  // 2.5-second Fallback Heartbeat Poll while in Room
  useEffect(() => {
    if (!isInRoom || !roomState.roomCode) return;

    const interval = setInterval(() => {
      refreshRoomFromDb(roomState.roomCode);
    }, 2500);

    return () => clearInterval(interval);
  }, [isInRoom, roomState.roomCode, refreshRoomFromDb]);

  // 1. Create Room
  const createRoom = useCallback(
    async (hostName: string, hostColor: PlayerColor) => {
      setIsConnecting(true);
      setKickedNotice(null);

      const code = Math.floor(1000 + Math.random() * 9000).toString();

      const hostPlayer: Player = {
        id: profile.id,
        room_code: code,
        name: hostName.trim() || 'المضيف',
        color: hostColor,
        isHost: true,
        is_host: true,
        isImpostor: false,
        is_impostor: false,
        mafiaRole: 'CIVILIAN',
        mafia_role: 'CIVILIAN',
        voted_for: null,
        score: 0,
        round_points: 0,
        roundPointsEarned: 0,
        isAlive: true,
        is_alive: true,
        is_online: true,
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
        sessionStorage.setItem('bara_active_room', code);
        localStorage.setItem(`showtime_state_${code}`, JSON.stringify(initialRoom));
      } catch (e) {}

      if (isOnline && isSupabaseConfigured()) {
        try {
          await createRoomInDb(code, hostPlayer, DEFAULT_CATEGORY_ID);
        } catch (err) {
          console.warn('[Bara] Supabase room creation failed, falling back locally', err);
        }
      }

      setRoomState(initialRoom);
      setIsInRoom(true);
      bindRealtime(code);
      setIsConnecting(false);
    },
    [profile.id, updateProfile, bindRealtime, isOnline, isLocallyVip]
  );

  // 2. Join Room with Strict Validation
  const joinRoom = useCallback(
    async (
      code: string,
      playerName: string,
      playerColor: PlayerColor
    ): Promise<{ success: boolean; error?: string }> => {
      setIsConnecting(true);
      setKickedNotice(null);

      const lang: 'ar' | 'en' =
        typeof window !== 'undefined' && localStorage.getItem('showtime_lang') === 'en'
          ? 'en'
          : 'ar';

      const cleanCode = code.trim().replace(/[^0-9]/g, '');
      if (cleanCode.length < 4) {
        setIsConnecting(false);
        return {
          success: false,
          error:
            lang === 'en'
              ? 'Please enter the 4-digit room code'
              : 'يرجى إدخال رمز الغرفة المكون من 4 أرقام',
        };
      }

      const newPlayer: Player = {
        id: profile.id,
        room_code: cleanCode,
        name: playerName.trim() || (lang === 'en' ? 'Player' : 'لاعب'),
        color: playerColor,
        isHost: false,
        is_host: false,
        isImpostor: false,
        is_impostor: false,
        mafiaRole: 'CIVILIAN',
        mafia_role: 'CIVILIAN',
        voted_for: null,
        score: 0,
        round_points: 0,
        roundPointsEarned: 0,
        isAlive: true,
        is_alive: true,
        is_online: true,
      };

      updateProfile({ name: playerName.trim(), color: playerColor });

      let joinedState: RoomState | null = null;
      let assignedColor = playerColor;

      if (isOnline && isSupabaseConfigured()) {
        try {
          const res = await joinRoomInDb(cleanCode, newPlayer, lang);
          if (res.success && res.room) {
            const myInDb = res.players?.find((p) => p.id === profile.id);
            if (myInDb && myInDb.color) {
              assignedColor = myInDb.color;
              newPlayer.color = assignedColor;
              updateProfile({ name: playerName.trim(), color: assignedColor });
            }
            joinedState = mapDbRoomToRoomState(res.room, res.players || [newPlayer]);
          } else {
            setIsConnecting(false);
            return {
              success: false,
              error:
                res.error ||
                (lang === 'en'
                  ? 'Room does not exist! Please check the 4-digit room code.'
                  : 'الغرفة غير موجودة! تأكد من رمز الغرفة الصحيح.'),
            };
          }
        } catch (err: any) {
          setIsConnecting(false);
          return {
            success: false,
            error:
              lang === 'en'
                ? 'An error occurred while connecting to the server'
                : 'حدث خطأ أثناء الاتصال بالخادم',
          };
        }
      }

      if (!joinedState) {
        let localSaved: RoomState | null = null;
        try {
          const raw = localStorage.getItem(`showtime_state_${cleanCode}`);
          if (raw) localSaved = JSON.parse(raw);
        } catch (e) {}

        if (
          localSaved &&
          localSaved.roomCode === cleanCode &&
          localSaved.players &&
          localSaved.players.length > 0
        ) {
          const usedColors = new Set(
            localSaved.players.filter((p) => p.id !== newPlayer.id).map((p) => p.color)
          );
          if (usedColors.has(assignedColor)) {
            const unused = PLAYER_COLORS.find((c) => !usedColors.has(c.hex));
            if (unused) assignedColor = unused.hex;
          }
          newPlayer.color = assignedColor;
          updateProfile({ name: playerName.trim(), color: assignedColor });

          const playerExists = localSaved.players.some((p) => p.id === newPlayer.id);
          const updatedPlayers = playerExists
            ? localSaved.players.map((p) =>
                p.id === newPlayer.id ? { ...p, name: newPlayer.name, color: assignedColor } : p
              )
            : [...localSaved.players, newPlayer];

          joinedState = {
            ...localSaved,
            players: updatedPlayers,
            settings: normalizeSettings(localSaved.settings),
          };
        } else {
          setIsConnecting(false);
          return {
            success: false,
            error:
              lang === 'en'
                ? 'Room does not exist! Please check the 4-digit room code.'
                : 'الغرفة غير موجودة! تأكد من رمز الغرفة الصحيح.',
          };
        }
      }

      if (isLocallyVip) {
        joinedState.isPremiumRoom = true;
      }

      try {
        sessionStorage.setItem('bara_active_room', cleanCode);
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
    },
    [profile.id, updateProfile, bindRealtime, isOnline, isLocallyVip]
  );

  // 3. Leave Room
  const leaveRoom = useCallback(async () => {
    if (roomState.roomCode) {
      if (isOnline && isSupabaseConfigured()) {
        try {
          await removePlayerFromDb(roomState.roomCode, profile.id);
        } catch (e) {}
      }
      if (syncEngineRef.current) {
        syncEngineRef.current.broadcast({
          type: 'PLAYER_LEAVE',
          roomCode: roomState.roomCode,
          senderId: profile.id,
          timestamp: Date.now(),
          payload: { playerId: profile.id },
        });
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
      sessionStorage.removeItem('bara_active_room');
      localStorage.removeItem('showtime_active_room');
      localStorage.removeItem('showtime_last_session');
    } catch (e) {}

    setIsInRoom(false);
    setRoomState(EMPTY_ROOM_STATE);
  }, [roomState.roomCode, profile.id, isOnline]);

  // 4. Kick Player
  const kickPlayer = useCallback(
    async (playerId: string) => {
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
    },
    [isHost, roomState, profile.id, broadcastRoomState, isOnline]
  );

  // 5. Select Category
  const setCategory = useCallback(
    async (categoryId: string) => {
      if (!isHost || !roomState.roomCode) return;

      if (isOnline && isSupabaseConfigured()) {
        try {
          await updateRoomInDb(roomState.roomCode, { category: categoryId });
        } catch (e) {}
      }

      const next = { ...roomState, selectedCategoryId: categoryId };
      broadcastRoomState(next);
    },
    [isHost, roomState, broadcastRoomState, isOnline]
  );

  // 6. Update Game Settings
  const updateSettings = useCallback(
    async (newSettings: Partial<GameSettings>) => {
      if (!isHost || !roomState.roomCode) return;

      const timerVal = newSettings.timer ?? newSettings.timerDuration ?? roomState.settings?.timer ?? roomState.settings?.timerDuration ?? 25;
      const mergedSettings = normalizeSettings({
        ...roomState.settings,
        ...newSettings,
        timer: timerVal,
        timerDuration: timerVal,
      });

      const next = { ...roomState, settings: mergedSettings };
      broadcastRoomState(next);

      if (isOnline && isSupabaseConfigured()) {
        try {
          await updateRoomInDb(roomState.roomCode, {
            settings: {
              ...mergedSettings,
              customCategory: roomState.customCategory,
            },
          });
        } catch (e) {}
      }
    },
    [isHost, roomState, broadcastRoomState, isOnline]
  );

  // 7. Update Custom Category
  const updateCustomCategory = useCallback(
    async (custom: CustomCategory) => {
      if (!isHost || !roomState.roomCode) return;

      const next = { ...roomState, customCategory: custom };
      broadcastRoomState(next);

      if (isOnline && isSupabaseConfigured()) {
        try {
          await updateRoomInDb(roomState.roomCode, {
            settings: {
              ...normalizeSettings(roomState.settings),
              customCategory: custom,
            },
          });
        } catch (e) {}
      }
    },
    [isHost, roomState, broadcastRoomState, isOnline]
  );

  // 8. Select Game Mode ('OUT_OF_THE_LOOP' | 'MAFIA')
  const setGameMode = useCallback(
    async (mode: GameMode) => {
      if (!isHost || !roomState.roomCode) return;

      const next = { ...roomState, gameMode: mode };
      broadcastRoomState(next);

      if (isOnline && isSupabaseConfigured()) {
        try {
          await updateRoomInDb(roomState.roomCode, { game_mode: mode });
        } catch (e) {}
      }
    },
    [isHost, roomState, broadcastRoomState, isOnline]
  );

  // 9. Reset Scores
  const resetScores = useCallback(async () => {
    if (!isHost || !roomState.roomCode) return;

    const resetPlayers: Player[] = roomState.players.map((p) => ({
      ...p,
      score: 0,
      round_points: 0,
      roundPointsEarned: 0,
    }));

    const next = { ...roomState, players: resetPlayers };
    broadcastRoomState(next);

    if (syncEngineRef.current) {
      syncEngineRef.current.broadcast({
        type: 'RESET_SCORES',
        roomCode: roomState.roomCode,
        senderId: profile.id,
        timestamp: Date.now(),
      });
    }

    if (isOnline && isSupabaseConfigured()) {
      try {
        await updatePlayersBatchInDb(resetPlayers);
      } catch (e) {}
    }
  }, [isHost, roomState, broadcastRoomState, profile.id, isOnline]);

  // 10. Floating Live Emoji Reaction
  const sendReaction = useCallback(
    (emoji: string) => {
      if (!roomState.roomCode) return;

      const reaction: EmojiReaction = {
        id: generateUUID(),
        playerId: profile.id,
        emoji,
        timestamp: Date.now(),
      };

      setActiveReactions((prev) => [...prev, reaction]);
      soundFx.playReactionPop();

      if (syncEngineRef.current) {
        syncEngineRef.current.broadcast({
          type: 'EMOJI_REACTION',
          roomCode: roomState.roomCode,
          senderId: profile.id,
          timestamp: Date.now(),
          payload: reaction,
        });
      }

      setTimeout(() => {
        setActiveReactions((prev) => prev.filter((r) => r.id !== reaction.id));
      }, 2500);
    },
    [roomState.roomCode, profile.id]
  );

  // 11. Activate VIP Room
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

    const shuffledAskOrder = cryptoShuffle(players);

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

  // Helper: Get word pool for category
  const getCategoryWordPool = (categoryId: string, custom?: CustomCategory): string[] => {
    if (categoryId === 'custom' && custom && custom.words?.length >= 8) {
      return custom.words;
    }
    const catList = getCategoriesWithLockStatus(roomState.isPremiumRoom || isLocallyVip);
    const cat = catList.find((c) => c.id === categoryId) || catList[0];
    return cat.words;
  };

  // 12. Start Game (Mode 1: Out of the Loop, 3+ players)
  const startGame = useCallback(async () => {
    if (!isHost || roomState.players.length < 3) return;
    resolvingVoteRef.current = false;

    const wordPool = getCategoryWordPool(roomState.selectedCategoryId, roomState.customCategory);
    const { secretWord, updatedUsedWords } = pickSmartWord(wordPool, roomState.usedWords || []);

    const playerCount = roomState.players.length;
    let impostorCount = 1;
    if (roomState.settings?.impostorCount === 'auto') {
      impostorCount = playerCount >= 7 ? 2 : 1;
    } else if (typeof roomState.settings?.impostorCount === 'number') {
      impostorCount = roomState.settings.impostorCount;
      if (impostorCount === 2 && playerCount < 5) impostorCount = 1;
      if (impostorCount === 3 && playerCount < 8) impostorCount = playerCount >= 5 ? 2 : 1;
    }

    const { impostorIds, updatedHistory } = pickSmartImpostors(
      roomState.players,
      impostorCount,
      roomState.lastImpostorIds || []
    );

    const partnerMap: Record<string, string> = {};
    const updatedPlayers: Player[] = roomState.players.map((p) => {
      const isImp = impostorIds.includes(p.id);
      let partnerId: string | undefined = undefined;
      if (isImp && impostorCount > 1) {
        partnerId = impostorIds.find((id) => id !== p.id);
        if (partnerId) partnerMap[p.id] = partnerId;
      }
      return {
        ...p,
        isImpostor: isImp,
        is_impostor: isImp,
        mafiaRole: isImp ? 'IMPOSTOR' : 'CIVILIAN',
        mafia_role: isImp ? 'IMPOSTOR' : 'CIVILIAN',
        impostorPartnerId: partnerId,
        hasVoted: false,
        votedTargetId: undefined,
        voted_for: null,
        roundPointsEarned: 0,
        round_points: 0,
        isAlive: true,
        is_alive: true,
      };
    });

    const pairs = generateQuestionPairs(updatedPlayers);

    if (isOnline && isSupabaseConfigured()) {
      try {
        await updatePlayersBatchInDb(updatedPlayers);
        await updateRoomInDb(roomState.roomCode, {
          phase: 'ROLE_REVEAL',
          game_mode: 'OUT_OF_THE_LOOP',
          secret_word: secretWord,
          question_pairs: pairs,
          current_pair_index: 0,
          turn_started_at: null,
          votes_revealed: false,
          caught_impostor_id: null,
          word_options: [],
          impostor_guess: null,
          winner: null,
          win_reason: null,
          used_words: updatedUsedWords,
          last_impostor_ids: updatedHistory,
          mafia_state: { partners: partnerMap, roundNumber: roomState.roundNumber },
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
      lastImpostorIds: updatedHistory,
      usedWords: updatedUsedWords,
    };

    broadcastRoomState(newState);
  }, [isHost, roomState, broadcastRoomState, isOnline, isLocallyVip]);

  // 13. Start Questions
  const startQuestions = useCallback(async () => {
    if (!isHost) return;

    const timerDur = roomState.settings?.timer ?? roomState.settings?.timerDuration ?? 25;
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

  // 14. Next Question Pair
  const nextQuestionPair = useCallback(async () => {
    if (!isHost) return;

    const timerDur = roomState.settings?.timer ?? roomState.settings?.timerDuration ?? 25;
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
      resolvingVoteRef.current = false;
      const resetPlayers: Player[] = roomState.players.map((p) => ({
        ...p,
        hasVoted: false,
        votedTargetId: undefined,
        voted_for: null,
      }));

      if (isOnline && isSupabaseConfigured()) {
        try {
          await updatePlayersBatchInDb(resetPlayers);
          await updateRoomInDb(roomState.roomCode, {
            phase: 'VOTING',
            turn_started_at: null,
            votes_revealed: false,
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
  const generateLastChanceOptions = (
    secretWord: string,
    categoryId: string,
    custom?: CustomCategory
  ): string[] => {
    let decoys: string[] = [];

    if (categoryId === 'custom' && custom && custom.words?.length >= 8) {
      decoys = custom.words.filter((w) => w !== secretWord);
    } else {
      const catList = getCategoriesWithLockStatus(true);
      const cat = catList.find((c) => c.id === categoryId) || catList[0];
      decoys = cat.words.filter((w) => w !== secretWord);
    }

    const shuffledDecoys = cryptoShuffle(decoys).slice(0, 7);
    return cryptoShuffle([secretWord, ...shuffledDecoys]);
  };

  /**
   * Exact Competitive Scoring Rules (Issue 4):
   * Out of the Loop:
   * - Civilian who voted for the Impostor: +100 pts.
   * - Team bonus to every Civilian if Impostor loses LAST_CHANCE: +50 pts.
   * - Impostor escapes voting: +200 pts.
   * - Impostor caught but guesses secret word in LAST_CHANCE: +150 pts.
   */
  const calculateScoring = (
    players: Player[],
    votes: Record<string, string>,
    winner: 'IMPOSTOR' | 'CIVILIANS',
    winReason: 'ESCAPED' | 'GUESSED_WORD' | 'WRONG_GUESS'
  ): Player[] => {
    const impostorIds = players
      .filter((p) => p.isImpostor || p.is_impostor)
      .map((p) => p.id);

    return players.map((p) => {
      let pointsEarned = 0;
      const isImp = Boolean(p.isImpostor || p.is_impostor);

      if (!isImp) {
        // Civilian who voted for the Impostor: +100 pts
        const targetId = p.voted_for || p.votedTargetId || votes[p.id];
        if (targetId && impostorIds.includes(targetId)) {
          pointsEarned += 100;
        }
        // Team bonus to every Civilian if Impostor loses LAST_CHANCE: +50 pts
        if (winner === 'CIVILIANS' && winReason === 'WRONG_GUESS') {
          pointsEarned += 50;
        }
      } else {
        // Impostor
        if (winner === 'IMPOSTOR' && winReason === 'ESCAPED') {
          pointsEarned += 200;
        } else if (winner === 'IMPOSTOR' && winReason === 'GUESSED_WORD') {
          pointsEarned += 150;
        }
      }

      const nextScore = (p.score || 0) + pointsEarned;

      return {
        ...p,
        roundPointsEarned: pointsEarned,
        round_points: pointsEarned,
        score: nextScore,
      };
    });
  };

  // Resolve Out-of-the-Loop Voting Round
  const resolveVotingRound = useCallback(async () => {
    if (roomState.phase !== 'VOTING' || resolvingVoteRef.current) return;
    resolvingVoteRef.current = true;

    const currentVotes: Record<string, string> = { ...roomState.votes };
    roomState.players.forEach((p) => {
      const vf = p.voted_for || p.votedTargetId || currentVotes[p.id];
      if (vf) currentVotes[p.id] = vf;
    });

    const syncedPlayers: Player[] = roomState.players.map((p) => {
      const vf = currentVotes[p.id] || null;
      return {
        ...p,
        voted_for: vf,
        votedTargetId: vf || undefined,
        hasVoted: Boolean(vf),
      };
    });

    // 1. Reveal votes across all screens
    const revealState: RoomState = {
      ...roomState,
      votes: currentVotes,
      players: syncedPlayers,
      votingRevealed: true,
    };

    broadcastRoomState(revealState);

    if (isOnline && isSupabaseConfigured()) {
      try {
        await updatePlayersBatchInDb(syncedPlayers);
        await updateRoomInDb(roomState.roomCode, {
          votes_revealed: true,
        });
      } catch (e) {}
    }

    // 2. After 2.5s reveal, transition to LAST_CHANCE or GAME_OVER
    setTimeout(async () => {
      const voteCounts: Record<string, number> = {};
      Object.values(currentVotes).forEach((tid) => {
        if (tid && tid !== 'SKIP') {
          voteCounts[tid] = (voteCounts[tid] || 0) + 1;
        }
      });

      let maxVotes = 0;
      Object.values(voteCounts).forEach((c) => {
        if (c > maxVotes) maxVotes = c;
      });

      const tiedTargetIds =
        maxVotes > 0 ? Object.keys(voteCounts).filter((id) => voteCounts[id] === maxVotes) : [];
      const tiedImpostors = syncedPlayers.filter(
        (p) => tiedTargetIds.includes(p.id) && (p.isImpostor || p.is_impostor)
      );

      if (tiedImpostors.length > 0) {
        const caughtImpostor = tiedImpostors[0];
        const lastChanceOptions = generateLastChanceOptions(
          roomState.secretWord,
          roomState.selectedCategoryId,
          roomState.customCategory
        );

        const lastChanceState: RoomState = {
          ...roomState,
          votes: currentVotes,
          players: syncedPlayers,
          votingRevealed: true,
          phase: 'LAST_CHANCE',
          caughtImpostorId: caughtImpostor.id,
          lastChanceOptions,
        };

        if (isOnline && isSupabaseConfigured()) {
          try {
            await updatePlayersBatchInDb(syncedPlayers);
            await updateRoomInDb(roomState.roomCode, {
              phase: 'LAST_CHANCE',
              votes_revealed: true,
              caught_impostor_id: caughtImpostor.id,
              word_options: lastChanceOptions,
            });
          } catch (e) {}
        }

        broadcastRoomState(lastChanceState);
      } else {
        // Impostor Escaped!
        soundFx.playVictory();

        const scoredPlayers = calculateScoring(
          syncedPlayers,
          currentVotes,
          'IMPOSTOR',
          'ESCAPED'
        );

        if (isOnline && isSupabaseConfigured()) {
          try {
            await updatePlayersBatchInDb(scoredPlayers);
            await updateRoomInDb(roomState.roomCode, {
              phase: 'GAME_OVER',
              votes_revealed: true,
              winner: 'IMPOSTOR',
              win_reason: 'ESCAPED',
              caught_impostor_id: null,
            });
          } catch (e) {}
        }

        const gameOverState: RoomState = {
          ...roomState,
          votes: currentVotes,
          players: scoredPlayers,
          votingRevealed: true,
          phase: 'GAME_OVER',
          winner: 'IMPOSTOR',
          winReason: 'ESCAPED',
          caughtImpostorId: null,
        };
        broadcastRoomState(gameOverState);
      }
    }, 2500);
  }, [roomState, broadcastRoomState, isOnline]);

  // 15. Submit Vote (Out of the Loop)
  const submitVote = useCallback(
    async (voterId: string, targetId: string) => {
      if (voterId === targetId) return;

      soundFx.playVoteClick();

      const nextVotes = { ...roomState.votes, [voterId]: targetId };
      const updatedPlayers: Player[] = roomState.players.map((p) =>
        p.id === voterId
          ? {
              ...p,
              hasVoted: true,
              votedTargetId: targetId,
              voted_for: targetId,
            }
          : p
      );

      const nextState: RoomState = {
        ...roomState,
        votes: nextVotes,
        players: updatedPlayers,
      };

      setRoomState(nextState);

      if (syncEngineRef.current) {
        syncEngineRef.current.broadcast({
          type: 'SUBMIT_VOTE',
          roomCode: roomState.roomCode,
          senderId: profile.id,
          timestamp: Date.now(),
          payload: { voterId, targetId },
        });
        syncEngineRef.current.saveRoomState(nextState);
      }

      if (isOnline && isSupabaseConfigured()) {
        try {
          await updatePlayerVoteInDb(voterId, targetId);
        } catch (e) {}
      }
    },
    [roomState, profile.id, isOnline]
  );

  // 16. Impostor Guess (Last Chance)
  const submitImpostorGuess = useCallback(
    async (guess: string) => {
      if (roomState.phase !== 'LAST_CHANCE') return;

      soundFx.playVictory();

      const isCorrect = guess === roomState.secretWord;
      const winner: 'IMPOSTOR' | 'CIVILIANS' = isCorrect ? 'IMPOSTOR' : 'CIVILIANS';
      const winReason: 'GUESSED_WORD' | 'WRONG_GUESS' = isCorrect ? 'GUESSED_WORD' : 'WRONG_GUESS';

      const scoredPlayers = calculateScoring(
        roomState.players,
        roomState.votes,
        winner,
        winReason
      );

      if (isOnline && isSupabaseConfigured()) {
        try {
          await updatePlayersBatchInDb(scoredPlayers);
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
        players: scoredPlayers,
      };
      broadcastRoomState(finalState);
    },
    [roomState, broadcastRoomState, isOnline]
  );

  // 17. Play Again (Out of the Loop)
  const playAgain = useCallback(async () => {
    if (!isHost || roomState.players.length < 3) return;
    resolvingVoteRef.current = false;

    const wordPool = getCategoryWordPool(roomState.selectedCategoryId, roomState.customCategory);
    const { secretWord, updatedUsedWords } = pickSmartWord(wordPool, roomState.usedWords || []);

    const playerCount = roomState.players.length;
    let impostorCount = 1;
    if (roomState.settings?.impostorCount === 'auto') {
      impostorCount = playerCount >= 7 ? 2 : 1;
    } else if (typeof roomState.settings?.impostorCount === 'number') {
      impostorCount = roomState.settings.impostorCount;
      if (impostorCount === 2 && playerCount < 5) impostorCount = 1;
      if (impostorCount === 3 && playerCount < 8) impostorCount = playerCount >= 5 ? 2 : 1;
    }

    const { impostorIds, updatedHistory } = pickSmartImpostors(
      roomState.players,
      impostorCount,
      roomState.lastImpostorIds || []
    );

    const partnerMap: Record<string, string> = {};
    const resetPlayers: Player[] = roomState.players.map((p) => {
      const isImp = impostorIds.includes(p.id);
      let partnerId: string | undefined = undefined;
      if (isImp && impostorCount > 1) {
        partnerId = impostorIds.find((id) => id !== p.id);
        if (partnerId) partnerMap[p.id] = partnerId;
      }
      return {
        ...p,
        isImpostor: isImp,
        is_impostor: isImp,
        mafiaRole: isImp ? 'IMPOSTOR' : 'CIVILIAN',
        mafia_role: isImp ? 'IMPOSTOR' : 'CIVILIAN',
        impostorPartnerId: partnerId,
        hasVoted: false,
        votedTargetId: undefined,
        voted_for: null,
        roundPointsEarned: 0,
        round_points: 0,
        isAlive: true,
        is_alive: true,
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
          votes_revealed: false,
          caught_impostor_id: null,
          word_options: [],
          impostor_guess: null,
          winner: null,
          win_reason: null,
          used_words: updatedUsedWords,
          last_impostor_ids: updatedHistory,
          mafia_state: { partners: partnerMap, roundNumber: roomState.roundNumber + 1 },
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
      lastImpostorIds: updatedHistory,
      usedWords: updatedUsedWords,
    };

    broadcastRoomState(newState);
  }, [isHost, roomState, broadcastRoomState, isOnline, isLocallyVip]);

  // 18. Back to Lobby
  const backToLobby = useCallback(async () => {
    if (!isHost) return;
    resolvingVoteRef.current = false;

    const resetPlayers: Player[] = roomState.players.map((p) => ({
      ...p,
      isImpostor: false,
      is_impostor: false,
      impostorPartnerId: undefined,
      hasVoted: false,
      votedTargetId: undefined,
      voted_for: null,
      roundPointsEarned: 0,
      round_points: 0,
      isAlive: true,
      is_alive: true,
      mafiaRole: 'CIVILIAN',
      mafia_role: 'CIVILIAN',
      doctorSelfSavedCount: 0,
    }));

    if (isOnline && isSupabaseConfigured()) {
      try {
        await updatePlayersBatchInDb(resetPlayers);
        await updateRoomInDb(roomState.roomCode, {
          phase: 'LOBBY',
          turn_started_at: null,
          votes_revealed: false,
          caught_impostor_id: null,
          word_options: [],
          impostor_guess: null,
          winner: null,
          win_reason: null,
          mafia_state: {},
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
      mafiaNightVictimId: null,
      mafiaNightProtectedId: null,
      mafiaNightInvestigatedId: null,
      mafiaNightKilledPlayerId: null,
      mafiaNightSaved: false,
      mafiaExiledPlayerId: null,
      mafiaRound: 1,
    };

    broadcastRoomState(newState);
  }, [isHost, roomState, broadcastRoomState, isOnline]);

  // =========================================================================
  // MODE 2: MAFIA
  // =========================================================================

  // 19. Start Mafia Game (Guaranteed Role Distribution Algorithm)
  const startMafiaGame = useCallback(async () => {
    if (!isHost || roomState.players.length < 3) return;
    resolvingVoteRef.current = false;

    const n = roomState.players.length;
    const rolesList: MafiaRole[] = ['IMPOSTOR', 'DOCTOR', 'DETECTIVE'];
    for (let i = 3; i < n; i++) {
      if (n >= 7 && i === 3) {
        rolesList.push('IMPOSTOR');
      } else {
        rolesList.push('CIVILIAN');
      }
    }

    const shuffledRoles = cryptoShuffle(rolesList);

    const roleMap: Record<string, MafiaRole> = {};
    const impostorIds: string[] = [];

    roomState.players.forEach((p, idx) => {
      const assignedRole = shuffledRoles[idx];
      roleMap[p.id] = assignedRole;
      if (assignedRole === 'IMPOSTOR') {
        impostorIds.push(p.id);
      }
    });

    const partnerMap: Record<string, string> = {};
    const mafiaPlayers: Player[] = roomState.players.map((p) => {
      const role = roleMap[p.id];
      const partnerId =
        role === 'IMPOSTOR' && impostorIds.length > 1
          ? impostorIds.find((id) => id !== p.id)
          : undefined;
      if (partnerId) partnerMap[p.id] = partnerId;

      return {
        ...p,
        isImpostor: role === 'IMPOSTOR',
        is_impostor: role === 'IMPOSTOR',
        impostorPartnerId: partnerId,
        mafiaRole: role,
        mafia_role: role,
        isAlive: true,
        is_alive: true,
        hasVoted: false,
        votedTargetId: undefined,
        voted_for: null,
        roundPointsEarned: 0,
        round_points: 0,
        doctorSelfSavedCount: 0,
      };
    });

    const mafiaStatePayload = {
      roles: roleMap,
      partners: partnerMap,
      victimId: null,
      protectedId: null,
      investigatedId: null,
      killedPlayerId: null,
      saved: false,
      exiledPlayerId: null,
      round: 1,
    };

    const newState: RoomState = {
      ...roomState,
      gameMode: 'MAFIA',
      phase: 'MAFIA_ROLE_REVEAL',
      players: mafiaPlayers,
      votes: {},
      votingRevealed: false,
      winner: null,
      winReason: null,
      questionPairs: [],
      lastImpostorIds: impostorIds,
      mafiaNightVictimId: null,
      mafiaNightProtectedId: null,
      mafiaNightInvestigatedId: null,
      mafiaNightKilledPlayerId: null,
      mafiaNightSaved: false,
      mafiaExiledPlayerId: null,
      mafiaRound: 1,
      mafiaNightTimeRemaining: 30,
      mafiaDiscussionTimeRemaining: 60,
    };

    if (isOnline && isSupabaseConfigured()) {
      try {
        await updatePlayersBatchInDb(mafiaPlayers);
        await updateRoomInDb(roomState.roomCode, {
          phase: 'MAFIA_ROLE_REVEAL',
          game_mode: 'MAFIA',
          votes_revealed: false,
          winner: null,
          win_reason: null,
          mafia_state: mafiaStatePayload,
        });
      } catch (e) {}
    }

    broadcastRoomState(newState);
  }, [isHost, roomState, broadcastRoomState, isOnline]);

  // 20. Start Mafia Night (30s timer)
  const startMafiaNight = useCallback(async () => {
    if (!isHost) return;
    resolvingVoteRef.current = false;

    soundFx.playNightFall();

    const turnStartedAt = new Date().toISOString();

    const nextPlayers: Player[] = roomState.players.map((p) => ({
      ...p,
      hasVoted: false,
      votedTargetId: undefined,
      voted_for: null,
    }));

    const nextState: RoomState = {
      ...roomState,
      phase: 'MAFIA_NIGHT',
      players: nextPlayers,
      votes: {},
      votingRevealed: false,
      turnStartedAt,
      mafiaNightVictimId: null,
      mafiaNightProtectedId: null,
      mafiaNightInvestigatedId: null,
      mafiaNightKilledPlayerId: null,
      mafiaNightSaved: false,
      mafiaExiledPlayerId: null,
      mafiaNightTimeRemaining: 30,
    };

    if (isOnline && isSupabaseConfigured()) {
      try {
        await updatePlayersBatchInDb(nextPlayers);
        await updateRoomInDb(roomState.roomCode, {
          phase: 'MAFIA_NIGHT',
          turn_started_at: turnStartedAt,
          votes_revealed: false,
          mafia_state: {
            victimId: null,
            protectedId: null,
            investigatedId: null,
            killedPlayerId: null,
            saved: false,
            exiledPlayerId: null,
            round: roomState.mafiaRound || 1,
          },
        });
      } catch (e) {}
    }

    broadcastRoomState(nextState);
  }, [isHost, roomState, broadcastRoomState, isOnline]);

  // 21. Submit Mafia Night Action
  const submitMafiaNightAction = useCallback(
    async (action: { role: MafiaRole; targetId: string }) => {
      soundFx.playVoteClick();

      let victimId = roomState.mafiaNightVictimId;
      let protectedId = roomState.mafiaNightProtectedId;
      let investigatedId = roomState.mafiaNightInvestigatedId;

      if (action.role === 'IMPOSTOR') {
        victimId = action.targetId;
      } else if (action.role === 'DOCTOR') {
        protectedId = action.targetId;
      } else if (action.role === 'DETECTIVE') {
        investigatedId = action.targetId;
      }

      const updatedPlayers: Player[] = roomState.players.map((p) => {
        if (p.id === profile.id) {
          const docCount =
            action.role === 'DOCTOR' && action.targetId === p.id
              ? (p.doctorSelfSavedCount || 0) + 1
              : p.doctorSelfSavedCount;
          return { ...p, hasVoted: true, doctorSelfSavedCount: docCount };
        }
        return p;
      });

      const nextState: RoomState = {
        ...roomState,
        players: updatedPlayers,
        mafiaNightVictimId: victimId,
        mafiaNightProtectedId: protectedId,
        mafiaNightInvestigatedId: investigatedId,
      };

      if (isOnline && isSupabaseConfigured()) {
        try {
          await updateRoomInDb(roomState.roomCode, {
            mafia_state: {
              victimId,
              protectedId,
              investigatedId,
              killedPlayerId: roomState.mafiaNightKilledPlayerId,
              saved: roomState.mafiaNightSaved,
              exiledPlayerId: roomState.mafiaExiledPlayerId,
              round: roomState.mafiaRound || 1,
            },
          });
        } catch (e) {}
      }

      broadcastRoomState(nextState);
    },
    [roomState, profile.id, broadcastRoomState, isOnline]
  );

  // 22. Resolve Mafia Night -> Morning Discussion
  const resolveMafiaNight = useCallback(async () => {
    if (!isHost) return;

    const victim = roomState.mafiaNightVictimId;
    const protectedTarget = roomState.mafiaNightProtectedId;

    let killedPlayerId: string | null = null;
    let saved = false;

    if (victim) {
      if (victim === protectedTarget) {
        killedPlayerId = null;
        saved = true;
      } else {
        killedPlayerId = victim;
        saved = false;
      }
    }

    const updatedPlayers: Player[] = roomState.players.map((p) => {
      if (killedPlayerId && p.id === killedPlayerId) {
        return { ...p, isAlive: false, is_alive: false, hasVoted: false, voted_for: null, votedTargetId: undefined };
      }
      return { ...p, hasVoted: false, voted_for: null, votedTargetId: undefined };
    });

    const livingImpostors = updatedPlayers.filter(
      (p) => p.isAlive !== false && p.is_alive !== false && (p.mafiaRole === 'IMPOSTOR' || p.isImpostor)
    );
    const livingInnocents = updatedPlayers.filter(
      (p) => p.isAlive !== false && p.is_alive !== false && p.mafiaRole !== 'IMPOSTOR' && !p.isImpostor
    );

    if (livingImpostors.length >= livingInnocents.length) {
      soundFx.playVictory();

      // Award +250 pts to Impostors
      const scoredPlayers: Player[] = updatedPlayers.map((p) => {
        const isImp = p.mafiaRole === 'IMPOSTOR' || p.isImpostor;
        const pointsEarned = isImp ? 250 : 0;
        return {
          ...p,
          roundPointsEarned: pointsEarned,
          round_points: pointsEarned,
          score: (p.score || 0) + pointsEarned,
        };
      });

      if (isOnline && isSupabaseConfigured()) {
        try {
          await updatePlayersBatchInDb(scoredPlayers);
          await updateRoomInDb(roomState.roomCode, {
            phase: 'GAME_OVER',
            winner: 'IMPOSTOR',
            win_reason: 'ESCAPED',
            mafia_state: {
              killedPlayerId,
              saved,
              round: roomState.mafiaRound || 1,
            },
          });
        } catch (e) {}
      }

      const gameOverState: RoomState = {
        ...roomState,
        phase: 'GAME_OVER',
        winner: 'IMPOSTOR',
        winReason: 'ESCAPED',
        players: scoredPlayers,
        mafiaNightKilledPlayerId: killedPlayerId,
        mafiaNightSaved: saved,
      };

      broadcastRoomState(gameOverState);
      return;
    }

    soundFx.playMorningSun();
    const turnStartedAt = new Date().toISOString();

    const morningState: RoomState = {
      ...roomState,
      phase: 'MAFIA_MORNING_DISCUSSION',
      players: updatedPlayers,
      mafiaNightKilledPlayerId: killedPlayerId,
      mafiaNightSaved: saved,
      turnStartedAt,
      mafiaDiscussionTimeRemaining: 60,
    };

    if (isOnline && isSupabaseConfigured()) {
      try {
        await updatePlayersBatchInDb(updatedPlayers);
        await updateRoomInDb(roomState.roomCode, {
          phase: 'MAFIA_MORNING_DISCUSSION',
          turn_started_at: turnStartedAt,
          mafia_state: {
            killedPlayerId,
            saved,
            round: roomState.mafiaRound || 1,
          },
        });
      } catch (e) {}
    }

    broadcastRoomState(morningState);
  }, [isHost, roomState, broadcastRoomState, isOnline]);

  // 23. Start Mafia Court Voting
  const startMafiaVoting = useCallback(async () => {
    if (!isHost) return;
    resolvingVoteRef.current = false;

    soundFx.playGavel();

    const resetVotesPlayers: Player[] = roomState.players.map((p) => ({
      ...p,
      hasVoted: false,
      votedTargetId: undefined,
      voted_for: null,
    }));

    const votingState: RoomState = {
      ...roomState,
      phase: 'MAFIA_VOTING',
      players: resetVotesPlayers,
      votes: {},
      votingRevealed: false,
      mafiaExiledPlayerId: null,
    };

    if (isOnline && isSupabaseConfigured()) {
      try {
        await updatePlayersBatchInDb(resetVotesPlayers);
        await updateRoomInDb(roomState.roomCode, {
          phase: 'MAFIA_VOTING',
          votes_revealed: false,
          mafia_state: {
            exiledPlayerId: null,
            round: roomState.mafiaRound || 1,
          },
        });
      } catch (e) {}
    }

    broadcastRoomState(votingState);
  }, [isHost, roomState, broadcastRoomState, isOnline]);

  // Resolve Mafia Court Voting
  const resolveMafiaVotingRound = useCallback(async () => {
    if (roomState.phase !== 'MAFIA_VOTING' || resolvingVoteRef.current) return;
    resolvingVoteRef.current = true;

    const currentVotes: Record<string, string> = { ...roomState.votes };
    roomState.players.forEach((p) => {
      const vf = p.voted_for || p.votedTargetId || currentVotes[p.id];
      if (vf) currentVotes[p.id] = vf;
    });

    const syncedPlayers: Player[] = roomState.players.map((p) => {
      const vf = currentVotes[p.id] || null;
      return {
        ...p,
        voted_for: vf,
        votedTargetId: vf || undefined,
        hasVoted: Boolean(vf),
      };
    });

    const activeVoters = syncedPlayers.filter(
      (p) => p.isAlive !== false && p.is_alive !== false
    );

    const voteCounts: Record<string, number> = {};
    activeVoters.forEach((p) => {
      const tid = p.voted_for || currentVotes[p.id];
      if (tid) {
        voteCounts[tid] = (voteCounts[tid] || 0) + 1;
      }
    });

    let maxTarget = '';
    let maxCount = 0;
    let isTie = false;

    Object.entries(voteCounts).forEach(([tid, count]) => {
      if (count > maxCount) {
        maxCount = count;
        maxTarget = tid;
        isTie = false;
      } else if (count === maxCount) {
        isTie = true;
      }
    });

    // Skip Tie/Majority Rule: If 'SKIP' receives most votes OR there is a tie, nobody is exiled!
    let exiledId: string | null = null;
    if (!isTie && maxTarget && maxTarget !== 'SKIP') {
      exiledId = maxTarget;
    }

    const postVotePlayers: Player[] = syncedPlayers.map((p) => {
      if (exiledId && p.id === exiledId) {
        return { ...p, isAlive: false, is_alive: false };
      }
      return p;
    });

    // Check Win Condition after Court
    const livingImpostors = postVotePlayers.filter(
      (p) => p.isAlive !== false && p.is_alive !== false && (p.mafiaRole === 'IMPOSTOR' || p.isImpostor)
    );
    const livingInnocents = postVotePlayers.filter(
      (p) => p.isAlive !== false && p.is_alive !== false && p.mafiaRole !== 'IMPOSTOR' && !p.isImpostor
    );

    // 1. All Impostors exiled -> Town / Civilians Win! (+150 pts each to Town members)
    if (livingImpostors.length === 0) {
      soundFx.playVictory();

      const scoredPlayers: Player[] = postVotePlayers.map((p) => {
        const isTown = p.mafiaRole !== 'IMPOSTOR' && !p.isImpostor;
        const pointsEarned = isTown ? 150 : 0;
        return {
          ...p,
          roundPointsEarned: pointsEarned,
          round_points: pointsEarned,
          score: (p.score || 0) + pointsEarned,
        };
      });

      if (isOnline && isSupabaseConfigured()) {
        try {
          await updatePlayersBatchInDb(scoredPlayers);
          await updateRoomInDb(roomState.roomCode, {
            phase: 'GAME_OVER',
            winner: 'CIVILIANS',
            win_reason: 'WRONG_GUESS',
            votes_revealed: true,
            mafia_state: {
              exiledPlayerId: exiledId,
              round: roomState.mafiaRound || 1,
            },
          });
        } catch (e) {}
      }

      const gameOverState: RoomState = {
        ...roomState,
        phase: 'GAME_OVER',
        winner: 'CIVILIANS',
        winReason: 'WRONG_GUESS',
        votingRevealed: true,
        votes: currentVotes,
        players: scoredPlayers,
        mafiaExiledPlayerId: exiledId,
      };

      broadcastRoomState(gameOverState);
      return;
    }

    // 2. Impostors outnumber/equal living innocents -> Impostor Wins! (+250 pts each)
    if (livingImpostors.length >= livingInnocents.length) {
      soundFx.playVictory();

      const scoredPlayers: Player[] = postVotePlayers.map((p) => {
        const isImp = p.mafiaRole === 'IMPOSTOR' || p.isImpostor;
        const pointsEarned = isImp ? 250 : 0;
        return {
          ...p,
          roundPointsEarned: pointsEarned,
          round_points: pointsEarned,
          score: (p.score || 0) + pointsEarned,
        };
      });

      if (isOnline && isSupabaseConfigured()) {
        try {
          await updatePlayersBatchInDb(scoredPlayers);
          await updateRoomInDb(roomState.roomCode, {
            phase: 'GAME_OVER',
            winner: 'IMPOSTOR',
            win_reason: 'ESCAPED',
            votes_revealed: true,
            mafia_state: {
              exiledPlayerId: exiledId,
              round: roomState.mafiaRound || 1,
            },
          });
        } catch (e) {}
      }

      const gameOverState: RoomState = {
        ...roomState,
        phase: 'GAME_OVER',
        winner: 'IMPOSTOR',
        winReason: 'ESCAPED',
        votingRevealed: true,
        votes: currentVotes,
        players: scoredPlayers,
        mafiaExiledPlayerId: exiledId,
      };

      broadcastRoomState(gameOverState);
      return;
    }

    // 3. Otherwise: Reveal court result and allow transition to next Night
    const courtResultState: RoomState = {
      ...roomState,
      phase: 'MAFIA_VOTING',
      votes: currentVotes,
      votingRevealed: true,
      players: postVotePlayers,
      mafiaExiledPlayerId: exiledId,
    };

    if (isOnline && isSupabaseConfigured()) {
      try {
        await updatePlayersBatchInDb(postVotePlayers);
        await updateRoomInDb(roomState.roomCode, {
          votes_revealed: true,
          mafia_state: {
            exiledPlayerId: exiledId,
            round: roomState.mafiaRound || 1,
          },
        });
      } catch (e) {}
    }

    broadcastRoomState(courtResultState);
  }, [roomState, broadcastRoomState, isOnline]);

  // 24. Submit Mafia Vote (Target player ID or 'SKIP')
  const submitMafiaVote = useCallback(
    async (voterId: string, targetId: string) => {
      soundFx.playVoteClick();

      const nextVotes = { ...roomState.votes, [voterId]: targetId };
      const updatedPlayers: Player[] = roomState.players.map((p) =>
        p.id === voterId
          ? {
              ...p,
              hasVoted: true,
              votedTargetId: targetId,
              voted_for: targetId,
            }
          : p
      );

      const nextState: RoomState = {
        ...roomState,
        votes: nextVotes,
        players: updatedPlayers,
      };

      setRoomState(nextState);

      if (syncEngineRef.current) {
        syncEngineRef.current.broadcast({
          type: 'SUBMIT_VOTE',
          roomCode: roomState.roomCode,
          senderId: profile.id,
          timestamp: Date.now(),
          payload: { voterId, targetId },
        });
        syncEngineRef.current.saveRoomState(nextState);
      }

      if (isOnline && isSupabaseConfigured()) {
        try {
          await updatePlayerVoteInDb(voterId, targetId);
        } catch (e) {}
      }
    },
    [roomState, profile.id, isOnline]
  );

  // AUTO-RESOLUTION GUARANTEE (Issue 3):
  // Watch activeVoters & votesCast in VOTING and MAFIA_VOTING phases.
  useEffect(() => {
    if (roomState.votingRevealed || resolvingVoteRef.current) return;

    if (roomState.phase === 'VOTING') {
      const activeVoters = roomState.players.filter(
        (p) => p.is_alive !== false && p.isAlive !== false
      );
      const votesCast = activeVoters.filter((p) => {
        const vf = p.voted_for ?? p.votedTargetId ?? roomState.votes[p.id];
        return vf !== null && vf !== undefined && vf !== '';
      });

      if (votesCast.length > 0 && votesCast.length >= activeVoters.length) {
        resolveVotingRound();
      }
    } else if (roomState.phase === 'MAFIA_VOTING') {
      const activeVoters = roomState.players.filter(
        (p) => p.is_alive !== false && p.isAlive !== false
      );
      const votesCast = activeVoters.filter((p) => {
        const vf = p.voted_for ?? p.votedTargetId ?? roomState.votes[p.id];
        return vf !== null && vf !== undefined && vf !== '';
      });

      if (votesCast.length > 0 && votesCast.length >= activeVoters.length) {
        resolveMafiaVotingRound();
      }
    }
  }, [
    roomState.phase,
    roomState.players,
    roomState.votes,
    roomState.votingRevealed,
    resolveVotingRound,
    resolveMafiaVotingRound,
  ]);

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
  };
}
