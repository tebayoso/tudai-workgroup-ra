import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TeamForm } from '@/components/team/team-form'
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

const mockSession = { user: { id: 'user-123', email: 'test@example.com', user_metadata: { name: 'Test User', role: 'estudiante' } } }

jest.mock('@/components/supabase-provider', () => ({
  useSupabase: () => ({ 
    supabase: mockSupabaseClient,
    session: mockSession
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

describe('Team Workflow Integration', () => {
  const user = userEvent.setup()
  
  beforeEach(() => {
    resetAllMocks()
    mockToast.mockClear()
  })

  describe('Team Creation and Task Management Flow', () => {
    it('allows creating a team and then adding tasks', async () => {
      // Step 1: Create a team
      const mockProfileQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({ data: { user_id: 'user-123' }, error: null }),
        single: jest.fn().mockResolvedValue({ data: { role: 'estudiante' }, error: null }),
      }

      const mockTeamInsert = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue({ data: [{ id: 'team-123', name: 'Test Team' }], error: null }),
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

      const { unmount: unmountTeamForm } = render(<TeamForm tpId="tp-123" />)

      // Fill team creation form
      await user.type(screen.getByLabelText(/nombre del equipo/i), 'Test Team')
      await user.type(screen.getByLabelText(/descripción/i), 'Test team description')
      fireEvent.click(screen.getByRole('button', { name: /crear equipo/i }))

      await waitFor(() => {
        expect(mockTeamInsert.insert).toHaveBeenCalledWith({
          name: 'Test Team',
          description: 'Test team description',
          tp_id: 'tp-123',
          created_by: 'user-123',
        })
      })

      expect(mockRouter.push).toHaveBeenCalledWith('/team/team-123')
      unmountTeamForm()

      // Step 2: Add a task to the team
      resetAllMocks()
      mockToast.mockClear()

      const mockTeamMembers = [
        { user_id: 'user-123', profile: { name: 'Test User' } },
        { user_id: 'user-456', profile: { name: 'Another User' } },
      ]

      const mockTaskInsert = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue({ 
          data: [{ id: 'task-123', title: 'Test Task', team_id: 'team-123' }], 
          error: null 
        }),
      }

      const mockUserTaskInsert = {
        insert: jest.fn().mockResolvedValue({ error: null }),
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
            single: jest.fn().mockResolvedValue({ data: { id: 'team-123', name: 'Test Team' }, error: null }),
          }
        }
        if (table === 'tasks') return mockTaskInsert
        if (table === 'user_tasks') return mockUserTaskInsert
        if (table === 'profiles') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: { name: 'Test User' }, error: null }),
          }
        }
        return mockTaskInsert
      })

      render(<TaskForm teamId="team-123" />)

      await waitFor(() => {
        expect(screen.getByLabelText(/título/i)).toBeInTheDocument()
      })

      // Fill task creation form
      await user.type(screen.getByLabelText(/título/i), 'Test Task')
      await user.type(screen.getByLabelText(/descripción/i), 'Test task description')
      await user.type(screen.getByLabelText(/fecha límite/i), '2024-12-31')
      
      const assignSelect = screen.getByTestId('select')
      fireEvent.change(assignSelect, { target: { value: 'user-123' } })
      
      fireEvent.click(screen.getByRole('button', { name: /crear tarea/i }))

      await waitFor(() => {
        expect(mockTaskInsert.insert).toHaveBeenCalledWith({
          title: 'Test Task',
          description: 'Test task description',
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

    it('handles errors in team creation gracefully', async () => {
      const mockProfileQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({ data: { user_id: 'user-123' }, error: null }),
      }

      const mockTeamInsert = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue({ 
          data: null, 
          error: { message: 'Database connection failed' } 
        }),
      }

      mockSupabaseClient.from.mockImplementation((table) => {
        if (table === 'profiles') return mockProfileQuery
        if (table === 'teams') return mockTeamInsert
        return mockTeamInsert
      })

      render(<TeamForm tpId="tp-123" />)

      await user.type(screen.getByLabelText(/nombre del equipo/i), 'Test Team')
      await user.type(screen.getByLabelText(/descripción/i), 'Test description')
      fireEvent.click(screen.getByRole('button', { name: /crear equipo/i }))

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Error al crear el equipo',
          description: 'Database connection failed',
          variant: 'destructive',
        })
      })

      // Form should still be available for retry
      expect(screen.getByRole('button', { name: /crear equipo/i })).toBeInTheDocument()
    })

    it('prevents unauthorized users from creating teams', async () => {
      jest.doMock('@/components/supabase-provider', () => ({
        useSupabase: () => ({ 
          supabase: mockSupabaseClient,
          session: null
        }),
      }))

      const { TeamForm: TeamFormNoAuth } = await import('@/components/team/team-form')
      render(<TeamFormNoAuth tpId="tp-123" />)

      await user.type(screen.getByLabelText(/nombre del equipo/i), 'Test Team')
      await user.type(screen.getByLabelText(/descripción/i), 'Test description')
      fireEvent.click(screen.getByRole('button', { name: /crear equipo/i }))

      expect(mockToast).toHaveBeenCalledWith({
        title: 'No autorizado',
        description: 'Debes iniciar sesión para crear un equipo',
        variant: 'destructive',
      })

      expect(mockSupabaseClient.from).not.toHaveBeenCalled()
    })
  })

  describe('Task Assignment and Updates', () => {
    it('allows updating task status and assignment', async () => {
      const mockTask = {
        id: 'task-123',
        title: 'Original Task',
        description: 'Original description',
        due_date: '2024-12-31T23:59:59Z',
        status: 'pending',
      }

      const mockTeamMembers = [
        { user_id: 'user-123', profile: { name: 'Test User' } },
        { user_id: 'user-456', profile: { name: 'Another User' } },
      ]

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
            single: jest.fn().mockResolvedValue({ data: { id: 'team-123', name: 'Test Team' }, error: null }),
          }
        }
        if (table === 'tasks') {
          const callCount = mockSupabaseClient.from.mock.calls.filter(call => call[0] === 'tasks').length
          if (callCount === 1) {
            // First call for fetching task
            return {
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
              single: jest.fn().mockResolvedValue({ data: mockTask, error: null }),
            }
          } else {
            // Second call for updating
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
              single: jest.fn().mockResolvedValue({ data: { user_id: 'user-123' }, error: null }),
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
            single: jest.fn().mockResolvedValue({ data: { name: 'Test User' }, error: null }),
          }
        }
        return mockUpdate
      })

      render(<TaskForm teamId="team-123" taskId="task-123" />)

      await waitFor(() => {
        expect(screen.getByDisplayValue('Original Task')).toBeInTheDocument()
      })

      // Update task status
      const statusSelect = screen.getAllByTestId('select')[1] // Second select is for status
      fireEvent.change(statusSelect, { target: { value: 'completed' } })

      fireEvent.click(screen.getByRole('button', { name: /actualizar tarea/i }))

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Tarea actualizada',
          description: 'La tarea ha sido actualizada correctamente',
        })
      })
    })
  })
})