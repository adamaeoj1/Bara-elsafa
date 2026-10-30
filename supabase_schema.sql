-- =========================================================================
-- Showtime / برا السالفة - Production Database Schema (Supabase PostgreSQL)
-- =========================================================================

-- 1. Create Rooms Table
CREATE TABLE IF NOT EXISTS public.rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  phase TEXT NOT NULL DEFAULT 'LOBBY',
  selected_category_id TEXT NOT NULL DEFAULT 'food',
  secret_word TEXT DEFAULT '',
  current_pair_index INT DEFAULT 0,
  question_pairs JSONB DEFAULT '[]'::JSONB,
  turn_started_at TIMESTAMPTZ,
  voting_revealed BOOLEAN DEFAULT FALSE,
  caught_impostor_id TEXT,
  last_chance_options JSONB DEFAULT '[]'::JSONB,
  impostor_guess TEXT,
  winner TEXT,
  win_reason TEXT,
  round_number INT DEFAULT 1,
  is_premium_room BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create Players Table
CREATE TABLE IF NOT EXISTS public.players (
  id TEXT PRIMARY KEY,
  room_code TEXT NOT NULL REFERENCES public.rooms(code) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  is_host BOOLEAN DEFAULT FALSE,
  is_impostor BOOLEAN DEFAULT FALSE,
  impostor_partner_id TEXT,
  has_voted BOOLEAN DEFAULT FALSE,
  voted_target_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create VIP Codes Table for Monetization
CREATE TABLE IF NOT EXISTS public.vip_codes (
  code TEXT PRIMARY KEY,
  plan_type TEXT NOT NULL DEFAULT '24h', -- '24h' or 'monthly'
  is_active BOOLEAN DEFAULT TRUE,
  max_uses INT DEFAULT 100,
  used_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default initial VIP Codes for testing and monetization
INSERT INTO public.vip_codes (code, plan_type, is_active, max_uses)
VALUES 
  ('SHOWTIME2026', '24h', true, 1000),
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
