import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Player, RoomState, GamePhase, PlayerColor, MafiaRole, QuestionPair, GameSettings } from '../types/game';
import { PLAYER_COLORS } from '../data/categories';

const rawUrl = import.meta.env.VITE_SUPABASE_URL;
const rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = (): boolean => {
  if (!rawUrl || !rawKey) return false;
  if (typeof rawUrl !== 'string' || typeof rawKey !== 'string') return false;

  const cleanUrl = rawUrl.trim();
  const cleanKey = rawKey.trim();

  if (
    cleanUrl.includes('your-project') ||
    cleanUrl.includes('placeholder') ||
    cleanUrl.includes('example.com') ||
    cleanKey.includes('your-anon') ||
    cleanKey.includes('placeholder') ||
    !cleanUrl.startsWith('http') ||
    cleanKey.length < 20
  ) {
    return false;
  }

  return true;
};

export const supabase: SupabaseClient | null = isSupabaseConfigured()
  ? createClient(rawUrl.trim(), rawKey.trim())
  : null;

// Test actual live connection to Supabase
export async function testSupabaseConnection(): Promise<boolean> {
  if (!supabase || !isSupabaseConfigured()) return false;

  try {
    const { error } = await supabase.from('rooms').select('code').limit(1);
    return !error;
  } catch (err) {
    console.warn('[Supabase] Connection test failed, will use local sync mode:', err);
    return false;
  }
}

// Normalize settings object so both timer and timerDuration are always valid numbers
export function normalizeSettings(raw?: any): GameSettings {
  const timerVal = raw?.timer ?? raw?.timerDuration ?? 25;
  const validTimer = (typeof timerVal === 'number' && !Number.isNaN(timerVal) ? timerVal : 25) as 15 | 25 | 45 | 0;
  return {
    timer: validTimer,
    timerDuration: validTimer,
    impostorCount: raw?.impostorCount ?? 'auto',
    impostorCategoryHint: raw?.impostorCategoryHint !== false,
  };
}

// Map DB Player row to Player
export function mapDbPlayerToPlayer(dbPlayer: any): Player {
  const rawVoted = dbPlayer.voted_for;
  const votedFor =
    rawVoted !== undefined && rawVoted !== null && String(rawVoted).trim() !== ''
      ? String(rawVoted).trim()
      : null;

  const isAlive = dbPlayer.is_alive !== false;
  const score = typeof dbPlayer.score === 'number' && !Number.isNaN(dbPlayer.score) ? dbPlayer.score : 0;
  const roundPts =
    typeof dbPlayer.round_points === 'number' && !Number.isNaN(dbPlayer.round_points)
      ? dbPlayer.round_points
      : 0;
  const mafiaRole: MafiaRole =
    (dbPlayer.mafia_role as MafiaRole) || (dbPlayer.is_impostor ? 'IMPOSTOR' : 'CIVILIAN');
  const isHost = Boolean(dbPlayer.is_host);
  const isImpostor = Boolean(dbPlayer.is_impostor) || mafiaRole === 'IMPOSTOR';

  return {
    id: dbPlayer.id,
    room_code: dbPlayer.room_code,
    name: dbPlayer.name,
    color: (dbPlayer.color as PlayerColor) || PLAYER_COLORS[0].hex,
    isHost,
    is_host: isHost,
    isImpostor,
    is_impostor: isImpostor,
    mafiaRole,
    mafia_role: mafiaRole,
    isAlive,
    is_alive: isAlive,
    voted_for: votedFor,
    votedTargetId: votedFor || undefined,
    hasVoted: Boolean(votedFor),
    score,
    round_points: roundPts,
    roundPointsEarned: roundPts,
    is_online: dbPlayer.is_online !== false,
  };
}

