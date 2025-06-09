"use client"

import { useEffect, useState } from "react"
import { useSupabase } from "@/components/supabase-provider"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Team, TeamListProps } from "@types"
import Link from "next/link"

export function TeamList({ tpId }: TeamListProps) {
  const [teams, setTeams] = useState<Team[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { supabase } = useSupabase()

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        // Obtener equipos para este TP
        const { data, error } = await supabase
          .from("teams")
          .select(`
            id,
            name,
            description,
            created_at,
            team_members:team_members(count)
          `)
          .eq("tp_id", tpId)
          .order("created_at", { ascending: false })

        if (error) {
          throw error
        }

        // Transformar los datos para incluir el conteo de miembros
        const teamsWithCount = data.map((team) => ({
          ...team,
          member_count: team.team_members[0]?.count || 0,
        }))

        setTeams(teamsWithCount)
      } catch (error) {
        console.error("Error fetching teams:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchTeams()
  }, [supabase, tpId])

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-5 w-1/3 rounded-md bg-muted"></div>
              <div className="h-4 w-1/2 rounded-md bg-muted"></div>
            </CardHeader>
            <CardContent>
              <div className="h-4 w-full rounded-md bg-muted"></div>
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
          <h3 className="mt-4 text-lg font-semibold">No hay equipos registrados</h3>
          <p className="mb-4 mt-2 text-sm text-muted-foreground">
            Aún no hay equipos registrados para este trabajo práctico.
          </p>
          <Button asChild>
            <Link href={`/tp/${tpId}/register`}>Registrarse</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {teams.map((team) => (
        <Card key={team.id}>
          <CardHeader>
            <CardTitle>{team.name}</CardTitle>
            <CardDescription>
              {team.member_count} miembro{team.member_count !== 1 ? "s" : ""}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="line-clamp-2 text-sm text-muted-foreground">{team.description}</p>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <Link href={`/team/${team.id}`}>Ver Equipo</Link>
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}
