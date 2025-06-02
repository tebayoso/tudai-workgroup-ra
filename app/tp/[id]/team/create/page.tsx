import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { TeamForm } from "@/components/team/team-form"

interface CreateTeamPageProps {
  params: {
    id: string
  }
}

export default function CreateTeamPage({ params }: CreateTeamPageProps) {
  const tpId = params.id

  return (
    <DashboardShell>
      <DashboardHeader heading="Crear Equipo" text="Crea un nuevo equipo para este trabajo práctico" />
      <div className="grid gap-8">
        <TeamForm tpId={tpId} />
      </div>
    </DashboardShell>
  )
}
