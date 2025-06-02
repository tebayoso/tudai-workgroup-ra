"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useSupabase } from "@/components/supabase-provider"
import { ModeToggle } from "@/components/mode-toggle"
import { useUserRole } from "@/hooks/use-user-role"

export function Navbar() {
  const pathname = usePathname()
  const { session } = useSupabase()
  const { isAdmin, isLoading: isRoleLoading } = useUserRole()

  // No mostrar la barra de navegación en las páginas de autenticación
  if (pathname === "/login" || pathname === "/register") {
    return null
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <span className="font-bold">TPManager</span>
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            {session ? (
              <>
                <Link href="/dashboard" className="transition-colors hover:text-foreground/80">
                  Dashboard
                </Link>
                <Link href="/tp" className="transition-colors hover:text-foreground/80">
                  Trabajos Prácticos
                </Link>
                {!isRoleLoading && isAdmin && (
                  <Link href="/tp/new" className="transition-colors hover:text-foreground/80">
                    Crear TP
                  </Link>
                )}
              </>
            ) : null}
          </nav>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-2">
          <nav className="flex items-center">
            <ModeToggle />
            {session ? (
              <Button variant="ghost" className="ml-2" asChild>
                <Link href="/profile">Perfil</Link>
              </Button>
            ) : (
              <Button variant="ghost" className="ml-2" asChild>
                <Link href="/login">Iniciar Sesión</Link>
              </Button>
            )}
          </nav>
        </div>
      </div>
    </header>
  )
}
