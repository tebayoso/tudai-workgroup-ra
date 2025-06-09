-- Add support for multiple instructors per TP with different roles
CREATE TABLE IF NOT EXISTS public.tp_instructors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tp_id UUID NOT NULL REFERENCES public.tps(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('creator', 'teacher', 'assistant')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tp_id, user_id)
);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tp_instructors TO authenticated;

-- Enable RLS
ALTER TABLE public.tp_instructors ENABLE ROW LEVEL SECURITY;

-- RLS policies for tp_instructors
CREATE POLICY "Users can view TP instructors" ON public.tp_instructors
FOR SELECT
TO authenticated
USING (true); -- Anyone can see who are the instructors

CREATE POLICY "Admins and TP creators can manage instructors" ON public.tp_instructors
FOR ALL
TO authenticated
USING (
  -- Allow admins
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  )
  OR
  -- Allow TP creator
  EXISTS (
    SELECT 1 FROM public.tps
    WHERE tps.id = tp_instructors.tp_id
    AND tps.created_by = auth.uid()
  )
  OR
  -- Allow existing instructors with creator or teacher role
  EXISTS (
    SELECT 1 FROM public.tp_instructors existing
    WHERE existing.tp_id = tp_instructors.tp_id
    AND existing.user_id = auth.uid()
    AND existing.role IN ('creator', 'teacher')
  )
);

-- Function to check if user can edit TP
CREATE OR REPLACE FUNCTION can_edit_tp(tp_uuid UUID, user_uuid UUID DEFAULT auth.uid())
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Check if user is admin
  IF EXISTS (
    SELECT 1 FROM users 
    WHERE id = user_uuid AND role = 'admin'
  ) THEN
    RETURN TRUE;
  END IF;
  
  -- Check if user is TP creator
  IF EXISTS (
    SELECT 1 FROM tps 
    WHERE id = tp_uuid AND created_by = user_uuid
  ) THEN
    RETURN TRUE;
  END IF;
  
  -- Check if user is instructor with creator or teacher role
  IF EXISTS (
    SELECT 1 FROM tp_instructors 
    WHERE tp_id = tp_uuid 
    AND user_id = user_uuid 
    AND role IN ('creator', 'teacher')
  ) THEN
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION can_edit_tp(UUID, UUID) TO authenticated;

-- Update RLS policy for tps table to allow editing by instructors
DROP POLICY IF EXISTS "Users can update TPs they created or are admin" ON public.tps;

CREATE POLICY "Authorized users can update TPs" ON public.tps
FOR UPDATE
TO authenticated
USING (can_edit_tp(id))
WITH CHECK (can_edit_tp(id));

-- Create trigger to automatically add creator as instructor when TP is created
CREATE OR REPLACE FUNCTION add_creator_as_instructor()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Add the creator as an instructor with 'creator' role
  INSERT INTO tp_instructors (tp_id, user_id, role)
  VALUES (NEW.id, NEW.created_by, 'creator')
  ON CONFLICT (tp_id, user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_add_creator_as_instructor ON public.tps;
CREATE TRIGGER trigger_add_creator_as_instructor
  AFTER INSERT ON public.tps
  FOR EACH ROW
  EXECUTE FUNCTION add_creator_as_instructor();

-- Backfill existing TPs (only for users that exist in public.users)
INSERT INTO tp_instructors (tp_id, user_id, role)
SELECT t.id, t.created_by, 'creator'
FROM tps t
JOIN users u ON t.created_by = u.id
WHERE t.created_by IS NOT NULL
ON CONFLICT (tp_id, user_id) DO NOTHING;