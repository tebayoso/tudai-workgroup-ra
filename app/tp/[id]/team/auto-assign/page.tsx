import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { AutoAssignForm } from "@/components/team/auto-assign-form"

interface AutoAssignPageProps {
  params: {
    id: string
  }
}

export default function AutoAssignPage({ params }: AutoAssignPageProps) {
  const tpId = params.id

  return (
    <DashboardShell>
      <DashboardHeader
        heading="Asignación Automática"
        text="Serás asignado automáticamente a un equipo existente o se creará uno nuevo"
      />
      <div className="grid gap-8">
        <AutoAssignForm tpId={tpId} />
      </div>
    </DashboardShell>
  )
}
