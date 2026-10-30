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
}

export interface QuestionPair {
  askerId: string;
  answererId: string;
}

export interface Category {
  id: string;
  name: string;
  isLocked: boolean;
  icon: string;
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
  votes: Record<string, string>; // voterId -> targetId
  votingRevealed: boolean;
  caughtImpostorId: string | null;
  lastChanceOptions: string[];
  impostorGuess: string | null;
  winner: 'IMPOSTOR' | 'CIVILIANS' | null;
  winReason: 'ESCAPED' | 'GUESSED_WORD' | 'WRONG_GUESS' | null;
  roundNumber: number;
}

export type SyncMessageType = 
  | 'ROOM_STATE_SYNC'
  | 'PLAYER_JOIN'
  | 'PLAYER_LEAVE'
  | 'SUBMIT_VOTE'
  | 'SUBMIT_GUESS'
  | 'RESET_GAME'
  | 'NEXT_TURN';

export interface SyncMessage {
  type: SyncMessageType;
  roomCode: string;
  senderId: string;
  timestamp: number;
  payload?: any;
}

export interface TestLogEntry {
  step: string;
  status: 'SUCCESS' | 'FAIL' | 'INFO';
  detail: string;
}
