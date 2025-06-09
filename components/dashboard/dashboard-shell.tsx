import type React from "react";
import { Breadcrumb } from "@/components/ui/breadcrumb";

interface DashboardShellProps {
  children: React.ReactNode;
}

export function DashboardShell({ children }: DashboardShellProps) {
  return (
    <div className="w-full grid items-start gap-4 sm:gap-6 lg:gap-8 py-4 sm:py-6 lg:py-8">
      <Breadcrumb />
      {children}
    </div>
  );
}
