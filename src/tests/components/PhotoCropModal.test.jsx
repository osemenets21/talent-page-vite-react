import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import PhotoCropModal from '../../components/PhotoCropModal'

// Mock react-image-crop
vi.mock('react-image-crop', () => ({
  default: ({ children, ...props }) => <div data-testid="react-crop" {...props}>{children}</div>,
  centerCrop: vi.fn(() => ({ x: 0, y: 0, width: 100, height: 100 })),
  makeAspectCrop: vi.fn(() => ({ x: 0, y: 0, width: 100, height: 100 }))
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
    
    expect(screen.getByText('Crop Photo')).toBeInTheDocument()
    expect(screen.getByText('Crop & Save')).toBeInTheDocument()
    expect(screen.getByText('Cancel')).toBeInTheDocument()
  })

  it('does not render when closed', () => {
    render(<PhotoCropModal {...defaultProps} open={false} />)
    
    expect(screen.queryByText('Crop Photo')).not.toBeInTheDocument()
  })

  it('shows crop interface when image is provided', () => {
    render(<PhotoCropModal {...defaultProps} />)
    
    expect(screen.getByTestId('react-crop')).toBeInTheDocument()
  })

  it('calls setOpen when cancel is clicked', () => {
    const setOpen = vi.fn()
    render(<PhotoCropModal {...defaultProps} setOpen={setOpen} />)
    
    const cancelButton = screen.getByText('Cancel')
    expect(cancelButton).toBeInTheDocument()
  })

  it('handles missing image file', () => {
    render(<PhotoCropModal {...defaultProps} imageFile={null} />)
    
    expect(screen.getByText('Crop Photo')).toBeInTheDocument()
  })
})