"use client"

import { useEffect, useState } from "react"
import { useSupabase } from "@/components/supabase-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { formatDate } from "@/lib/utils"

interface TaskProgressListProps {
  teamId: string
}

interface Task {
  id: string
  title: string
  description: string
  status: "pending" | "in_progress" | "completed"
  due_date: string
  assigned_user?: {
    user_id: string
    name: string
  }
  updates: TaskUpdate[]
}

interface TaskUpdate {
  id: string
  task_id: string
  user_id: string
  comment: string
  created_at: string
  user: {
    name: string
  }
}

export function TaskProgressList({ teamId }: TaskProgressListProps) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [comments, setComments] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState<Record<string, boolean>>({})
  const { supabase, session } = useSupabase()
  const { toast } = useToast()

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        // Obtener las tareas del equipo
        const { data: tasksData, error: tasksError } = await supabase
          .from("tasks")
          .select(`
            id,
            title,
            description,
            status,
            due_date
          `)
          .eq("team_id", teamId)
          .order("due_date", { ascending: true })

        if (tasksError) {
          throw tasksError
        }

        // Inicializar comentarios vacíos
        const initialComments: Record<string, string> = {}
        tasksData.forEach((task) => {
          initialComments[task.id] = ""
        })
        setComments(initialComments)

        // Para cada tarea, obtener el usuario asignado y las actualizaciones
        const tasksWithDetails = await Promise.all(
          (tasksData || []).map(async (task) => {
            // Obtener el usuario asignado desde user_tasks
            const { data: userTaskData, error: userTaskError } = await supabase
              .from("user_tasks")
              .select("user_id")
              .eq("task_id", task.id)
              .single()

            let assignedUser = undefined

            if (!userTaskError && userTaskData) {
              // Obtener detalles del usuario
              const { data: userData, error: userError } = await supabase
                .from("profiles")
                .select("name")
                .eq("user_id", userTaskData.user_id)
                .single()

              if (!userError && userData) {
                assignedUser = {
                  user_id: userTaskData.user_id,
                  name: userData.name,
                }
              }
            }

            // Obtener actualizaciones de la tarea
            const { data: updatesData, error: updatesError } = await supabase
              .from("task_updates")
              .select(`
                id,
                task_id,
                user_id,
                comment,
                created_at,
                user:profiles!inner(name)
              `)
              .eq("task_id", task.id)
              .order("created_at", { ascending: false })

            if (updatesError) {
              console.error("Error fetching task updates:", updatesError)
              return {
                ...task,
                assigned_user: assignedUser,
                updates: [],
              }
            }

            return {
              ...task,
              assigned_user: assignedUser,
              updates: updatesData || [],
            }
          }),
        )

        setTasks(tasksWithDetails)
      } catch (error) {
        console.error("Error fetching tasks:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchTasks()
  }, [supabase, teamId])

  const handleCommentChange = (taskId: string, value: string) => {
    setComments({ ...comments, [taskId]: value })
  }

  const handleSubmitComment = async (taskId: string) => {
    if (!session) {
      toast({
        title: "No autorizado",
        description: "Debes iniciar sesión para añadir comentarios",
        variant: "destructive",
      })
      return
    }

    if (!comments[taskId]?.trim()) {
      toast({
        title: "Comentario vacío",
        description: "Por favor, escribe un comentario antes de enviar",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting({ ...isSubmitting, [taskId]: true })

    try {
      const { data, error } = await supabase
        .from("task_updates")
        .insert({
          task_id: taskId,
          user_id: session.user.id,
          comment: comments[taskId],
        })
        .select(`
          id,
          task_id,
          user_id,
          comment,
          created_at,
          user:profiles!inner(name)
        `)

      if (error) {
        throw error
      }

      // Actualizar la lista de tareas con el nuevo comentario
      setTasks(
        tasks.map((task) => {
          if (task.id === taskId) {
            return {
              ...task,
              updates: [data[0], ...task.updates],
            }
          }
          return task
        }),
      )

      // Limpiar el campo de comentario
      setComments({ ...comments, [taskId]: "" })

      toast({
        title: "Comentario añadido",
        description: "Tu comentario ha sido añadido correctamente",
      })
    } catch (error: any) {
      toast({
        title: "Error al añadir comentario",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting({ ...isSubmitting, [taskId]: false })
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-5 w-1/3 rounded-md bg-muted"></div>
              <div className="h-4 w-1/2 rounded-md bg-muted"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-4 w-full rounded-md bg-muted"></div>
                <div className="h-4 w-full rounded-md bg-muted"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (tasks.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-sm text-muted-foreground">No hay tareas para este equipo</p>
        </CardContent>
      </Card>
    )
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline">Pendiente</Badge>
      case "in_progress":
        return <Badge variant="secondary">En Progreso</Badge>
      case "completed":
        return <Badge variant="default">Completada</Badge>
      default:
        return <Badge variant="outline">Desconocido</Badge>
    }
  }

  return (
    <div className="space-y-6">
      {tasks.map((task) => (
        <Card key={task.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{task.title}</CardTitle>
              {getStatusBadge(task.status)}
            </div>
            <CardDescription>
              Fecha límite: {formatDate(task.due_date)} • Asignada a:{" "}
              {task.assigned_user ? task.assigned_user.name : "No asignada"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">{task.description}</p>

            <div className="space-y-2">
              <h3 className="text-sm font-medium">Añadir actualización</h3>
              <div className="flex space-x-2">
                <Textarea
                  value={comments[task.id] || ""}
                  onChange={(e) => handleCommentChange(task.id, e.target.value)}
                  placeholder="Escribe un comentario sobre el progreso..."
                  className="flex-1"
                />
                <Button
                  onClick={() => handleSubmitComment(task.id)}
                  disabled={isSubmitting[task.id]}
                  className="self-end"
                >
                  Enviar
                </Button>
              </div>
            </div>

            {task.updates.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-medium">Actualizaciones</h3>
                <div className="space-y-3">
                  {task.updates.map((update) => (
                    <div key={update.id} className="rounded-md border p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{update.user.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(update.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="mt-1 text-sm">{update.comment}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
