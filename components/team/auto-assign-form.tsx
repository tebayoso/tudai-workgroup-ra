"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSupabase } from "@/components/supabase-provider"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, Users, UserPlus } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { autoAssignStudentsToTeams, validateAutoAssignment } from "@/lib/team-assignment"
import { useUserRole } from "@/hooks/use-user-role"
import type { AutoAssignFormProps } from "@/@types"

export function AutoAssignForm({ tpId }: AutoAssignFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [validationInfo, setValidationInfo] = useState<{
    canAssign: boolean
    reasons: string[]
  } | null>(null)
  const [isValidating, setIsValidating] = useState(true)
  const { supabase, session } = useSupabase()
  const { isAdmin } = useUserRole()
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    const checkValidation = async () => {
      if (!session) return
      
      setIsValidating(true)
      const validation = await validateAutoAssignment(supabase, tpId)
      setValidationInfo(validation)
      setIsValidating(false)
    }

    checkValidation()
  }, [supabase, tpId, session])

  const handleAutoAssign = async () => {
    if (!session) {
      toast({
        title: "No autorizado",
        description: "Debes iniciar sesión para realizar la asignación",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      if (isAdmin) {
        // Admin: auto-assign all unassigned students
        const result = await autoAssignStudentsToTeams(supabase, tpId, {
          createNewTeams: true,
          maxMembersPerTeam: 4,
          teamNamePrefix: 'Equipo'
        })

        if (result.success) {
          toast({
            title: "Asignación automática completada",
            description: result.message,
          })

          // Refresh validation info
          const validation = await validateAutoAssignment(supabase, tpId)
          setValidationInfo(validation)
        } else {
          throw new Error(result.message)
        }
      } else {
        // Student: self-assign to a team
        // Check if already assigned
        const { data: existingMembership } = await supabase
          .from("team_members")
          .select("team_id")
          .eq("user_id", session.user.id)
          .in("team_id", 
            supabase
              .from("teams")
              .select("id")
              .eq("tp_id", tpId)
          )

        if (existingMembership && existingMembership.length > 0) {
          throw new Error("Ya eres miembro de un equipo para este trabajo práctico")
        }

        // Find available team or create new one
        const { data: availableTeams } = await supabase
          .from("teams")
          .select(`
            id,
            name,
            max_members,
            team_members(count)
          `)
          .eq("tp_id", tpId)
          .order("created_at", { ascending: true })

        let teamId: string | null = null
        let teamName = ""
        let isNewTeam = false

        // Find team with available space
        if (availableTeams && availableTeams.length > 0) {
          for (const team of availableTeams) {
            const memberCount = team.team_members[0]?.count || 0
            if (memberCount < team.max_members) {
              teamId = team.id
              teamName = team.name
              break
            }
          }
        }

        // Create new team if no space available
        if (!teamId) {
          const teamNumber = (availableTeams?.length || 0) + 1
          const { data: newTeam, error: createError } = await supabase
            .from("teams")
            .insert({
              name: `Equipo ${teamNumber}`,
              description: "Equipo creado automáticamente",
              tp_id: tpId,
              max_members: 4,
              created_by: session.user.id,
            })
            .select()
            .single()

          if (createError) throw createError

          teamId = newTeam.id
          teamName = newTeam.name
          isNewTeam = true
        }

        // Add user to team
        const { error: joinError } = await supabase
          .from("team_members")
          .insert({
            team_id: teamId,
            user_id: session.user.id,
            is_leader: isNewTeam, // First member becomes leader
          })

        if (joinError) throw joinError

        toast({
          title: "Asignación exitosa",
          description: `Has sido asignado al ${teamName}${isNewTeam ? ' (equipo nuevo)' : ''}`,
        })

        router.push(`/team/${teamId}`)
      }
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

  if (isValidating) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Asignación Automática</CardTitle>
          <CardDescription>Validando posibilidad de asignación...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {isAdmin ? <Users className="h-5 w-5" /> : <UserPlus className="h-5 w-5" />}
              Asignación Automática
            </CardTitle>
            <CardDescription>
              {isAdmin 
                ? "Asignar automáticamente a todos los estudiantes sin equipo"
                : "Únete automáticamente a un equipo con espacio disponible"
              }
            </CardDescription>
          </div>
          {validationInfo?.canAssign && (
            <Badge variant="secondary">
              {isAdmin ? "Disponible para administradores" : "Disponible"}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {validationInfo && (
          <div>
            {validationInfo.canAssign ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Estado de Asignación</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc list-inside space-y-1">
                    {validationInfo.reasons.map((reason, index) => (
                      <li key={index} className="text-sm">{reason}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            ) : (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>No se puede realizar asignación automática</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc list-inside space-y-1">
                    {validationInfo.reasons.map((reason, index) => (
                      <li key={index} className="text-sm">{reason}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {!isAdmin && validationInfo?.canAssign && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Información</AlertTitle>
            <AlertDescription>
              Una vez asignado, no podrás cambiar de equipo. Asegúrate de que esta es la opción que deseas.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleAutoAssign} 
          disabled={isLoading || !validationInfo?.canAssign} 
          className="w-full"
        >
          {isLoading 
            ? "Procesando..." 
            : isAdmin 
              ? "Asignar Todos los Estudiantes"
              : "Asignarme a un Equipo"
          }
        </Button>
      </CardFooter>
    </Card>
  )
}
