-- Add new fields to closet_items table for enhanced analysis
ALTER TABLE public.closet_items 
ADD COLUMN IF NOT EXISTS style TEXT,
ADD COLUMN IF NOT EXISTS suitable_occasions TEXT[],
ADD COLUMN IF NOT EXISTS formality_level INTEGER CHECK (formality_level BETWEEN 1 AND 5),
ADD COLUMN IF NOT EXISTS hijab_friendly BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS modest_coverage TEXT CHECK (modest_coverage IN ('high', 'medium', 'low'));