// Map DB Room row + Players to RoomState
export function mapDbRoomToRoomState(dbRoom: any, players: Player[]): RoomState {
  let rolesFromPairs: Record<string, MafiaRole> | undefined = undefined;
  let votesFromPairs: Record<string, string> = {};
  let qPairs: QuestionPair[] = [];

  if (dbRoom.question_pairs && typeof dbRoom.question_pairs === 'object') {
    if (Array.isArray(dbRoom.question_pairs)) {
      qPairs = dbRoom.question_pairs;
    } else {
      rolesFromPairs = dbRoom.question_pairs.roles;
      votesFromPairs = dbRoom.question_pairs.votes || {};
      qPairs = Array.isArray(dbRoom.question_pairs.pairs) ? dbRoom.question_pairs.pairs : [];
    }
  }

  const mafiaState = dbRoom.mafia_state && typeof dbRoom.mafia_state === 'object' ? dbRoom.mafia_state : {};
  const rolesFromMafiaState = mafiaState.roles as Record<string, MafiaRole> | undefined;
  const partnerMap = mafiaState.partners as Record<string, string> | undefined;

  const votes: Record<string, string> = {};

  const mappedPlayers: Player[] = players.map((p) => {
    const role: MafiaRole =
      p.mafia_role ||
      p.mafiaRole ||
      (rolesFromMafiaState && rolesFromMafiaState[p.id]) ||
      (rolesFromPairs && rolesFromPairs[p.id]) ||
      (p.isImpostor ? 'IMPOSTOR' : 'CIVILIAN');

    const isImp = Boolean(p.isImpostor || p.is_impostor || role === 'IMPOSTOR');
    const rawVote = p.voted_for ?? p.votedTargetId ?? votesFromPairs[p.id] ?? null;
    const cleanVote = rawVote !== null && rawVote !== undefined && String(rawVote).trim() !== '' ? String(rawVote) : null;

    if (cleanVote) {
      votes[p.id] = cleanVote;
    }

    const isAlive = p.is_alive !== false && p.isAlive !== false;
    const score = typeof p.score === 'number' ? p.score : 0;
    const roundPts = typeof p.round_points === 'number' ? p.round_points : (p.roundPointsEarned ?? 0);

    return {
      ...p,
      isHost: Boolean(p.isHost || p.is_host || (dbRoom.host_id && dbRoom.host_id === p.id)),
      is_host: Boolean(p.isHost || p.is_host || (dbRoom.host_id && dbRoom.host_id === p.id)),
      isImpostor: isImp,
      is_impostor: isImp,
      impostorPartnerId: p.impostorPartnerId || (partnerMap && partnerMap[p.id]) || undefined,
      mafiaRole: role,
      mafia_role: role,
      isAlive,
      is_alive: isAlive,
      voted_for: cleanVote,
      votedTargetId: cleanVote || undefined,
      hasVoted: Boolean(cleanVote),
      score,
      round_points: roundPts,
      roundPointsEarned: roundPts,
    };
  });

  const normalizedSettings = normalizeSettings(dbRoom.settings);

  return {
    roomCode: dbRoom.code,
    phase: (dbRoom.phase as GamePhase) || 'LOBBY',
    gameMode: dbRoom.game_mode || 'OUT_OF_THE_LOOP',
    players: mappedPlayers,
    selectedCategoryId: dbRoom.category || 'moroccan_food',
    secretWord: dbRoom.secret_word || '',
    currentPairIndex: dbRoom.current_pair_index || 0,
    questionPairs: qPairs,
    questionTimeRemaining: normalizedSettings.timerDuration || 25,
    turnStartedAt: dbRoom.turn_started_at || null,
    votes,
    votingRevealed: Boolean(dbRoom.votes_revealed),
    caughtImpostorId: dbRoom.caught_impostor_id || null,
    lastChanceOptions: Array.isArray(dbRoom.word_options) ? dbRoom.word_options : [],
    impostorGuess: dbRoom.impostor_guess || null,
    winner: dbRoom.winner || null,
    winReason: dbRoom.win_reason || null,
    roundNumber: mafiaState.roundNumber || 1,
    isPremiumRoom: Boolean(dbRoom.is_premium_room),
    settings: normalizedSettings,
    customCategory: dbRoom.settings?.customCategory || undefined,
    lastImpostorIds: Array.isArray(dbRoom.last_impostor_ids) ? dbRoom.last_impostor_ids : [],
    usedWords: Array.isArray(dbRoom.used_words) ? dbRoom.used_words : [],
    mafiaNightVictimId: mafiaState.victimId ?? null,
    mafiaNightProtectedId: mafiaState.protectedId ?? null,
    mafiaNightInvestigatedId: mafiaState.investigatedId ?? null,
    mafiaNightKilledPlayerId: mafiaState.killedPlayerId ?? null,
    mafiaNightSaved: Boolean(mafiaState.saved),
    mafiaExiledPlayerId: mafiaState.exiledPlayerId ?? null,
    mafiaRound: mafiaState.round ?? 1,
    mafiaNightTimeRemaining: 30,
    mafiaDiscussionTimeRemaining: 60,
  };
}

