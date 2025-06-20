import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { RegisterOptions } from "@/components/tp/register-options";

interface RegisterPageProps {
  params: {
    id: string;
  };
}

export default function RegisterPage({ params }: RegisterPageProps) {
  const tpId = params.id;

  return (
    <DashboardShell>
      <DashboardHeader
        heading="Registrarse al Trabajo Práctico"
        text="Elige cómo quieres registrarte para este trabajo práctico"
      />
      <div className="grid gap-8">
        <div className="bg-gradient-to-br from-[#F5F5F5] to-[#FFFFFF] rounded-lg shadow-md p-4">
          <RegisterOptions tpId={tpId} />
        </div>
      </div>
    </DashboardShell>
  );
}
