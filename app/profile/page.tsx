"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSupabase } from "@/components/supabase-provider";
import { useUserRole } from "@/hooks/use-user-role";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useToast } from "@/components/ui/use-toast";
import { User, Mail, Shield, Calendar, Save } from "lucide-react";

interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  role: string;
  created_at: string;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  
  const { supabase, session } = useSupabase();
  const { isAdmin } = useUserRole();
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (!session) {
      router.push("/login");
      return;
    }
    
    fetchProfile();
  }, [session, router]);

  const fetchProfile = async () => {
    if (!session) return;

    try {
      setIsLoading(true);
      
      // Get user profile data using the view
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (profileError) {
        throw profileError;
      }

      if (profileData) {
        setProfile(profileData);
        setName(profileData.name || "");
        setAvatarUrl(profileData.avatar_url || "");
      }

      // Get additional user data from public.users table
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("description")
        .eq("id", session.user.id)
        .single();

      if (!userError && userData) {
        setDescription(userData.description || "");
      }

    } catch (error: any) {
      toast({
        title: "Error al cargar el perfil",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!session || !profile) return;

    try {
      setIsSaving(true);

      // Update auth.users metadata
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          name: name,
          avatar_url: avatarUrl
        }
      });

      if (authError) {
        throw authError;
      }

      // Update or insert into public.users table
      const { error: userError } = await supabase
        .from("users")
        .upsert({
          id: session.user.id,
          name: name,
          role: profile.role,
          avatar_url: avatarUrl,
          description: description,
        });

      if (userError) {
        throw userError;
      }

      toast({
        title: "Perfil actualizado",
        description: "Los cambios se han guardado correctamente",
      });

      // Refresh profile data
      fetchProfile();

    } catch (error: any) {
      toast({
        title: "Error al guardar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardShell>
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size={32} />
        </div>
      </DashboardShell>
    );
  }

  if (!profile) {
    return (
      <DashboardShell>
        <div className="text-center py-12">
          <p className="text-muted-foreground">No se pudo cargar el perfil</p>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <DashboardHeader
        heading="Mi Perfil"
        text="Gestiona la información de tu cuenta"
      />
      
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Profile Overview Card */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Información General
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Avatar */}
            <div className="flex flex-col items-center space-y-4">
              <Avatar className="h-24 w-24">
                <AvatarImage src={avatarUrl} alt={name} />
                <AvatarFallback className="text-lg">
                  {name.split(' ').map(n => n[0]).join('').toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="text-center">
                <h3 className="font-semibold text-lg">{name}</h3>
                <p className="text-sm text-muted-foreground">{profile.email}</p>
              </div>
            </div>

            {/* Account Info */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Email:</span>
                <span>{profile.email}</span>
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Rol:</span>
                <span className="capitalize">{profile.role === 'admin' ? 'Administrador' : 'Estudiante'}</span>
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Miembro desde:</span>
                <span>{new Date(profile.created_at).toLocaleDateString('es-ES')}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Edit Profile Form */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Editar Perfil</CardTitle>
            <CardDescription>
              Actualiza tu información personal
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre completo</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ingresa tu nombre completo"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  value={profile.email}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  El email no se puede modificar
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="avatar">URL del Avatar</Label>
              <Input
                id="avatar"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://ejemplo.com/mi-avatar.jpg"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Cuéntanos un poco sobre ti..."
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label>Rol</Label>
              <Select value={profile.role} disabled>
                <SelectTrigger className="bg-muted">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="student">Estudiante</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                El rol es asignado por un administrador
              </p>
            </div>

            <div className="pt-4">
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="w-full sm:w-auto"
              >
                {isSaving ? (
                  <>
                    <LoadingSpinner size={16} className="mr-2" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Guardar Cambios
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}