# Testing Documentation

## Overview

This project uses Jest and React Testing Library for comprehensive testing coverage. The test suite includes unit tests, integration tests, and component tests.

## Test Structure

```
__tests__/
├── components/
│   ├── auth/           # Authentication component tests
│   ├── task/           # Task management component tests
│   ├── team/           # Team management component tests
│   ├── tp/             # TP (Trabajo Práctico) component tests
│   └── ui/             # UI component tests
├── hooks/              # Custom hooks tests
├── lib/                # Utility functions tests
├── integration/        # Integration tests
├── utils/
│   ├── test-utils.tsx  # Custom render functions and utilities
│   └── mocks.ts        # Mock implementations
└── setup-tests.ts      # Additional test setup utilities
```

## Running Tests

### All Tests
```bash
npm test
```

### Watch Mode
```bash
npm run test:watch
```

### Coverage Report
```bash
npm run test:coverage
```

## Test Configuration

### Jest Configuration
- **Framework**: Jest with Next.js integration
- **Environment**: jsdom for DOM testing
- **Setup**: Custom setup files for mocking and utilities
- **Coverage**: 80% threshold for branches, functions, lines, and statements

### Key Features
- **Mocked Dependencies**: Supabase, Next.js router, webhooks
- **Custom Utilities**: Test data factories, accessibility helpers
- **Integration Tests**: Complete user workflows

## Testing Patterns

### Component Testing
```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import { MyComponent } from '@/components/MyComponent'

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />)
    expect(screen.getByText('Expected Text')).toBeInTheDocument()
  })
})
```

### Async Testing
```typescript
import { waitFor } from '@testing-library/react'

it('handles async operations', async () => {
  render(<AsyncComponent />)
  
  await waitFor(() => {
    expect(screen.getByText('Loaded Data')).toBeInTheDocument()
  })
})
```

### Mock Usage
```typescript
import { mockSupabaseClient } from '@/__tests__/utils/mocks'

beforeEach(() => {
  mockSupabaseClient.from.mockReturnValue({
    select: jest.fn().mockResolvedValue({ data: [], error: null })
  })
})
```

## Test Categories

### Unit Tests
- Individual component rendering
- Function behavior verification
- Error handling
- Input validation

### Integration Tests
- Complete user workflows
- Component interaction
- Data flow between components
- Authentication flows

### UI Tests
- Form submissions
- User interactions
- Loading states
- Error states

## Mocked Services

### Supabase
- Authentication methods
- Database operations
- Real-time subscriptions
- Storage operations

### Next.js
- Router navigation
- Server components
- Client components

### External Services
- Webhook notifications
- File uploads

## Best Practices

### Test Organization
- Group related tests in describe blocks
- Use descriptive test names
- Keep tests focused and isolated

### Assertions
- Use specific matchers
- Test both positive and negative cases
- Verify accessibility attributes

### Mock Management
- Reset mocks between tests
- Use realistic mock data
- Mock at the appropriate level

### Performance
- Avoid unnecessary renders
- Use appropriate timeouts
- Clean up after tests

## Coverage Goals

- **Components**: 90%+ coverage
- **Utilities**: 95%+ coverage
- **Hooks**: 90%+ coverage
- **Integration**: Key workflows covered

## Common Testing Scenarios

### Form Testing
```typescript
// Fill and submit form
await user.type(screen.getByLabelText(/email/i), 'test@example.com')
fireEvent.click(screen.getByRole('button', { name: /submit/i }))

// Verify submission
await waitFor(() => {
  expect(mockApiCall).toHaveBeenCalledWith(expectedData)
})
```

### Error Handling
```typescript
// Mock error response
mockSupabaseClient.auth.signIn.mockResolvedValue({
  error: { message: 'Invalid credentials' }
})

// Verify error display
await waitFor(() => {
  expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument()
})
```

### Loading States
```typescript
// Mock delayed response
mockApiCall.mockImplementation(() => 
  new Promise(resolve => setTimeout(resolve, 100))
)

// Verify loading indicator
expect(screen.getByText(/loading/i)).toBeInTheDocument()
```

## Debugging Tests

### Common Issues
- **Async operations**: Use `waitFor` for async state changes
- **Mock timing**: Ensure mocks are set up before rendering
- **Test isolation**: Reset mocks and clean up between tests

### Debugging Tips
- Use `screen.debug()` to see rendered output
- Check console for warnings and errors
- Verify mock call history with `.toHaveBeenCalledWith()`

## Contributing

When adding new tests:
1. Follow existing patterns
2. Add both positive and negative test cases
3. Update this documentation if needed
4. Ensure tests pass in CI environment
5. Maintain or improve coverage percentage