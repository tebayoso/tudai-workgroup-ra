"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useSupabase } from "@/components/supabase-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { notifyTaskCreated, notifyTaskUpdated } from "@/lib/webhook-service"
import { TaskFormProps, TeamMember, Team } from "@types"
import { X } from "lucide-react"

export function TaskForm({ teamId, taskId }: TaskFormProps) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [dueDate, setDueDate] = useState("")
  const [assignedTo, setAssignedTo] = useState("")
  const [status, setStatus] = useState("pending")
  const [priority, setPriority] = useState("medium")
  const [category, setCategory] = useState("")
  const [labels, setLabels] = useState<string[]>([])
  const [newLabel, setNewLabel] = useState("")
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [teamDetails, setTeamDetails] = useState<Team | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const { supabase, session } = useSupabase()
  const { toast } = useToast()

  useEffect(() => {
    const fetchTeamMembers = async () => {
      try {
        const { data, error } = await supabase
          .from("team_members")
          .select(`
            user_id,
            profile:profiles(name)
          `)
          .eq("team_id", teamId)

        if (error) {
          throw error
        }

        setTeamMembers(data || [])
      } catch (error) {
        console.error("Error fetching team members:", error)
      }
    }

    const fetchTeamDetails = async () => {
      try {
        const { data, error } = await supabase.from("teams").select("id, name").eq("id", teamId).single()

        if (error) {
          throw error
        }

        setTeamDetails(data)
      } catch (error) {
        console.error("Error fetching team details:", error)
      }
    }

    const fetchTask = async () => {
      if (!taskId) return

      setIsEditing(true)

      try {
        // Obtener los detalles de la tarea
        const { data: taskData, error: taskError } = await supabase.from("tasks").select("*").eq("id", taskId).single()

        if (taskError) {
          throw taskError
        }

        if (taskData) {
          setTitle(taskData.title)
          setDescription(taskData.description || "")
          setDueDate(taskData.due_date ? taskData.due_date.split("T")[0] : "") // Extraer solo la fecha
          setStatus(taskData.status)
          setPriority(taskData.priority || "medium")
          setCategory(taskData.category || "")
          setLabels(taskData.labels || [])
          setAssignedTo(taskData.assigned_to || "")

          // Obtener el usuario asignado desde user_tasks
          const { data: userTaskData, error: userTaskError } = await supabase
            .from("user_tasks")
            .select("user_id")
            .eq("task_id", taskId)
            .single()

          if (!userTaskError && userTaskData) {
            setAssignedTo(userTaskData.user_id)
          }
        }
      } catch (error) {
        console.error("Error fetching task:", error)
      }
    }

    fetchTeamMembers()
    fetchTeamDetails()
    fetchTask()
  }, [supabase, teamId, taskId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!session) {
      toast({
        title: "No autorizado",
        description: "Debes iniciar sesión para crear o editar una tarea",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      if (isEditing) {
        // Actualizar tarea existente
        const { data, error } = await supabase
          .from("tasks")
          .update({
            title,
            description,
            due_date: dueDate,
            status,
            priority,
            category,
            labels: JSON.stringify(labels),
            assigned_to: assignedTo,
            updated_by: session.user.id,
            updated_at: new Date().toISOString(),
          })
          .eq("id", taskId)
          .select()

        if (error) {
          throw error
        }

        // Actualizar la asignación en user_tasks
        if (data && data.length > 0) {
          // Primero eliminar asignaciones existentes
          const { error: deleteError } = await supabase.from("user_tasks").delete().eq("task_id", taskId)

          if (deleteError) {
            throw deleteError
          }

          // Luego crear la nueva asignación
          const { error: assignError } = await supabase.from("user_tasks").insert({
            task_id: taskId,
            user_id: assignedTo,
          })

          if (assignError) {
            throw assignError
          }

          // Obtener información adicional para la notificación
          const taskData = data[0]

          // Obtener nombre del usuario asignado
          const { data: assignedUserData } = await supabase
            .from("profiles")
            .select("name")
            .eq("user_id", assignedTo)
            .single()

          // Obtener nombre del creador
          const { data: creatorData } = await supabase
            .from("profiles")
            .select("name")
            .eq("user_id", session.user.id)
            .single()

          // Enviar notificación de tarea actualizada
          await notifyTaskUpdated({
            ...taskData,
            assigned_to: assignedTo, // Añadir manualmente ya que no está en la tabla tasks
            assigned_user_name: assignedUserData?.name || "Usuario desconocido",
            team_name: teamDetails?.name || "Equipo desconocido",
            creator_name: creatorData?.name || "Usuario desconocido",
          })
        }

        toast({
          title: "Tarea actualizada",
          description: "La tarea ha sido actualizada correctamente",
        })
      } else {
        // Crear nueva tarea
        const { data, error } = await supabase
          .from("tasks")
          .insert({
            title,
            description,
            due_date: dueDate,
            status: "pending",
            priority,
            category,
            labels: JSON.stringify(labels),
            assigned_to: assignedTo,
            team_id: teamId,
            created_by: session.user.id,
          })
          .select()

        if (error) {
          throw error
        }

        // Crear la asignación en user_tasks
        if (data && data.length > 0) {
          const taskId = data[0].id

          const { error: assignError } = await supabase.from("user_tasks").insert({
            task_id: taskId,
            user_id: assignedTo,
          })

          if (assignError) {
            throw assignError
          }

          // Obtener información adicional para la notificación
          const taskData = data[0]

          // Obtener nombre del usuario asignado
          const { data: assignedUserData } = await supabase
            .from("profiles")
            .select("name")
            .eq("user_id", assignedTo)
            .single()

          // Obtener nombre del creador
          const { data: creatorData } = await supabase
            .from("profiles")
            .select("name")
            .eq("user_id", session.user.id)
            .single()

          // Enviar notificación de tarea creada
          await notifyTaskCreated({
            ...taskData,
            assigned_to: assignedTo, // Añadir manualmente ya que no está en la tabla tasks
            assigned_user_name: assignedUserData?.name || "Usuario desconocido",
            team_name: teamDetails?.name || "Equipo desconocido",
            creator_name: creatorData?.name || "Usuario desconocido",
          })
        }

        toast({
          title: "Tarea creada",
          description: "La tarea ha sido creada correctamente",
        })
      }

      // Limpiar el formulario
      if (!isEditing) {
        setTitle("")
        setDescription("")
        setDueDate("")
        setAssignedTo("")
        setStatus("pending")
      }

      // Cerrar el diálogo (esto se maneja en el componente padre)
    } catch (error: any) {
      toast({
        title: isEditing ? "Error al actualizar la tarea" : "Error al crear la tarea",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const addLabel = () => {
    if (newLabel.trim() && !labels.includes(newLabel.trim())) {
      setLabels([...labels, newLabel.trim()])
      setNewLabel("")
    }
  }

  const removeLabel = (labelToRemove: string) => {
    setLabels(labels.filter(label => label !== labelToRemove))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
          rows={3}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="dueDate">Fecha límite</Label>
        <Input id="dueDate" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} required />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="priority">Prioridad</Label>
          <Select value={priority} onValueChange={setPriority}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona prioridad" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Baja</SelectItem>
              <SelectItem value="medium">Media</SelectItem>
              <SelectItem value="high">Alta</SelectItem>
              <SelectItem value="critical">Crítica</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="category">Categoría</Label>
          <Input 
            id="category" 
            value={category} 
            onChange={(e) => setCategory(e.target.value)} 
            placeholder="ej. Frontend, Backend, Design"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="labels">Etiquetas</Label>
        <div className="flex gap-2">
          <Input
            id="labels"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            placeholder="Agregar etiqueta"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                addLabel()
              }
            }}
          />
          <Button type="button" onClick={addLabel} variant="outline">
            Agregar
          </Button>
        </div>
        {labels.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {labels.map((label) => (
              <Badge key={label} variant="secondary" className="flex items-center gap-1">
                {label}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => removeLabel(label)}
                />
              </Badge>
            ))}
          </div>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="assignedTo">Asignada a</Label>
        <Select value={assignedTo} onValueChange={setAssignedTo} required>
          <SelectTrigger>
            <SelectValue placeholder="Selecciona un miembro" />
          </SelectTrigger>
          <SelectContent>
            {teamMembers.map((member) => (
              <SelectItem key={member.user_id} value={member.user_id}>
                {member.profile?.name || "Usuario desconocido"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {isEditing && (
        <div className="space-y-2">
          <Label htmlFor="status">Estado</Label>
          <Select value={status} onValueChange={setStatus} required>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona un estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pendiente</SelectItem>
              <SelectItem value="in_progress">En Progreso</SelectItem>
              <SelectItem value="review">En Revisión</SelectItem>
              <SelectItem value="completed">Completada</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? (isEditing ? "Actualizando..." : "Creando...") : isEditing ? "Actualizar Tarea" : "Crear Tarea"}
      </Button>
    </form>
  )
}
