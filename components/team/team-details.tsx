"use client"

import { useEffect, useState } from "react"
import { useSupabase } from "@/components/supabase-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

interface TeamDetailsProps {
  id: string
}

interface Team {
  id: string
  name: string
  description: string
  created_at: string
  tp: {
    id: string
    title: string
    deadline: string
  }
}

export function TeamDetails({ id }: TeamDetailsProps) {
  const [team, setTeam] = useState<Team | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { supabase } = useSupabase()

  useEffect(() => {
    const fetchTeam = async () => {
      try {
        const { data, error } = await supabase
          .from("teams")
          .select(`
            id,
            name,
            description,
            created_at,
            tp:tps(id, title, deadline)
          `)
          .eq("id", id)
          .single()

        if (error) {
          throw error
        }

        setTeam(data)
      } catch (error) {
        console.error("Error fetching team:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchTeam()
  }, [supabase, id])

  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-6 w-1/3 rounded-md bg-muted"></div>
          <div className="h-4 w-1/2 rounded-md bg-muted"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="h-4 w-full rounded-md bg-muted"></div>
            <div className="h-4 w-full rounded-md bg-muted"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!team) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Equipo no encontrado</CardTitle>
          <CardDescription>El equipo que estás buscando no existe o ha sido eliminado.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const isExpired = new Date(team.tp.deadline) < new Date()

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{team.name}</CardTitle>
          <Badge variant={isExpired ? "destructive" : "default"}>{isExpired ? "TP Vencido" : "TP Activo"}</Badge>
        </div>
        <CardDescription>
          Trabajo Práctico:{" "}
          <Link href={`/tp/${team.tp.id}`} className="underline hover:text-primary">
            {team.tp.title}
          </Link>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="prose max-w-none dark:prose-invert">
          <p>{team.description}</p>
        </div>
        <div className="mt-4 flex items-center text-sm text-muted-foreground">
          <span>ID del equipo: {team.id}</span>
          <span className="mx-2">•</span>
          <span>Comparte este ID para que otros se unan a tu equipo</span>
        </div>
      </CardContent>
    </Card>
  )
}
