import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import SupervisorPanel from '../../components/SupervisorPanel'

// Mock Firebase
vi.mock('../../firebase', () => ({
  auth: { currentUser: { uid: 'admin-uid' } },
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

const mockTalentData = [
  {
    submissionId: 'test123',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    phone: '123-456-7890',
    bio: 'Test bio',
    timestamp: '08/10/2025, 10:30:00 AM',
    files: {
      photo: 'photo.jpg'
    }
  }
]

const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  )
}

describe('SupervisorPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockTalentData)
      })
    )
  })

  it('renders loading state initially', () => {
    renderWithRouter(<SupervisorPanel />)
    
    expect(screen.getByText('Loading talents...')).toBeInTheDocument()
  })

  it('displays talent data in table', async () => {
    renderWithRouter(<SupervisorPanel />)
    
    await waitFor(() => {
      expect(screen.getByText('John')).toBeInTheDocument()
      expect(screen.getByText('Doe')).toBeInTheDocument()
      expect(screen.getByText('john@example.com')).toBeInTheDocument()
    })
  })

  it('shows table headers', async () => {
    renderWithRouter(<SupervisorPanel />)
    
    await waitFor(() => {
      expect(screen.getByText('First Name')).toBeInTheDocument()
      expect(screen.getByText('Last Name')).toBeInTheDocument()
      expect(screen.getByText('Email')).toBeInTheDocument()
      expect(screen.getByText('Photo')).toBeInTheDocument()
    })
  })

  it('shows edit and delete buttons for each talent', async () => {
    renderWithRouter(<SupervisorPanel />)
    
    await waitFor(() => {
      expect(screen.getByText('Edit')).toBeInTheDocument()
      expect(screen.getByText('Delete')).toBeInTheDocument()
    })
  })

  it('displays row numbers', async () => {
    renderWithRouter(<SupervisorPanel />)
    
    await waitFor(() => {
      expect(screen.getByText('1')).toBeInTheDocument()
    })
  })

  it('shows timestamp in correct format', async () => {
    renderWithRouter(<SupervisorPanel />)
    
    await waitFor(() => {
      expect(screen.getByText('08/10/2025, 10:30:00 AM')).toBeInTheDocument()
    })
  })

  it('handles empty talent list', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve([])
      })
    )

    renderWithRouter(<SupervisorPanel />)
    
    await waitFor(() => {
      expect(screen.getByText('No talents found.')).toBeInTheDocument()
    })
  })
})