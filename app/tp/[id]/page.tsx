import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { TeamList } from "@/components/team/team-list";
import { TpDetails } from "@/components/tp/tp-details";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { Suspense } from "react";

interface TpPageProps {
  params: {
    id: string;
  };
}

// Componente de carga para TpDetails
function TpDetailsLoading() {
  return (
    <Card className="animate-pulse bg-gradient-to-br from-[#F5F5F5] to-[#FFFFFF] rounded-lg shadow-md">
      <CardHeader>
        <div className="h-6 w-1/3 rounded-md bg-muted"></div>
        <div className="h-4 w-1/2 rounded-md bg-muted"></div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="h-4 w-full rounded-md bg-muted"></div>
          <div className="h-4 w-full rounded-md bg-muted"></div>
          <div className="h-4 w-2/3 rounded-md bg-muted"></div>
        </div>
      </CardContent>
    </Card>
  );
}

// Componente de carga para TeamList
function TeamListLoading() {
  return (
    <div className="space-y-4">
      {[1, 2].map((i) => (
        <Card
          key={i}
          className="animate-pulse bg-gradient-to-br from-[#F5F5F5] to-[#FFFFFF] rounded-lg shadow-md"
        >
          <CardHeader>
            <div className="h-5 w-1/3 rounded-md bg-muted"></div>
            <div className="h-4 w-1/2 rounded-md bg-muted"></div>
          </CardHeader>
          <CardContent>
            <div className="h-4 w-full rounded-md bg-muted"></div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function TpPage({ params }: TpPageProps) {
  const tpId = params.id;

  return (
    <DashboardShell>
      <DashboardHeader
        heading="Trabajo Práctico"
        text="Detalles del trabajo práctico y equipos registrados"
      >
        <div className="flex space-x-2">
          <Button
            variant="outline"
            asChild
            className="border-[#F7C948] text-[#B89B2B]"
          >
            <Link href={`/tp/${tpId}/register`}>Registrarse</Link>
          </Button>
          <Button
            asChild
            className="bg-gradient-to-r from-[#F7C948] to-[#B89B2B] text-[#333333] font-semibold shadow"
          >
            <Link href={`/tp/${tpId}/team/create`}>Crear Equipo</Link>
          </Button>
        </div>
      </DashboardHeader>
      <div className="grid gap-8">
        <Suspense fallback={<TpDetailsLoading />}>
          <TpDetails id={tpId} />
        </Suspense>
        <Separator />
        <div>
          <h2 className="text-xl font-bold tracking-tight text-[#333333]">
            Equipos Registrados
          </h2>
          <p className="text-[#666666]">
            Listado de equipos registrados para este trabajo práctico
          </p>
          <div className="mt-4">
            <Suspense fallback={<TeamListLoading />}>
              <TeamList tpId={tpId} />
            </Suspense>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
