import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TeamForm } from '@/components/team/team-form'
import { mockRouter, mockSupabaseClient, resetAllMocks } from '@/__tests__/utils/mocks'

// Mock the hooks
jest.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
}))

jest.mock('@/components/supabase-provider', () => ({
  useSupabase: () => ({ 
    supabase: mockSupabaseClient,
    session: { user: { id: 'user-123', email: 'test@example.com', user_metadata: { name: 'Test User', role: 'estudiante' } } }
  }),
}))

const mockToast = jest.fn()
jest.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}))

describe('TeamForm', () => {
  const user = userEvent.setup()
  
  beforeEach(() => {
    resetAllMocks()
    mockToast.mockClear()
  })

  it('renders form fields', () => {
    render(<TeamForm tpId="tp-123" />)

    expect(screen.getByLabelText(/nombre del equipo/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/descripción/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /crear equipo/i })).toBeInTheDocument()
  })

  it('updates input values when user types', async () => {
    render(<TeamForm tpId="tp-123" />)

    const nameInput = screen.getByLabelText(/nombre del equipo/i)
    const descriptionInput = screen.getByLabelText(/descripción/i)

    await user.type(nameInput, 'Test Team')
    await user.type(descriptionInput, 'Test description')

    expect(nameInput).toHaveValue('Test Team')
    expect(descriptionInput).toHaveValue('Test description')
  })

  it('shows loading state when submitting form', async () => {
    const mockProfileQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({ data: { user_id: 'user-123' }, error: null }),
    }

    const mockTeamInsert = {
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ data: [{ id: 'team-123' }], error: null }), 100))
      ),
    }

    mockSupabaseClient.from.mockImplementation((table) => {
      if (table === 'profiles') return mockProfileQuery
      if (table === 'teams') return mockTeamInsert
      return { insert: jest.fn().mockResolvedValue({ error: null }) }
    })

    render(<TeamForm tpId="tp-123" />)

    await fillFormAndSubmit()
    
    expect(screen.getByText(/creando/i)).toBeInTheDocument()
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('creates team successfully with existing user profile', async () => {
    const mockProfileQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({ data: { user_id: 'user-123' }, error: null }),
      single: jest.fn().mockResolvedValue({ data: { role: 'estudiante' }, error: null }),
    }

    const mockTeamInsert = {
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockResolvedValue({ data: [{ id: 'team-123' }], error: null }),
    }

    const mockMemberInsert = {
      insert: jest.fn().mockResolvedValue({ error: null }),
    }

    mockSupabaseClient.from.mockImplementation((table) => {
      if (table === 'profiles') return mockProfileQuery
      if (table === 'teams') return mockTeamInsert
      if (table === 'team_members') return mockMemberInsert
      return mockTeamInsert
    })

    render(<TeamForm tpId="tp-123" />)

    await fillFormAndSubmit()

    await waitFor(() => {
      expect(mockTeamInsert.insert).toHaveBeenCalledWith({
        name: 'Test Team',
        description: 'Test description',
        tp_id: 'tp-123',
        created_by: 'user-123',
      })
    })

    expect(mockMemberInsert.insert).toHaveBeenCalledWith({
      team_id: 'team-123',
      user_id: 'user-123',
    })

    expect(mockToast).toHaveBeenCalledWith({
      title: 'Equipo creado',
      description: 'El equipo ha sido creado correctamente y has sido añadido como miembro',
    })

    expect(mockRouter.push).toHaveBeenCalledWith('/team/team-123')
  })

  it('creates user profile if not exists', async () => {
    const mockProfileQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
      single: jest.fn().mockResolvedValue({ data: { role: 'estudiante' }, error: null }),
      insert: jest.fn().mockResolvedValue({ error: null }),
    }

    const mockTeamInsert = {
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockResolvedValue({ data: [{ id: 'team-123' }], error: null }),
    }

    const mockMemberInsert = {
      insert: jest.fn().mockResolvedValue({ error: null }),
    }

    mockSupabaseClient.from.mockImplementation((table) => {
      if (table === 'profiles') return mockProfileQuery
      if (table === 'teams') return mockTeamInsert
      if (table === 'team_members') return mockMemberInsert
      return mockTeamInsert
    })

    render(<TeamForm tpId="tp-123" />)

    await fillFormAndSubmit()

    await waitFor(() => {
      expect(mockProfileQuery.insert).toHaveBeenCalledWith({
        user_id: 'user-123',
        name: 'Test User',
        role: 'estudiante',
      })
    })
  })

  it('shows different message for admin users', async () => {
    jest.doMock('@/components/supabase-provider', () => ({
      useSupabase: () => ({ 
        supabase: mockSupabaseClient,
        session: { user: { id: 'user-123', email: 'admin@example.com', user_metadata: { name: 'Admin User', role: 'admin' } } }
      }),
    }))

    const mockProfileQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({ data: { user_id: 'user-123' }, error: null }),
      single: jest.fn().mockResolvedValue({ data: { role: 'admin' }, error: null }),
    }

    const mockTeamInsert = {
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockResolvedValue({ data: [{ id: 'team-123' }], error: null }),
    }

    const mockMemberInsert = {
      insert: jest.fn().mockResolvedValue({ error: null }),
    }

    mockSupabaseClient.from.mockImplementation((table) => {
      if (table === 'profiles') return mockProfileQuery
      if (table === 'teams') return mockTeamInsert
      if (table === 'team_members') return mockMemberInsert
      return mockTeamInsert
    })

    const { TeamForm: TeamFormAdmin } = await import('@/components/team/team-form')
    render(<TeamFormAdmin tpId="tp-123" />)

    await fillFormAndSubmit()

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Equipo creado',
        description: 'El equipo ha sido creado correctamente y has sido añadido como profesor/asistente',
      })
    })
  })

  it('shows error when user is not authenticated', async () => {
    jest.doMock('@/components/supabase-provider', () => ({
      useSupabase: () => ({ 
        supabase: mockSupabaseClient,
        session: null
      }),
    }))

    const { TeamForm: TeamFormNoAuth } = await import('@/components/team/team-form')
    render(<TeamFormNoAuth tpId="tp-123" />)

    await fillFormAndSubmit()

    expect(mockToast).toHaveBeenCalledWith({
      title: 'No autorizado',
      description: 'Debes iniciar sesión para crear un equipo',
      variant: 'destructive',
    })
  })

  it('shows error toast on team creation failure', async () => {
    const mockProfileQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({ data: { user_id: 'user-123' }, error: null }),
    }

    const mockTeamInsert = {
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockResolvedValue({ 
        data: null, 
        error: { message: 'Database error' } 
      }),
    }

    mockSupabaseClient.from.mockImplementation((table) => {
      if (table === 'profiles') return mockProfileQuery
      if (table === 'teams') return mockTeamInsert
      return mockTeamInsert
    })

    render(<TeamForm tpId="tp-123" />)

    await fillFormAndSubmit()

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Error al crear el equipo',
        description: 'Database error',
        variant: 'destructive',
      })
    })
  })

  it('has required validation on form fields', () => {
    render(<TeamForm tpId="tp-123" />)

    const nameInput = screen.getByLabelText(/nombre del equipo/i)
    const descriptionInput = screen.getByLabelText(/descripción/i)

    expect(nameInput).toHaveAttribute('required')
    expect(descriptionInput).toHaveAttribute('required')
  })

  const fillFormAndSubmit = async () => {
    const nameInput = screen.getByLabelText(/nombre del equipo/i)
    const descriptionInput = screen.getByLabelText(/descripción/i)
    const submitButton = screen.getByRole('button', { name: /crear equipo/i })

    await user.type(nameInput, 'Test Team')
    await user.type(descriptionInput, 'Test description')
    fireEvent.click(submitButton)
  }
})