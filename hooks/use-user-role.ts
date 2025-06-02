"use client"

import { useEffect, useState } from "react"
import { useSupabase } from "@/components/supabase-provider"

export function useUserRole() {
  const { supabase, session } = useSupabase()
  const [role, setRole] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!session) {
        setIsLoading(false)
        return
      }

      try {
        // Consultamos la tabla profiles usando user_id en lugar de id
        const { data, error } = await supabase
          .from("profiles")
          .select("role")
          .eq("user_id", session.user.id)
          .maybeSingle()

        if (error) {
          throw error
        }

        if (data) {
          // Si encontramos el perfil, usamos su rol
          setRole(data.role)
        } else {
          // Si el usuario no existe en la tabla profiles, intentamos crearlo
          console.log("Usuario no encontrado en la tabla profiles, intentando crearlo...")

          // Obtenemos los metadatos del usuario de la sesión
          const userMetadata = session.user.user_metadata || {}
          const userRole = userMetadata.role || "estudiante" // Valor predeterminado: estudiante

          const { error: insertError } = await supabase.from("profiles").insert({
            user_id: session.user.id,
            name: userMetadata.name || session.user.email?.split("@")[0] || "Usuario",
            role: userRole,
          })

          if (insertError) {
            console.error("Error al crear el perfil de usuario:", insertError)
            // Si no podemos crear el perfil, usamos el rol de los metadatos
            setRole(userRole)
          } else {
            // Si creamos el perfil correctamente, usamos el rol que acabamos de asignar
            setRole(userRole)
          }
        }
      } catch (err) {
        console.error("Error fetching user role:", err)

        // En caso de error, intentamos usar el rol de los metadatos como fallback
        if (session.user.user_metadata?.role) {
          console.log("Usando rol de metadatos como fallback:", session.user.user_metadata.role)
          setRole(session.user.user_metadata.role)
        } else {
          setError(err instanceof Error ? err : new Error("Error desconocido al obtener el rol del usuario"))
        }
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserRole()
  }, [supabase, session])

  return { role, isLoading, error, isAdmin: role === "admin" }
}
