-- Create a secure view to expose user profile information
-- This view allows safe access to user data from auth.users while respecting RLS

-- First, create a function to get user profile data
CREATE OR REPLACE FUNCTION get_user_profile(user_uuid UUID)
RETURNS TABLE (
  id UUID,
  email TEXT,
  name TEXT,
  avatar_url TEXT,
  role TEXT,
  created_at TIMESTAMPTZ
) 
SECURITY DEFINER
SET search_path = public, auth
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only allow authenticated users to call this function
  IF auth.uid() IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT 
    au.id,
    au.email,
    COALESCE(au.raw_user_meta_data->>'name', au.email) as name,
    au.raw_user_meta_data->>'avatar_url' as avatar_url,
    COALESCE(u.role, 'student') as role,
    au.created_at
  FROM auth.users au
  LEFT JOIN public.users u ON au.id = u.id
  WHERE au.id = user_uuid;
END;
$$;

-- Create a view that exposes user profiles safely
CREATE OR REPLACE VIEW user_profiles AS
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'name', au.email) as name,
  au.raw_user_meta_data->>'avatar_url' as avatar_url,
  COALESCE(u.role, 'student') as role,
  au.created_at
FROM auth.users au
LEFT JOIN public.users u ON au.id = u.id;

-- Grant permissions on the view
GRANT SELECT ON user_profiles TO authenticated;

-- Alternative simpler approach: Create a function to get team member profiles
CREATE OR REPLACE FUNCTION get_team_member_profiles(team_uuid UUID)
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  name TEXT,
  avatar_url TEXT,
  role TEXT,
  is_leader BOOLEAN,
  joined_at TIMESTAMPTZ
) 
SECURITY DEFINER
SET search_path = public, auth
LANGUAGE plpgsql
AS $$
BEGIN
  -- Check if the requesting user is a member of this team or an admin
  IF NOT EXISTS (
    SELECT 1 FROM team_members tm
    JOIN teams t ON tm.team_id = t.id
    WHERE tm.user_id = auth.uid() 
    AND t.id = team_uuid
  ) AND NOT EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  ) THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT 
    tm.user_id,
    au.email,
    COALESCE(au.raw_user_meta_data->>'name', au.email) as name,
    au.raw_user_meta_data->>'avatar_url' as avatar_url,
    COALESCE(u.role, 'student') as role,
    false as is_leader, -- We removed is_leader column, so default to false
    tm.created_at as joined_at
  FROM team_members tm
  JOIN auth.users au ON tm.user_id = au.id
  LEFT JOIN public.users u ON au.id = u.id
  WHERE tm.team_id = team_uuid
  ORDER BY tm.created_at;
END;
$$;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION get_team_member_profiles(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_profile(UUID) TO authenticated;