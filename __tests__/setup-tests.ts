// Additional test setup for specific test scenarios

// Global test utilities
export const waitForLoadingToFinish = async () => {
  const { waitFor } = await import('@testing-library/react')
  await waitFor(() => {
    // Wait for any loading indicators to disappear
    const loadingElements = document.querySelectorAll('[data-testid*="loading"], [aria-busy="true"]')
    expect(loadingElements).toHaveLength(0)
  }, { timeout: 5000 })
}

// Mock data generators for consistent testing
export const generateMockUser = (overrides = {}) => ({
  id: 'user-' + Math.random().toString(36).substr(2, 9),
  email: 'test@example.com',
  user_metadata: {
    name: 'Test User',
    role: 'estudiante',
  },
  created_at: new Date().toISOString(),
  ...overrides,
})

export const generateMockTeam = (overrides = {}) => ({
  id: 'team-' + Math.random().toString(36).substr(2, 9),
  name: 'Test Team',
  description: 'Test team description',
  tp_id: 'tp-123',
  created_by: 'user-123',
  created_at: new Date().toISOString(),
  ...overrides,
})

export const generateMockTask = (overrides = {}) => ({
  id: 'task-' + Math.random().toString(36).substr(2, 9),
  title: 'Test Task',
  description: 'Test task description',
  due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  status: 'pending',
  team_id: 'team-123',
  created_by: 'user-123',
  created_at: new Date().toISOString(),
  ...overrides,
})

// Test environment validation
export const validateTestEnvironment = () => {
  if (typeof window === 'undefined') {
    throw new Error('Test environment is not properly configured for DOM testing')
  }
  
  if (!global.fetch) {
    throw new Error('Fetch is not available in test environment')
  }
}

// Performance test helpers
export const measureComponentRenderTime = async (renderFn: () => void) => {
  const start = performance.now()
  renderFn()
  const end = performance.now()
  return end - start
}

// Accessibility test helpers
export const checkBasicAccessibility = (container: HTMLElement) => {
  // Check for basic accessibility requirements
  const buttons = container.querySelectorAll('button')
  buttons.forEach(button => {
    expect(button).toHaveAttribute('type')
  })

  const inputs = container.querySelectorAll('input')
  inputs.forEach(input => {
    if (input.getAttribute('required')) {
      expect(input).toHaveAttribute('aria-required', 'true')
    }
  })

  const labels = container.querySelectorAll('label')
  labels.forEach(label => {
    if (label.getAttribute('for')) {
      const associatedElement = container.querySelector(`#${label.getAttribute('for')}`)
      expect(associatedElement).toBeInTheDocument()
    }
  })
}

// Database mock helpers
export const createMockSupabaseResponse = (data: any, error: any = null) => ({
  data,
  error,
  status: error ? 400 : 200,
  statusText: error ? 'Bad Request' : 'OK',
})

export const createMockSupabaseQuery = (mockResponses: any[]) => {
  let callIndex = 0
  return {
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    single: jest.fn().mockImplementation(() => {
      const response = mockResponses[callIndex] || mockResponses[mockResponses.length - 1]
      callIndex++
      return Promise.resolve(response)
    }),
    maybeSingle: jest.fn().mockImplementation(() => {
      const response = mockResponses[callIndex] || mockResponses[mockResponses.length - 1]
      callIndex++
      return Promise.resolve(response)
    }),
  }
}