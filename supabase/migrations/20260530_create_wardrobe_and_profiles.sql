-- 1. Create a custom Type for tracking item status
CREATE TYPE item_status AS ENUM ('active', 'ready_to_part_with', 'traded');

-- 2. Create the Profiles table to hold extended user metrics
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    name TEXT,
    gender TEXT,
    profession TEXT,
    income_level TEXT,
    sustainable_goal TEXT,
    fashion_style TEXT[], -- Array to hold detected stylistic tags
    sustainability_score INT DEFAULT 100,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. Create the Wardrobe Items table (Your main workspace)
CREATE TABLE public.wardrobe_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    image_url TEXT NOT NULL,          -- Points to the file path in Supabase Storage
    category TEXT NOT NULL,           -- e.g., 'T-Shirt', 'Jeans'
    colors TEXT[] NOT NULL,           -- Array to handle multiple primary garment colors
    material TEXT,                    -- e.g., 'Organic Cotton', 'Polyester Blend'
    brand TEXT DEFAULT 'Unknown',
    purchase_price NUMERIC,           -- Required for price sorting features
    status item_status DEFAULT 'active' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 4. Enable Row Level Security (RLS) so users cannot modify other users' closets
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wardrobe_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view and edit their own profiles" 
    ON public.profiles FOR ALL USING (auth.uid() = id);

CREATE POLICY "Users can manage their own wardrobe items" 
    ON public.wardrobe_items FOR ALL USING (auth.uid() = user_id);