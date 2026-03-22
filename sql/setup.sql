-- =============================================
-- KASH — Setup SQL (run in Supabase SQL Editor)
-- =============================================

-- Profils utilisateurs
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT NOT NULL,
  name TEXT,
  currency TEXT DEFAULT '€',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Transactions (revenus + dépenses)
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  amount DECIMAL(10,2) NOT NULL,
  category TEXT NOT NULL,
  label TEXT,
  note TEXT,
  date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Objectifs d'épargne
CREATE TABLE IF NOT EXISTS savings_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  emoji TEXT DEFAULT '🎯',
  target_amount DECIMAL(10,2) NOT NULL,
  current_amount DECIMAL(10,2) DEFAULT 0,
  deadline DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Dettes
CREATE TABLE IF NOT EXISTS debts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  direction TEXT NOT NULL CHECK (direction IN ('owe', 'owed')),
  person_name TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  note TEXT,
  settled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Row Level Security ──
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE savings_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE debts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_profile" ON profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "users_own_transactions" ON transactions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "users_own_goals" ON savings_goals FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "users_own_debts" ON debts FOR ALL USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON transactions(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_goals_user ON savings_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_debts_user ON debts(user_id, settled);
