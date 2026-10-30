Build a complete, production-ready, real-time multiplayer Arabic social deduction mobile web game inspired by "Showtime / برا السالفة" (شوتايم).

Integrity mode: development

## Requirements

### R1. Project Stack & Modular Architecture
Initialize and implement the project using Vite + React + TypeScript + Tailwind CSS + Lucide React, adhering strictly to the following modular structure:
- `src/types/game.ts`: Strict TypeScript interfaces for `Player`, `RoomState`, `GamePhase`, `QuestionPair`, `Category`, and `SyncMessage`.
- `src/data/categories.ts`: Full Arabic word dictionary and category metadata.
- `src/services/syncEngine.ts`: Dual real-time synchronization engine (Supabase Realtime Broadcast/Presence + automatic fallback to browser `BroadcastChannel` + `localStorage` persistence).
- `src/hooks/useGameEngine.ts`: Custom React hook managing the deterministic 6-state machine, host-authoritative timer, role distribution, and voting resolution.
- `src/components/PlayerPawn.tsx`: Custom SVG character figure (circular smiley head + rounded body + black Neo-brutalist stroke).
- `src/components/phases/`: Separate components for each of the 6 game phases (`LobbyPhase.tsx`, `RoleRevealPhase.tsx`, `QuestionsPhase.tsx`, `VotingPhase.tsx`, `LastChancePhase.tsx`, `GameOverPhase.tsx`).
- `src/components/DevToolbar.tsx`: Developer bar for instant single-screen multi-player switching and automated in-app E2E self-testing.

### R2. UI/UX & Neo-Brutalist Visual Design System
- Deliver a full Arabic interface (`dir="rtl"`, `lang="ar"`) importing Google Font `'Cairo'` (weights 700, 800, 900) as default font.
- Visual styling rules:
  - Main app background: Warm Cream (`#F7F4EB`).
  - Solid black borders (`border-2 border-black`) on cards, buttons, pills, modals, and avatars.
  - Hard drop shadows: `shadow-[4px_4px_0px_0px_#000]` on cards, `shadow-[3px_3px_0px_0px_#000]` on buttons, with tactile press states (`active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all`).
  - 7 pastel player colors: Purple (`#B388FF`), Cyan (`#6FD8F2`), Yellow (`#FAD85D`), Green (`#7CE38B`), Pink (`#FF80AB`), Orange (`#FFAB73`), Brown (`#D7B38C`).
- Persistent Character Stage (Bottom Dock):
  - Render players as custom SVG pawns at bottom of screen (1 row for <=4 players, or 2 rows: 3 top / 4 bottom for 7 players).
  - Dynamically highlight active players (`opacity-100 scale-105` with colored underline) and dim inactive players (`opacity-30 scale-95`) based on active phase and turn.

### R3. Arabic Categories Dictionary & Premium Modal
Populate 4 unlocked categories (minimum 16 words each) and 2 locked categories in `src/data/categories.ts`:
- "أكلات" (Unlocked): كبسة، شاورما، برغر، بيتزا، باستا، مشاوي، تميس، ناتشوز، مندي، فلافل، سوشي، باشميل، كشري، مسخن، مقلوبة، سمبوسة، كنافة، لقيمات.
- "المجلس" (Unlocked): دلة، فنجال، تمر، بلوت، مبخرة، مسند، زولية، عود، سبحة، بشت، شبة نار، صينية، ترامس، كيرم، ضيافة، قهوة عربية.
- "أدوات المطبخ" (Unlocked): خلاط، مقلاة، قدر، شوكة، مبشرة، ثلاجة، فرن، غلاية، ميكروويف، ملعقة، سكين، صفاية، صحن، قطاعة، قلاية هوائية، محمصة.
- "البقالة والسوق" (Unlocked): حليب، خبز، شيبس، عصير، كاشير، عربة، شوكولاتة، زبادي، جبن، بيض، معلبات، فاتورة، كيس، آيسكريم، بسكويت، مخلل.
- Locked categories: `"مدن وقرى سعودية 🔒"` and `"رمضان الخليج 🔒"`. Clicking either opens a modal with:
  - Title: `"افتح كل الفئات 🔒"`
  - Body: `"21 فئة مقفلة، تقدر تفتحها كلها عن طريق الاشتراك"`
  - Buttons: Primary yellow `"اشترك"` and secondary white `"مو الحين"`.

