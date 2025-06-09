import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LoginForm } from '@/components/auth/login-form'
import { mockRouter, mockSupabaseClient, resetAllMocks } from '@/__tests__/utils/mocks'

// Mock the hooks
jest.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
}))

jest.mock('@/components/supabase-provider', () => ({
  useSupabase: () => ({ supabase: mockSupabaseClient }),
}))

jest.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}))

describe('LoginForm', () => {
  const user = userEvent.setup()

  beforeEach(() => {
    resetAllMocks()
  })

  it('renders login form fields', () => {
    render(<LoginForm />)

    expect(screen.getByLabelText(/correo electrónico/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /iniciar sesión/i })).toBeInTheDocument()
  })

  it('updates input values when user types', async () => {
    render(<LoginForm />)

    const emailInput = screen.getByLabelText(/correo electrónico/i)
    const passwordInput = screen.getByLabelText(/contraseña/i)

    await user.clear(emailInput)
    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')

    expect(emailInput).toHaveValue('test@example.com')
    expect(passwordInput).toHaveValue('password123')
  })

  it('shows loading state when submitting form', async () => {
    mockSupabaseClient.auth.signInWithPassword.mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve({ error: null }), 100))
    )

    render(<LoginForm />)

    const submitButton = screen.getByRole('button', { name: /iniciar sesión/i })
    const emailInput = screen.getByLabelText(/correo electrónico/i)
    const passwordInput = screen.getByLabelText(/contraseña/i)

    await user.clear(emailInput)
    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')
    
    fireEvent.click(submitButton)

    expect(screen.getByText(/iniciando sesión/i)).toBeInTheDocument()
    expect(submitButton).toBeDisabled()
  })

  it('calls supabase signInWithPassword on form submission', async () => {
    mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({ error: null })

    render(<LoginForm />)

    const emailInput = screen.getByLabelText(/correo electrónico/i)
    const passwordInput = screen.getByLabelText(/contraseña/i)
    const submitButton = screen.getByRole('button', { name: /iniciar sesión/i })

    await user.clear(emailInput)
    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockSupabaseClient.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      })
    })
  })

  it('redirects to dashboard on successful login', async () => {
    mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({ error: null })

    render(<LoginForm />)

    const emailInput = screen.getByLabelText(/correo electrónico/i)
    const passwordInput = screen.getByLabelText(/contraseña/i)
    const submitButton = screen.getByRole('button', { name: /iniciar sesión/i })

    await user.clear(emailInput)
    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith('/dashboard')
    })
  })

  it('shows error toast on login failure', async () => {
    const mockToast = jest.fn()
    jest.doMock('@/components/ui/use-toast', () => ({
      useToast: () => ({ toast: mockToast }),
    }))

    mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
      error: { message: 'Invalid credentials' }
    })

    // Re-import to get the mocked toast
    const { LoginForm: LoginFormWithMock } = await import('@/components/auth/login-form')
    
    render(<LoginFormWithMock />)

    const emailInput = screen.getByLabelText(/correo electrónico/i)
    const passwordInput = screen.getByLabelText(/contraseña/i)
    const submitButton = screen.getByRole('button', { name: /iniciar sesión/i })

    await user.clear(emailInput)
    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'wrongpassword')
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Error al iniciar sesión',
        description: 'Invalid credentials',
        variant: 'destructive',
      })
    })
  })

  it('has required validation on form fields', () => {
    render(<LoginForm />)

    const emailInput = screen.getByLabelText(/correo electrónico/i)
    const passwordInput = screen.getByLabelText(/contraseña/i)

    expect(emailInput).toHaveAttribute('required')
    expect(passwordInput).toHaveAttribute('required')
    expect(emailInput).toHaveAttribute('type', 'email')
    expect(passwordInput).toHaveAttribute('type', 'password')
  })

  it('prevents form submission when fields are empty', async () => {
    render(<LoginForm />)

    const submitButton = screen.getByRole('button', { name: /iniciar sesión/i })
    fireEvent.click(submitButton)

    expect(mockSupabaseClient.auth.signInWithPassword).not.toHaveBeenCalled()
  })
})