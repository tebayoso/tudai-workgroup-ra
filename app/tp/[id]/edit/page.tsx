"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSupabase } from "@/components/supabase-provider";
import { useUserRole } from "@/hooks/use-user-role";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useToast } from "@/components/ui/use-toast";
import { Save, ArrowLeft, Users, UserPlus, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Link from "next/link";

interface TP {
  id: string;
  title: string;
  description: string;
  deadline: string;
  created_by: string;
}

interface Instructor {
  id: string;
  user_id: string;
  role: string;
  name: string;
  email: string;
}

export default function EditTPPage() {
  const [tp, setTp] = useState<TP | null>(null);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [canEdit, setCanEdit] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");
  const [newInstructorEmail, setNewInstructorEmail] = useState("");
  const [newInstructorRole, setNewInstructorRole] = useState("assistant");
  const [isAddingInstructor, setIsAddingInstructor] = useState(false);

  const { supabase, session } = useSupabase();
  const { isAdmin } = useUserRole();
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const tpId = params.id as string;

  useEffect(() => {
    if (!session) {
      router.push("/login");
      return;
    }
    
    fetchTPData();
  }, [session, router, tpId]);

  const fetchTPData = async () => {
    if (!session) return;

    try {
      setIsLoading(true);
      
      // Check if user can edit this TP
      const { data: canEditData, error: canEditError } = await supabase
        .rpc('can_edit_tp', { tp_uuid: tpId });

      if (canEditError) {
        throw canEditError;
      }

      if (!canEditData) {
        toast({
          title: "Sin permisos",
          description: "No tienes permisos para editar este trabajo práctico",
          variant: "destructive",
        });
        router.push(`/tp/${tpId}`);
        return;
      }

      setCanEdit(true);

      // Fetch TP details
      const { data: tpData, error: tpError } = await supabase
        .from("tps")
        .select("*")
        .eq("id", tpId)
        .single();

      if (tpError) {
        throw tpError;
      }

      if (tpData) {
        setTp(tpData);
        setTitle(tpData.title);
        setDescription(tpData.description || "");
        setDeadline(tpData.deadline);
      }

      // Fetch instructors - with error handling for missing table
      try {
        const { data: instructorsData, error: instructorsError } = await supabase
          .from("tp_instructors")
          .select("id, user_id, role")
          .eq("tp_id", tpId);

        if (instructorsError) {
          console.error("Error fetching instructors:", instructorsError);
          // If table doesn't exist or other error, just show creator as fallback
          if (tpData?.created_by && session?.user) {
            const { data: creatorProfile } = await supabase
              .from("user_profiles")
              .select("id, name, email")
              .eq("id", tpData.created_by)
              .single();
            
            if (creatorProfile) {
              setInstructors([{
                id: "fallback",
                user_id: tpData.created_by,
                role: "creator",
                name: creatorProfile.name || "Creador",
                email: creatorProfile.email || ""
              }]);
            }
          } else {
            setInstructors([]);
          }
        } else if (instructorsData && instructorsData.length > 0) {
          // Get user profiles for each instructor
          const instructorIds = instructorsData.map(i => i.user_id);
          const { data: profilesData, error: profilesError } = await supabase
            .from("user_profiles")
            .select("id, name, email")
            .in("id", instructorIds);

          if (!profilesError && profilesData) {
            const formattedInstructors = instructorsData.map(instructor => {
              const profile = profilesData.find(p => p.id === instructor.user_id);
              return {
                id: instructor.id,
                user_id: instructor.user_id,
                role: instructor.role,
                name: profile?.name || "Usuario desconocido",
                email: profile?.email || ""
              };
            });
            setInstructors(formattedInstructors);
          } else {
            // Fallback without profile data
            const formattedInstructors = instructorsData.map(instructor => ({
              id: instructor.id,
              user_id: instructor.user_id,
              role: instructor.role,
              name: "Usuario desconocido",
              email: ""
            }));
            setInstructors(formattedInstructors);
          }
        } else {
          // No instructors found, showing creator as fallback
          // If no instructors but we have TP creator, show that
          if (tpData?.created_by) {
            const { data: creatorProfile } = await supabase
              .from("user_profiles")
              .select("id, name, email")
              .eq("id", tpData.created_by)
              .single();
            
            if (creatorProfile) {
              setInstructors([{
                id: "creator-fallback",
                user_id: tpData.created_by,
                role: "creator",
                name: creatorProfile.name || "Creador",
                email: creatorProfile.email || ""
              }]);
            } else {
              setInstructors([]);
            }
          } else {
            setInstructors([]);
          }
        }
      } catch (err) {
        // Silently handle instructor fetching errors and show fallback
        setInstructors([]);
      }

    } catch (error: any) {
      toast({
        title: "Error al cargar el TP",
        description: error.message,
        variant: "destructive",
      });
      router.push("/tp");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!session || !tp) return;

    try {
      setIsSaving(true);

      const { error } = await supabase
        .from("tps")
        .update({
          title,
          description,
          deadline,
        })
        .eq("id", tpId);

      if (error) {
        throw error;
      }

      toast({
        title: "TP actualizado",
        description: "Los cambios se han guardado correctamente",
      });

      router.push(`/tp/${tpId}`);

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

  const handleAddInstructor = async () => {
    if (!newInstructorEmail.trim()) return;

    try {
      setIsAddingInstructor(true);

      // First, find the user by email
      const { data: userData, error: userError } = await supabase
        .from("user_profiles")
        .select("id, email, name")
        .eq("email", newInstructorEmail.trim())
        .single();

      if (userError || !userData) {
        toast({
          title: "Usuario no encontrado",
          description: "No se encontró un usuario con ese email",
          variant: "destructive",
        });
        return;
      }

      // Add instructor
      const { error: addError } = await supabase
        .from("tp_instructors")
        .insert({
          tp_id: tpId,
          user_id: userData.id,
          role: newInstructorRole
        });

      if (addError) {
        if (addError.code === '23505') { // Unique constraint violation
          toast({
            title: "Usuario ya es instructor",
            description: "Este usuario ya es instructor de este TP",
            variant: "destructive",
          });
        } else {
          throw addError;
        }
        return;
      }

      toast({
        title: "Instructor agregado",
        description: `${userData.name} ha sido agregado como ${newInstructorRole}`,
      });

      // Refresh instructors list
      setNewInstructorEmail("");
      setNewInstructorRole("assistant");
      fetchTPData();

    } catch (error: any) {
      toast({
        title: "Error al agregar instructor",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsAddingInstructor(false);
    }
  };

  const handleRemoveInstructor = async (instructorId: string, instructorRole: string) => {
    if (instructorRole === 'creator') {
      toast({
        title: "No se puede eliminar",
        description: "No se puede eliminar al creador del TP",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("tp_instructors")
        .delete()
        .eq("id", instructorId);

      if (error) {
        throw error;
      }

      toast({
        title: "Instructor eliminado",
        description: "El instructor ha sido eliminado del TP",
      });

      fetchTPData();

    } catch (error: any) {
      toast({
        title: "Error al eliminar instructor",
        description: error.message,
        variant: "destructive",
      });
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

  if (!canEdit || !tp) {
    return (
      <DashboardShell>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Sin permisos para editar este TP</p>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <DashboardHeader
        heading="Editar Trabajo Práctico"
        text="Actualiza la información del TP"
      >
        <Button variant="outline" asChild>
          <Link href={`/tp/${tpId}`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Link>
        </Button>
      </DashboardHeader>
      
      <div className="grid gap-8 lg:grid-cols-3">
        {/* TP Details Form */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Detalles del TP</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Título</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Título del trabajo práctico"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descripción detallada del trabajo práctico"
                rows={6}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="deadline">Fecha límite</Label>
              <Input
                id="deadline"
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
              />
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

        {/* Instructors Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Instructores
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Current Instructors */}
            <div className="space-y-2">
              {instructors.map((instructor) => (
                <div key={instructor.id} className="flex items-center justify-between p-2 border rounded-lg">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{instructor.name}</p>
                    <p className="text-xs text-muted-foreground">{instructor.email}</p>
                    <Badge variant="outline" className="text-xs mt-1">
                      {instructor.role === 'creator' ? 'Creador' : 
                       instructor.role === 'teacher' ? 'Profesor' : 'Asistente'}
                    </Badge>
                  </div>
                  {instructor.role !== 'creator' && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveInstructor(instructor.id, instructor.role)}
                      className="h-8 w-8"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            {/* Add New Instructor */}
            <div className="border-t pt-4 space-y-3">
              <div className="space-y-2">
                <Label htmlFor="instructor-email">Email del instructor</Label>
                <Input
                  id="instructor-email"
                  type="email"
                  value={newInstructorEmail}
                  onChange={(e) => setNewInstructorEmail(e.target.value)}
                  placeholder="email@ejemplo.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="instructor-role">Rol</Label>
                <Select value={newInstructorRole} onValueChange={setNewInstructorRole}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="teacher">Profesor</SelectItem>
                    <SelectItem value="assistant">Asistente</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={handleAddInstructor}
                disabled={isAddingInstructor || !newInstructorEmail.trim()}
                className="w-full"
                size="sm"
              >
                {isAddingInstructor ? (
                  <>
                    <LoadingSpinner size={16} className="mr-2" />
                    Agregando...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Agregar Instructor
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