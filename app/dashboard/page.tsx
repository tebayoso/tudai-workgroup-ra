"use client"

import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { TpList } from "@/components/dashboard/tp-list"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import Link from "next/link"
import { useUserRole } from "@/hooks/use-user-role"

export default function DashboardPage() {
  const { isAdmin, isLoading, error } = useUserRole()

  return (
    <DashboardShell>
      <DashboardHeader heading="Dashboard" text="Gestiona tus trabajos prácticos y equipos">
        {isLoading ? (
          <Button disabled>
            <LoadingSpinner size={16} className="mr-2" />
            Cargando...
          </Button>
        ) : error ? (
          <div className="text-sm text-destructive">Error al cargar permisos</div>
        ) : isAdmin ? (
          <Button asChild>
            <Link href="/tp/new">Nuevo TP</Link>
          </Button>
        ) : null}
      </DashboardHeader>
      <Tabs defaultValue="assigned" className="space-y-4">
        <TabsList>
          <TabsTrigger value="assigned">Mis TPs</TabsTrigger>
          <TabsTrigger value="teams">Mis Equipos</TabsTrigger>
        </TabsList>
        <TabsContent value="assigned" className="space-y-4">
          <TpList />
        </TabsContent>
        <TabsContent value="teams" className="space-y-4">
          <div className="rounded-md border p-4">
            <div className="text-center text-sm text-muted-foreground">No tienes equipos asignados</div>
          </div>
        </TabsContent>
      </Tabs>
    </DashboardShell>
  )
}
