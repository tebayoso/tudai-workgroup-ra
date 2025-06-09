-- Populate tp_instructors table with existing TP creators
-- But first, let's make sure users exist for the creators

-- First, create users entries for any missing creators
INSERT INTO public.users (id, name, role)
SELECT DISTINCT 
  t.created_by as id,
  COALESCE(au.raw_user_meta_data->>'name', au.email, 'Usuario') as name,
  'admin' as role
FROM public.tps t
LEFT JOIN auth.users au ON t.created_by = au.id
LEFT JOIN public.users u ON t.created_by = u.id
WHERE t.created_by IS NOT NULL
  AND u.id IS NULL  -- Only insert if user doesn't exist
ON CONFLICT (id) DO NOTHING;

-- Now populate tp_instructors with creators
INSERT INTO public.tp_instructors (tp_id, user_id, role)
SELECT 
  t.id as tp_id,
  t.created_by as user_id,
  'creator' as role
FROM public.tps t
WHERE t.created_by IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.tp_instructors ti 
    WHERE ti.tp_id = t.id AND ti.user_id = t.created_by
  );

-- Grant permissions to the current user if they exist
DO $$
DECLARE
  current_user_id UUID;
BEGIN
  -- Try to get the current user ID from the session
  SELECT auth.uid() INTO current_user_id;
  
  IF current_user_id IS NOT NULL THEN
    -- Make sure the current user exists in the users table
    INSERT INTO public.users (id, name, role)
    SELECT 
      current_user_id,
      COALESCE(au.raw_user_meta_data->>'name', au.email, 'Usuario Actual') as name,
      'admin' as role
    FROM auth.users au
    WHERE au.id = current_user_id
    ON CONFLICT (id) DO NOTHING;
    
    -- Make the current user an instructor for all TPs if they're an admin
    INSERT INTO public.tp_instructors (tp_id, user_id, role)
    SELECT 
      t.id as tp_id,
      current_user_id as user_id,
      'teacher' as role
    FROM public.tps t
    WHERE NOT EXISTS (
      SELECT 1 FROM public.tp_instructors ti 
      WHERE ti.tp_id = t.id AND ti.user_id = current_user_id
    );
  END IF;
END $$;