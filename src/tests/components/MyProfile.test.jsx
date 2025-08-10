import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import MyProfile from '../../components/MyProfile'

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

const mockProfileData = {
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  phone: '123-456-7890',
  bio: 'Test bio',
  updated_at: '08/10/2025, 10:30:00 AM'
}

const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  )
}

describe('MyProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockProfileData)
      })
    )
  })

  it('renders loading state initially', () => {
    renderWithRouter(<MyProfile />)
    
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('displays welcome message with user name', async () => {
    renderWithRouter(<MyProfile />)
    
    await waitFor(() => {
      expect(screen.getByText('Welcome, John Doe')).toBeInTheDocument()
    })
  })

  it('displays profile information', async () => {
    renderWithRouter(<MyProfile />)
    
    await waitFor(() => {
      expect(screen.getByText('john@example.com')).toBeInTheDocument()
      expect(screen.getByText('123-456-7890')).toBeInTheDocument()
      expect(screen.getByText('Test bio')).toBeInTheDocument()
    })
  })

  it('shows edit button', async () => {
    renderWithRouter(<MyProfile />)
    
    await waitFor(() => {
      expect(screen.getByText('Edit Profile')).toBeInTheDocument()
    })
  })

  it('shows last updated timestamp', async () => {
    renderWithRouter(<MyProfile />)
    
    await waitFor(() => {
      expect(screen.getByText('Last Updated')).toBeInTheDocument()
      expect(screen.getByText('08/10/2025, 10:30:00 AM')).toBeInTheDocument()
    })
  })

  it('handles profile not found', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(null)
      })
    )

    renderWithRouter(<MyProfile />)
    
    await waitFor(() => {
      expect(screen.getByText('Profile not found')).toBeInTheDocument()
    })
  })
})