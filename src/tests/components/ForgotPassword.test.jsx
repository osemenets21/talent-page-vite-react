import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import ForgotPassword from '../../components/ForgotPassword'

// Mock Firebase
vi.mock('../../firebase', () => ({
  auth: {},
  sendPasswordResetEmail: vi.fn()
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: vi.fn(() => vi.fn()),
    Link: ({ children, to, ...props }) => <a href={to} {...props}>{children}</a>
  }
})

const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  )
}

describe('ForgotPassword', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders forgot password form correctly', () => {
    renderWithRouter(<ForgotPassword />)
    
    expect(screen.getByText('Reset your password')).toBeInTheDocument()
    expect(screen.getByLabelText('Email address')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Send reset email' })).toBeInTheDocument()
  })

  it('allows user to enter email', () => {
    renderWithRouter(<ForgotPassword />)
    
    const emailInput = screen.getByLabelText('Email address')
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    
    expect(emailInput).toHaveValue('test@example.com')
  })

  it('has link back to sign in', () => {
    renderWithRouter(<ForgotPassword />)
    
    expect(screen.getByText('Back to sign in')).toBeInTheDocument()
  })

  it('validates email field as required', () => {
    renderWithRouter(<ForgotPassword />)
    
    const emailInput = screen.getByLabelText('Email address')
    expect(emailInput).toBeRequired()
  })
})