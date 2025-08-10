import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import FileUpload from '../../components/FileUpload'

describe('FileUpload', () => {
  const defaultProps = {
    label: 'Upload File',
    accept: '.pdf',
    setFile: vi.fn(),
    multiple: false
  }

  it('renders file upload component correctly', () => {
    render(<FileUpload {...defaultProps} />)
    
    expect(screen.getByText('Upload File')).toBeInTheDocument()
    expect(screen.getByText('Choose file')).toBeInTheDocument()
  })

  it('shows required indicator when required prop is true', () => {
    render(<FileUpload {...defaultProps} required />)
    
    expect(screen.getByText('*')).toBeInTheDocument()
  })

  it('accepts correct file types', () => {
    render(<FileUpload {...defaultProps} />)
    
    const input = screen.getByRole('button').parentElement.querySelector('input[type="file"]')
    expect(input).toHaveAttribute('accept', '.pdf')
  })

  it('handles multiple files when multiple prop is true', () => {
    render(<FileUpload {...defaultProps} multiple />)
    
    const input = screen.getByRole('button').parentElement.querySelector('input[type="file"]')
    expect(input).toHaveAttribute('multiple')
  })

  it('calls setFile when file is selected', () => {
    const setFile = vi.fn()
    render(<FileUpload {...defaultProps} setFile={setFile} />)
    
    const input = screen.getByRole('button').parentElement.querySelector('input[type="file"]')
    const file = new File(['test'], 'test.pdf', { type: 'application/pdf' })
    
    fireEvent.change(input, { target: { files: [file] } })
    
    expect(setFile).toHaveBeenCalled()
  })
})