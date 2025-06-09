import { cn, formatDate } from '@/lib/utils'

describe('utils', () => {
  describe('cn', () => {
    it('should merge class names correctly', () => {
      expect(cn('class1', 'class2')).toBe('class1 class2')
    })

    it('should handle conditional classes', () => {
      expect(cn('base', true && 'conditional', false && 'hidden')).toBe('base conditional')
    })

    it('should handle conflicting Tailwind classes', () => {
      expect(cn('p-4', 'p-2')).toBe('p-2')
    })

    it('should handle empty inputs', () => {
      expect(cn()).toBe('')
    })

    it('should handle null and undefined', () => {
      expect(cn(null, undefined, 'valid')).toBe('valid')
    })
  })

  describe('formatDate', () => {
    it('should format date string correctly in es-AR format', () => {
      const dateString = '2024-01-15T10:30:00Z'
      const formatted = formatDate(dateString)
      expect(formatted).toMatch(/\d{2}\/\d{2}\/\d{4}/)
    })

    it('should handle different date formats', () => {
      const dateString = '2024-12-31T12:00:00Z'
      const formatted = formatDate(dateString)
      expect(formatted).toMatch(/31\/12\/2024/)
    })

    it('should handle ISO date strings', () => {
      const dateString = '2024-06-15T14:30:00.000Z'
      const formatted = formatDate(dateString)
      expect(formatted).toMatch(/15\/06\/2024/)
    })

    it('should throw error for invalid date strings', () => {
      expect(() => formatDate('invalid-date')).toThrow()
    })
  })
})