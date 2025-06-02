"use client"

import { useEffect, useState } from "react"
import { useSupabase } from "@/components/supabase-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

interface ProgressChartProps {
  teamId: string
}

interface TaskStatus {
  pending: number
  in_progress: number
  completed: number
  total: number
}

export function ProgressChart({ teamId }: ProgressChartProps) {
  const [taskStatus, setTaskStatus] = useState<TaskStatus>({
    pending: 0,
    in_progress: 0,
    completed: 0,
    total: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const { supabase } = useSupabase()

  useEffect(() => {
    const fetchTaskStatus = async () => {
      try {
        const { data, error } = await supabase.from("tasks").select("status").eq("team_id", teamId)

        if (error) {
          throw error
        }

        const statusCounts = {
          pending: 0,
          in_progress: 0,
          completed: 0,
          total: data.length,
        }

        data.forEach((task) => {
          statusCounts[task.status as keyof typeof statusCounts]++
        })

        setTaskStatus(statusCounts)
      } catch (error) {
        console.error("Error fetching task status:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchTaskStatus()
  }, [supabase, teamId])

  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-6 w-1/3 rounded-md bg-muted"></div>
          <div className="h-4 w-1/2 rounded-md bg-muted"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-4 w-full rounded-md bg-muted"></div>
            <div className="h-4 w-full rounded-md bg-muted"></div>
            <div className="h-4 w-full rounded-md bg-muted"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const completionPercentage = taskStatus.total > 0 ? Math.round((taskStatus.completed / taskStatus.total) * 100) : 0

  return (
    <Card>
      <CardHeader>
        <CardTitle>Progreso del Equipo</CardTitle>
        <CardDescription>Resumen del estado de las tareas del equipo</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Progreso General</span>
            <span className="text-sm font-medium">{completionPercentage}%</span>
          </div>
          <Progress value={completionPercentage} className="h-2" />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-lg border p-3 text-center">
            <div className="text-2xl font-bold">{taskStatus.pending}</div>
            <div className="text-xs text-muted-foreground">Pendientes</div>
          </div>
          <div className="rounded-lg border p-3 text-center">
            <div className="text-2xl font-bold">{taskStatus.in_progress}</div>
            <div className="text-xs text-muted-foreground">En Progreso</div>
          </div>
          <div className="rounded-lg border p-3 text-center">
            <div className="text-2xl font-bold">{taskStatus.completed}</div>
            <div className="text-xs text-muted-foreground">Completadas</div>
          </div>
        </div>

        {taskStatus.total === 0 && (
          <div className="rounded-md bg-muted p-4 text-center text-sm">No hay tareas creadas para este equipo.</div>
        )}
      </CardContent>
    </Card>
  )
}
