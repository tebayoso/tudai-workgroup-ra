export interface Task {
  id: string
  title: string
  description: string
  status: "pending" | "in_progress" | "completed"
  due_date: string
  created_by?: string
  team_id?: string
  created_at?: string
  assigned_user?: {
    user_id: string
    name: string
  }
  updates?: TaskUpdate[]
}

export interface TaskUpdate {
  id: string
  task_id: string
  user_id: string
  comment: string
  created_at: string
  user: {
    name: string
  }
}

export interface TaskFormProps {
  teamId: string
  taskId?: string
}

export interface TaskListProps {
  teamId: string
}

export interface TaskProgressListProps {
  teamId: string
}

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
  // Información adicional
  assigned_user_name?: string
  team_name?: string
  creator_name?: string
}