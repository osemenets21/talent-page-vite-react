import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import ForgotPassword from '../../components/ForgotPassword'

// Mock Firebase
vi.mock('../../firebase', () => ({
  auth: {},
  sendPasswordResetEmail: vi.fn(() => Promise.resolve())
}))

// Mock react-router-dom
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
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
    
    // The actual text is "Sign in" not "Back to sign in"
    expect(screen.getByText('Sign in')).toBeInTheDocument()
  })

  it('validates email field as required', () => {
    renderWithRouter(<ForgotPassword />)
    
    const emailInput = screen.getByLabelText('Email address')
    expect(emailInput).toBeRequired()
  })
})