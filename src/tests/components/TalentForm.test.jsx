import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import TalentForm from '../../components/TalentForm'

// Mock Firebase
vi.mock('../../firebase', () => ({
  auth: { currentUser: { uid: 'test-uid' } },
  signOut: vi.fn()
}))

// Mock react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: vi.fn(() => vi.fn())
  }
})

const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  )
}

describe('TalentForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = vi.fn()
  })

  it('renders talent form correctly', () => {
    renderWithRouter(<TalentForm />)
    
    expect(screen.getByText('Create Public Performer Profile')).toBeInTheDocument()
    expect(screen.getByLabelText('First Name')).toBeInTheDocument()
    expect(screen.getByLabelText('Last Name')).toBeInTheDocument()
  })

  it('displays required field indicators', () => {
    renderWithRouter(<TalentForm />)
    
    // Check for red asterisks indicating required fields
    const requiredFields = screen.getAllByText('*')
    expect(requiredFields.length).toBeGreaterThan(0)
  })

  it('has role selection dropdown', () => {
    renderWithRouter(<TalentForm />)
    
    const roleSelect = screen.getByDisplayValue('DJ')
    expect(roleSelect).toBeInTheDocument()
  })

  it('shows role other input when Other is selected', () => {
    renderWithRouter(<TalentForm />)
    
    const roleSelect = screen.getByDisplayValue('DJ')
    fireEvent.change(roleSelect, { target: { value: 'Other' } })
    
    expect(screen.getByPlaceholderText('Specify your role')).toBeInTheDocument()
  })

  it('has payment method selection', () => {
    renderWithRouter(<TalentForm />)
    
    const paymentSelect = screen.getByDisplayValue('Venmo')
    expect(paymentSelect).toBeInTheDocument()
    
    fireEvent.change(paymentSelect, { target: { value: 'Zelle' } })
    expect(screen.getByLabelText('Zelle Email or Phone')).toBeInTheDocument()
  })

  it('validates bio character limit', () => {
    renderWithRouter(<TalentForm />)
    
    const bioTextarea = screen.getByLabelText('Brief BIO')
    expect(bioTextarea).toHaveAttribute('maxLength', '1500')
    
    // Check character counter
    expect(screen.getByText('0/1500')).toBeInTheDocument()
  })

  it('has terms and conditions checkbox', () => {
    renderWithRouter(<TalentForm />)
    
    const checkbox = screen.getByRole('checkbox')
    expect(checkbox).toBeRequired()
    expect(screen.getByText('Terms and Conditions')).toBeInTheDocument()
  })

  it('has submit button', () => {
    renderWithRouter(<TalentForm />)
    
    const submitButton = screen.getByRole('button', { name: 'Submit Talent Profile' })
    expect(submitButton).toBeInTheDocument()
  })
})