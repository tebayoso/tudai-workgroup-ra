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
import { useUserRole } from "@/hooks/use-user-role"

export function TpForm() {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [deadline, setDeadline] = useState("")
  const [files, setFiles] = useState<FileList | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { supabase, session } = useSupabase()
  const { isAdmin, isLoading: isRoleLoading } = useUserRole()
  const router = useRouter()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!session) {
      toast({
        title: "No autorizado",
        description: "Debes iniciar sesión para crear un trabajo práctico",
        variant: "destructive",
      })
      return
    }

    if (isRoleLoading) {
      toast({
        title: "Cargando",
        description: "Verificando permisos...",
      })
      return
    }

    if (!isAdmin) {
      toast({
        title: "No autorizado",
        description: "Solo los administradores pueden crear trabajos prácticos",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      // Crear el TP en la base de datos
      const { data: tpData, error: tpError } = await supabase
        .from("tps")
        .insert({
          title,
          description,
          deadline,
          created_by: session.user.id,
        })
        .select()

      if (tpError) {
        throw tpError
      }

      // Si hay archivos, subirlos a Supabase Storage
      if (files && tpData && tpData[0]) {
        const tpId = tpData[0].id

        // Subir cada archivo
        for (let i = 0; i < files.length; i++) {
          const file = files[i]
          const fileExt = file.name.split(".").pop()
          const fileName = `${tpId}-${Date.now()}-${i}.${fileExt}`
          const filePath = `tps/${tpId}/${fileName}`

          const { error: uploadError } = await supabase.storage.from("attachments").upload(filePath, file)

          if (uploadError) {
            console.error("Error uploading file:", uploadError)
            continue
          }

          // Obtener la URL pública del archivo
          const { data: publicUrlData } = supabase.storage.from("attachments").getPublicUrl(filePath)

          if (publicUrlData) {
            // Insertar en la tabla tp_attachments
            await supabase.from("tp_attachments").insert({
              tp_id: tpId,
              file_url: publicUrlData.publicUrl,
            })
          }
        }
      }

      toast({
        title: "Trabajo práctico creado",
        description: "El trabajo práctico ha sido creado correctamente",
      })

      router.push("/tp")
    } catch (error: any) {
      toast({
        title: "Error al crear el trabajo práctico",
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
            <Label htmlFor="title">Título</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="deadline">Fecha límite</Label>
            <Input id="deadline" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="file">Archivo adjunto (opcional)</Label>
            <Input
              id="file"
              type="file"
              multiple
              onChange={(e) => {
                const files = e.target.files
                if (files && files.length > 0) {
                  setFiles(files)
                }
              }}
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={isLoading || isRoleLoading}>
            {isLoading ? "Creando..." : "Crear Trabajo Práctico"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
