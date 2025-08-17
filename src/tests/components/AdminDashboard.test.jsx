import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import AdminDashboard from '../AdminDashboard';

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

const renderAdminDashboard = () => {
  return render(
    <BrowserRouter>
      <AdminDashboard />
    </BrowserRouter>
  );
};

describe('AdminDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders admin dashboard correctly', () => {
    renderAdminDashboard();
    
    expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Welcome to Admin Panel')).toBeInTheDocument();
    expect(screen.getByText('Talent Data Manager')).toBeInTheDocument();
    expect(screen.getByText('Events Content Manager')).toBeInTheDocument();
  });

  it('navigates to supervisor panel when talent data button is clicked', () => {
    renderAdminDashboard();
    
    const talentButton = screen.getByText('Open Talent Manager');
    fireEvent.click(talentButton);
    
    expect(mockNavigate).toHaveBeenCalledWith('/supervisor-panel');
  });

  it('navigates to events manager when events button is clicked', () => {
    renderAdminDashboard();
    
    const eventsButton = screen.getByText('Open Events Manager');
    fireEvent.click(eventsButton);
    
    expect(mockNavigate).toHaveBeenCalledWith('/events-content-manager');
  });

  it('has logout button', () => {
    renderAdminDashboard();
    
    const logoutButton = screen.getByText('Logout');
    expect(logoutButton).toBeInTheDocument();
  });
});
