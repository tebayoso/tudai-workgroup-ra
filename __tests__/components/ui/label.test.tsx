import React from 'react'
import { render, screen } from '@testing-library/react'
import { Label } from '@/components/ui/label'

describe('Label', () => {
  it('renders label with text', () => {
    render(<Label>Username</Label>)
    expect(screen.getByText('Username')).toBeInTheDocument()
  })

  it('associates with form controls via htmlFor', () => {
    render(
      <div>
        <Label htmlFor="username">Username</Label>
        <input id="username" type="text" />
      </div>
    )
    
    const label = screen.getByText('Username')
    const input = screen.getByRole('textbox')
    
    expect(label).toHaveAttribute('for', 'username')
    expect(input).toHaveAttribute('id', 'username')
  })

  it('applies custom className', () => {
    render(<Label className="custom-label">Custom Label</Label>)
    
    const label = screen.getByText('Custom Label')
    expect(label).toHaveClass('custom-label')
  })

  it('forwards ref correctly', () => {
    const ref = React.createRef<HTMLLabelElement>()
    render(<Label ref={ref}>Label</Label>)
    
    expect(ref.current).toBeInstanceOf(HTMLLabelElement)
  })

  it('supports additional props', () => {
    render(
      <Label data-testid="test-label" onClick={() => {}}>
        Clickable Label
      </Label>
    )
    
    const label = screen.getByTestId('test-label')
    expect(label).toBeInTheDocument()
    expect(label).toHaveTextContent('Clickable Label')
  })

  it('has proper accessibility attributes', () => {
    render(<Label htmlFor="email">Email Address</Label>)
    
    const label = screen.getByText('Email Address')
    expect(label.tagName).toBe('LABEL')
  })
})