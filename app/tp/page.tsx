import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { TpList } from "@/components/dashboard/tp-list"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Suspense } from "react"

export default function TpListPage() {
  return (
    <DashboardShell>
      <DashboardHeader heading="Trabajos Prácticos" text="Listado de todos los trabajos prácticos">
        <Button asChild>
          <Link href="/tp/new">Nuevo TP</Link>
        </Button>
      </DashboardHeader>
      <div className="grid gap-8">
        <Suspense fallback={<div>Cargando trabajos prácticos...</div>}>
          <TpList />
        </Suspense>
      </div>
    </DashboardShell>
  )
}
