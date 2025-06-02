-- Crear tablas para TPManager

-- Tabla de usuarios (complementa la autenticación de Supabase)
CREATE TABLE users (
  id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'estudiante')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Tabla de trabajos prácticos
CREATE TABLE tps (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  deadline TIMESTAMP WITH TIME ZONE NOT NULL,
  attachments TEXT[],
  created_by UUID REFERENCES users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Tabla de equipos
CREATE TABLE teams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tp_id UUID REFERENCES tps(id) NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Tabla de miembros de equipo
CREATE TABLE team_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID REFERENCES teams(id) NOT NULL,
  user_id UUID REFERENCES users(id) NOT NULL,
  is_leader BOOLEAN DEFAULT FALSE NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE (team_id, user_id)
);

-- Tabla de tareas
CREATE TABLE tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID REFERENCES teams(id) NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'in_progress', 'completed')) DEFAULT 'pending',
  due_date TIMESTAMP WITH TIME ZONE NOT NULL,
  assigned_to UUID REFERENCES users(id) NOT NULL,
  created_by UUID REFERENCES users(id) NOT NULL,
  updated_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Tabla de actualizaciones de tareas
CREATE TABLE task_updates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID REFERENCES tasks(id) NOT NULL,
  user_id UUID REFERENCES users(id) NOT NULL,
  status TEXT CHECK (status IN ('pending', 'in_progress', 'completed')),
  comment TEXT,
  attachment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Políticas de seguridad (RLS)

-- Habilitar RLS en todas las tablas
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tps ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_updates ENABLE ROW LEVEL SECURITY;

-- Políticas para usuarios
CREATE POLICY "Los usuarios pueden ver sus propios datos"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Los administradores pueden ver todos los usuarios"
  ON users FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ));

-- Políticas para trabajos prácticos
CREATE POLICY "Todos pueden ver los TPs"
  ON tps FOR SELECT
  USING (true);

CREATE POLICY "Solo administradores pueden crear TPs"
  ON tps FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Solo administradores pueden actualizar TPs"
  ON tps FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ));

-- Políticas para equipos
CREATE POLICY "Todos pueden ver los equipos"
  ON teams FOR SELECT
  USING (true);

CREATE POLICY "Usuarios autenticados pueden crear equipos"
  ON teams FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Líderes de equipo pueden actualizar sus equipos"
  ON teams FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM team_members
    WHERE team_id = id AND user_id = auth.uid() AND is_leader = true
  ));

-- Políticas para miembros de equipo
CREATE POLICY "Todos pueden ver los miembros de equipo"
  ON team_members FOR SELECT
  USING (true);

CREATE POLICY "Usuarios autenticados pueden unirse a equipos"
  ON team_members FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Usuarios solo pueden actualizar su propia membresía"
  ON team_members FOR UPDATE
  USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM team_members
    WHERE team_id = team_id AND user_id = auth.uid() AND is_leader = true
  ));

-- Políticas para tareas
CREATE POLICY "Miembros del equipo pueden ver las tareas"
  ON tasks FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM team_members
    WHERE team_id = tasks.team_id AND user_id = auth.uid()
  ));

CREATE POLICY "Miembros del equipo pueden crear tareas"
  ON tasks FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM team_members
    WHERE team_id = tasks.team_id AND user_id = auth.uid()
  ));

CREATE POLICY "Miembros del equipo pueden actualizar tareas"
  ON tasks FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM team_members
    WHERE team_id = tasks.team_id AND user_id = auth.uid()
  ));

-- Políticas para actualizaciones de tareas
CREATE POLICY "Miembros del equipo pueden ver actualizaciones"
  ON task_updates FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM team_members
    JOIN tasks ON tasks.team_id = team_members.team_id
    WHERE tasks.id = task_updates.task_id AND team_members.user_id = auth.uid()
  ));

CREATE POLICY "Miembros del equipo pueden crear actualizaciones"
  ON task_updates FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM team_members
    JOIN tasks ON tasks.team_id = team_members.team_id
    WHERE tasks.id = task_updates.task_id AND team_members.user_id = auth.uid()
  ));

-- Crear buckets para almacenamiento
INSERT INTO storage.buckets (id, name, public) VALUES ('attachments', 'Attachments', true);

-- Políticas para almacenamiento
CREATE POLICY "Archivos públicos son accesibles para todos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'attachments');

CREATE POLICY "Usuarios autenticados pueden subir archivos"
  ON storage.objects FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND bucket_id = 'attachments');

-- Triggers para actualizar timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_tasks_updated_at
BEFORE UPDATE ON tasks
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
