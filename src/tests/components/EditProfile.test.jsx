import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import EditProfile from '../../components/EditProfile'

const mockProfile = {
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  phone: '123-456-7890',
  bio: 'Test bio',
  submissionId: 'test123'
}

describe('EditProfile', () => {
  const defaultProps = {
    profile: mockProfile,
    onSave: vi.fn(),
    onCancel: vi.fn(),
    saving: false
  }

  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = vi.fn()
  })

  it('renders edit form with profile data', () => {
    render(<EditProfile {...defaultProps} />)
    
    expect(screen.getByDisplayValue('John')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Doe')).toBeInTheDocument()
    expect(screen.getByDisplayValue('john@example.com')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Test bio')).toBeInTheDocument()
  })

  it('shows save and cancel buttons', () => {
    render(<EditProfile {...defaultProps} />)
    
    expect(screen.getByText('Save Changes')).toBeInTheDocument()
    expect(screen.getByText('Cancel')).toBeInTheDocument()
  })

  it('calls onCancel when cancel button is clicked', () => {
    const onCancel = vi.fn()
    render(<EditProfile {...defaultProps} onCancel={onCancel} />)
    
    fireEvent.click(screen.getByText('Cancel'))
    expect(onCancel).toHaveBeenCalled()
  })

  it('allows editing form fields', () => {
    render(<EditProfile {...defaultProps} />)
    
    const firstNameInput = screen.getByDisplayValue('John')
    fireEvent.change(firstNameInput, { target: { value: 'Jane' } })
    
    expect(firstNameInput).toHaveValue('Jane')
  })

  it('shows saving state when saving', () => {
    render(<EditProfile {...defaultProps} saving={true} />)
    
    const saveButton = screen.getByText('Saving...')
    expect(saveButton).toBeDisabled()
  })

  it('has file upload sections', () => {
    render(<EditProfile {...defaultProps} />)
    
    expect(screen.getByText('Photo')).toBeInTheDocument()
    expect(screen.getByText('Tax Form')).toBeInTheDocument()
    expect(screen.getByText('Performer Images')).toBeInTheDocument()
  })
})