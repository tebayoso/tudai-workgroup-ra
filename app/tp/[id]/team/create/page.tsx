import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { TeamForm } from "@/components/team/team-form";

interface CreateTeamPageProps {
  params: {
    id: string;
  };
}

export default function CreateTeamPage({ params }: CreateTeamPageProps) {
  const tpId = params.id;

  return (
    <DashboardShell>
      <DashboardHeader
        heading="Crear Equipo"
        text="Crea un nuevo equipo para este trabajo práctico"
      />
      <div className="grid gap-8">
        <div className="bg-gradient-to-br from-[#F5F5F5] to-[#FFFFFF] rounded-lg shadow-md p-4">
          <TeamForm tpId={tpId} />
        </div>
      </div>
    </DashboardShell>
  );
}
