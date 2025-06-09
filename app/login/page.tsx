import { LoginForm } from "@/components/auth/login-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="w-full flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center">
      <div className="w-full max-w-md mx-auto px-4">
      <Link
        href="/"
        className="absolute left-2 top-2 sm:left-4 sm:top-4 md:left-8 md:top-8 text-[#B89B2B] font-semibold text-sm sm:text-base"
      >
        ← Volver
      </Link>
      <div className="mx-auto flex w-full flex-col justify-center space-y-6">
        <Card className="bg-gradient-to-br from-[#F5F5F5] to-[#FFFFFF] rounded-lg shadow-md">
          <CardHeader>
            <CardTitle className="text-2xl text-[#333333]">
              Iniciar Sesión
            </CardTitle>
            <CardDescription className="text-[#666666]">
              Ingresa tus credenciales para acceder a TPManager
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm />
          </CardContent>
        </Card>
        <p className="px-4 sm:px-8 text-center text-sm text-[#666666]">
          ¿No tienes una cuenta?{" "}
          <Link
            href="/register"
            className="underline underline-offset-4 text-[#F7C948] hover:text-[#B89B2B] font-semibold"
          >
            Regístrate
          </Link>
        </p>
        </div>
      </div>
    </div>
  );
}
