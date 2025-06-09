import { notifyTaskCreated, notifyTaskUpdated } from '@/lib/webhook-service'

// Mock fetch globally
global.fetch = jest.fn()

describe('webhook-service', () => {
  const mockTaskData = {
    id: '123',
    titulo: 'Test Task',
    descripcion: 'Test description',
    estado: 'pendiente',
    prioridad: 'alta',
    team_id: '456',
    asignado_a: '789',
  }

  beforeEach(() => {
    jest.clearAllMocks()
    // Mock console methods to avoid noise in tests
    jest.spyOn(console, 'log').mockImplementation()
    jest.spyOn(console, 'error').mockImplementation()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('notifyTaskCreated', () => {
    it('should send task creation notification successfully', async () => {
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        text: jest.fn().mockResolvedValue('Success'),
      })

      const result = await notifyTaskCreated(mockTaskData)

      expect(result).toBe(true)
      expect(fetch).toHaveBeenCalledWith(
        'https://webhooks.pox.me/webhook/1a7295b9-5633-4ee2-a80e-93cc7afe6b1a',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: expect.stringContaining('"event":"task.created"'),
        }
      )
    })

    it('should handle failed webhook request', async () => {
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        text: jest.fn().mockResolvedValue('Error message'),
      })

      const result = await notifyTaskCreated(mockTaskData)

      expect(result).toBe(false)
      expect(console.error).toHaveBeenCalledWith(
        'Error al enviar notificación:',
        'Error message'
      )
    })

    it('should handle network errors', async () => {
      const networkError = new Error('Network error')
      ;(fetch as jest.Mock).mockRejectedValueOnce(networkError)

      const result = await notifyTaskCreated(mockTaskData)

      expect(result).toBe(false)
      expect(console.error).toHaveBeenCalledWith(
        'Error al enviar notificación:',
        networkError
      )
    })

    it('should include correct event type and timestamp', async () => {
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        text: jest.fn().mockResolvedValue('Success'),
      })

      await notifyTaskCreated(mockTaskData)

      const callArgs = (fetch as jest.Mock).mock.calls[0]
      const body = JSON.parse(callArgs[1].body)

      expect(body.event).toBe('task.created')
      expect(body.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/)
      expect(body.data).toEqual(mockTaskData)
    })
  })

  describe('notifyTaskUpdated', () => {
    it('should send task update notification successfully', async () => {
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        text: jest.fn().mockResolvedValue('Success'),
      })

      const result = await notifyTaskUpdated(mockTaskData)

      expect(result).toBe(true)
      expect(fetch).toHaveBeenCalledWith(
        'https://webhooks.pox.me/webhook/1a7295b9-5633-4ee2-a80e-93cc7afe6b1a',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: expect.stringContaining('"event":"task.updated"'),
        }
      )
    })

    it('should handle failed webhook request', async () => {
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        text: jest.fn().mockResolvedValue('Error message'),
      })

      const result = await notifyTaskUpdated(mockTaskData)

      expect(result).toBe(false)
      expect(console.error).toHaveBeenCalledWith(
        'Error al enviar notificación:',
        'Error message'
      )
    })

    it('should include correct event type for updates', async () => {
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        text: jest.fn().mockResolvedValue('Success'),
      })

      await notifyTaskUpdated(mockTaskData)

      const callArgs = (fetch as jest.Mock).mock.calls[0]
      const body = JSON.parse(callArgs[1].body)

      expect(body.event).toBe('task.updated')
      expect(body.data).toEqual(mockTaskData)
    })
  })
})