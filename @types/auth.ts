import { Session } from '@supabase/supabase-js'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export type SupabaseContext = {
  supabase: ReturnType<typeof createClientComponentClient>
  session: Session | null
}

export interface User {
  id: string
  email: string
  role: 'admin' | 'estudiante'
  created_at: string
}

export interface Profile {
  user_id: string
  name: string
  role: string
}