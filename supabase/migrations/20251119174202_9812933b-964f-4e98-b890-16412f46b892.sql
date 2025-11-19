-- Create enum for styling preferences
CREATE TYPE public.styling_preference AS ENUM ('veiled', 'unveiled');

-- Create enum for clothing categories
CREATE TYPE public.clothing_category AS ENUM (
  'tops',
  'bottoms',
  'dresses',
  'outerwear',
  'shoes',
  'accessories',
  'bags'
);

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  styling_preference styling_preference,
  occupation TEXT,
  location TEXT,
  favorite_brands TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create closet_items table
CREATE TABLE public.closet_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category clothing_category NOT NULL,
  brand TEXT,
  color TEXT,
  image_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create outfits table
CREATE TABLE public.outfits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  occasion TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create outfit_items junction table
CREATE TABLE public.outfit_items (
  outfit_id UUID NOT NULL REFERENCES public.outfits(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES public.closet_items(id) ON DELETE CASCADE,
  PRIMARY KEY (outfit_id, item_id)
);

-- Create calendar_looks table
CREATE TABLE public.calendar_looks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  outfit_id UUID REFERENCES public.outfits(id) ON DELETE SET NULL,
  scheduled_date DATE NOT NULL,
  activity TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.closet_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outfits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outfit_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_looks ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Closet items policies
CREATE POLICY "Users can view own closet items"
  ON public.closet_items FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own closet items"
  ON public.closet_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own closet items"
  ON public.closet_items FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own closet items"
  ON public.closet_items FOR DELETE
  USING (auth.uid() = user_id);

-- Outfits policies
CREATE POLICY "Users can view own outfits"
  ON public.outfits FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own outfits"
  ON public.outfits FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own outfits"
  ON public.outfits FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own outfits"
  ON public.outfits FOR DELETE
  USING (auth.uid() = user_id);

-- Outfit items policies
CREATE POLICY "Users can view own outfit items"
  ON public.outfit_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.outfits
    WHERE outfits.id = outfit_items.outfit_id
    AND outfits.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert own outfit items"
  ON public.outfit_items FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.outfits
    WHERE outfits.id = outfit_items.outfit_id
    AND outfits.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own outfit items"
  ON public.outfit_items FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.outfits
    WHERE outfits.id = outfit_items.outfit_id
    AND outfits.user_id = auth.uid()
  ));

-- Calendar looks policies
CREATE POLICY "Users can view own calendar looks"
  ON public.calendar_looks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own calendar looks"
  ON public.calendar_looks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own calendar looks"
  ON public.calendar_looks FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own calendar looks"
  ON public.calendar_looks FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();