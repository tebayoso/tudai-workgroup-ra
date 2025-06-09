import { renderHook, waitFor } from '@testing-library/react'
import { useUserRole } from '@/hooks/use-user-role'

// Mock the Supabase provider
const mockSupabase = {
  from: jest.fn(),
}

const mockUseSupabase = jest.fn()

jest.mock('@/components/supabase-provider', () => ({
  useSupabase: () => mockUseSupabase(),
}))

// Mock console methods
const consoleSpy = {
  log: jest.spyOn(console, 'log').mockImplementation(),
  error: jest.spyOn(console, 'error').mockImplementation(),
}

describe('useUserRole', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn(),
      insert: jest.fn(),
    })
  })

  afterAll(() => {
    consoleSpy.log.mockRestore()
    consoleSpy.error.mockRestore()
  })

  it('should return loading state initially', () => {
    mockUseSupabase.mockReturnValue({
      supabase: mockSupabase,
      session: null,
    })

    const { result } = renderHook(() => useUserRole())

    expect(result.current.isLoading).toBe(true)
    expect(result.current.role).toBe(null)
    expect(result.current.error).toBe(null)
    expect(result.current.isAdmin).toBe(false)
  })

  it('should handle no session', async () => {
    mockUseSupabase.mockReturnValue({
      supabase: mockSupabase,
      session: null,
    })

    const { result } = renderHook(() => useUserRole())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.role).toBe(null)
    expect(result.current.isAdmin).toBe(false)
  })

  it('should fetch user role from profiles table', async () => {
    const mockSession = {
      user: {
        id: 'user-123',
        email: 'test@example.com',
        user_metadata: {},
      },
    }

    mockUseSupabase.mockReturnValue({
      supabase: mockSupabase,
      session: mockSession,
    })

    const mockQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({
        data: { role: 'admin' },
        error: null,
      }),
    }

    mockSupabase.from.mockReturnValue(mockQuery)

    const { result } = renderHook(() => useUserRole())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.role).toBe('admin')
    expect(result.current.isAdmin).toBe(true)
    expect(mockSupabase.from).toHaveBeenCalledWith('profiles')
  })

  it('should create profile if user not found', async () => {
    const mockSession = {
      user: {
        id: 'user-123',
        email: 'test@example.com',
        user_metadata: { role: 'estudiante', name: 'Test User' },
      },
    }

    mockUseSupabase.mockReturnValue({
      supabase: mockSupabase,
      session: mockSession,
    })

    const mockQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({
        data: null,
        error: null,
      }),
      insert: jest.fn().mockResolvedValue({
        error: null,
      }),
    }

    mockSupabase.from.mockReturnValue(mockQuery)

    const { result } = renderHook(() => useUserRole())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.role).toBe('estudiante')
    expect(result.current.isAdmin).toBe(false)
    expect(mockQuery.insert).toHaveBeenCalledWith({
      user_id: 'user-123',
      name: 'Test User',
      role: 'estudiante',
    })
  })

  it('should handle error when fetching role', async () => {
    const mockSession = {
      user: {
        id: 'user-123',
        email: 'test@example.com',
        user_metadata: {},
      },
    }

    mockUseSupabase.mockReturnValue({
      supabase: mockSupabase,
      session: mockSession,
    })

    const mockQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockRejectedValue(new Error('Database error')),
    }

    mockSupabase.from.mockReturnValue(mockQuery)

    const { result } = renderHook(() => useUserRole())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.error).toBeInstanceOf(Error)
    expect(result.current.error?.message).toBe('Database error')
  })

  it('should use metadata role as fallback on error', async () => {
    const mockSession = {
      user: {
        id: 'user-123',
        email: 'test@example.com',
        user_metadata: { role: 'admin' },
      },
    }

    mockUseSupabase.mockReturnValue({
      supabase: mockSupabase,
      session: mockSession,
    })

    const mockQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockRejectedValue(new Error('Database error')),
    }

    mockSupabase.from.mockReturnValue(mockQuery)

    const { result } = renderHook(() => useUserRole())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.role).toBe('admin')
    expect(result.current.isAdmin).toBe(true)
    expect(result.current.error).toBe(null)
  })

  it('should default to estudiante role when creating profile', async () => {
    const mockSession = {
      user: {
        id: 'user-123',
        email: 'test@example.com',
        user_metadata: {},
      },
    }

    mockUseSupabase.mockReturnValue({
      supabase: mockSupabase,
      session: mockSession,
    })

    const mockQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({
        data: null,
        error: null,
      }),
      insert: jest.fn().mockResolvedValue({
        error: null,
      }),
    }

    mockSupabase.from.mockReturnValue(mockQuery)

    const { result } = renderHook(() => useUserRole())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(mockQuery.insert).toHaveBeenCalledWith({
      user_id: 'user-123',
      name: 'test',
      role: 'estudiante',
    })
  })
})