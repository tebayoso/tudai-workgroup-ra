import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { TaskList } from "@/components/task/task-list"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { TaskForm } from "@/components/task/task-form"

interface TasksPageProps {
  params: {
    id: string
  }
}

export default function TasksPage({ params }: TasksPageProps) {
  const teamId = params.id

  return (
    <DashboardShell>
      <DashboardHeader heading="Tareas del Equipo" text="Gestiona las tareas de tu equipo">
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
      </DashboardHeader>
      <div className="grid gap-8">
        <TaskList teamId={teamId} />
      </div>
    </DashboardShell>
  )
}
