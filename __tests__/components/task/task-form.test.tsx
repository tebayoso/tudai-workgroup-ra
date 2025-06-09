import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TaskForm } from '@/components/task/task-form'
import { mockRouter, mockSupabaseClient, resetAllMocks } from '@/__tests__/utils/mocks'

// Mock webhook service
jest.mock('@/lib/webhook-service', () => ({
  notifyTaskCreated: jest.fn().mockResolvedValue(true),
  notifyTaskUpdated: jest.fn().mockResolvedValue(true),
}))

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

// Mock Select components
jest.mock('@/components/ui/select', () => ({
  Select: ({ children, value, onValueChange }: any) => (
    <select data-testid="select" value={value} onChange={(e) => onValueChange(e.target.value)}>
      {children}
    </select>
  ),
  SelectContent: ({ children }: any) => children,
  SelectItem: ({ value, children }: any) => <option value={value}>{children}</option>,
  SelectTrigger: ({ children }: any) => children,
  SelectValue: ({ placeholder }: any) => <span>{placeholder}</span>,
}))

describe('TaskForm', () => {
  const user = userEvent.setup()
  const mockTeamMembers = [
    { user_id: 'user-1', profile: { name: 'John Doe' } },
    { user_id: 'user-2', profile: { name: 'Jane Smith' } },
  ]
  const mockTeamDetails = { id: 'team-123', name: 'Test Team' }

  beforeEach(() => {
    resetAllMocks()
    mockToast.mockClear()

    // Setup default mocks for data fetching
    const mockQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
    }

    mockSupabaseClient.from.mockImplementation((table) => {
      if (table === 'team_members') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockResolvedValue({ data: mockTeamMembers, error: null }),
        }
      }
      if (table === 'teams') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: mockTeamDetails, error: null }),
        }
      }
      return mockQuery
    })
  })

  it('renders form fields for creating new task', async () => {
    render(<TaskForm teamId="team-123" />)

    await waitFor(() => {
      expect(screen.getByLabelText(/título/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/descripción/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/fecha límite/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/asignada a/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /crear tarea/i })).toBeInTheDocument()
    })
  })

  it('shows status field when editing task', async () => {
    const mockTask = {
      id: 'task-123',
      title: 'Test Task',
      description: 'Test description',
      due_date: '2024-12-31T23:59:59Z',
      status: 'in_progress',
    }

    const mockTaskQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: mockTask, error: null }),
    }

    const mockUserTaskQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: { user_id: 'user-1' }, error: null }),
    }

    mockSupabaseClient.from.mockImplementation((table) => {
      if (table === 'tasks') return mockTaskQuery
      if (table === 'user_tasks') return mockUserTaskQuery
      if (table === 'team_members') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockResolvedValue({ data: mockTeamMembers, error: null }),
        }
      }
      if (table === 'teams') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: mockTeamDetails, error: null }),
        }
      }
      return mockTaskQuery
    })

    render(<TaskForm teamId="team-123" taskId="task-123" />)

    await waitFor(() => {
      expect(screen.getByLabelText(/estado/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /actualizar tarea/i })).toBeInTheDocument()
    })
  })

  it('creates new task successfully', async () => {
    const mockInsert = {
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockResolvedValue({ 
        data: [{ id: 'task-123', title: 'Test Task' }], 
        error: null 
      }),
    }

    const mockUserTaskInsert = {
      insert: jest.fn().mockResolvedValue({ error: null }),
    }

    const mockProfileQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: { name: 'John Doe' }, error: null }),
    }

    mockSupabaseClient.from.mockImplementation((table) => {
      if (table === 'tasks') return mockInsert
      if (table === 'user_tasks') return mockUserTaskInsert
      if (table === 'profiles') return mockProfileQuery
      if (table === 'team_members') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockResolvedValue({ data: mockTeamMembers, error: null }),
        }
      }
      if (table === 'teams') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: mockTeamDetails, error: null }),
        }
      }
      return mockInsert
    })

    render(<TaskForm teamId="team-123" />)

    await waitFor(() => {
      expect(screen.getByLabelText(/título/i)).toBeInTheDocument()
    })

    await fillFormAndSubmit()

    await waitFor(() => {
      expect(mockInsert.insert).toHaveBeenCalledWith({
        title: 'Test Task',
        description: 'Test description',
        due_date: '2024-12-31',
        status: 'pending',
        team_id: 'team-123',
        created_by: 'user-123',
      })
    })

    expect(mockToast).toHaveBeenCalledWith({
      title: 'Tarea creada',
      description: 'La tarea ha sido creada correctamente',
    })
  })

  it('updates existing task successfully', async () => {
    const mockTask = {
      id: 'task-123',
      title: 'Original Task',
      description: 'Original description',
      due_date: '2024-12-31T23:59:59Z',
      status: 'pending',
    }

    const mockUpdate = {
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      select: jest.fn().mockResolvedValue({ 
        data: [{ id: 'task-123', title: 'Updated Task' }], 
        error: null 
      }),
    }

    const mockDelete = {
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({ error: null }),
    }

    const mockInsert = {
      insert: jest.fn().mockResolvedValue({ error: null }),
    }

    // Setup mocks for task editing
    mockSupabaseClient.from.mockImplementation((table) => {
      if (table === 'tasks') {
        if (mockSupabaseClient.from.mock.calls.filter(call => call[0] === 'tasks').length === 1) {
          // First call is for fetching task
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: mockTask, error: null }),
          }
        } else {
          // Second call is for updating
          return mockUpdate
        }
      }
      if (table === 'user_tasks') {
        const callCount = mockSupabaseClient.from.mock.calls.filter(call => call[0] === 'user_tasks').length
        if (callCount === 1) {
          // First call for fetching assignment
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: { user_id: 'user-1' }, error: null }),
          }
        } else if (callCount === 2) {
          // Second call for deleting old assignment
          return mockDelete
        } else {
          // Third call for creating new assignment
          return mockInsert
        }
      }
      if (table === 'profiles') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: { name: 'John Doe' }, error: null }),
        }
      }
      if (table === 'team_members') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockResolvedValue({ data: mockTeamMembers, error: null }),
        }
      }
      if (table === 'teams') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: mockTeamDetails, error: null }),
        }
      }
      return mockUpdate
    })

    render(<TaskForm teamId="team-123" taskId="task-123" />)

    await waitFor(() => {
      expect(screen.getByDisplayValue('Original Task')).toBeInTheDocument()
    })

    // Update the form
    const titleInput = screen.getByDisplayValue('Original Task')
    await user.clear(titleInput)
    await user.type(titleInput, 'Updated Task')

    const submitButton = screen.getByRole('button', { name: /actualizar tarea/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Tarea actualizada',
        description: 'La tarea ha sido actualizada correctamente',
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

    const { TaskForm: TaskFormNoAuth } = await import('@/components/task/task-form')
    render(<TaskFormNoAuth teamId="team-123" />)

    await waitFor(() => {
      expect(screen.getByLabelText(/título/i)).toBeInTheDocument()
    })

    await fillFormAndSubmit()

    expect(mockToast).toHaveBeenCalledWith({
      title: 'No autorizado',
      description: 'Debes iniciar sesión para crear o editar una tarea',
      variant: 'destructive',
    })
  })

  it('shows loading state when submitting', async () => {
    const mockInsert = {
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ data: [{ id: 'task-123' }], error: null }), 100))
      ),
    }

    mockSupabaseClient.from.mockImplementation((table) => {
      if (table === 'tasks') return mockInsert
      if (table === 'team_members') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockResolvedValue({ data: mockTeamMembers, error: null }),
        }
      }
      if (table === 'teams') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: mockTeamDetails, error: null }),
        }
      }
      return mockInsert
    })

    render(<TaskForm teamId="team-123" />)

    await waitFor(() => {
      expect(screen.getByLabelText(/título/i)).toBeInTheDocument()
    })

    await fillFormAndSubmit()

    expect(screen.getByText(/creando/i)).toBeInTheDocument()
    expect(screen.getByRole('button')).toBeDisabled()
  })

  const fillFormAndSubmit = async () => {
    const titleInput = screen.getByLabelText(/título/i)
    const descriptionInput = screen.getByLabelText(/descripción/i)
    const dueDateInput = screen.getByLabelText(/fecha límite/i)
    const assignedToSelect = screen.getAllByTestId('select')[0] // First select is for assignment

    await user.type(titleInput, 'Test Task')
    await user.type(descriptionInput, 'Test description')
    await user.type(dueDateInput, '2024-12-31')
    fireEvent.change(assignedToSelect, { target: { value: 'user-1' } })

    const submitButton = screen.getByRole('button', { name: /crear tarea/i })
    fireEvent.click(submitButton)
  }
})