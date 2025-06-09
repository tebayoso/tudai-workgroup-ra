import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Textarea } from '@/components/ui/textarea'

describe('Textarea', () => {
  it('renders textarea field', () => {
    render(<Textarea placeholder="Enter description" />)
    expect(screen.getByPlaceholderText(/enter description/i)).toBeInTheDocument()
  })

  it('handles value changes', async () => {
    const user = userEvent.setup()
    const handleChange = jest.fn()
    
    render(<Textarea onChange={handleChange} />)
    
    const textarea = screen.getByRole('textbox')
    await user.type(textarea, 'test content')
    
    expect(handleChange).toHaveBeenCalled()
    expect(textarea).toHaveValue('test content')
  })

  it('can be disabled', () => {
    render(<Textarea disabled />)
    
    const textarea = screen.getByRole('textbox')
    expect(textarea).toBeDisabled()
  })

  it('supports rows attribute', () => {
    render(<Textarea rows={5} data-testid="textarea" />)
    
    const textarea = screen.getByTestId('textarea')
    expect(textarea).toHaveAttribute('rows', '5')
  })

  it('forwards ref correctly', () => {
    const ref = React.createRef<HTMLTextAreaElement>()
    render(<Textarea ref={ref} />)
    
    expect(ref.current).toBeInstanceOf(HTMLTextAreaElement)
  })

  it('applies custom className', () => {
    render(<Textarea className="custom-class" data-testid="textarea" />)
    
    const textarea = screen.getByTestId('textarea')
    expect(textarea).toHaveClass('custom-class')
  })

  it('supports controlled textarea', () => {
    const TestComponent = () => {
      const [value, setValue] = React.useState('')
      return (
        <Textarea 
          value={value} 
          onChange={(e) => setValue(e.target.value)}
          data-testid="controlled-textarea"
        />
      )
    }
    
    render(<TestComponent />)
    
    const textarea = screen.getByTestId('controlled-textarea')
    fireEvent.change(textarea, { target: { value: 'controlled content' } })
    expect(textarea).toHaveValue('controlled content')
  })

  it('handles resize property', () => {
    render(<Textarea className="resize-none" data-testid="textarea" />)
    
    const textarea = screen.getByTestId('textarea')
    expect(textarea).toHaveClass('resize-none')
  })
})