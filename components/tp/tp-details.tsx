"use client"

import { useEffect, useState } from "react"
import { useSupabase } from "@/components/supabase-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { formatDate } from "@/lib/utils"

interface TpDetailsProps {
  id: string
}

interface Tp {
  id: string
  title: string
  description: string
  deadline: string
  created_at: string
  created_by: string
}

interface TpAttachment {
  id: string
  tp_id: string
  file_url: string
  uploaded_at: string
}

export function TpDetails({ id }: TpDetailsProps) {
  const [tp, setTp] = useState<Tp | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [attachments, setAttachments] = useState<TpAttachment[]>([])
  const { supabase } = useSupabase()

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
      } catch (err: any) {
        console.error("Error fetching TP:", err)
        setError(err.message)
      } finally {
        setIsLoading(false)
      }
    }

    fetchTp()
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
          <CardTitle>{tp.title}</CardTitle>
          <Badge variant={isExpired ? "destructive" : "default"}>{isExpired ? "Vencido" : "Activo"}</Badge>
        </div>
        <CardDescription>Fecha límite: {formatDate(tp.deadline)}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="prose max-w-none dark:prose-invert">
          <p>{tp.description}</p>
        </div>

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
