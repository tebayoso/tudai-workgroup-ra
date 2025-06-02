"use client"

import { useEffect, useState } from "react"
import { useSupabase } from "@/components/supabase-provider"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { formatDate } from "@/lib/utils"
import { useUserRole } from "@/hooks/use-user-role"

interface Tp {
  id: string
  title: string
  description: string
  deadline: string
  created_at: string
}

export function TpList() {
  const [tps, setTps] = useState<Tp[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { supabase, session } = useSupabase()
  const { isAdmin, isLoading: isRoleLoading } = useUserRole()

  useEffect(() => {
    const fetchTps = async () => {
      if (!session || isRoleLoading) return

      try {
        // Si es admin, obtener todos los TPs
        // Si es estudiante, obtener los TPs donde está registrado
        let query = supabase.from("tps").select("*")

        if (!isAdmin) {
          // Obtener TPs donde el usuario es miembro de algún equipo
          const { data: teamMemberships } = await supabase
            .from("team_members")
            .select("team_id")
            .eq("user_id", session.user.id)

          if (teamMemberships && teamMemberships.length > 0) {
            const teamIds = teamMemberships.map((tm) => tm.team_id)

            const { data: teams } = await supabase.from("teams").select("tp_id").in("id", teamIds)

            if (teams && teams.length > 0) {
              const tpIds = teams.map((t) => t.tp_id)
              query = query.in("id", tpIds)
            } else {
              // No hay equipos, mostrar lista vacía
              setTps([])
              setIsLoading(false)
              return
            }
          } else {
            // No hay membresías, mostrar lista vacía
            setTps([])
            setIsLoading(false)
            return
          }
        }

        const { data, error } = await query.order("created_at", { ascending: false })

        if (error) {
          throw error
        }

        setTps(data || [])
      } catch (error) {
        console.error("Error fetching TPs:", error)
      } finally {
        setIsLoading(false)
      }
    }

    if (!isRoleLoading) {
      fetchTps()
    }
  }, [supabase, session, isAdmin, isRoleLoading])

  if (isLoading || isRoleLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
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

  if (tps.length === 0) {
    return (
      <div className="rounded-md border p-8 text-center">
        <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
          <h3 className="mt-4 text-lg font-semibold">No hay trabajos prácticos</h3>
          <p className="mb-4 mt-2 text-sm text-muted-foreground">
            No tienes trabajos prácticos asignados. Crea uno nuevo o espera a que te asignen.
          </p>
          {isAdmin && (
            <Button asChild>
              <Link href="/tp/create">Crear Trabajo Práctico</Link>
            </Button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="grid gap-4">
      {tps.map((tp) => (
        <Card key={tp.id}>
          <CardHeader>
            <CardTitle>{tp.title}</CardTitle>
            <CardDescription>Fecha límite: {formatDate(tp.deadline)}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="line-clamp-2 text-sm text-muted-foreground">{tp.description}</p>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Badge variant="outline">{new Date(tp.deadline) > new Date() ? "Activo" : "Vencido"}</Badge>
            <Button asChild>
              <Link href={`/tp/${tp.id}`}>Ver Detalles</Link>
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}
