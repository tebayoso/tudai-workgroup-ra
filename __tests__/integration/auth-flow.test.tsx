import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LoginForm } from '@/components/auth/login-form'
import { RegisterForm } from '@/components/auth/register-form'
import { mockRouter, mockSupabaseClient, resetAllMocks } from '@/__tests__/utils/mocks'

// Mock the hooks
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

// Mock Select components for RegisterForm
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

describe('Authentication Flow Integration', () => {
  const user = userEvent.setup()

  beforeEach(() => {
    resetAllMocks()
    mockToast.mockClear()
  })

  describe('User Registration and Login Flow', () => {
    it('allows user to register and then login', async () => {
      // First, test registration
      mockSupabaseClient.auth.signUp.mockResolvedValue({ 
        data: { user: { id: 'user-123', email: 'test@example.com' } }, 
        error: null 
      })
      
      const mockInsert = {
        insert: jest.fn().mockResolvedValue({ error: null })
      }
      mockSupabaseClient.from.mockReturnValue(mockInsert)

      const { unmount } = render(<RegisterForm />)

      // Fill registration form
      await user.type(screen.getByLabelText(/nombre completo/i), 'Test User')
      await user.type(screen.getByLabelText(/correo electrónico/i), 'test@example.com')
      await user.type(screen.getByLabelText(/contraseña/i), 'password123')
      
      // Submit registration
      fireEvent.click(screen.getByRole('button', { name: /registrarse/i }))

      await waitFor(() => {
        expect(mockSupabaseClient.auth.signUp).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123',
          options: {
            data: {
              name: 'Test User',
              role: 'estudiante',
            },
          },
        })
      })

      expect(mockRouter.push).toHaveBeenCalledWith('/dashboard')
      unmount()

      // Reset mocks for login test
      resetAllMocks()
      mockToast.mockClear()

      // Now test login with same credentials
      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({ error: null })

      render(<LoginForm />)

      // Fill login form
      const emailInput = screen.getByLabelText(/correo electrónico/i)
      await user.clear(emailInput)
      await user.type(emailInput, 'test@example.com')
      await user.type(screen.getByLabelText(/contraseña/i), 'password123')
      
      // Submit login
      fireEvent.click(screen.getByRole('button', { name: /iniciar sesión/i }))

      await waitFor(() => {
        expect(mockSupabaseClient.auth.signInWithPassword).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123',
        })
      })

      expect(mockRouter.push).toHaveBeenCalledWith('/dashboard')
    })

    it('handles registration failure and allows retry', async () => {
      mockSupabaseClient.auth.signUp.mockResolvedValue({
        data: null,
        error: { message: 'Email already registered' }
      })

      render(<RegisterForm />)

      // Fill and submit form
      await user.type(screen.getByLabelText(/nombre completo/i), 'Test User')
      await user.type(screen.getByLabelText(/correo electrónico/i), 'test@example.com')
      await user.type(screen.getByLabelText(/contraseña/i), 'password123')
      fireEvent.click(screen.getByRole('button', { name: /registrarse/i }))

      // Should show error
      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Error al registrarse',
          description: 'Email already registered',
          variant: 'destructive',
        })
      })

      // Form should still be available for retry
      expect(screen.getByRole('button', { name: /registrarse/i })).toBeInTheDocument()
      expect(screen.getByLabelText(/correo electrónico/i)).toHaveValue('test@example.com')
    })

    it('handles login failure and allows retry', async () => {
      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
        error: { message: 'Invalid credentials' }
      })

      render(<LoginForm />)

      // Fill and submit form with wrong credentials
      const emailInput = screen.getByLabelText(/correo electrónico/i)
      await user.clear(emailInput)
      await user.type(emailInput, 'test@example.com')
      await user.type(screen.getByLabelText(/contraseña/i), 'wrongpassword')
      fireEvent.click(screen.getByRole('button', { name: /iniciar sesión/i }))

      // Should show error
      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Error al iniciar sesión',
          description: 'Invalid credentials',
          variant: 'destructive',
        })
      })

      // Form should still be available for retry
      expect(screen.getByRole('button', { name: /iniciar sesión/i })).toBeInTheDocument()
      expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument()
    })
  })

  describe('Form Validation', () => {
    it('validates required fields in registration form', async () => {
      render(<RegisterForm />)

      // Try to submit empty form
      fireEvent.click(screen.getByRole('button', { name: /registrarse/i }))

      // Should not call Supabase
      expect(mockSupabaseClient.auth.signUp).not.toHaveBeenCalled()
    })

    it('validates required fields in login form', async () => {
      render(<LoginForm />)

      // Try to submit empty form
      fireEvent.click(screen.getByRole('button', { name: /iniciar sesión/i }))

      // Should not call Supabase
      expect(mockSupabaseClient.auth.signInWithPassword).not.toHaveBeenCalled()
    })
  })
})