// Tipos para TPManager
import { Session } from "@supabase/auth-helpers-nextjs"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

// Database types
export interface User {
  id: string
  name: string
  email: string
  role: 'admin' | 'docente' | 'estudiante'
  created_at: string
  updated_at: string
}

export interface TP {
  id: string
  title: string
  description: string
  deadline: string
  attachments: string[]
  created_by: string
  created_at: string
  updated_at: string
  creator?: User
  teams_count?: number
}

export interface Team {
  id: string
  tp_id: string
  name: string
  description?: string
  join_code: string
  max_members: number
  created_by: string
  created_at: string
  updated_at: string
  tp?: TP
  creator?: User
  members?: TeamMember[]
  member_count?: number
}

export interface TeamMember {
  team_id: string
  user_id: string
  is_leader: boolean
  joined_at: string
  user?: User
  team?: Team
}

export interface Task {
  id: string
  team_id: string
  title: string
  description?: string
  status: 'pending' | 'in_progress' | 'review' | 'completed'
  priority: 'low' | 'medium' | 'high' | 'critical'
  category?: string
  labels: string[]
  due_date?: string
  assigned_to?: string
  created_by: string
  updated_by?: string
  created_at: string
  updated_at: string
  team?: Team
  assigned_user?: User
  creator?: User
  updates?: TaskUpdate[]
}

export interface TaskUpdate {
  id: string
  task_id: string
  user_id: string
  previous_status?: 'pending' | 'in_progress' | 'review' | 'completed'
  new_status?: 'pending' | 'in_progress' | 'review' | 'completed'
  comment?: string
  attachment?: string
  created_at: string
  user?: User
  task?: Task
}

// Form types
export interface TPFormData {
  title: string
  description: string
  deadline: Date
  attachments?: FileList
}

export interface TeamFormData {
  name: string
  description?: string
}

export interface TaskFormData {
  title: string
  description?: string
  assigned_to?: string
  due_date?: Date
  status: 'pending' | 'in_progress' | 'review' | 'completed'
  priority: 'low' | 'medium' | 'high' | 'critical'
  category?: string
  labels: string[]
}

export interface JoinTeamFormData {
  join_code: string
}

// Context types
export interface SupabaseContext {
  supabase: ReturnType<typeof createClientComponentClient>
  session: Session | null
}

// Webhook types
export interface TaskNotification {
  id: string
  title: string
  description: string
  due_date: string
  assigned_to?: string
  team_id: string
  created_by: string
  status: string
  created_at: string
  assigned_user_name?: string
  team_name?: string
  creator_name?: string
}

// API Response types
export interface ApiResponse<T = any> {
  data?: T
  error?: string
  message?: string
}

// Filter and pagination types
export interface TaskFilters {
  status?: 'pending' | 'in_progress' | 'review' | 'completed'
  priority?: 'low' | 'medium' | 'high' | 'critical'
  category?: string
  assigned_to?: string
  team_id?: string
  due_date_from?: string
  due_date_to?: string
  labels?: string[]
}

export interface TPFilters {
  deadline_status?: 'upcoming' | 'past' | 'all'
  created_by?: string
  search?: string
}

export interface PaginationOptions {
  page?: number
  limit?: number
  order_by?: string
  order_direction?: 'asc' | 'desc'
}

// Progress tracking types
export interface TeamProgress {
  team_id: string
  total_tasks: number
  completed_tasks: number
  in_progress_tasks: number
  pending_tasks: number
  completion_percentage: number
  overdue_tasks: number
}

export interface TaskStatusDistribution {
  pending: number
  in_progress: number
  review: number
  completed: number
}

export interface MemberContribution {
  user_id: string
  user_name: string
  assigned_tasks: number
  completed_tasks: number
  completion_rate: number
}