import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export default function Home() {
  return (
    <div className="container py-10">
      <div className="flex flex-col items-center justify-center space-y-4 text-center">
        <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl">TPManager</h1>
        <p className="max-w-[700px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
          Plataforma de gestión colaborativa de trabajos prácticos para estudiantes y docentes
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Button asChild>
            <Link href="/login">Iniciar Sesión</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/register">Registrarse</Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 pt-12 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Para Docentes</CardTitle>
            <CardDescription>Gestiona los trabajos prácticos de tus materias</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Crea trabajos prácticos, asigna equipos y realiza seguimiento del progreso de tus estudiantes.</p>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full" asChild>
              <Link href="/login">Comenzar</Link>
            </Button>
          </CardFooter>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Para Estudiantes</CardTitle>
            <CardDescription>Organiza tus trabajos y colabora con tu equipo</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Únete a equipos, distribuye tareas y mantén un seguimiento del progreso de tu trabajo práctico.</p>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full" asChild>
              <Link href="/login">Comenzar</Link>
            </Button>
          </CardFooter>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Colaboración</CardTitle>
            <CardDescription>Trabaja en equipo de manera efectiva</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Distribuye tareas, actualiza el progreso y mantén a todos informados sobre el avance del trabajo.</p>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full" asChild>
              <Link href="/register">Registrarse</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
