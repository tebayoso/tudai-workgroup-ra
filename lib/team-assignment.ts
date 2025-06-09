import { createClient } from '@supabase/supabase-js'

interface TeamAssignmentResult {
  success: boolean
  message: string
  assignedTeams?: { userId: string; teamId: string; teamName: string }[]
  errors?: string[]
}

interface StudentInfo {
  id: string
  name: string
  email: string
}

interface TeamInfo {
  id: string
  name: string
  max_members: number
  current_members: number
}

/**
 * Auto-assigns students to teams for a specific TP (Trabajo Práctico)
 * Uses a round-robin algorithm to distribute students evenly across teams
 */
export async function autoAssignStudentsToTeams(
  supabase: ReturnType<typeof createClient>,
  tpId: string,
  options: {
    createNewTeams?: boolean
    maxMembersPerTeam?: number
    teamNamePrefix?: string
  } = {}
): Promise<TeamAssignmentResult> {
  const {
    createNewTeams = true,
    maxMembersPerTeam = 4,
    teamNamePrefix = 'Equipo'
  } = options

  try {
    // 1. Get all students who need team assignment for this TP
    const { data: unassignedStudents, error: studentsError } = await supabase
      .from('users')
      .select('id, name, email')
      .eq('role', 'estudiante')
      .not('id', 'in', 
        supabase
          .from('team_members')
          .select('user_id')
          .in('team_id', 
            supabase
              .from('teams')
              .select('id')
              .eq('tp_id', tpId)
          )
      )

    if (studentsError) {
      throw new Error(`Error fetching unassigned students: ${studentsError.message}`)
    }

    if (!unassignedStudents || unassignedStudents.length === 0) {
      return {
        success: true,
        message: 'No hay estudiantes sin asignar para este TP',
        assignedTeams: []
      }
    }

    // 2. Get existing teams for this TP with current member counts
    const { data: existingTeams, error: teamsError } = await supabase
      .from('teams')
      .select(`
        id,
        name,
        max_members,
        team_members(count)
      `)
      .eq('tp_id', tpId)

    if (teamsError) {
      throw new Error(`Error fetching existing teams: ${teamsError.message}`)
    }

    // Transform teams data to include current member count
    let availableTeams: TeamInfo[] = (existingTeams || []).map(team => ({
      id: team.id,
      name: team.name,
      max_members: team.max_members,
      current_members: team.team_members?.[0]?.count || 0
    }))

    // Filter out full teams
    availableTeams = availableTeams.filter(team => team.current_members < team.max_members)

    // 3. Calculate how many new teams we need to create
    const totalStudents = unassignedStudents.length
    const availableSlots = availableTeams.reduce((sum, team) => 
      sum + (team.max_members - team.current_members), 0
    )
    
    let newTeamsNeeded = 0
    if (totalStudents > availableSlots) {
      if (createNewTeams) {
        newTeamsNeeded = Math.ceil((totalStudents - availableSlots) / maxMembersPerTeam)
      } else {
        return {
          success: false,
          message: `No hay suficientes espacios en equipos existentes. Se necesitan ${totalStudents - availableSlots} espacios adicionales.`
        }
      }
    }

    // 4. Create new teams if needed
    if (newTeamsNeeded > 0) {
      const newTeams = []
      for (let i = 1; i <= newTeamsNeeded; i++) {
        const teamNumber = availableTeams.length + i
        newTeams.push({
          tp_id: tpId,
          name: `${teamNamePrefix} ${teamNumber}`,
          max_members: maxMembersPerTeam,
          created_by: unassignedStudents[0].id // Use first student as creator temporarily
        })
      }

      const { data: createdTeams, error: createError } = await supabase
        .from('teams')
        .insert(newTeams)
        .select('id, name, max_members')

      if (createError) {
        throw new Error(`Error creating new teams: ${createError.message}`)
      }

      // Add created teams to available teams
      if (createdTeams) {
        availableTeams.push(...createdTeams.map(team => ({
          id: team.id,
          name: team.name,
          max_members: team.max_members,
          current_members: 0
        })))
      }
    }

    // 5. Assign students to teams using round-robin algorithm
    const assignments: { userId: string; teamId: string; teamName: string }[] = []
    const teamAssignments: { user_id: string; team_id: string; is_leader: boolean }[] = []
    
    let currentTeamIndex = 0
    
    for (const student of unassignedStudents) {
      // Find next available team
      while (currentTeamIndex < availableTeams.length && 
             availableTeams[currentTeamIndex].current_members >= availableTeams[currentTeamIndex].max_members) {
        currentTeamIndex++
      }

      if (currentTeamIndex >= availableTeams.length) {
        // This shouldn't happen if we calculated correctly, but handle it
        break
      }

      const assignedTeam = availableTeams[currentTeamIndex]
      
      // Assign first member of each team as leader
      const isLeader = assignedTeam.current_members === 0

      teamAssignments.push({
        user_id: student.id,
        team_id: assignedTeam.id,
        is_leader: isLeader
      })

      assignments.push({
        userId: student.id,
        teamId: assignedTeam.id,
        teamName: assignedTeam.name
      })

      // Update team member count
      assignedTeam.current_members++

      // Move to next team for round-robin distribution
      currentTeamIndex = (currentTeamIndex + 1) % availableTeams.length
    }

    // 6. Insert all team member assignments
    if (teamAssignments.length > 0) {
      const { error: assignmentError } = await supabase
        .from('team_members')
        .insert(teamAssignments)

      if (assignmentError) {
        throw new Error(`Error assigning students to teams: ${assignmentError.message}`)
      }
    }

    return {
      success: true,
      message: `${assignments.length} estudiantes asignados exitosamente a equipos${newTeamsNeeded > 0 ? ` (${newTeamsNeeded} equipos nuevos creados)` : ''}`,
      assignedTeams: assignments
    }

  } catch (error) {
    console.error('Error in auto-assignment:', error)
    return {
      success: false,
      message: `Error en la asignación automática: ${error instanceof Error ? error.message : 'Error desconocido'}`,
      errors: [error instanceof Error ? error.message : 'Error desconocido']
    }
  }
}

