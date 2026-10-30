import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import { Player, RoomState, GamePhase, PlayerColor } from '../types/game';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl.startsWith('http') &&
    supabaseAnonKey.length > 10
  );
};

export const supabase: SupabaseClient | null = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Map DB Room row to RoomState
export function mapDbRoomToRoomState(dbRoom: any, players: Player[]): RoomState {
  return {
    roomCode: dbRoom.code,
    phase: dbRoom.phase as GamePhase,
    players,
    selectedCategoryId: dbRoom.selected_category_id || 'food',
    secretWord: dbRoom.secret_word || '',
    currentPairIndex: dbRoom.current_pair_index || 0,
    questionPairs: Array.isArray(dbRoom.question_pairs) ? dbRoom.question_pairs : [],
    questionTimeRemaining: 25,
    turnStartedAt: dbRoom.turn_started_at || null,
    votes: {}, // Built dynamically from players' voted_target_id
    votingRevealed: Boolean(dbRoom.voting_revealed),
    caughtImpostorId: dbRoom.caught_impostor_id || null,
    lastChanceOptions: Array.isArray(dbRoom.last_chance_options) ? dbRoom.last_chance_options : [],
    impostorGuess: dbRoom.impostor_guess || null,
    winner: dbRoom.winner || null,
    winReason: dbRoom.win_reason || null,
    roundNumber: dbRoom.round_number || 1,
    isPremiumRoom: Boolean(dbRoom.is_premium_room),
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
      console.error('[Supabase] Error creating room:', roomError);
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
      console.error('[Supabase] Error inserting host player:', playerError);
      return false;
    }

    return true;
  } catch (err) {
    console.error('[Supabase] Exception in createRoomInDb:', err);
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
    console.error('[Supabase] Exception in fetchRoomDataFromDb:', err);
    return null;
  }
}

// 3. Join Room
export async function joinRoomInDb(roomCode: string, player: Player): Promise<{ success: boolean; error?: string }> {
  if (!supabase) return { success: false, error: 'Database not connected' };

  try {
    // Check if room exists and is in LOBBY
    const { data: roomData, error: roomError } = await supabase
      .from('rooms')
      .select('phase')
      .eq('code', roomCode)
      .maybeSingle();

    if (roomError || !roomData) {
      return { success: false, error: 'الغرفة غير موجودة! تأكد من الرمز المدخل.' };
    }

    if (roomData.phase !== 'LOBBY') {
      return { success: false, error: 'اللعبة قد بدأت بالفعل في هذه الغرفة! انتظر حتى تنتهي.' };
    }

    // Insert or update player
    const { error: insertError } = await supabase.from('players').upsert({
      id: player.id,
      room_code: roomCode,
      name: player.name,
      color: player.color,
      is_host: player.isHost,
      is_impostor: false,
      has_voted: false,
      voted_target_id: null,
      last_seen_at: new Date().toISOString(),
    });

    if (insertError) {
      return { success: false, error: 'تعذر الانضمام للغرفة: ' + insertError.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'حدث خطأ أثناء الانضمام' };
  }
}

// 4. Leave / Kick Player & Host Promotion
export async function removePlayerFromDb(roomCode: string, playerId: string): Promise<boolean> {
  if (!supabase) return false;

  try {
    // Check if the removed player was host
    const { data: removedPlayer } = await supabase
      .from('players')
      .select('is_host')
      .eq('id', playerId)
      .maybeSingle();

    const wasHost = removedPlayer?.is_host;

    // Delete player
    await supabase.from('players').delete().eq('id', playerId);

    // If host left, promote oldest remaining player to host
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
        // No players left, optionally delete room
        await supabase.from('rooms').delete().eq('code', roomCode);
      }
    }

    return true;
  } catch (err) {
    console.error('[Supabase] Exception in removePlayerFromDb:', err);
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
    console.error('[Supabase] Exception in updateRoomInDb:', err);
    return false;
  }
}

// 6. Update Multiple Players (e.g. role distribution or votes reset)
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
    console.error('[Supabase] Exception in updatePlayersBatchInDb:', err);
    return false;
  }
}

// 7. Verify VIP / Promo Code
export async function verifyVipCodeInDb(code: string): Promise<{ valid: boolean; plan?: string }> {
  const cleanCode = code.trim().toUpperCase();

  // Fallback instant codes for local testing and direct sales
  if (cleanCode === 'SHOWTIME2026' || cleanCode === 'VIP' || cleanCode === 'BARA') {
    return { valid: true, plan: cleanCode === 'VIP' ? 'monthly' : '24h' };
  }

  if (!supabase) {
    return { valid: false };
  }

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

    // Increment used_count
    await supabase
      .from('vip_codes')
      .update({ used_count: (data.used_count || 0) + 1 })
      .eq('code', cleanCode);

    return { valid: true, plan: data.plan_type };
  } catch (err) {
    console.error('[Supabase] Exception in verifyVipCodeInDb:', err);
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
}
