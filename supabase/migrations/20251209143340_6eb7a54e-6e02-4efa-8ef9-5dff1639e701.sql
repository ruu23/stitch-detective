-- Allow authenticated users to read profiles for friend features
-- This enables friend suggestions, search, and friends list to work
CREATE POLICY "Authenticated users can view profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);