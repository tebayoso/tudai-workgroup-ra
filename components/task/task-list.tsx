"use client"

import { useEffect, useState } from "react"
import { useSupabase } from "@/components/supabase-provider"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { TaskForm } from "@/components/task/task-form"
import { formatDate } from "@/lib/utils"
import { notifyTaskUpdated } from "@/lib/webhook-service"

interface TaskListProps {
  teamId: string
}

interface Task {
  id: string
  title: string
  description: string
  status: "pending" | "in_progress" | "completed"
  due_date: string
  created_by: string
  team_id: string
  created_at: string
  assigned_user?: {
    user_id: string
    name: string
  }
}

interface Team {
  id: string
  name: string
}

export function TaskList({ teamId }: TaskListProps) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [teamDetails, setTeamDetails] = useState<Team | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { supabase, session } = useSupabase()

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
            due_date,
            created_by,
            team_id,
            created_at
          `)
          .eq("team_id", teamId)
          .order("due_date", { ascending: true })

        if (tasksError) {
          throw tasksError
        }

        // Para cada tarea, obtener el usuario asignado desde user_tasks
        const tasksWithUsers = await Promise.all(
          (tasksData || []).map(async (task) => {
            // Obtener el usuario asignado desde user_tasks
            const { data: userTaskData, error: userTaskError } = await supabase
              .from("user_tasks")
              .select("user_id")
              .eq("task_id", task.id)
              .single()

            if (userTaskError) {
              console.error("Error fetching user_task:", userTaskError)
              return task
            }

            // Si encontramos un usuario asignado, obtener sus detalles
            if (userTaskData) {
              const { data: userData, error: userError } = await supabase
                .from("profiles")
                .select("name")
                .eq("user_id", userTaskData.user_id)
                .single()

              if (userError) {
                console.error("Error fetching user:", userError)
                return {
                  ...task,
                  assigned_user: {
                    user_id: userTaskData.user_id,
                    name: "Usuario desconocido",
                  },
                }
              }

              return {
                ...task,
                assigned_user: {
                  user_id: userTaskData.user_id,
                  name: userData.name,
                },
              }
            }

            return task
          }),
        )

        setTasks(tasksWithUsers)
      } catch (error) {
        console.error("Error fetching tasks:", error)
      } finally {
        setIsLoading(false)
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

    fetchTasks()
    fetchTeamDetails()
  }, [supabase, teamId])

  const handleStatusChange = async (taskId: string, newStatus: "pending" | "in_progress" | "completed") => {
    try {
      if (!session) {
        console.error("No hay sesión de usuario")
        return
      }

      const { data, error } = await supabase
        .from("tasks")
        .update({
          status: newStatus,
          updated_by: session.user.id,
          updated_at: new Date().toISOString(),
        })
        .eq("id", taskId)
        .select()

      if (error) {
        throw error
      }

      // Actualizar el estado local
      const updatedTasks = tasks.map((task) => (task.id === taskId ? { ...task, status: newStatus } : task))
      setTasks(updatedTasks)

      // Obtener la tarea actualizada para la notificación
      const updatedTask = updatedTasks.find((task) => task.id === taskId)

      if (updatedTask && data && data.length > 0) {
        // Obtener el usuario asignado
        const { data: userTaskData } = await supabase
          .from("user_tasks")
          .select("user_id")
          .eq("task_id", taskId)
          .single()

        // Obtener nombre del usuario asignado
        let assignedUserName = "Usuario desconocido"
        let assignedUserId = ""

        if (userTaskData) {
          assignedUserId = userTaskData.user_id
          const { data: userData } = await supabase
            .from("profiles")
            .select("name")
            .eq("user_id", userTaskData.user_id)
            .single()

          if (userData) {
            assignedUserName = userData.name
          }
        }

        // Obtener nombre del creador
        const { data: creatorData } = await supabase
          .from("profiles")
          .select("name")
          .eq("user_id", session.user.id)
          .single()

        // Enviar notificación de tarea actualizada
        await notifyTaskUpdated({
          ...data[0],
          assigned_to: assignedUserId,
          assigned_user_name: assignedUserName,
          team_name: teamDetails?.name || "Equipo desconocido",
          creator_name: creatorData?.name || "Usuario desconocido",
        })
      }
    } catch (error) {
      console.error("Error updating task status:", error)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-5 w-1/3 rounded-md bg-muted"></div>
              <div className="h-4 w-1/2 rounded-md bg-muted"></div>
            </CardHeader>
            <CardContent>
              <div className="h-4 w-full rounded-md bg-muted"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (tasks.length === 0) {
    return (
      <div className="rounded-md border p-8 text-center">
        <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
          <h3 className="mt-4 text-lg font-semibold">No hay tareas</h3>
          <p className="mb-4 mt-2 text-sm text-muted-foreground">
            No hay tareas creadas para este equipo. Crea una nueva tarea para comenzar.
          </p>
          <Dialog>
            <DialogTrigger asChild>
              <Button>Nueva Tarea</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Crear Nueva Tarea</DialogTitle>
                <DialogDescription>Añade una nueva tarea para tu equipo</DialogDescription>
              </DialogHeader>
              <TaskForm teamId={teamId} />
            </DialogContent>
          </Dialog>
        </div>
      </div>
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
    <div className="space-y-4">
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
          <CardContent>
            <p className="text-sm text-muted-foreground">{task.description}</p>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">Editar</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Editar Tarea</DialogTitle>
                  <DialogDescription>Modifica los detalles de esta tarea</DialogDescription>
                </DialogHeader>
                <TaskForm teamId={teamId} taskId={task.id} />
              </DialogContent>
            </Dialog>
            <div className="flex space-x-2">
              {task.status !== "pending" && (
                <Button variant="outline" size="sm" onClick={() => handleStatusChange(task.id, "pending")}>
                  Pendiente
                </Button>
              )}
              {task.status !== "in_progress" && (
                <Button variant="outline" size="sm" onClick={() => handleStatusChange(task.id, "in_progress")}>
                  En Progreso
                </Button>
              )}
              {task.status !== "completed" && (
                <Button variant="outline" size="sm" onClick={() => handleStatusChange(task.id, "completed")}>
                  Completada
                </Button>
              )}
            </div>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}
