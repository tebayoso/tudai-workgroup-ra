import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { ProgressChart } from "@/components/team/progress-chart"
import { TaskProgressList } from "@/components/task/task-progress-list"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface ProgressPageProps {
  params: {
    id: string
  }
}

export default function ProgressPage({ params }: ProgressPageProps) {
  const teamId = params.id

  return (
    <DashboardShell>
      <DashboardHeader heading="Progreso del Equipo" text="Visualiza el progreso de las tareas de tu equipo" />
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="tasks">Tareas</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-4">
          <ProgressChart teamId={teamId} />
        </TabsContent>
        <TabsContent value="tasks" className="space-y-4">
          <TaskProgressList teamId={teamId} />
        </TabsContent>
      </Tabs>
    </DashboardShell>
  )
}
