"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useSupabase } from "@/components/supabase-provider"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface AutoAssignFormProps {
  tpId: string
}

export function AutoAssignForm({ tpId }: AutoAssignFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { supabase, session } = useSupabase()
  const router = useRouter()
  const { toast } = useToast()

  const handleAutoAssign = async () => {
    if (!session) {
      toast({
        title: "No autorizado",
        description: "Debes iniciar sesión para ser asignado a un equipo",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      // Verificar que el usuario existe en la tabla profiles
      const { data: userProfile, error: profileError } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("user_id", session.user.id)
        .maybeSingle()

      if (profileError) {
        console.error("Error verificando perfil de usuario:", profileError)
      }

      // Si el usuario no existe en profiles, intentamos crearlo
      if (!userProfile) {
        console.log("Usuario no encontrado en la tabla profiles, intentando crearlo...")

        // Obtenemos los metadatos del usuario de la sesión
        const userMetadata = session.user.user_metadata || {}

        const { error: insertProfileError } = await supabase.from("profiles").insert({
          user_id: session.user.id,
          name: userMetadata.name || session.user.email?.split("@")[0] || "Usuario",
          role: userMetadata.role || "estudiante",
        })

        if (insertProfileError) {
          console.error("Error al crear el perfil de usuario:", insertProfileError)
          // Continuamos con la asignación aunque haya error en el perfil
        }
      }

      // Verificar si el usuario ya está en un equipo para este TP
      const { data: existingMembership, error: membershipError } = await supabase
        .from("team_members")
        .select("team_id")
        .eq("user_id", session.user.id)
        .in("team_id", supabase.from("teams").select("id").eq("tp_id", tpId))

      if (existingMembership && existingMembership.length > 0) {
        throw new Error("Ya eres miembro de un equipo para este trabajo práctico")
      }

      // Buscar equipos con menos de 5 miembros
      const { data: availableTeams, error: teamsError } = await supabase
        .from("teams")
        .select(`
          id,
          name,
          team_members:team_members(count)
        `)
        .eq("tp_id", tpId)
        .order("created_at", { ascending: true })

      if (teamsError) {
        throw teamsError
      }

      let teamId: string | null = null
      let isNewTeam = false

      // Encontrar un equipo con espacio disponible
      if (availableTeams && availableTeams.length > 0) {
        for (const team of availableTeams) {
          const memberCount = team.team_members[0]?.count || 0
          if (memberCount < 5) {
            teamId = team.id
            break
          }
        }
      }

      // Si no hay equipos con espacio, crear uno nuevo
      if (!teamId) {
        const { data: newTeam, error: createError } = await supabase
          .from("teams")
          .insert({
            name: `Equipo Auto ${Date.now().toString().slice(-4)}`,
            description: "Equipo creado automáticamente",
            tp_id: tpId,
            created_by: session.user.id,
          })
          .select()

        if (createError) {
          throw createError
        }

        if (newTeam && newTeam[0]) {
          teamId = newTeam[0].id
          isNewTeam = true
        }
      }

      if (!teamId) {
        throw new Error("No se pudo asignar a un equipo")
      }

      // Verificar si el usuario es profesor o asistente
      const { data: userRole } = await supabase.from("profiles").select("role").eq("user_id", session.user.id).single()

      const isTeacher = userRole?.role === "admin"

      // Agregar usuario al equipo sin la columna is_leader
      const { error: joinError } = await supabase.from("team_members").insert({
        team_id: teamId,
        user_id: session.user.id,
      })

      if (joinError) {
        throw joinError
      }

      toast({
        title: "Asignado correctamente",
        description: isNewTeam
          ? isTeacher
            ? "Se ha creado un nuevo equipo y has sido asignado como profesor/asistente"
            : "Se ha creado un nuevo equipo y has sido asignado como miembro"
          : "Has sido asignado a un equipo existente",
      })

      router.push(`/team/${teamId}`)
    } catch (error: any) {
      toast({
        title: "Error en la asignación",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Asignación Automática</CardTitle>
        <CardDescription>
          Serás asignado automáticamente a un equipo existente con espacio disponible o se creará uno nuevo.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Información</AlertTitle>
          <AlertDescription>
            Una vez asignado, no podrás cambiar de equipo. Asegúrate de que esta es la opción que deseas.
          </AlertDescription>
        </Alert>
      </CardContent>
      <CardFooter>
        <Button onClick={handleAutoAssign} disabled={isLoading} className="w-full">
          {isLoading ? "Asignando..." : "Asignarme a un Equipo"}
        </Button>
      </CardFooter>
    </Card>
  )
}
