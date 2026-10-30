import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import { SyncMessage, RoomState } from '../types/game';

export class RealtimeSyncEngine {
  private roomCode: string;
  private channelName: string;
  private broadcastChannel: BroadcastChannel | null = null;
  private supabase: SupabaseClient | null = null;
  private supabaseChannel: RealtimeChannel | null = null;
  private messageListeners: Set<(msg: SyncMessage) => void> = new Set();
  private storageListener: ((e: StorageEvent) => void) | null = null;

  constructor(roomCode: string) {
    this.roomCode = roomCode;
    this.channelName = `showtime_room_${roomCode}`;
    this.initBroadcastChannel();
    this.initStorageFallback();
    this.initSupabaseRealtime();
  }

  private initBroadcastChannel() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.broadcastChannel = new BroadcastChannel(this.channelName);
        this.broadcastChannel.onmessage = (event) => {
          if (event.data && typeof event.data === 'object' && event.data.roomCode === this.roomCode) {
            this.notifyListeners(event.data as SyncMessage);
          }
        };
      } catch (err) {
        console.warn('[SyncEngine] BroadcastChannel initialization failed, relying on localStorage fallback', err);
      }
    }
  }

  private initStorageFallback() {
    if (typeof window === 'undefined') return;

    this.storageListener = (e: StorageEvent) => {
      if (e.key === `showtime_sync_${this.roomCode}` && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue) as SyncMessage;
          if (parsed && parsed.roomCode === this.roomCode) {
            this.notifyListeners(parsed);
          }
        } catch (err) {
          console.warn('[SyncEngine] Error parsing localStorage sync event', err);
        }
      }
    };

    window.addEventListener('storage', this.storageListener);
  }

  private initSupabaseRealtime() {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseKey) {
      try {
        this.supabase = createClient(supabaseUrl, supabaseKey);
        this.supabaseChannel = this.supabase.channel(`room:${this.roomCode}`);

        this.supabaseChannel
          .on('broadcast', { event: 'game_event' }, (payload) => {
            if (payload?.payload && payload.payload.roomCode === this.roomCode) {
              this.notifyListeners(payload.payload as SyncMessage);
            }
          })
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              console.log(`[SyncEngine] Supabase Realtime connected for room ${this.roomCode}`);
            }
          });
      } catch (err) {
        console.warn('[SyncEngine] Supabase Realtime setup failed, running offline/local sync', err);
      }
    }
  }

  public broadcast(message: SyncMessage) {
    // 1. BroadcastChannel
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage(message);
      } catch (err) {
        console.warn('[SyncEngine] Error posting to BroadcastChannel', err);
      }
    }

    // 2. LocalStorage sync trigger for cross-tab fallback
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(`showtime_sync_${this.roomCode}`, JSON.stringify(message));
      } catch (err) {
        console.warn('[SyncEngine] Error writing sync message to localStorage', err);
      }
    }

    // 3. Supabase Realtime Broadcast (if enabled)
    if (this.supabaseChannel) {
      try {
        this.supabaseChannel.send({
          type: 'broadcast',
          event: 'game_event',
          payload: message,
        });
      } catch (err) {
        console.warn('[SyncEngine] Supabase broadcast failed', err);
      }
    }
  }

  public subscribe(callback: (msg: SyncMessage) => void): () => void {
    this.messageListeners.add(callback);
    return () => {
      this.messageListeners.delete(callback);
    };
  }

  private notifyListeners(msg: SyncMessage) {
    this.messageListeners.forEach((listener) => {
      try {
        listener(msg);
      } catch (err) {
        console.error('[SyncEngine] Listener error', err);
      }
    });
  }

  public saveRoomState(state: RoomState) {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(`showtime_state_${this.roomCode}`, JSON.stringify(state));
      } catch (err) {
        console.warn('[SyncEngine] Failed to save state to localStorage', err);
      }
    }
  }

  public loadRoomState(): RoomState | null {
    if (typeof window === 'undefined') return null;
    try {
      const data = localStorage.getItem(`showtime_state_${this.roomCode}`);
      return data ? JSON.parse(data) : null;
    } catch (err) {
      console.warn('[SyncEngine] Failed to load state from localStorage', err);
      return null;
    }
  }

  public cleanup() {
    if (this.broadcastChannel) {
      this.broadcastChannel.close();
      this.broadcastChannel = null;
    }
    if (this.storageListener && typeof window !== 'undefined') {
      window.removeEventListener('storage', this.storageListener);
      this.storageListener = null;
    }
    if (this.supabaseChannel && this.supabase) {
      this.supabase.removeChannel(this.supabaseChannel);
      this.supabaseChannel = null;
    }
    this.messageListeners.clear();
  }
}
