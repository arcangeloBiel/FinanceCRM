-- Drop tables if they exist (for reset purposes, be careful in production)
-- DROP TABLE IF EXISTS public.despesas;
-- DROP TABLE IF EXISTS public.receitas;
-- DROP TABLE IF EXISTS public.users;
-- DROP TYPE IF EXISTS public.user_role;

-- 1. Create Enum for User Role
CREATE TYPE public.user_role AS ENUM ('admin', 'normal');

-- 2. Create Users Table
-- We link this to auth.users to ensure integrity with Supabase Auth
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  senha_hash TEXT, -- Optional if using Supabase Auth, but kept per spec
  role public.user_role DEFAULT 'normal',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create Receitas Table
CREATE TABLE public.receitas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  descricao TEXT NOT NULL,
  valor NUMERIC(15, 2) NOT NULL,
  categoria TEXT NOT NULL,
  data DATE NOT NULL
);

-- 4. Create Despesas Table
CREATE TABLE public.despesas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  descricao TEXT NOT NULL,
  valor NUMERIC(15, 2) NOT NULL,
  categoria TEXT NOT NULL,
  data DATE NOT NULL
);

-- 5. Create Indices for Performance
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_receitas_user_id ON public.receitas(user_id);
CREATE INDEX idx_receitas_data ON public.receitas(data);
CREATE INDEX idx_despesas_user_id ON public.despesas(user_id);
CREATE INDEX idx_despesas_data ON public.despesas(data);

-- 6. Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receitas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.despesas ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies

-- Users
-- Users can view their own profile
CREATE POLICY "Users can view own profile" 
ON public.users FOR SELECT 
USING (auth.uid() = id);

-- Admins can view all users
CREATE POLICY "Admins can view all users" 
ON public.users FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" 
ON public.users FOR UPDATE 
USING (auth.uid() = id);

-- Receitas
-- Users can view their own receitas
CREATE POLICY "Users can view own receitas" 
ON public.receitas FOR SELECT 
USING (auth.uid() = user_id);

-- Users can insert their own receitas
CREATE POLICY "Users can insert own receitas" 
ON public.receitas FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Users can update their own receitas
CREATE POLICY "Users can update own receitas" 
ON public.receitas FOR UPDATE 
USING (auth.uid() = user_id);

-- Users can delete their own receitas
CREATE POLICY "Users can delete own receitas" 
ON public.receitas FOR DELETE 
USING (auth.uid() = user_id);


-- Despesas
-- Users can view their own despesas
CREATE POLICY "Users can view own despesas" 
ON public.despesas FOR SELECT 
USING (auth.uid() = user_id);

-- Users can insert their own despesas
CREATE POLICY "Users can insert own despesas" 
ON public.despesas FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Users can update their own despesas
CREATE POLICY "Users can update own despesas" 
ON public.despesas FOR UPDATE 
USING (auth.uid() = user_id);

-- Users can delete their own despesas
CREATE POLICY "Users can delete own despesas" 
ON public.despesas FOR DELETE 
USING (auth.uid() = user_id);

-- Trigger to automatically create a public.users entry when a new auth.users is created
-- This is optional but recommended if using Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, nome, role)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'nome', 'normal');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
