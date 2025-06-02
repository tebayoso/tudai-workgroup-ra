import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { TpDetails } from "@/components/tp/tp-details"
import { TeamList } from "@/components/team/team-list"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"
import { Suspense } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

interface TpPageProps {
  params: {
    id: string
  }
}

// Componente de carga para TpDetails
function TpDetailsLoading() {
  return (
    <Card className="animate-pulse">
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
  )
}

// Componente de carga para TeamList
function TeamListLoading() {
  return (
    <div className="space-y-4">
      {[1, 2].map((i) => (
        <Card key={i} className="animate-pulse">
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
  )
}

export default function TpPage({ params }: TpPageProps) {
  const tpId = params.id

  return (
    <DashboardShell>
      <DashboardHeader heading="Trabajo Práctico" text="Detalles del trabajo práctico y equipos registrados">
        <div className="flex space-x-2">
          <Button variant="outline" asChild>
            <Link href={`/tp/${tpId}/register`}>Registrarse</Link>
          </Button>
          <Button asChild>
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
          <h2 className="text-xl font-bold tracking-tight">Equipos Registrados</h2>
          <p className="text-muted-foreground">Listado de equipos registrados para este trabajo práctico</p>
          <div className="mt-4">
            <Suspense fallback={<TeamListLoading />}>
              <TeamList tpId={tpId} />
            </Suspense>
          </div>
        </div>
      </div>
    </DashboardShell>
  )
}