// Allowed columns in public.rooms per strict schema
const ALLOWED_ROOM_COLUMNS = new Set([
  'code',
  'host_id',
  'phase',
  'game_mode',
  'category',
  'secret_word',
  'question_pairs',
  'current_pair_index',
  'turn_started_at',
  'votes_revealed',
  'caught_impostor_id',
  'word_options',
  'impostor_guess',
  'winner',
  'win_reason',
  'is_premium_room',
  'settings',
  'mafia_state',
  'used_words',
  'last_impostor_ids',
]);

// 1. Create Room in Supabase
export async function createRoomInDb(roomCode: string, hostPlayer: Player, categoryId: string): Promise<boolean> {
  if (!supabase) return false;

  const cleanCode = roomCode.trim().replace(/[^0-9]/g, '');

  try {
    await supabase.from('players').delete().eq('room_code', cleanCode);
    await supabase.from('rooms').delete().eq('code', cleanCode);

    const roomPayload = {
      code: cleanCode,
      host_id: hostPlayer.id,
      phase: 'LOBBY',
      game_mode: 'OUT_OF_THE_LOOP',
      category: categoryId || 'moroccan_food',
      secret_word: '',
      question_pairs: [],
      current_pair_index: 0,
      turn_started_at: null,
      votes_revealed: false,
      caught_impostor_id: null,
      word_options: [],
      impostor_guess: null,
      winner: null,
      win_reason: null,
      is_premium_room: false,
      settings: {
        timer: 25,
        timerDuration: 25,
        impostorCount: 'auto',
        impostorCategoryHint: true,
      },
      mafia_state: {},
      used_words: [],
      last_impostor_ids: [],
    };

    let { error: roomError } = await supabase.from('rooms').insert(roomPayload);

    if (roomError) {
      console.warn('[Supabase] Initial room insert failed, retrying minimal payload:', roomError.message);
      const minimalPayload = {
        code: cleanCode,
        host_id: hostPlayer.id,
        phase: 'LOBBY',
        category: categoryId || 'moroccan_food',
      };
      const { error: retryError } = await supabase.from('rooms').insert(minimalPayload);
      if (retryError) {
        console.error('[Supabase] Minimal room insert also failed:', retryError.message);
        return false;
      }
    }

    const { error: playerError } = await supabase.from('players').insert({
      id: hostPlayer.id,
      room_code: cleanCode,
      name: hostPlayer.name,
      color: hostPlayer.color,
      is_host: true,
      is_impostor: false,
      mafia_role: 'CIVILIAN',
      is_alive: true,
      voted_for: null,
      score: 0,
      round_points: 0,
      is_online: true,
    });

    if (playerError) {
      console.warn('[Supabase] Host insert failed, retrying minimal player:', playerError.message);
      await supabase.from('players').insert({
        id: hostPlayer.id,
        room_code: cleanCode,
        name: hostPlayer.name,
        color: hostPlayer.color,
        is_host: true,
        is_online: true,
      });
    }

    return true;
  } catch (err) {
    console.warn('[Supabase] Exception in createRoomInDb:', err);
    return false;
  }
}

// 2. Fetch Room & Players
export async function fetchRoomDataFromDb(roomCode: string): Promise<{ room: any; players: Player[] } | null> {
  if (!supabase) return null;

  try {
    const cleanCode = roomCode.trim().replace(/[^0-9]/g, '');
    const { data: roomData, error: roomError } = await supabase
      .from('rooms')
      .select('*')
      .eq('code', cleanCode)
      .maybeSingle();

    if (roomError || !roomData) return null;

    const { data: playersData, error: playersError } = await supabase
      .from('players')
      .select('*')
      .eq('room_code', cleanCode);

    if (playersError) return null;

    const players = (playersData || []).map(mapDbPlayerToPlayer);
    // Keep host first, then stable by ID
    players.sort((a, b) => {
      if (a.isHost && !b.isHost) return -1;
      if (!a.isHost && b.isHost) return 1;
      return a.id.localeCompare(b.id);
    });

    return { room: roomData, players };
  } catch (err) {
    console.warn('[Supabase] Exception in fetchRoomDataFromDb:', err);
    return null;
  }
}

