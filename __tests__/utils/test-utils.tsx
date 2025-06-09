import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { ThemeProvider } from 'next-themes'

// Mock Supabase context
const mockSupabaseContext = {
  supabase: {
    auth: {
      getUser: jest.fn(),
      signIn: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } }
      })),
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
    })),
  },
  user: null,
  session: null,
}

// Create a custom render function that includes providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      {children}
    </ThemeProvider>
  )
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options })

export * from '@testing-library/react'
export { customRender as render }

// Mock data factories
export const createMockUser = (overrides = {}) => ({
  id: '123',
  email: 'test@example.com',
  role: 'estudiante',
  nombre: 'Test User',
  apellido: 'User',
  created_at: new Date().toISOString(),
  ...overrides,
})

export const createMockTP = (overrides = {}) => ({
  id: '456',
  nombre: 'Test TP',
  descripcion: 'Test description',
  fecha_inicio: new Date().toISOString(),
  fecha_fin: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  max_integrantes: 4,
  created_by: '123',
  created_at: new Date().toISOString(),
  ...overrides,
})

export const createMockTeam = (overrides = {}) => ({
  id: '789',
  nombre: 'Test Team',
  tp_id: '456',
  created_at: new Date().toISOString(),
  ...overrides,
})

export const createMockTask = (overrides = {}) => ({
  id: '101',
  titulo: 'Test Task',
  descripcion: 'Test task description',
  estado: 'pendiente',
  prioridad: 'media',
  fecha_vencimiento: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
  team_id: '789',
  asignado_a: '123',
  created_at: new Date().toISOString(),
  ...overrides,
})