// Mock implementations for testing

export const mockPush = jest.fn()
export const mockReplace = jest.fn()
export const mockRefresh = jest.fn()

export const mockRouter = {
  push: mockPush,
  replace: mockReplace,
  refresh: mockRefresh,
  back: jest.fn(),
  forward: jest.fn(),
  prefetch: jest.fn(),
}

export const mockSupabaseClient = {
  auth: {
    getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
    signIn: jest.fn().mockResolvedValue({ data: {}, error: null }),
    signUp: jest.fn().mockResolvedValue({ data: {}, error: null }),
    signOut: jest.fn().mockResolvedValue({ error: null }),
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
    single: jest.fn().mockResolvedValue({ data: null, error: null }),
  })),
}

export const mockWebhookService = {
  sendTaskEvent: jest.fn().mockResolvedValue(undefined),
}

// Reset all mocks
export const resetAllMocks = () => {
  mockPush.mockReset()
  mockReplace.mockReset()
  mockRefresh.mockReset()
  Object.values(mockSupabaseClient.auth).forEach(fn => {
    if (typeof fn === 'function') fn.mockReset?.()
  })
  mockWebhookService.sendTaskEvent.mockReset()
}