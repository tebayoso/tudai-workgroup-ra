"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useSupabase } from "@/components/supabase-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { TeamFormProps } from "@types"

export function TeamForm({ tpId }: TeamFormProps) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { supabase, session } = useSupabase()
  const router = useRouter()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!session) {
      toast({
        title: "No autorizado",
        description: "Debes iniciar sesión para crear un equipo",
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
          // Continuamos con la creación del equipo aunque haya error en el perfil
        }
      }

      // Crear el equipo en la base de datos usando una transacción
      const { data: teamData, error: teamError } = await supabase
        .from("teams")
        .insert({
          name,
          description,
          tp_id: tpId,
          created_by: session.user.id,
        })
        .select()

      if (teamError) {
        throw teamError
      }

      // Agregar al creador como miembro del equipo
      if (teamData && teamData[0]) {
        const teamId = teamData[0].id

        // Verificar si el usuario es profesor o asistente
        const { data: userProfile } = await supabase
          .from("profiles")
          .select("role")
          .eq("user_id", session.user.id)
          .single()

        const isTeacher = userProfile?.role === "admin"

        // Eliminamos la referencia a is_leader ya que no existe en la tabla
        const { error: memberError } = await supabase.from("team_members").insert({
          team_id: teamId,
          user_id: session.user.id,
        })

        if (memberError) {
          throw memberError
        }

        toast({
          title: "Equipo creado",
          description: isTeacher
            ? "El equipo ha sido creado correctamente y has sido añadido como profesor/asistente"
            : "El equipo ha sido creado correctamente y has sido añadido como miembro",
        })

        router.push(`/team/${teamId}`)
      }
    } catch (error: any) {
      toast({
        title: "Error al crear el equipo",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4 pt-6">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre del equipo</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              required
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Creando..." : "Crear Equipo"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
