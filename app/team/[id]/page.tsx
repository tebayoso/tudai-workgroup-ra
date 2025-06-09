import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { TeamDetails } from "@/components/team/team-details";
import { TeamMembers } from "@/components/team/team-members";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { TeamPageProps } from "@types";
import Link from "next/link";

export default function TeamPage({ params }: TeamPageProps) {
  const teamId = params.id;

  return (
    <DashboardShell>
      <DashboardHeader
        heading="Panel del Equipo"
        text="Gestiona tu equipo y sus tareas"
      >
        <div className="flex space-x-2">
          <Button
            asChild
            className="bg-gradient-to-r from-[#F7C948] to-[#B89B2B] text-[#333333] font-semibold shadow"
          >
            <Link href={`/team/${teamId}/tasks`}>Ver Tareas</Link>
          </Button>
          <Button
            variant="outline"
            asChild
            className="border-[#F7C948] text-[#B89B2B]"
          >
            <Link href={`/team/${teamId}/progress`}>Ver Progreso</Link>
          </Button>
        </div>
      </DashboardHeader>
      <div className="grid gap-8">
        <div className="bg-gradient-to-br from-[#F5F5F5] to-[#FFFFFF] rounded-lg shadow-md p-4">
          <TeamDetails id={teamId} />
        </div>
        <Separator />
        <div>
          <h2 className="text-xl font-bold tracking-tight text-[#333333]">
            Miembros del Equipo
          </h2>
          <p className="text-[#666666]">
            Listado de miembros que componen este equipo
          </p>
          <div className="mt-4">
            <TeamMembers teamId={teamId} />
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