### R4. Deterministic 6-Phase Game Engine
Progress strictly through these 6 phases in `src/hooks/useGameEngine.ts`:
1. `LOBBY`:
   - Room creation (4-digit code) and join flow via code, player name input, and color avatar picker.
   - Quick setup preset buttons: `4 لاعبين (1 إمبوستر)` and `7 لاعبين (2 إمبوستر)`.
   - Category selector ("اختر السالفة") and Host start button `"ابدأ اللعبة 🎮"` (enforcing minimum 3 players).
2. `ROLE_REVEAL` (البطاقات السرية):
   - Random secret word picked from chosen category.
   - Impostor assignment: 1 random Impostor for <= 6 players; 2 random co-aware Impostors for >= 7 players.
   - Unflipped purple card (`#6D4AFF`) with central `?` box (`"اضغط لكشف بطاقتك السرية"`). Holding or tapping flips card for active player only:
     - Civilian view: `"الكلمة هي:"` + large purple `secretWord`.
     - Impostor view: `"[Player Name]"` + `"أنت الإمبوستر"` + `"ما تعرف الكلمة - ركّز وحاول تعرفها"` (plus yellow badge `"خويك: [Partner Name]"` if 7+ players).
   - Host button `"ابدأ الأسئلة ⬅"` to advance to `QUESTIONS`.
3. `QUESTIONS` (الأسئلة والمؤقت):
   - Randomized `[askerId, answererId]` pairs ensuring every player asks another distinct player.
   - Center card UI: Pink pill `"الأسئلة"`, cyan countdown badge `"[timeLeft] ث"`. Connection diagram: Asker circle + `"يسأل: [Asker Name]"` connected by vertical dashed black line (`border-r-2 border-dashed border-black`) to Answerer circle + `"يجاوب: [Answerer Name]"`.
   - 25-second countdown progress bar (`25 ثانية لكل دور - ينتقل تلقائياً إذا خلص الوقت`).
   - Only active Asker and Answerer pawns highlighted (`opacity-100` + underline); others dimmed (`opacity-25`).
   - Auto-advance when countdown reaches 0 or Host clicks `"الدور التالي"`. Transition to `VOTING` after last pair.
4. `VOTING` (التصويت السري):
   - Secret voting screen titled `"مين الإمبوستر برأيك؟ تصويتك سري - النتائج تنعرض للكل مرة وحدة"`.
   - Players select another player to lock in vote (self-voting disallowed); display `"صوّت ✓"` indicator on players who voted without revealing targets.
   - Simultaneous reveal once all players vote, presented in 2-column grid `"مين صوت على مين"`: `[Voter Badge] ⬅ [Target Badge]`.
   - Catch logic: Find players with `maxVotes`. If AT LEAST ONE with `maxVotes` is an Impostor, ALL Impostors are caught -> set caught Impostor as `caughtImpostorId`, generate 8 shuffled options (1 secret word + 7 decoys from same category), and transition to `LAST_CHANCE`. If NONE of `maxVotes` is an Impostor, transition directly to `GAME_OVER` (`winner: 'IMPOSTOR'`, `reason: 'ESCAPED'`).
5. `LAST_CHANCE` (الفرصة الأخيرة):
   - Cyan pill `"الفرصة الأخيرة"` + Header `"انكشف [Caught Impostor Name]! الإمبوستر جالس يختار الكلمة الحين"`.
   - 2-column Neo-brutalist grid of 8 word options.
   - Only the caught Impostor (`activePlayerId === caughtImpostorId`) can click words; other players view spectator waiting banner. Clicking a word records `impostorGuess` and advances to `GAME_OVER`.
