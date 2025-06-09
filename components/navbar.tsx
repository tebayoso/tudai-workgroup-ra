"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useSupabase } from "@/components/supabase-provider"
import { ModeToggle } from "@/components/mode-toggle"
import { useUserRole } from "@/hooks/use-user-role"
import { useToast } from "@/components/ui/use-toast"
import { LogOut, User, Menu, X } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

export function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const { supabase, session } = useSupabase()
  const { isAdmin, isLoading: isRoleLoading } = useUserRole()
  const { toast } = useToast()

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        throw error
      }
      setIsOpen(false) // Close mobile menu
      router.push('/')
      router.refresh()
    } catch (error: any) {
      toast({
        title: "Error al cerrar sesión",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const closeSheet = () => setIsOpen(false)

  // No mostrar la barra de navegación en las páginas de autenticación
  if (pathname === "/login" || pathname === "/register") {
    return null
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 flex h-14 items-center">
        {/* Logo and Desktop Navigation */}
        <div className="flex items-center">
          <Link href="/" className="mr-4 flex items-center space-x-2">
            <span className="font-bold text-lg">TPManager</span>
          </Link>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
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

        {/* Desktop Actions */}
        <div className="hidden md:flex flex-1 items-center justify-end space-x-2">
          <ModeToggle />
          {session ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="ml-2">
                  <User className="h-4 w-4 mr-2" />
                  <span className="hidden lg:inline">Cuenta</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="flex items-center">
                    <User className="h-4 w-4 mr-2" />
                    Perfil
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout} className="flex items-center">
                  <LogOut className="h-4 w-4 mr-2" />
                  Cerrar Sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="ghost" className="ml-2" asChild>
              <Link href="/login">Iniciar Sesión</Link>
            </Button>
          )}
        </div>

        {/* Mobile Navigation */}
        <div className="flex md:hidden flex-1 items-center justify-end space-x-2">
          <ModeToggle />
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <nav className="flex flex-col space-y-4">
                {session ? (
                  <>
                    <Link 
                      href="/dashboard" 
                      className="flex items-center py-2 text-lg font-medium transition-colors hover:text-foreground/80"
                      onClick={closeSheet}
                    >
                      Dashboard
                    </Link>
                    <Link 
                      href="/tp" 
                      className="flex items-center py-2 text-lg font-medium transition-colors hover:text-foreground/80"
                      onClick={closeSheet}
                    >
                      Trabajos Prácticos
                    </Link>
                    {!isRoleLoading && isAdmin && (
                      <Link 
                        href="/tp/new" 
                        className="flex items-center py-2 text-lg font-medium transition-colors hover:text-foreground/80"
                        onClick={closeSheet}
                      >
                        Crear TP
                      </Link>
                    )}
                    <hr className="my-4" />
                    <Link 
                      href="/profile" 
                      className="flex items-center py-2 text-lg font-medium transition-colors hover:text-foreground/80"
                      onClick={closeSheet}
                    >
                      <User className="h-4 w-4 mr-2" />
                      Perfil
                    </Link>
                    <button 
                      onClick={handleLogout}
                      className="flex items-center py-2 text-lg font-medium transition-colors hover:text-foreground/80 text-left"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Cerrar Sesión
                    </button>
                  </>
                ) : (
                  <Link 
                    href="/login" 
                    className="flex items-center py-2 text-lg font-medium transition-colors hover:text-foreground/80"
                    onClick={closeSheet}
                  >
                    Iniciar Sesión
                  </Link>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