/**
 * Validates if auto-assignment is possible for a TP
 */
export async function validateAutoAssignment(
  supabase: ReturnType<typeof createClient>,
  tpId: string
): Promise<{ canAssign: boolean; reasons: string[] }> {
  const reasons: string[] = []

  try {
    // Check if TP exists
    const { data: tp, error: tpError } = await supabase
      .from('tps')
      .select('id, title')
      .eq('id', tpId)
      .single()

    if (tpError || !tp) {
      reasons.push('El Trabajo Práctico no existe o no es accesible')
      return { canAssign: false, reasons }
    }

    // Check for unassigned students
    const { data: unassignedStudents, error: studentsError } = await supabase
      .from('users')
      .select('id')
      .eq('role', 'estudiante')
      .not('id', 'in', 
        supabase
          .from('team_members')
          .select('user_id')
          .in('team_id', 
            supabase
              .from('teams')
              .select('id')
              .eq('tp_id', tpId)
          )
      )

    if (studentsError) {
      reasons.push('Error al verificar estudiantes sin asignar')
      return { canAssign: false, reasons }
    }

    if (!unassignedStudents || unassignedStudents.length === 0) {
      reasons.push('No hay estudiantes sin asignar para este TP')
    }

    // Check if there are existing teams with capacity
    const { data: existingTeams, error: teamsError } = await supabase
      .from('teams')
      .select(`
        id,
        max_members,
        team_members(count)
      `)
      .eq('tp_id', tpId)

    if (teamsError) {
      reasons.push('Error al verificar equipos existentes')
      return { canAssign: false, reasons }
    }

    const availableSlots = (existingTeams || []).reduce((sum, team) => {
      const currentMembers = team.team_members?.[0]?.count || 0
      return sum + Math.max(0, team.max_members - currentMembers)
    }, 0)

    if (unassignedStudents && unassignedStudents.length > 0) {
      if (availableSlots === 0) {
        reasons.push('Se necesitarán crear equipos nuevos (no hay espacios disponibles en equipos existentes)')
      } else if (unassignedStudents.length > availableSlots) {
        reasons.push(`Se necesitarán crear equipos adicionales (${unassignedStudents.length - availableSlots} estudiantes exceden la capacidad disponible)`)
      }
    }

    return {
      canAssign: unassignedStudents ? unassignedStudents.length > 0 : false,
      reasons
    }

  } catch (error) {
    reasons.push(`Error de validación: ${error instanceof Error ? error.message : 'Error desconocido'}`)
    return { canAssign: false, reasons }
  }
}