export type GameMode = 'OUT_OF_THE_LOOP' | 'MAFIA';

export type GamePhase = 
  | 'LOBBY' 
  // Out of the Loop phases
  | 'ROLE_REVEAL' 
  | 'QUESTIONS' 
  | 'VOTING' 
  | 'LAST_CHANCE' 
  | 'GAME_OVER'
  // Mafia game mode phases
  | 'MAFIA_ROLE_REVEAL'
  | 'MAFIA_NIGHT'
  | 'MAFIA_MORNING_DISCUSSION'
  | 'MAFIA_VOTING';

export type PlayerColor = 
  | '#B388FF' // Purple
  | '#6FD8F2' // Cyan
  | '#FAD85D' // Yellow
  | '#7CE38B' // Green
  | '#FF80AB' // Pink
  | '#FFAB73' // Orange
  | '#D7B38C'; // Brown

export type MafiaRole = 'IMPOSTOR' | 'DOCTOR' | 'DETECTIVE' | 'CIVILIAN';

export interface Player {
  id: string;
  room_code?: string;
  name: string;
  color: PlayerColor;
  isHost: boolean;
  is_host?: boolean;
  isImpostor: boolean;
  is_impostor?: boolean;
  impostorPartnerId?: string;
  hasVoted?: boolean;
  votedTargetId?: string;
  voted_for?: string | null;
  isReady?: boolean;
  createdAt?: string;
  // Competitive scoring
  score: number;
  roundPointsEarned: number;
  round_points?: number;
  // Mafia mode fields
  isAlive?: boolean;
  is_alive?: boolean;
  mafiaRole?: MafiaRole;
  mafia_role?: MafiaRole;
  doctorSelfSavedCount?: number;
  is_online?: boolean;
}

export interface QuestionPair {
  askerId: string;
  answererId: string;
}

export interface GameSettings {
  timer?: 15 | 25 | 45 | 0;
  timerDuration: 15 | 25 | 45 | 0; // 0 = no timer (infinite)
  impostorCount: 'auto' | 1 | 2 | 3;
  impostorCategoryHint: boolean; // true = impostor sees category name, false = hardcore mode
}

export interface Category {
  id: string;
  nameAr: string;
  nameEn: string;
  name: string; // compatibility fallback
  isLocked: boolean;
  icon: string;
  wordsAr: string[];
  wordsEn: string[];
  words: string[]; // compatibility fallback
}

export interface CustomCategory {
  name: string;
  title?: string;
  words: string[];
}

export interface VoteRecord {
  voterId: string;
  targetId: string;
}

export interface EmojiReaction {
  id: string;
  playerId: string;
  emoji: string;
  timestamp: number;
}

export interface RoomState {
  roomCode: string;
  phase: GamePhase;
  gameMode: GameMode;
  players: Player[];
  selectedCategoryId: string;
  secretWord: string;
  currentPairIndex: number;
  questionPairs: QuestionPair[];
  questionTimeRemaining: number;
  turnStartedAt?: string | null;
  votes: Record<string, string>; // voterId -> targetId
  votingRevealed: boolean;
  caughtImpostorId: string | null;
  lastChanceOptions: string[];
  impostorGuess: string | null;
  winner: 'IMPOSTOR' | 'CIVILIANS' | null;
  winReason: 'ESCAPED' | 'GUESSED_WORD' | 'WRONG_GUESS' | null;
  roundNumber: number;
  isPremiumRoom?: boolean;
  settings: GameSettings;
  customCategory?: CustomCategory;
  // Anti-repeat RNG state
  lastImpostorIds: string[];
  usedWords: string[];
  // Mafia specific state
  mafiaNightVictimId?: string | null;
  mafiaNightProtectedId?: string | null;
  mafiaNightInvestigatedId?: string | null;
  mafiaNightKilledPlayerId?: string | null;
  mafiaNightSaved?: boolean;
  mafiaExiledPlayerId?: string | null;
  mafiaRound?: number;
  mafiaNightTimeRemaining?: number;
  mafiaDiscussionTimeRemaining?: number;
}

export interface UserProfile {
  id: string;
  name: string;
  color: PlayerColor;
}

export type SyncMessageType = 
  | 'ROOM_STATE_SYNC'
  | 'REQUEST_ROOM_SYNC'
  | 'PLAYER_JOIN'
  | 'PLAYER_LEAVE'
  | 'PLAYER_KICKED'
  | 'SUBMIT_VOTE'
  | 'SUBMIT_GUESS'
  | 'RESET_GAME'
  | 'NEXT_TURN'
  | 'PREMIUM_ACTIVATED'
  | 'EMOJI_REACTION'
  | 'RESET_SCORES'
  | 'MAFIA_NIGHT_ACTION';

export interface SyncMessage {
  type: SyncMessageType;
  roomCode: string;
  senderId: string;
  timestamp: number;
  payload?: any;
}
