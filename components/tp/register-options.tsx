"use client"

import type React from "react"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useSupabase } from "@/components/supabase-provider"
import { useToast } from "@/components/ui/use-toast"
import Link from "next/link"

interface RegisterOptionsProps {
  tpId: string
}

export function RegisterOptions({ tpId }: RegisterOptionsProps) {
  const [teamCode, setTeamCode] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { supabase, session } = useSupabase()
  const { toast } = useToast()

  const handleJoinTeam = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!session) {
      toast({
        title: "No autorizado",
        description: "Debes iniciar sesión para unirte a un equipo",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      // Verificar si el usuario ya es miembro del equipo
      const { data: memberData, error: memberError } = await supabase
        .from("team_members")
        .select("*")
        .eq("team_id", teamCode)
        .eq("user_id", session.user.id)
        .single()

      if (memberData) {
        throw new Error("Ya eres miembro de este equipo")
      }

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
          // Continuamos con la unión al equipo aunque haya error en el perfil
        }
      }

      // Verificar si el código de equipo es válido
      const { data: teamData, error: teamError } = await supabase
        .from("teams")
        .select("*")
        .eq("id", teamCode)
        .eq("tp_id", tpId)
        .single()

      if (teamError) {
        throw new Error("Código de equipo inválido")
      }

      // Verificar si el usuario es profesor o asistente
      const { data: profileData } = await supabase
        .from("profiles")
        .select("role")
        .eq("user_id", session.user.id)
        .single()

      const isTeacher = profileData?.role === "admin"

      // Agregar usuario al equipo sin la columna is_leader
      const { error: joinError } = await supabase.from("team_members").insert({
        team_id: teamCode,
        user_id: session.user.id,
      })

      if (joinError) {
        throw joinError
      }

      toast({
        title: "Te has unido al equipo",
        description: `Te has unido al equipo ${teamData.name} correctamente`,
      })

      router.push(`/team/${teamCode}`)
    } catch (error: any) {
      toast({
        title: "Error al unirse al equipo",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle>Crear Equipo</CardTitle>
          <CardDescription>Crea un nuevo equipo para este trabajo práctico</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Crea un equipo e invita a otros estudiantes a unirse.</p>
        </CardContent>
        <CardFooter>
          <Button asChild className="w-full">
            <Link href={`/tp/${tpId}/team/create`}>Crear Equipo</Link>
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Unirse a un Equipo</CardTitle>
          <CardDescription>Únete a un equipo existente con un código</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleJoinTeam} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="teamCode">Código de Equipo</Label>
              <Input
                id="teamCode"
                value={teamCode}
                onChange={(e) => setTeamCode(e.target.value)}
                placeholder="Ingresa el código del equipo"
                required
              />
            </div>
          </form>
        </CardContent>
        <CardFooter>
          <Button onClick={handleJoinTeam} disabled={isLoading} className="w-full">
            {isLoading ? "Uniéndose..." : "Unirse al Equipo"}
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Asignación Automática</CardTitle>
          <CardDescription>Sé asignado automáticamente a un equipo</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            El sistema te asignará a un equipo existente con espacio disponible o creará uno nuevo.
          </p>
        </CardContent>
        <CardFooter>
          <Button asChild className="w-full">
            <Link href={`/tp/${tpId}/team/auto-assign`}>Asignación Automática</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
