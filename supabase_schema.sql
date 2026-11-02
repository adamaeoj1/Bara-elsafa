-- =========================================================================
-- Bara Elsalfa (برا السالفة) - Production Database Schema (Supabase PostgreSQL)
-- =========================================================================

-- 1. Create Rooms Table
CREATE TABLE IF NOT EXISTS public.rooms (
  code TEXT PRIMARY KEY,
  host_id TEXT,
  phase TEXT NOT NULL DEFAULT 'LOBBY',
  game_mode TEXT NOT NULL DEFAULT 'OUT_OF_THE_LOOP',
  category TEXT NOT NULL DEFAULT 'moroccan_food',
  secret_word TEXT DEFAULT '',
  question_pairs JSONB DEFAULT '[]'::JSONB,
  current_pair_index INT DEFAULT 0,
  turn_started_at TIMESTAMPTZ,
  votes_revealed BOOLEAN DEFAULT FALSE,
  caught_impostor_id TEXT,
  word_options JSONB DEFAULT '[]'::JSONB,
  impostor_guess TEXT,
  winner TEXT,
  win_reason TEXT,
  is_premium_room BOOLEAN DEFAULT FALSE,
  settings JSONB DEFAULT '{"timer": 25, "timerDuration": 25, "impostorCount": "auto", "impostorCategoryHint": true}'::JSONB,
  mafia_state JSONB DEFAULT '{}'::JSONB,
  used_words JSONB DEFAULT '[]'::JSONB,
  last_impostor_ids JSONB DEFAULT '[]'::JSONB
);

-- 2. Create Players Table
CREATE TABLE IF NOT EXISTS public.players (
  id TEXT PRIMARY KEY,
  room_code TEXT NOT NULL REFERENCES public.rooms(code) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  is_host BOOLEAN DEFAULT FALSE,
  is_impostor BOOLEAN DEFAULT FALSE,
  mafia_role TEXT DEFAULT 'CIVILIAN',
  is_alive BOOLEAN DEFAULT TRUE,
  voted_for TEXT,
  score INT DEFAULT 0,
  round_points INT DEFAULT 0,
  is_online BOOLEAN DEFAULT TRUE
);

-- 3. Create VIP Codes Table for Monetization
CREATE TABLE IF NOT EXISTS public.vip_codes (
  code TEXT PRIMARY KEY,
  plan_type TEXT NOT NULL DEFAULT '24h',
  is_active BOOLEAN DEFAULT TRUE,
  max_uses INT DEFAULT 1000,
  used_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default initial VIP Codes for testing and monetization
INSERT INTO public.vip_codes (code, plan_type, is_active, max_uses)
VALUES 
  ('SHOWTIME2026', '24h', true, 1000),
  ('BARA2026', '24h', true, 1000),
  ('VIP', 'monthly', true, 1000),
  ('BARA', '24h', true, 1000)
ON CONFLICT (code) DO NOTHING;

-- 4. Enable Supabase Realtime Publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.players;

-- 5. Enable Row Level Security (RLS) with open game access
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vip_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access on rooms" ON public.rooms FOR SELECT USING (true);
CREATE POLICY "Allow public insert on rooms" ON public.rooms FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on rooms" ON public.rooms FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on rooms" ON public.rooms FOR DELETE USING (true);

CREATE POLICY "Allow public read access on players" ON public.players FOR SELECT USING (true);
CREATE POLICY "Allow public insert on players" ON public.players FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on players" ON public.players FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on players" ON public.players FOR DELETE USING (true);

CREATE POLICY "Allow public read on vip_codes" ON public.vip_codes FOR SELECT USING (true);
CREATE POLICY "Allow public update on vip_codes" ON public.vip_codes FOR UPDATE USING (true);
