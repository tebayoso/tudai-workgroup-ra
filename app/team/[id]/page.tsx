import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { TeamDetails } from "@/components/team/team-details"
import { TeamMembers } from "@/components/team/team-members"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"

interface TeamPageProps {
  params: {
    id: string
  }
}

export default function TeamPage({ params }: TeamPageProps) {
  const teamId = params.id

  return (
    <DashboardShell>
      <DashboardHeader heading="Panel del Equipo" text="Gestiona tu equipo y sus tareas">
        <div className="flex space-x-2">
          <Button asChild>
            <Link href={`/team/${teamId}/tasks`}>Ver Tareas</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/team/${teamId}/progress`}>Ver Progreso</Link>
          </Button>
        </div>
      </DashboardHeader>
      <div className="grid gap-8">
        <TeamDetails id={teamId} />
        <Separator />
        <div>
          <h2 className="text-xl font-bold tracking-tight">Miembros del Equipo</h2>
          <p className="text-muted-foreground">Listado de miembros que componen este equipo</p>
          <div className="mt-4">
            <TeamMembers teamId={teamId} />
          </div>
        </div>
      </div>
    </DashboardShell>
  )
}
