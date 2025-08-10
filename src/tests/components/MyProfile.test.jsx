import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import MyProfile from '../../components/MyProfile'

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
})

// Mock Firebase
vi.mock('../../firebase', () => ({
  auth: { currentUser: { uid: 'test-uid' } },
  signOut: vi.fn(() => Promise.resolve())
}))

// Mock react-router-dom
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate
  }
})

// Mock environment variables
Object.defineProperty(import.meta, 'env', {
  value: {
    VITE_API_DOMAIN: 'http://localhost:8000'
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
    // Reset localStorage mock
    mockLocalStorage.getItem.mockReturnValue(null)
    
    // Mock fetch globally
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockProfileData)
      })
    )
  })

  it('renders no submission message when no ID found', () => {
    // No submission ID in localStorage
    mockLocalStorage.getItem.mockReturnValue(null)
    
    renderWithRouter(<MyProfile />)
    
    expect(screen.getByText('No submission ID found. Please submit your profile first.')).toBeInTheDocument()
  })

  it('renders loading state initially when submission ID exists', () => {
    // Mock submission ID exists
    mockLocalStorage.getItem.mockReturnValue('test-submission-id')
    
    renderWithRouter(<MyProfile />)
    
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('displays welcome message with user name', async () => {
    // Mock submission ID exists
    mockLocalStorage.getItem.mockReturnValue('test-submission-id')
    
    renderWithRouter(<MyProfile />)
    
    await waitFor(() => {
      expect(screen.getByText('Welcome, John Doe')).toBeInTheDocument()
    })
  })

  it('displays profile information', async () => {
    // Mock submission ID exists
    mockLocalStorage.getItem.mockReturnValue('test-submission-id')
    
    renderWithRouter(<MyProfile />)
    
    await waitFor(() => {
      expect(screen.getByText('john@example.com')).toBeInTheDocument()
      expect(screen.getByText('123-456-7890')).toBeInTheDocument()
      expect(screen.getByText('Test bio')).toBeInTheDocument()
    })
  })

  it('shows edit button', async () => {
    // Mock submission ID exists
    mockLocalStorage.getItem.mockReturnValue('test-submission-id')
    
    renderWithRouter(<MyProfile />)
    
    await waitFor(() => {
      expect(screen.getByText('Edit Profile')).toBeInTheDocument()
    })
  })

  it('handles profile not found', async () => {
    // Mock submission ID exists but profile not found
    mockLocalStorage.getItem.mockReturnValue('test-submission-id')
    
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

  it('handles fetch error', async () => {
    // Mock submission ID exists but fetch fails
    mockLocalStorage.getItem.mockReturnValue('test-submission-id')
    
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        status: 404
      })
    )

    renderWithRouter(<MyProfile />)
    
    await waitFor(() => {
      expect(screen.getByText('Profile not found')).toBeInTheDocument()
    })
  })
})