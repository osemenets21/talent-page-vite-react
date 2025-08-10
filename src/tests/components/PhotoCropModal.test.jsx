import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import PhotoCropModal from '../../components/PhotoCropModal'

// Mock react-easy-crop
vi.mock('react-easy-crop', () => ({
  default: ({ onCropComplete, ...props }) => <div data-testid="react-crop" {...props} />
}))

describe('PhotoCropModal', () => {
  const defaultProps = {
    open: true,
    setOpen: vi.fn(),
    imageFile: new File([''], 'test.jpg', { type: 'image/jpeg' }),
    onCropDone: vi.fn()
  }

  it('renders when open', () => {
    render(<PhotoCropModal {...defaultProps} />)
    
    // The actual text is "Adjust Photo" not "Crop Photo"
    expect(screen.getByText('Adjust Photo')).toBeInTheDocument()
    expect(screen.getByText('Crop & Save')).toBeInTheDocument()
    expect(screen.getByText('Cancel')).toBeInTheDocument()
  })

  it('does not render when closed', () => {
    render(<PhotoCropModal {...defaultProps} open={false} />)
    
    expect(screen.queryByText('Adjust Photo')).not.toBeInTheDocument()
  })

  it('handles missing image file', () => {
    render(<PhotoCropModal {...defaultProps} imageFile={null} />)
    
    expect(screen.getByText('Adjust Photo')).toBeInTheDocument()
  })
})