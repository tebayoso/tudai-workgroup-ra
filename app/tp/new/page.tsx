import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { TpForm } from "@/components/tp/tp-form";

export default function NewTpPage() {
  return (
    <DashboardShell>
      <DashboardHeader
        heading="Crear Trabajo Práctico"
        text="Crea un nuevo trabajo práctico para tus estudiantes"
      />
      <div className="grid gap-8">
        <div className="bg-gradient-to-br from-[#F5F5F5] to-[#FFFFFF] rounded-lg shadow-md p-4">
          <TpForm />
        </div>
      </div>
    </DashboardShell>
  );
}
