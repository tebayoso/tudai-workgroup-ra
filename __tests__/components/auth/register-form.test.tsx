import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RegisterForm } from '@/components/auth/register-form'
import { mockRouter, mockSupabaseClient, resetAllMocks } from '@/__tests__/utils/mocks'

// Mock the hooks and components
jest.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
}))

jest.mock('@/components/supabase-provider', () => ({
  useSupabase: () => ({ supabase: mockSupabaseClient }),
}))

const mockToast = jest.fn()
jest.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}))

// Mock Select components
jest.mock('@/components/ui/select', () => ({
  Select: ({ children, value, onValueChange }: any) => (
    <select data-testid="role-select" value={value} onChange={(e) => onValueChange(e.target.value)}>
      {children}
    </select>
  ),
  SelectContent: ({ children }: any) => children,
  SelectItem: ({ value, children }: any) => <option value={value}>{children}</option>,
  SelectTrigger: ({ children }: any) => children,
  SelectValue: ({ placeholder }: any) => <span>{placeholder}</span>,
}))

describe('RegisterForm', () => {
  const user = userEvent.setup()

  beforeEach(() => {
    resetAllMocks()
    mockToast.mockClear()
  })

  it('renders all form fields', () => {
    render(<RegisterForm />)

    expect(screen.getByLabelText(/nombre completo/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/correo electrónico/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/rol/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /registrarse/i })).toBeInTheDocument()
  })

  it('updates input values when user types', async () => {
    render(<RegisterForm />)

    const nameInput = screen.getByLabelText(/nombre completo/i)
    const emailInput = screen.getByLabelText(/correo electrónico/i)
    const passwordInput = screen.getByLabelText(/contraseña/i)

    await user.type(nameInput, 'Juan Pérez')
    await user.type(emailInput, 'juan@example.com')
    await user.type(passwordInput, 'password123')

    expect(nameInput).toHaveValue('Juan Pérez')
    expect(emailInput).toHaveValue('juan@example.com')
    expect(passwordInput).toHaveValue('password123')
  })

  it('shows loading state when submitting form', async () => {
    mockSupabaseClient.auth.signUp.mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve({ data: { user: { id: '123' } }, error: null }), 100))
    )

    render(<RegisterForm />)

    const submitButton = screen.getByRole('button', { name: /registrarse/i })
    
    await fillFormAndSubmit()
    
    expect(screen.getByText(/registrando/i)).toBeInTheDocument()
    expect(submitButton).toBeDisabled()
  })

  it('calls supabase signUp and creates profile on form submission', async () => {
    const mockUser = { id: 'user-123' }
    mockSupabaseClient.auth.signUp.mockResolvedValue({ 
      data: { user: mockUser }, 
      error: null 
    })
    
    const mockInsert = {
      insert: jest.fn().mockResolvedValue({ error: null })
    }
    mockSupabaseClient.from.mockReturnValue(mockInsert)

    render(<RegisterForm />)

    await fillFormAndSubmit()

    await waitFor(() => {
      expect(mockSupabaseClient.auth.signUp).toHaveBeenCalledWith({
        email: 'juan@example.com',
        password: 'password123',
        options: {
          data: {
            name: 'Juan Pérez',
            role: 'estudiante',
          },
        },
      })
    })

    expect(mockSupabaseClient.from).toHaveBeenCalledWith('profiles')
    expect(mockInsert.insert).toHaveBeenCalledWith({
      user_id: 'user-123',
      name: 'Juan Pérez',
      role: 'estudiante',
    })
  })

  it('redirects to dashboard on successful registration', async () => {
    mockSupabaseClient.auth.signUp.mockResolvedValue({ 
      data: { user: { id: 'user-123' } }, 
      error: null 
    })
    
    const mockInsert = {
      insert: jest.fn().mockResolvedValue({ error: null })
    }
    mockSupabaseClient.from.mockReturnValue(mockInsert)

    render(<RegisterForm />)

    await fillFormAndSubmit()

    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith('/dashboard')
    })
  })

  it('shows success toast when profile is created successfully', async () => {
    mockSupabaseClient.auth.signUp.mockResolvedValue({ 
      data: { user: { id: 'user-123' } }, 
      error: null 
    })
    
    const mockInsert = {
      insert: jest.fn().mockResolvedValue({ error: null })
    }
    mockSupabaseClient.from.mockReturnValue(mockInsert)

    render(<RegisterForm />)

    await fillFormAndSubmit()

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Cuenta creada',
        description: 'Tu cuenta ha sido creada correctamente',
      })
    })
  })

  it('shows warning toast when profile creation fails', async () => {
    mockSupabaseClient.auth.signUp.mockResolvedValue({ 
      data: { user: { id: 'user-123' } }, 
      error: null 
    })
    
    const mockInsert = {
      insert: jest.fn().mockResolvedValue({ error: { message: 'Profile creation failed' } })
    }
    mockSupabaseClient.from.mockReturnValue(mockInsert)

    render(<RegisterForm />)

    await fillFormAndSubmit()

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Advertencia',
        description: 'Tu cuenta se creó, pero hubo un problema al configurar tu perfil. Algunas funciones podrían no estar disponibles.',
        variant: 'warning',
      })
    })
  })

  it('shows error toast on registration failure', async () => {
    mockSupabaseClient.auth.signUp.mockResolvedValue({
      data: null,
      error: { message: 'Email already registered' }
    })

    render(<RegisterForm />)

    await fillFormAndSubmit()

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Error al registrarse',
        description: 'Email already registered',
        variant: 'destructive',
      })
    })
  })

  it('allows role selection', async () => {
    render(<RegisterForm />)

    const roleSelect = screen.getByTestId('role-select')
    
    expect(roleSelect).toHaveValue('estudiante')
    
    fireEvent.change(roleSelect, { target: { value: 'admin' } })
    
    expect(roleSelect).toHaveValue('admin')
  })

  it('has required validation on form fields', () => {
    render(<RegisterForm />)

    const nameInput = screen.getByLabelText(/nombre completo/i)
    const emailInput = screen.getByLabelText(/correo electrónico/i)
    const passwordInput = screen.getByLabelText(/contraseña/i)

    expect(nameInput).toHaveAttribute('required')
    expect(emailInput).toHaveAttribute('required')
    expect(passwordInput).toHaveAttribute('required')
    expect(emailInput).toHaveAttribute('type', 'email')
    expect(passwordInput).toHaveAttribute('type', 'password')
  })

  const fillFormAndSubmit = async () => {
    const nameInput = screen.getByLabelText(/nombre completo/i)
    const emailInput = screen.getByLabelText(/correo electrónico/i)
    const passwordInput = screen.getByLabelText(/contraseña/i)
    const submitButton = screen.getByRole('button', { name: /registrarse/i })

    await user.type(nameInput, 'Juan Pérez')
    await user.type(emailInput, 'juan@example.com')
    await user.type(passwordInput, 'password123')
    fireEvent.click(submitButton)
  }
})