"use client";

import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { TpList } from "@/components/dashboard/tp-list";
import { TeamListForUser } from "@/components/team/team-list-for-user";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUserRole } from "@/hooks/use-user-role";
import Link from "next/link";

export default function DashboardPage() {
  const { isAdmin, isLoading, error } = useUserRole();

  return (
    <DashboardShell>
      <DashboardHeader
        heading="Dashboard"
        text="Gestiona tus trabajos prácticos y equipos"
      >
        {isLoading ? (
          <Button
            disabled
            className="bg-gradient-to-r from-[#F7C948] to-[#B89B2B] text-[#333333] font-semibold shadow"
          >
            <LoadingSpinner size={16} className="mr-2" />
            Cargando...
          </Button>
        ) : error ? (
          <div className="text-sm text-destructive">
            Error al cargar permisos
          </div>
        ) : isAdmin ? (
          <Button
            asChild
            className="bg-gradient-to-r from-[#F7C948] to-[#B89B2B] text-[#333333] font-semibold shadow"
          >
            <Link href="/tp/new">Nuevo TP</Link>
          </Button>
        ) : null}
      </DashboardHeader>
      <Tabs defaultValue="assigned" className="space-y-4">
        <TabsList className="bg-gradient-to-r from-[#F7C948] to-[#B89B2B] text-[#333333] font-semibold shadow w-full sm:w-auto">
          <TabsTrigger value="assigned" className="flex-1 sm:flex-initial text-xs sm:text-sm">Mis TPs</TabsTrigger>
          <TabsTrigger value="teams" className="flex-1 sm:flex-initial text-xs sm:text-sm">Mis Equipos</TabsTrigger>
        </TabsList>
        <TabsContent value="assigned" className="space-y-4">
          <div className="bg-gradient-to-br from-[#F5F5F5] to-[#FFFFFF] rounded-lg shadow-md p-4 sm:p-6 lg:p-8">
            <TpList />
          </div>
        </TabsContent>
        <TabsContent value="teams" className="space-y-4">
          <div className="bg-gradient-to-br from-[#F5F5F5] to-[#FFFFFF] rounded-lg shadow-md p-4 sm:p-6 lg:p-8">
            <TeamListForUser />
          </div>
        </TabsContent>
      </Tabs>
    </DashboardShell>
  );
}
