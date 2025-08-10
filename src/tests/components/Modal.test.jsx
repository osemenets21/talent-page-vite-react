import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Modal from '../../components/Modal'

describe('Modal', () => {
  const defaultProps = {
    open: true,
    setOpen: vi.fn(),
    title: 'Test Title',
    message: 'Test message'
  }

  it('renders modal when open', () => {
    render(<Modal {...defaultProps} />)
    
    expect(screen.getByText('Test Title')).toBeInTheDocument()
    expect(screen.getByText('Test message')).toBeInTheDocument()
  })

  it('does not render modal when closed', () => {
    render(<Modal {...defaultProps} open={false} />)
    
    expect(screen.queryByText('Test Title')).not.toBeInTheDocument()
    expect(screen.queryByText('Test message')).not.toBeInTheDocument()
  })

  it('calls setOpen when close button is clicked', () => {
    const setOpen = vi.fn()
    render(<Modal {...defaultProps} setOpen={setOpen} />)
    
    const closeButton = screen.getByRole('button')
    fireEvent.click(closeButton)
    
    expect(setOpen).toHaveBeenCalledWith(false)
  })

  it('handles missing title gracefully', () => {
    render(<Modal {...defaultProps} title="" />)
    
    expect(screen.getByText('Test message')).toBeInTheDocument()
  })

  it('handles missing message gracefully', () => {
    render(<Modal {...defaultProps} message="" />)
    
    expect(screen.getByText('Test Title')).toBeInTheDocument()
  })
})