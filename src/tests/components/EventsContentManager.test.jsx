import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import EventsContentManager from '../EventsContentManager';

// Mock Firebase
vi.mock('../../firebase', () => ({
  auth: {
    currentUser: { email: 'oleg@luckyhospitality.com' }
  }
}));

// Mock Firebase auth
vi.mock('firebase/auth', () => ({
  signOut: vi.fn()
}));

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate
  };
});

const renderEventsManager = () => {
  return render(
    <BrowserRouter>
      <EventsContentManager />
    </BrowserRouter>
  );
};

describe('EventsContentManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders events content manager correctly', () => {
    renderEventsManager();
    
    expect(screen.getByText('Events Content Manager')).toBeInTheDocument();
    expect(screen.getByText('Manage Events')).toBeInTheDocument();
    expect(screen.getByText('+ Create New Event')).toBeInTheDocument();
  });

  it('shows existing events in table', () => {
    renderEventsManager();
    
    expect(screen.getByText('Summer Music Festival')).toBeInTheDocument();
    expect(screen.getByText('Jazz Night')).toBeInTheDocument();
    expect(screen.getByText('Central Park')).toBeInTheDocument();
    expect(screen.getByText('Blue Note Club')).toBeInTheDocument();
  });

  it('opens create form when create button is clicked', () => {
    renderEventsManager();
    
    const createButton = screen.getByText('+ Create New Event');
    fireEvent.click(createButton);
    
    expect(screen.getByText('Create New Event')).toBeInTheDocument();
    expect(screen.getByLabelText('Event Title')).toBeInTheDocument();
  });

  it('navigates back to dashboard when back button is clicked', () => {
    renderEventsManager();
    
    const backButton = screen.getByText('← Back to Dashboard');
    fireEvent.click(backButton);
    
    expect(mockNavigate).toHaveBeenCalledWith('/admin-dashboard');
  });

  it('has logout button', () => {
    renderEventsManager();
    
    const logoutButton = screen.getByText('Logout');
    expect(logoutButton).toBeInTheDocument();
  });
});
