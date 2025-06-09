"use client"

import { useEffect, useState } from "react"
import { useSupabase } from "@/components/supabase-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Download, Edit, Users } from "lucide-react"
import { formatDate } from "@/lib/utils"
import { TpDetailsProps, Tp, TpAttachment } from "@types"
import Link from "next/link"

export function TpDetails({ id }: TpDetailsProps) {
  const [tp, setTp] = useState<Tp | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [attachments, setAttachments] = useState<TpAttachment[]>([])
  const [canEdit, setCanEdit] = useState(false)
  const [instructors, setInstructors] = useState<any[]>([])
  const { supabase, session } = useSupabase()

  useEffect(() => {
    const fetchTp = async () => {
      try {
        // Validar que el ID tenga formato UUID
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
        if (!uuidRegex.test(id)) {
          throw new Error(`ID inválido: ${id}. Debe ser un UUID válido.`)
        }

        const { data, error } = await supabase.from("tps").select("*").eq("id", id).single()

        if (error) {
          throw error
        }

        setTp(data)

        // Obtener los archivos adjuntos
        const { data: attachmentsData, error: attachmentsError } = await supabase
          .from("tp_attachments")
          .select("*")
          .eq("tp_id", id)

        if (attachmentsError) {
          throw attachmentsError
        }

        setAttachments(attachmentsData || [])

        // Check if user can edit this TP
        if (session) {
          const { data: canEditData, error: canEditError } = await supabase
            .rpc('can_edit_tp', { tp_uuid: id });

          if (!canEditError && canEditData) {
            setCanEdit(true);
          }

          // Fetch instructors
          const { data: instructorsData, error: instructorsError } = await supabase
            .from("tp_instructors")
            .select(`
              id,
              role,
              user_id
            `)
            .eq("tp_id", id);

          if (!instructorsError && instructorsData) {
            // Get user profiles for each instructor
            const instructorIds = instructorsData.map(i => i.user_id);
            const { data: profilesData, error: profilesError } = await supabase
              .from("user_profiles")
              .select("id, name, email")
              .in("id", instructorIds);

            if (!profilesError && profilesData) {
              const enrichedInstructors = instructorsData.map(instructor => {
                const profile = profilesData.find(p => p.id === instructor.user_id);
                return {
                  ...instructor,
                  user_profiles: profile || { name: "Usuario desconocido", email: "" }
                };
              });
              setInstructors(enrichedInstructors);
            } else {
              setInstructors(instructorsData);
            }
          }
        }
      } catch (err: any) {
        console.error("Error fetching TP:", err)
        setError(err.message)
      } finally {
        setIsLoading(false)
      }
    }

    fetchTp()
  }, [supabase, id, session])

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
            <div className="h-4 w-2/3 rounded-md bg-muted"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Error</CardTitle>
          <CardDescription>Ocurrió un error al cargar el trabajo práctico</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">{error}</p>
        </CardContent>
      </Card>
    )
  }

  if (!tp) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Trabajo Práctico no encontrado</CardTitle>
          <CardDescription>El trabajo práctico que estás buscando no existe o ha sido eliminado.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const isExpired = new Date(tp.deadline) < new Date()

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <CardTitle>{tp.title}</CardTitle>
            <CardDescription>Fecha límite: {formatDate(tp.deadline)}</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={isExpired ? "destructive" : "default"}>{isExpired ? "Vencido" : "Activo"}</Badge>
            {canEdit && (
              <Button variant="outline" size="sm" asChild>
                <Link href={`/tp/${id}/edit`}>
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </Link>
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="prose max-w-none dark:prose-invert">
          <p>{tp.description}</p>
        </div>

        {/* Instructors Section */}
        {instructors.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Instructores
            </h3>
            <div className="flex flex-wrap gap-2">
              {instructors.map((instructor) => (
                <Badge key={instructor.id} variant="outline">
                  {instructor.user_profiles?.name || "Usuario desconocido"} 
                  <span className="ml-1 text-xs">
                    ({instructor.role === 'creator' ? 'Creador' : 
                      instructor.role === 'teacher' ? 'Profesor' : 'Asistente'})
                  </span>
                </Badge>
              ))}
            </div>
          </div>
        )}

        {attachments.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Archivos adjuntos</h3>
            <div className="flex flex-wrap gap-2">
              {attachments.map((attachment) => (
                <Button key={attachment.id} variant="outline" size="sm" className="flex items-center gap-2" asChild>
                  <a href={attachment.file_url} target="_blank" rel="noopener noreferrer">
                    <Download className="h-4 w-4" />
                    Descargar archivo
                  </a>
                </Button>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
