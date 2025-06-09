import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { TaskForm } from "@/components/task/task-form";
import { TaskList } from "@/components/task/task-list";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface TasksPageProps {
  params: {
    id: string;
  };
}

export default function TasksPage({ params }: TasksPageProps) {
  const teamId = params.id;

  return (
    <DashboardShell>
      <DashboardHeader
        heading="Tareas del Equipo"
        text="Gestiona las tareas de tu equipo"
      >
        <Dialog>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-[#F7C948] to-[#B89B2B] text-[#333333] font-semibold shadow">
              Nueva Tarea
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-gradient-to-br from-[#F5F5F5] to-[#FFFFFF] rounded-lg shadow-md">
            <DialogHeader>
              <DialogTitle>Crear Nueva Tarea</DialogTitle>
              <DialogDescription>
                Añade una nueva tarea para tu equipo
              </DialogDescription>
            </DialogHeader>
            <TaskForm teamId={teamId} />
          </DialogContent>
        </Dialog>
      </DashboardHeader>
      <div className="grid gap-8">
        <div className="bg-gradient-to-br from-[#F5F5F5] to-[#FFFFFF] rounded-lg shadow-md p-4">
          <TaskList teamId={teamId} />
        </div>
      </div>
    </DashboardShell>
  );
}
