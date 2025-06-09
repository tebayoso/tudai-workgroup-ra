export interface Team {
  id: string
  name: string
  description?: string
  created_at?: string
  member_count?: number
}

export interface TeamMember {
  user_id: string
  profile: {
    name: string
    role?: string
  }
}

export interface TeamFormProps {
  tpId: string
}

export interface TeamListProps {
  tpId: string
}

export interface TeamMembersProps {
  teamId: string
}

export interface AutoAssignFormProps {
  tpId: string
}

export interface TeamPageProps {
  params: {
    id: string
  }
}