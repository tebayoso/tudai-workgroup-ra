"use client"

import { useEffect, useState } from "react"
import { useSupabase } from "@/components/supabase-provider"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { useUserRole } from "@/hooks/use-user-role"

interface TeamMembersProps {
  teamId: string
}

interface TeamMember {
  user_id: string
  profile: {
    name: string
    role: string
  }
}

export function TeamMembers({ teamId }: TeamMembersProps) {
  const [members, setMembers] = useState<TeamMember[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { supabase } = useSupabase()
  const { isAdmin } = useUserRole()

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        // Modificamos la consulta para no seleccionar la columna 'is_leader' que no existe
        const { data, error } = await supabase
          .from("team_members")
          .select(`
            user_id,
            profile:profiles(name, role)
          `)
          .eq("team_id", teamId)

        if (error) {
          throw error
        }

        setMembers(data || [])
      } catch (error) {
        console.error("Error fetching team members:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchMembers()
  }, [supabase, teamId])

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="flex items-center space-x-4">
                <div className="h-10 w-10 rounded-full bg-muted"></div>
                <div className="space-y-2">
                  <div className="h-4 w-24 rounded-md bg-muted"></div>
                  <div className="h-3 w-32 rounded-md bg-muted"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (members.length === 0) {
    return (
      <Card>
        <CardContent className="p-4 text-center">
          <p className="text-sm text-muted-foreground">No hay miembros en este equipo</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {members.map((member) => (
        <Card key={member.user_id}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Avatar>
                  <AvatarFallback>
                    {member.profile?.name
                      ? member.profile.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                      : "??"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">
                    {member.profile?.name || "Usuario desconocido"}
                    {member.profile?.role === "admin" && (
                      <span className="ml-2 text-xs text-blue-500">(Profesor/Asistente)</span>
                    )}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {member.profile?.role === "admin" ? "Docente" : "Estudiante"}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
