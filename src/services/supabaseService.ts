import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import { Player, RoomState, GamePhase, PlayerColor } from '../types/game';

const rawUrl = import.meta.env.VITE_SUPABASE_URL;
const rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = (): boolean => {
  if (!rawUrl || !rawKey) return false;
  if (typeof rawUrl !== 'string' || typeof rawKey !== 'string') return false;

  const cleanUrl = rawUrl.trim();
  const cleanKey = rawKey.trim();

  // Validate that strings are not placeholders
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

// Map DB Room row to RoomState
export function mapDbRoomToRoomState(dbRoom: any, players: Player[]): RoomState {
  return {
    roomCode: dbRoom.code,
    phase: (dbRoom.phase as GamePhase) || 'LOBBY',
    players,
    selectedCategoryId: dbRoom.selected_category_id || 'moroccan_food',
    secretWord: dbRoom.secret_word || '',
    currentPairIndex: dbRoom.current_pair_index || 0,
    questionPairs: Array.isArray(dbRoom.question_pairs) ? dbRoom.question_pairs : [],
    questionTimeRemaining: 25,
    turnStartedAt: dbRoom.turn_started_at || null,
    votes: {},
    votingRevealed: Boolean(dbRoom.voting_revealed),
    caughtImpostorId: dbRoom.caught_impostor_id || null,
    lastChanceOptions: Array.isArray(dbRoom.last_chance_options) ? dbRoom.last_chance_options : [],
    impostorGuess: dbRoom.impostor_guess || null,
    winner: dbRoom.winner || null,
    winReason: dbRoom.win_reason || null,
    roundNumber: dbRoom.round_number || 1,
    isPremiumRoom: Boolean(dbRoom.is_premium_room),
    settings: dbRoom.settings || {
      timerDuration: 25,
      impostorCount: 'auto',
      impostorCategoryHint: true,
    },
    customCategory: dbRoom.custom_category || undefined,
  };
}

// Map DB Player row to Player
export function mapDbPlayerToPlayer(dbPlayer: any): Player {
  return {
    id: dbPlayer.id,
    name: dbPlayer.name,
    color: dbPlayer.color as PlayerColor,
    isHost: Boolean(dbPlayer.is_host),
    isImpostor: Boolean(dbPlayer.is_impostor),
    impostorPartnerId: dbPlayer.impostor_partner_id || undefined,
    hasVoted: Boolean(dbPlayer.has_voted),
    votedTargetId: dbPlayer.voted_target_id || undefined,
    createdAt: dbPlayer.created_at,
  };
}

// 1. Create Room in Supabase
export async function createRoomInDb(roomCode: string, hostPlayer: Player, categoryId: string): Promise<boolean> {
  if (!supabase) return false;

  try {
    // Delete any stale room or players with this code first to prevent constraint collision
    await supabase.from('players').delete().eq('room_code', roomCode);
    await supabase.from('rooms').delete().eq('code', roomCode);

    const { error: roomError } = await supabase.from('rooms').insert({
      code: roomCode,
      phase: 'LOBBY',
      selected_category_id: categoryId,
      secret_word: '',
      current_pair_index: 0,
      question_pairs: [],
      turn_started_at: null,
      voting_revealed: false,
      caught_impostor_id: null,
      last_chance_options: [],
      impostor_guess: null,
      winner: null,
      win_reason: null,
      round_number: 1,
      is_premium_room: false,
    });

    if (roomError) {
      console.warn('[Supabase] Error creating room in DB:', roomError);
      return false;
    }

    const { error: playerError } = await supabase.from('players').insert({
      id: hostPlayer.id,
      room_code: roomCode,
      name: hostPlayer.name,
      color: hostPlayer.color,
      is_host: true,
      is_impostor: false,
      has_voted: false,
    });

    if (playerError) {
      console.warn('[Supabase] Error inserting host player in DB:', playerError);
      return false;
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
    const { data: roomData, error: roomError } = await supabase
      .from('rooms')
      .select('*')
      .eq('code', roomCode)
      .maybeSingle();

    if (roomError || !roomData) return null;

    const { data: playersData, error: playersError } = await supabase
      .from('players')
      .select('*')
      .eq('room_code', roomCode)
      .order('created_at', { ascending: true });

    if (playersError) return null;

    const players = (playersData || []).map(mapDbPlayerToPlayer);
    return { room: roomData, players };
  } catch (err) {
    console.warn('[Supabase] Exception in fetchRoomDataFromDb:', err);
    return null;
  }
}

// 3. Join Room
export async function joinRoomInDb(roomCode: string, player: Player): Promise<{ success: boolean; error?: string; room?: any; players?: Player[] }> {
  if (!supabase) return { success: false, error: 'Database not connected' };

  try {
    const { data: roomData, error: roomError } = await supabase
      .from('rooms')
      .select('*')
      .eq('code', roomCode)
      .maybeSingle();

    if (roomError) {
      return { success: false, error: roomError.message };
    }

    if (!roomData) {
      return { success: false, error: 'ROOM_NOT_FOUND' };
    }

    if (roomData.phase !== 'LOBBY') {
      return { success: false, error: 'اللعبة قد بدأت بالفعل في هذه الغرفة! انتظر حتى تنتهي.' };
    }

    // Insert or update player in DB
    const { error: insertError } = await supabase.from('players').upsert({
      id: player.id,
      room_code: roomCode,
      name: player.name,
      color: player.color,
      is_host: false,
      is_impostor: false,
      has_voted: false,
      voted_target_id: null,
      last_seen_at: new Date().toISOString(),
    });

    if (insertError) {
      return { success: false, error: insertError.message };
    }

    const { data: playersData } = await supabase
      .from('players')
      .select('*')
      .eq('room_code', roomCode)
      .order('created_at', { ascending: true });

    const players = (playersData || []).map(mapDbPlayerToPlayer);
    return { success: true, room: roomData, players };
  } catch (err: any) {
    return { success: false, error: err?.message || 'حدث خطأ أثناء الانضمام' };
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
        .order('created_at', { ascending: true })
        .limit(1);

      if (remainingPlayers && remainingPlayers.length > 0) {
        await supabase
          .from('players')
          .update({ is_host: true })
          .eq('id', remainingPlayers[0].id);
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

// 5. Update Room in DB
export async function updateRoomInDb(roomCode: string, fields: Record<string, any>): Promise<boolean> {
  if (!supabase) return false;

  try {
    const { error } = await supabase
      .from('rooms')
      .update({ ...fields, updated_at: new Date().toISOString() })
      .eq('code', roomCode);

    return !error;
  } catch (err) {
    console.warn('[Supabase] Exception in updateRoomInDb:', err);
    return false;
  }
}

// 6. Update Multiple Players
export async function updatePlayersBatchInDb(players: Player[]): Promise<boolean> {
  if (!supabase || players.length === 0) return false;

  try {
    const updates = players.map((p) => ({
      id: p.id,
      is_host: p.isHost,
      is_impostor: p.isImpostor,
      impostor_partner_id: p.impostorPartnerId || null,
      has_voted: p.hasVoted || false,
      voted_target_id: p.votedTargetId || null,
    }));

    for (const update of updates) {
      await supabase.from('players').update(update).eq('id', update.id);
    }
    return true;
  } catch (err) {
    console.warn('[Supabase] Exception in updatePlayersBatchInDb:', err);
    return false;
  }
}

// 7. Verify VIP / Promo Code
export async function verifyVipCodeInDb(code: string): Promise<{ valid: boolean; plan?: string }> {
  const cleanCode = code.trim().toUpperCase();

  // Instant fallback codes for offline/direct access
  if (cleanCode === 'SHOWTIME2026' || cleanCode === 'VIP' || cleanCode === 'BARA') {
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
    return { valid: false };
  }
}

// 8. Subscribe to Room & Players Realtime Changes
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
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`[Supabase Realtime] Subscribed to room ${roomCode}`);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  } catch (err) {
    console.warn('[Supabase] Error subscribing to realtime channel:', err);
    return () => {};
  }
}
