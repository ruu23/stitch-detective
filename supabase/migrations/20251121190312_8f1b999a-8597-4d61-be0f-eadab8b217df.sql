-- Update profiles table with new fields
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_veiled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS lifestyle_type TEXT CHECK (lifestyle_type IN ('corporate', 'casual', 'creative', 'athleisure')),
ADD COLUMN IF NOT EXISTS monthly_budget DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS body_measurements JSONB;

-- Update closet_items table with new fields
ALTER TABLE public.closet_items 
ADD COLUMN IF NOT EXISTS item_type TEXT CHECK (item_type IN ('top', 'bottom', 'dress', 'shoes', 'accessories')),
ADD COLUMN IF NOT EXISTS color_primary TEXT,
ADD COLUMN IF NOT EXISTS color_secondary TEXT,
ADD COLUMN IF NOT EXISTS pattern TEXT,
ADD COLUMN IF NOT EXISTS season TEXT,
ADD COLUMN IF NOT EXISTS price_paid DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS purchase_date DATE,
ADD COLUMN IF NOT EXISTS wear_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS cost_per_wear DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS ai_tags TEXT[];

-- Create body_scans table
CREATE TABLE IF NOT EXISTS public.body_scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  height DECIMAL(5,2),
  weight DECIMAL(5,2),
  bust DECIMAL(5,2),
  waist DECIMAL(5,2),
  hips DECIMAL(5,2),
  inseam DECIMAL(5,2),
  shoulder_width DECIMAL(5,2),
  body_shape TEXT CHECK (body_shape IN ('hourglass', 'pear', 'apple', 'rectangle', 'inverted_triangle')),
  skin_tone_hex TEXT,
  skin_undertone TEXT CHECK (skin_undertone IN ('warm', 'cool', 'neutral')),
  hair_color TEXT,
  front_image_url TEXT,
  side_image_url TEXT,
  face_image_url TEXT,
  measurements_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.body_scans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own body scans"
  ON public.body_scans FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own body scans"
  ON public.body_scans FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own body scans"
  ON public.body_scans FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own body scans"
  ON public.body_scans FOR DELETE
  USING (auth.uid() = user_id);

CREATE TRIGGER update_body_scans_updated_at
  BEFORE UPDATE ON public.body_scans
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Create avatars table
CREATE TABLE IF NOT EXISTS public.avatars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  avatar_model_url TEXT,
  skin_tone_hex TEXT,
  body_shape_params JSONB,
  face_features JSONB,
  hair_style TEXT,
  hair_color TEXT,
  avatar_thumbnail_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.avatars ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own avatars"
  ON public.avatars FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own avatars"
  ON public.avatars FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own avatars"
  ON public.avatars FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own avatars"
  ON public.avatars FOR DELETE
  USING (auth.uid() = user_id);

CREATE TRIGGER update_avatars_updated_at
  BEFORE UPDATE ON public.avatars
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Update outfits table with new fields
ALTER TABLE public.outfits 
ADD COLUMN IF NOT EXISTS scheduled_date DATE,
ADD COLUMN IF NOT EXISTS weather_temp DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS weather_condition TEXT,
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS avatar_render_url TEXT,
ADD COLUMN IF NOT EXISTS budget_used DECIMAL(10,2);

-- Create trips table
CREATE TABLE IF NOT EXISTS public.trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  destination TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  activities TEXT[],
  weather_forecast JSONB,
  budget_allocated DECIMAL(10,2),
  packing_list UUID[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own trips"
  ON public.trips FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own trips"
  ON public.trips FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own trips"
  ON public.trips FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own trips"
  ON public.trips FOR DELETE
  USING (auth.uid() = user_id);

CREATE TRIGGER update_trips_updated_at
  BEFORE UPDATE ON public.trips
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Create budget_tracking table
CREATE TABLE IF NOT EXISTS public.budget_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  monthly_budget DECIMAL(10,2) NOT NULL,
  spent_this_month DECIMAL(10,2) DEFAULT 0,
  wishlist_items JSONB,
  savings_goal DECIMAL(10,2),
  month_year TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, month_year)
);

ALTER TABLE public.budget_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own budget tracking"
  ON public.budget_tracking FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own budget tracking"
  ON public.budget_tracking FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own budget tracking"
  ON public.budget_tracking FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own budget tracking"
  ON public.budget_tracking FOR DELETE
  USING (auth.uid() = user_id);

CREATE TRIGGER update_budget_tracking_updated_at
  BEFORE UPDATE ON public.budget_tracking
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();