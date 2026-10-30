export type GamePhase = 
  | 'LOBBY' 
  | 'ROLE_REVEAL' 
  | 'QUESTIONS' 
  | 'VOTING' 
  | 'LAST_CHANCE' 
  | 'GAME_OVER';

export type PlayerColor = 
  | '#B388FF' // Purple
  | '#6FD8F2' // Cyan
  | '#FAD85D' // Yellow
  | '#7CE38B' // Green
  | '#FF80AB' // Pink
  | '#FFAB73' // Orange
  | '#D7B38C'; // Brown

export interface Player {
  id: string;
  name: string;
  color: PlayerColor;
  isHost: boolean;
  isImpostor: boolean;
  impostorPartnerId?: string;
  hasVoted?: boolean;
  votedTargetId?: string;
  isReady?: boolean;
  createdAt?: string;
}

export interface QuestionPair {
  askerId: string;
  answererId: string;
}

export interface GameSettings {
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

export interface RoomState {
  roomCode: string;
  phase: GamePhase;
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
  | 'PREMIUM_ACTIVATED';

export interface SyncMessage {
  type: SyncMessageType;
  roomCode: string;
  senderId: string;
  timestamp: number;
  payload?: any;
}
