"use client"

import { useEffect, useState } from "react"
import { useSupabase } from "@/components/supabase-provider"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import Link from "next/link"
import { formatDate } from "@/lib/utils"
import { Team, TeamMember, User } from "@/types"
import { Users, Calendar, Hash } from "lucide-react"

interface TeamWithDetails extends Team {
  members: (TeamMember & { user: User })[]
  tp: {
    title: string
    deadline: string
  }
}

export function TeamListForUser() {
  const [teams, setTeams] = useState<TeamWithDetails[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { supabase, session } = useSupabase()

  useEffect(() => {
    const fetchUserTeams = async () => {
      if (!session) return

      try {
        // Get teams where the user is a member
        const { data: teamMemberships, error: membershipError } = await supabase
          .from("team_members")
          .select(`
            team_id,
            is_leader,
            joined_at,
            teams!inner (
              id,
              name,
              description,
              join_code,
              max_members,
              created_at,
              tp_id,
              tps!inner (
                title,
                deadline
              )
            )
          `)
          .eq("user_id", session.user.id)

        if (membershipError) {
          throw membershipError
        }

        if (!teamMemberships || teamMemberships.length === 0) {
          setTeams([])
          setIsLoading(false)
          return
        }

        // Get detailed team information with all members
        const teamIds = teamMemberships.map(tm => tm.teams.id)
        
        const { data: teamsData, error: teamsError } = await supabase
          .from("teams")
          .select(`
            *,
            tps!inner (
              title,
              deadline
            ),
            team_members!inner (
              user_id,
              is_leader,
              joined_at,
              users!inner (
                id,
                name,
                email,
                role
              )
            )
          `)
          .in("id", teamIds)

        if (teamsError) {
          throw teamsError
        }

        // Transform the data to match our interface
        const transformedTeams: TeamWithDetails[] = (teamsData || []).map(team => ({
          ...team,
          tp: team.tps,
          members: team.team_members.map(member => ({
            team_id: team.id,
            user_id: member.user_id,
            is_leader: member.is_leader,
            joined_at: member.joined_at,
            user: member.users
          }))
        }))

        setTeams(transformedTeams)
      } catch (error) {
        console.error("Error fetching user teams:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserTeams()
  }, [supabase, session])

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-5 w-1/3 rounded-md bg-muted"></div>
              <div className="h-4 w-1/2 rounded-md bg-muted"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-4 w-full rounded-md bg-muted"></div>
                <div className="h-4 w-3/4 rounded-md bg-muted"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (teams.length === 0) {
    return (
      <div className="rounded-md border p-8 text-center">
        <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
          <Users className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="mt-4 text-lg font-semibold">No tienes equipos</h3>
          <p className="mb-4 mt-2 text-sm text-muted-foreground">
            No eres miembro de ningún equipo. Únete a un equipo o crea uno nuevo para comenzar a colaborar.
          </p>
          <Button asChild>
            <Link href="/tp">Ver Trabajos Prácticos</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="grid gap-4">
      {teams.map((team) => {
        const userMembership = team.members.find(member => member.user_id === session?.user.id)
        const isLeader = userMembership?.is_leader || false
        const isDeadlineSoon = new Date(team.tp.deadline) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        
        return (
          <Card key={team.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="flex items-center gap-2">
                    {team.name}
                    {isLeader && (
                      <Badge variant="secondary" className="text-xs">
                        Líder
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription>
                    TP: {team.tp.title}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Hash className="h-4 w-4" />
                  {team.join_code}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {team.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {team.description}
                </p>
              )}
              
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span>{team.members.length}/{team.max_members} miembros</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>Vence: {formatDate(team.tp.deadline)}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Miembros:</span>
                <div className="flex -space-x-2">
                  {team.members.slice(0, 4).map((member) => (
                    <Avatar key={member.user_id} className="h-8 w-8 border-2 border-background">
                      <AvatarFallback className="text-xs">
                        {member.user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                  {team.members.length > 4 && (
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs border-2 border-background">
                      +{team.members.length - 4}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <div className="flex gap-2">
                <Badge 
                  variant={isDeadlineSoon ? "destructive" : "outline"}
                >
                  {isDeadlineSoon ? "Próximo a vencer" : "Activo"}
                </Badge>
                {team.members.length === team.max_members && (
                  <Badge variant="secondary">Completo</Badge>
                )}
              </div>
              <Button asChild>
                <Link href={`/team/${team.id}`}>Ver Equipo</Link>
              </Button>
            </CardFooter>
          </Card>
        )
      })}
    </div>
  )
}