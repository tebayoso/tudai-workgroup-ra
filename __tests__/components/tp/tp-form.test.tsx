import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TpForm } from '@/components/tp/tp-form'
import { mockRouter, mockSupabaseClient, resetAllMocks } from '@/__tests__/utils/mocks'

// Mock the hooks
jest.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
}))

jest.mock('@/components/supabase-provider', () => ({
  useSupabase: () => ({ 
    supabase: mockSupabaseClient,
    session: { user: { id: 'user-123' } }
  }),
}))

const mockToast = jest.fn()
jest.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}))

jest.mock('@/hooks/use-user-role', () => ({
  useUserRole: jest.fn(() => ({
    isAdmin: true,
    isLoading: false,
  })),
}))

describe('TpForm', () => {
  const user = userEvent.setup()
  
  beforeEach(() => {
    resetAllMocks()
    mockToast.mockClear()
  })

  it('renders all form fields', () => {
    render(<TpForm />)

    expect(screen.getByLabelText(/título/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/descripción/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/fecha límite/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/archivo adjunto/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /crear trabajo práctico/i })).toBeInTheDocument()
  })

  it('updates input values when user types', async () => {
    render(<TpForm />)

    const titleInput = screen.getByLabelText(/título/i)
    const descriptionInput = screen.getByLabelText(/descripción/i)
    const deadlineInput = screen.getByLabelText(/fecha límite/i)

    await user.type(titleInput, 'Test TP')
    await user.type(descriptionInput, 'Test description')
    await user.type(deadlineInput, '2024-12-31')

    expect(titleInput).toHaveValue('Test TP')
    expect(descriptionInput).toHaveValue('Test description')
    expect(deadlineInput).toHaveValue('2024-12-31')
  })

  it('shows loading state when submitting form', async () => {
    const mockInsert = {
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ data: [{ id: 'tp-123' }], error: null }), 100))
      ),
    }
    mockSupabaseClient.from.mockReturnValue(mockInsert)

    render(<TpForm />)

    await fillFormAndSubmit()
    
    expect(screen.getByText(/creando/i)).toBeInTheDocument()
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('creates TP successfully and redirects', async () => {
    const mockInsert = {
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockResolvedValue({ data: [{ id: 'tp-123' }], error: null }),
    }
    mockSupabaseClient.from.mockReturnValue(mockInsert)

    render(<TpForm />)

    await fillFormAndSubmit()

    await waitFor(() => {
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('tps')
      expect(mockInsert.insert).toHaveBeenCalledWith({
        title: 'Test TP',
        description: 'Test description',
        deadline: '2024-12-31',
        created_by: 'user-123',
      })
    })

    expect(mockToast).toHaveBeenCalledWith({
      title: 'Trabajo práctico creado',
      description: 'El trabajo práctico ha sido creado correctamente',
    })

    expect(mockRouter.push).toHaveBeenCalledWith('/tp')
  })

  it('shows error when user is not authenticated', async () => {
    jest.doMock('@/components/supabase-provider', () => ({
      useSupabase: () => ({ 
        supabase: mockSupabaseClient,
        session: null
      }),
    }))

    const { TpForm: TpFormNoAuth } = await import('@/components/tp/tp-form')
    render(<TpFormNoAuth />)

    await fillFormAndSubmit()

    expect(mockToast).toHaveBeenCalledWith({
      title: 'No autorizado',
      description: 'Debes iniciar sesión para crear un trabajo práctico',
      variant: 'destructive',
    })
  })

  it('shows error when user is not admin', async () => {
    const mockUseUserRole = require('@/hooks/use-user-role').useUserRole
    mockUseUserRole.mockReturnValue({
      isAdmin: false,
      isLoading: false,
    })

    render(<TpForm />)

    await fillFormAndSubmit()

    expect(mockToast).toHaveBeenCalledWith({
      title: 'No autorizado',
      description: 'Solo los administradores pueden crear trabajos prácticos',
      variant: 'destructive',
    })
  })

  it('shows loading message when role is still loading', async () => {
    const mockUseUserRole = require('@/hooks/use-user-role').useUserRole
    mockUseUserRole.mockReturnValue({
      isAdmin: false,
      isLoading: true,
    })

    render(<TpForm />)

    await fillFormAndSubmit()

    expect(mockToast).toHaveBeenCalledWith({
      title: 'Cargando',
      description: 'Verificando permisos...',
    })
  })

  it('handles file uploads when files are selected', async () => {
    const mockTpData = [{ id: 'tp-123' }]
    const mockInsert = {
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockResolvedValue({ data: mockTpData, error: null }),
    }
    
    const mockStorage = {
      upload: jest.fn().mockResolvedValue({ error: null }),
      getPublicUrl: jest.fn().mockReturnValue({ 
        data: { publicUrl: 'https://example.com/file.pdf' } 
      }),
    }
    
    mockSupabaseClient.from.mockReturnValue(mockInsert)
    mockSupabaseClient.storage = {
      from: jest.fn().mockReturnValue(mockStorage),
    }

    render(<TpForm />)

    const fileInput = screen.getByLabelText(/archivo adjunto/i)
    const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' })
    
    await user.upload(fileInput, file)
    await fillFormAndSubmit()

    await waitFor(() => {
      expect(mockSupabaseClient.storage.from).toHaveBeenCalledWith('attachments')
      expect(mockStorage.upload).toHaveBeenCalled()
    })
  })

  it('shows error toast on TP creation failure', async () => {
    const mockInsert = {
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockResolvedValue({ 
        data: null, 
        error: { message: 'Database error' } 
      }),
    }
    mockSupabaseClient.from.mockReturnValue(mockInsert)

    render(<TpForm />)

    await fillFormAndSubmit()

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Error al crear el trabajo práctico',
        description: 'Database error',
        variant: 'destructive',
      })
    })
  })

  it('has required validation on form fields', () => {
    render(<TpForm />)

    const titleInput = screen.getByLabelText(/título/i)
    const descriptionInput = screen.getByLabelText(/descripción/i)
    const deadlineInput = screen.getByLabelText(/fecha límite/i)

    expect(titleInput).toHaveAttribute('required')
    expect(descriptionInput).toHaveAttribute('required')
    expect(deadlineInput).toHaveAttribute('required')
    expect(deadlineInput).toHaveAttribute('type', 'date')
  })

  const fillFormAndSubmit = async () => {
    const titleInput = screen.getByLabelText(/título/i)
    const descriptionInput = screen.getByLabelText(/descripción/i)
    const deadlineInput = screen.getByLabelText(/fecha límite/i)
    const submitButton = screen.getByRole('button', { name: /crear trabajo práctico/i })

    await user.type(titleInput, 'Test TP')
    await user.type(descriptionInput, 'Test description')
    await user.type(deadlineInput, '2024-12-31')
    fireEvent.click(submitButton)
  }
})