// 3. Join Room
export async function joinRoomInDb(
  roomCode: string,
  player: Player,
  language: 'ar' | 'en' = 'ar'
): Promise<{ success: boolean; error?: string; room?: any; players?: Player[] }> {
  if (!supabase) {
    return {
      success: false,
      error: language === 'en' ? 'Database not connected' : 'قاعدة البيانات غير متصلة',
    };
  }

  try {
    const cleanCode = roomCode.trim().replace(/[^0-9]/g, '');

    const { data: roomData, error: roomError } = await supabase
      .from('rooms')
      .select('*')
      .eq('code', cleanCode)
      .maybeSingle();

    if (roomError) {
      return { success: false, error: roomError.message };
    }

    if (!roomData) {
      return {
        success: false,
        error:
          language === 'en'
            ? 'Room does not exist! Please check the 4-digit room code.'
            : 'الغرفة غير موجودة! تأكد من رمز الغرفة الصحيح.',
      };
    }

    if (roomData.phase !== 'LOBBY') {
      return {
        success: false,
        error:
          language === 'en'
            ? 'Game has already started in this room!'
            : 'اللعبة بدأت بالفعل في هذه الغرفة!',
      };
    }

    const { data: existingPlayersData } = await supabase
      .from('players')
      .select('*')
      .eq('room_code', cleanCode);

    const existingMe = (existingPlayersData || []).find((ep: any) => ep.id === player.id);
    const otherPlayers = (existingPlayersData || []).filter((ep: any) => ep.id !== player.id);
    const usedColors = new Set(otherPlayers.map((ep: any) => ep.color));
    let finalColor = player.color;
    if (usedColors.has(finalColor)) {
      const unused = PLAYER_COLORS.find((c) => !usedColors.has(c.hex));
      if (unused) {
        finalColor = unused.hex;
      }
    }

    const { error: insertError } = await supabase.from('players').upsert({
      id: player.id,
      room_code: cleanCode,
      name: player.name,
      color: finalColor,
      is_host: existingMe ? Boolean(existingMe.is_host) : false,
      is_impostor: false,
      mafia_role: 'CIVILIAN',
      is_alive: true,
      voted_for: null,
      score: existingMe?.score ?? 0,
      round_points: existingMe?.round_points ?? 0,
      is_online: true,
    }, { onConflict: 'id' });

    if (insertError) {
      console.warn('[Supabase] Upsert error, retrying minimal upsert:', insertError.message);
      await supabase.from('players').upsert({
        id: player.id,
        room_code: cleanCode,
        name: player.name,
        color: finalColor,
        is_host: existingMe ? Boolean(existingMe.is_host) : false,
        is_online: true,
      }, { onConflict: 'id' });
    }

    const { data: playersData } = await supabase
      .from('players')
      .select('*')
      .eq('room_code', cleanCode);

    const players = (playersData || []).map(mapDbPlayerToPlayer);
    players.sort((a, b) => {
      if (a.isHost && !b.isHost) return -1;
      if (!a.isHost && b.isHost) return 1;
      return a.id.localeCompare(b.id);
    });

    return { success: true, room: roomData, players };
  } catch (err: any) {
    return {
      success: false,
      error:
        language === 'en'
          ? 'An error occurred while connecting to the server'
          : 'حدث خطأ أثناء الاتصال بالخادم',
    };
  }
}

// 4. Leave / Kick Player & Host Promotion
export async function removePlayerFromDb(roomCode: string, playerId: string): Promise<boolean> {
  if (!supabase) return false;

  try {
    const { data: removedPlayer } = await supabase
      .from('players')
      .select('is_host')
      .eq('id', playerId)
      .maybeSingle();

    const wasHost = removedPlayer?.is_host;

    await supabase.from('players').delete().eq('id', playerId);

    if (wasHost) {
      const { data: remainingPlayers } = await supabase
        .from('players')
        .select('id')
        .eq('room_code', roomCode)
        .limit(1);

      if (remainingPlayers && remainingPlayers.length > 0) {
        const newHostId = remainingPlayers[0].id;
        await supabase.from('players').update({ is_host: true }).eq('id', newHostId);
        await supabase.from('rooms').update({ host_id: newHostId }).eq('code', roomCode);
      } else {
        await supabase.from('rooms').delete().eq('code', roomCode);
      }
    }

    return true;
  } catch (err) {
    console.warn('[Supabase] Exception in removePlayerFromDb:', err);
    return false;
  }
}

// 5. Update Room in DB (strictly filtered to schema columns)
export async function updateRoomInDb(roomCode: string, fields: Record<string, any>): Promise<boolean> {
  if (!supabase) return false;

  try {
    const cleanPayload: Record<string, any> = {};

    Object.entries(fields).forEach(([key, value]) => {
      if (key === 'selected_category_id') {
        cleanPayload.category = value;
      } else if (key === 'voting_revealed') {
        cleanPayload.votes_revealed = value;
      } else if (key === 'last_chance_options') {
        cleanPayload.word_options = value;
      } else if (ALLOWED_ROOM_COLUMNS.has(key)) {
        cleanPayload[key] = value;
      }
    });

    if (Object.keys(cleanPayload).length === 0) return true;

    const { error } = await supabase
      .from('rooms')
      .update(cleanPayload)
      .eq('code', roomCode);

    if (error) {
      console.warn('[Supabase] Error updating room in DB:', error);
    }

    return !error;
  } catch (err) {
    console.warn('[Supabase] Exception in updateRoomInDb:', err);
    return false;
  }
}