6. `GAME_OVER` (النتيجة النهائية):
   - Victory banner card:
     - Impostor wins (`reason === 'ESCAPED'` or `impostorGuess === secretWord`): Pink card (`#F8BBD0`) titled `"فاز الإمبوستر"`, crown `👑`, name, and subtitle (`"انكشف الإمبوستر وعرف الكلمة"` or `"ما قدرتوا تصيدون الإمبوستر!"`).
     - Civilians win (`impostorGuess !== secretWord`): Green card (`#A5D6A7`) titled `"فازوا اللاعبين"`, civilian badges, and subtitle `"انكشف الإمبوستر وما عرف الكلمة"`.
   - Side-by-side summary boxes: Right box `"الكلمة كانت"` + large bold `secretWord`; Left box Pink pill `"الإمبوستر"` + avatar/name + `"خمن [impostorGuess] ✓/✗"`.
   - Character stage highlights winners (`opacity-100`) and dims losers (`opacity-25`).
   - Host replay controls: `"العب مرة ثانية 🔄"` and `"تغيير السالفة / اللوبي"`.

### R5. Dual Real-Time Sync & Built-In DevToolbar E2E Runner
- Multi-Tab & Multi-Device Sync (`src/services/syncEngine.ts`):
  - Synchronize state across browser tabs using `BroadcastChannel('showtime_room_' + roomCode)` with `localStorage` fallback/persistence.
  - Automatically bridge broadcasts over Supabase Realtime channel (`room:${roomCode}`) when `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are provided.
- Developer Switcher & E2E Runner (`src/components/DevToolbar.tsx`):
  - Top developer bar for 1-click active player switching (`فلان`, `علان`, `زيد`, `عبيد`...).
  - `"تصويت الكل ⚡"` helper button during voting phase to auto-cast remaining votes.
  - Built-in `"فحص تلقائي ⚡"` button that programmatically executes and validates all 6 phases, displaying assertion results in an in-app modal.

## Acceptance Criteria

### Architecture & UI System
- [ ] Application compiles with zero TypeScript errors under Vite + React + Tailwind CSS.
- [ ] Interface renders in full Arabic (`dir="rtl"`, `lang="ar"`) using Google Font 'Cairo', warm cream background (`#F7F4EB`), solid black borders, and hard drop shadows with active press translation.
- [ ] Custom SVG character pawns render in persistent bottom dock (1 row for <=4 players, 2 rows for 7 players) with active highlighting and inactive dimming per phase.

### Content & Modals
- [ ] Four unlocked categories contain 16+ verified Arabic words each in `src/data/categories.ts`.
- [ ] Clicking locked categories displays the Neo-brutalist modal with `"افتح كل الفئات 🔒"`, `"21 فئة مقفلة، تقدر تفتحها كلها عن طريق الاشتراك"`, yellow `"اشترك"`, and white `"مو الحين"`.

### Game Mechanics & State Progression
- [ ] Lobby provides room creation (4-digit code), joining, avatar color picker, 4-player and 7-player preset buttons, and enforces minimum 3 players.
- [ ] Role reveal assigns 1 impostor for <=6 players, and 2 co-aware impostors for >=7 players, with secret flippable card showing secret word for civilians and impostor status/partner for impostors.
- [ ] Questions phase generates player pairs, displays Asker-Answerer connection diagram, runs host-authoritative 25-second countdown with auto-advance, and highlights active pair on bottom dock.
- [ ] Voting hides targets during voting, reveals all votes simultaneously, correctly identifies `maxVotes`, catches impostor(s) if any impostor has highest votes, or awards immediate win to impostor if no impostor tied for highest.
- [ ] Last Chance restricts 8-word grid interaction exclusively to the caught impostor while spectators see waiting banner.
- [ ] Game Over renders victory banner with proper theme colors (pink for impostor win, green for civilian win), summary boxes with secret word and guess accuracy, and host replay options.

### Sync & In-App Verification
- [ ] State updates synchronize seamlessly between tabs via `BroadcastChannel` and `localStorage`, and connect to Supabase Realtime when environment variables are supplied.
- [ ] DevToolbar allows 1-click switching between simulated player perspectives, and `"تصويت الكل ⚡"` casts pending votes.
- [ ] In-app `"فحص تلقائي ⚡"` runs an end-to-end simulation across all 6 phases and logs successful assertions in a modal.
