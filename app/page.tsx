import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";

export default function Home() {
  return (
    <div className="w-full min-h-[calc(100vh-4rem)]">
      {/* Hero Section */}
      <section className="w-full py-12 sm:py-16 lg:py-24 xl:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-center space-y-8 text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tighter text-[#333333]">
              TPManager
            </h1>
            <p className="max-w-4xl text-[#666666] text-base sm:text-lg lg:text-xl xl:text-2xl leading-relaxed">
              Plataforma de gestión colaborativa de trabajos prácticos para
              estudiantes y docentes
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 w-full max-w-md">
              <Button
                asChild
                className="w-full sm:w-auto min-w-[160px] h-12 bg-gradient-to-r from-[#F7C948] to-[#B89B2B] text-[#333333] font-semibold shadow-lg hover:from-yellow-500 hover:to-yellow-700 transition text-lg"
              >
                <Link href="/login">Iniciar Sesión</Link>
              </Button>
              <Button
                variant="outline"
                asChild
                className="w-full sm:w-auto min-w-[160px] h-12 border-2 border-[#F7C948] text-[#B89B2B] text-lg font-semibold hover:bg-[#F7C948] hover:text-[#333333]"
              >
                <Link href="/register">Registrarse</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="w-full py-16 sm:py-20 lg:py-24 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 lg:gap-12">
            <Card className="bg-gradient-to-br from-[#F5F5F5] to-[#FFFFFF] rounded-xl shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl lg:text-2xl text-[#333333]">Para Docentes</CardTitle>
                <CardDescription className="text-[#666666] text-base">
                  Gestiona los trabajos prácticos de tus materias
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-6">
                <p className="text-[#666666] text-sm sm:text-base leading-relaxed">
                  Crea trabajos prácticos, asigna equipos y realiza seguimiento del
                  progreso de tus estudiantes.
                </p>
              </CardContent>
              <CardFooter>
                <Button
                  variant="outline"
                  className="w-full h-11 border-2 border-[#F7C948] text-[#B89B2B] font-semibold hover:bg-[#F7C948] hover:text-[#333333] transition-colors"
                  asChild
                >
                  <Link href="/login">Comenzar</Link>
                </Button>
              </CardFooter>
            </Card>
            
            <Card className="bg-gradient-to-br from-[#F5F5F5] to-[#FFFFFF] rounded-xl shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl lg:text-2xl text-[#333333]">Para Estudiantes</CardTitle>
                <CardDescription className="text-[#666666] text-base">
                  Organiza tus trabajos y colabora con tu equipo
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-6">
                <p className="text-[#666666] text-sm sm:text-base leading-relaxed">
                  Únete a equipos, distribuye tareas y mantén un seguimiento del
                  progreso de tu trabajo práctico.
                </p>
              </CardContent>
              <CardFooter>
                <Button
                  variant="outline"
                  className="w-full h-11 border-2 border-[#F7C948] text-[#B89B2B] font-semibold hover:bg-[#F7C948] hover:text-[#333333] transition-colors"
                  asChild
                >
                  <Link href="/login">Comenzar</Link>
                </Button>
              </CardFooter>
            </Card>
            
            <Card className="bg-gradient-to-br from-[#F5F5F5] to-[#FFFFFF] rounded-xl shadow-lg hover:shadow-xl transition-shadow md:col-span-2 xl:col-span-1">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl lg:text-2xl text-[#333333]">Colaboración</CardTitle>
                <CardDescription className="text-[#666666] text-base">
                  Trabaja en equipo de manera efectiva
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-6">
                <p className="text-[#666666] text-sm sm:text-base leading-relaxed">
                  Distribuye tareas, actualiza el progreso y mantén a todos
                  informados sobre el avance del trabajo.
                </p>
              </CardContent>
              <CardFooter>
                <Button
                  variant="outline"
                  className="w-full h-11 border-2 border-[#F7C948] text-[#B89B2B] font-semibold hover:bg-[#F7C948] hover:text-[#333333] transition-colors"
                  asChild
                >
                  <Link href="/register">Registrarse</Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
