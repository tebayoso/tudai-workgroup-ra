import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { TaskProgressList } from "@/components/task/task-progress-list";
import { ProgressChart } from "@/components/team/progress-chart";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ProgressPageProps {
  params: {
    id: string;
  };
}

export default function ProgressPage({ params }: ProgressPageProps) {
  const teamId = params.id;

  return (
    <DashboardShell>
      <DashboardHeader
        heading="Progreso del Equipo"
        text="Visualiza el progreso de las tareas de tu equipo"
      />
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="bg-gradient-to-r from-[#F7C948] to-[#B89B2B] text-[#333333] font-semibold shadow">
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="tasks">Tareas</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-4">
          <div className="bg-gradient-to-br from-[#F5F5F5] to-[#FFFFFF] rounded-lg shadow-md p-4">
            <ProgressChart teamId={teamId} />
          </div>
        </TabsContent>
        <TabsContent value="tasks" className="space-y-4">
          <div className="bg-gradient-to-br from-[#F5F5F5] to-[#FFFFFF] rounded-lg shadow-md p-4">
            <TaskProgressList teamId={teamId} />
          </div>
        </TabsContent>
      </Tabs>
    </DashboardShell>
  );
}