// 6. Update Single Player Vote Directly in DB
export async function updatePlayerVoteInDb(playerId: string, targetIdOrSkip: string | null): Promise<boolean> {
  if (!supabase || !playerId) return false;

  try {
    const { error } = await supabase
      .from('players')
      .update({
        voted_for: targetIdOrSkip,
      })
      .eq('id', playerId);

    if (error) {
      console.warn('[Supabase] Error updating player vote in DB:', error);
    }
    return !error;
  } catch (err) {
    console.warn('[Supabase] Exception in updatePlayerVoteInDb:', err);
    return false;
  }
}

// 7. Update Multiple Players in DB (strictly matching public.players columns)
export async function updatePlayersBatchInDb(players: Player[]): Promise<boolean> {
  if (!supabase || players.length === 0) return false;

  try {
    await Promise.all(
      players.map((p) => {
        const rawVote = p.voted_for !== undefined ? p.voted_for : (p.votedTargetId ?? null);
        const cleanVote =
          rawVote !== null && rawVote !== undefined && String(rawVote).trim() !== ''
            ? String(rawVote).trim()
            : null;
        const score = typeof p.score === 'number' && !Number.isNaN(p.score) ? p.score : 0;
        const roundPts =
          typeof p.round_points === 'number' && !Number.isNaN(p.round_points)
            ? p.round_points
            : typeof p.roundPointsEarned === 'number' && !Number.isNaN(p.roundPointsEarned)
            ? p.roundPointsEarned
            : 0;

        return supabase!
          .from('players')
          .update({
            is_host: Boolean(p.isHost ?? p.is_host),
            is_impostor: Boolean(p.isImpostor ?? p.is_impostor),
            mafia_role: p.mafiaRole || p.mafia_role || (p.isImpostor ? 'IMPOSTOR' : 'CIVILIAN'),
            is_alive: p.isAlive !== false && p.is_alive !== false,
            voted_for: cleanVote,
            score,
            round_points: roundPts,
            is_online: true,
          })
          .eq('id', p.id);
      })
    );
    return true;
  } catch (err) {
    console.warn('[Supabase] Exception in updatePlayersBatchInDb:', err);
    return false;
  }
}

// 8. Verify VIP / Promo Code
export async function verifyVipCodeInDb(code: string): Promise<{ valid: boolean; plan?: string }> {
  const cleanCode = code.trim().toUpperCase();

  if (cleanCode === 'BARA2026' || cleanCode === 'SHOWTIME2026' || cleanCode === 'VIP' || cleanCode === 'BARA') {
    return { valid: true, plan: cleanCode === 'VIP' ? 'monthly' : '24h' };
  }

  if (!supabase) return { valid: false };

  try {
    const { data, error } = await supabase
      .from('vip_codes')
      .select('*')
      .eq('code', cleanCode)
      .eq('is_active', true)
      .maybeSingle();

    if (error || !data) return { valid: false };

    if (data.max_uses && data.used_count >= data.max_uses) {
      return { valid: false };
    }

    await supabase
      .from('vip_codes')
      .update({ used_count: (data.used_count || 0) + 1 })
      .eq('code', cleanCode);

    return { valid: true, plan: data.plan_type };
  } catch (err) {
    console.warn('[Supabase] Exception in verifyVipCodeInDb:', err);
    return false ? { valid: false } : { valid: false };
  }
}

// 9. Subscribe to Room & Players Realtime Changes
export function subscribeToRoomRealtime(
  roomCode: string,
  onRoomUpdate: (room: any) => void,
  onPlayersUpdate: () => void
): () => void {
  if (!supabase) return () => {};

  try {
    const channel = supabase
      .channel(`room_sync:${roomCode}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'rooms', filter: `code=eq.${roomCode}` },
        (payload) => {
          if (payload.new) {
            onRoomUpdate(payload.new);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'players', filter: `room_code=eq.${roomCode}` },
        () => {
          onPlayersUpdate();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  } catch (err) {
    console.warn('[Supabase] Error subscribing to realtime channel:', err);
    return () => {};
  }
}
