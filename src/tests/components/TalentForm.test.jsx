import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import TalentForm from '../../components/TalentForm'

// Mock Firebase
vi.mock('../../firebase', () => ({
  auth: { currentUser: { uid: 'test-uid' } },
  signOut: vi.fn(() => Promise.resolve()),
  storage: {}
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

// Mock FileUpload component
vi.mock('../../components/FileUpload', () => ({
  default: ({ label, setFile, required }) => (
    <div>
      <label>{label}</label>
      <input
        type="file"
        onChange={(e) => setFile && setFile(e.target.files[0])}
        required={required}
      />
    </div>
  )
}))

// Mock PhotoCropModal component
vi.mock('../../components/PhotoCropModal', () => ({
  default: ({ open, setOpen, onCropDone }) => 
    open ? (
      <div>
        <button onClick={() => {
          onCropDone(new Blob())
          setOpen(false)
        }}>
          Crop Photo
        </button>
      </div>
    ) : null
}))

// Mock Modal component
vi.mock('../../components/Modal', () => ({
  default: ({ open, title, message, setOpen }) => 
    open ? (
      <div role="dialog">
        <h2>{title}</h2>
        <p>{message}</p>
        <button onClick={() => setOpen(false)}>Close</button>
      </div>
    ) : null
}))

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
    // Mock URL.createObjectURL
    global.URL.createObjectURL = vi.fn(() => 'mock-url')
    global.URL.revokeObjectURL = vi.fn()
  })

  it('renders talent form correctly', () => {
    renderWithRouter(<TalentForm />)
    
    expect(screen.getByText('Create Public Performer Profile')).toBeInTheDocument()
    expect(screen.getByText('First Name')).toBeInTheDocument()
    expect(screen.getByText('Last Name')).toBeInTheDocument()
  })

  it('displays required field indicators', () => {
    renderWithRouter(<TalentForm />)
    
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
    expect(paymentSelect).toHaveValue('Zelle')
  })

  it('validates bio character limit', () => {
    renderWithRouter(<TalentForm />)
    
    const bioTextarea = screen.getByRole('textbox', { name: /bio/i })
    expect(bioTextarea).toHaveAttribute('maxLength', '1500')
    
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

  it('updates bio character counter when typing', () => {
    renderWithRouter(<TalentForm />)
    
    const bioTextarea = screen.getByRole('textbox', { name: /bio/i })
    fireEvent.change(bioTextarea, { target: { value: 'Test bio content' } })
    
    expect(screen.getByText('16/1500')).toBeInTheDocument()
  })

  it('shows venmo field when venmo payment method is selected', () => {
    renderWithRouter(<TalentForm />)
    
    expect(screen.getByLabelText('Venmo Name')).toBeInTheDocument()
  })

  it('shows zelle field when zelle payment method is selected', () => {
    renderWithRouter(<TalentForm />)
    
    const paymentSelect = screen.getByDisplayValue('Venmo')
    fireEvent.change(paymentSelect, { target: { value: 'Zelle' } })
    
    expect(screen.getByLabelText('Zelle Email or Phone')).toBeInTheDocument()
  })

  it('validates bio for repetitive characters', async () => {
    renderWithRouter(<TalentForm />)
    
    const bioTextarea = screen.getByRole('textbox', { name: /bio/i })
    fireEvent.change(bioTextarea, { target: { value: 'aaaaaaaaaaaaa' } })
    
    await waitFor(() => {
      expect(screen.getByText('Bio cannot contain more than 10 consecutive same characters')).toBeInTheDocument()
    })
  })

  it('validates bio for repetitive words', async () => {
    renderWithRouter(<TalentForm />)
    
    const bioTextarea = screen.getByRole('textbox', { name: /bio/i })
    fireEvent.change(bioTextarea, { target: { value: 'hello hello hello hello hello hello' } })
    
    await waitFor(() => {
      expect(screen.getByText('Bio cannot repeat the same word more than 5 times')).toBeInTheDocument()
    })
  })

  it('validates bio for repetitive phrases', async () => {
    renderWithRouter(<TalentForm />)
    
    const bioTextarea = screen.getByRole('textbox', { name: /bio/i })
    fireEvent.change(bioTextarea, { target: { value: 'I am great I am great I am great' } })
    
    await waitFor(() => {
      expect(screen.getByText('Bio cannot repeat the same phrase more than 2 times')).toBeInTheDocument()
    })
  })

  it('updates form fields correctly', () => {
    renderWithRouter(<TalentForm />)
    
    const firstNameInput = screen.getByLabelText('First Name')
    fireEvent.change(firstNameInput, { target: { value: 'John' } })
    expect(firstNameInput).toHaveValue('John')
    
    const lastNameInput = screen.getByLabelText('Last Name')
    fireEvent.change(lastNameInput, { target: { value: 'Doe' } })
    expect(lastNameInput).toHaveValue('Doe')
  })

  it('has logout button', () => {
    renderWithRouter(<TalentForm />)
    
    const logoutButton = screen.getByTitle('Logout')
    expect(logoutButton).toBeInTheDocument()
  })

  it('displays photo upload section', () => {
    renderWithRouter(<TalentForm />)
    
    expect(screen.getByText('Photo')).toBeInTheDocument()
    expect(screen.getByText('Change')).toBeInTheDocument()
  })

  it('has all social media fields', () => {
    renderWithRouter(<TalentForm />)
    
    expect(screen.getByLabelText('Instagram')).toBeInTheDocument()
    expect(screen.getByLabelText('Facebook')).toBeInTheDocument()
    expect(screen.getByLabelText('SoundCloud')).toBeInTheDocument()
    expect(screen.getByLabelText('Spotify')).toBeInTheDocument()
    expect(screen.getByLabelText('Youtube')).toBeInTheDocument()
    expect(screen.getByLabelText('Tiktok')).toBeInTheDocument()
  })

  it('has location fields', () => {
    renderWithRouter(<TalentForm />)
    
    expect(screen.getByLabelText('City of Origin')).toBeInTheDocument()
    expect(screen.getByLabelText('Country')).toBeInTheDocument()
  })

  it('has contact fields', () => {
    renderWithRouter(<TalentForm />)
    
    expect(screen.getByLabelText('Phone')).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
  })

  it('prevents form submission when terms not agreed', async () => {
    renderWithRouter(<TalentForm />)
    
    const submitButton = screen.getByRole('button', { name: 'Submit Talent Profile' })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument()
      expect(screen.getByText('Terms Required')).toBeInTheDocument()
    })
  })

  it('shows file upload sections', () => {
    renderWithRouter(<TalentForm />)
    
    expect(screen.getByText('Performer Images / LOGO (JPG/PNG)')).toBeInTheDocument()
    expect(screen.getByText('Upload W9 (PDF)')).toBeInTheDocument()
  })

  it('country field defaults to USA', () => {
    renderWithRouter(<TalentForm />)
    
    const countryInput = screen.getByLabelText('Country')
    expect(countryInput).toHaveValue('USA')
  })

  it('shows private info section', () => {
    renderWithRouter(<TalentForm />)
    
    expect(screen.getByText('Private Info')).toBeInTheDocument()
  })

  it('shows photo crop modal when photo is uploaded', async () => {
    renderWithRouter(<TalentForm />)
    
    const photoInput = screen.getByLabelText('Change')
    const file = new File(['photo'], 'photo.jpg', { type: 'image/jpeg' })
    
    fireEvent.change(photoInput.querySelector('input'), { target: { files: [file] } })
    
    await waitFor(() => {
      expect(screen.getByText('Crop Photo')).toBeInTheDocument()
    })
  })

  it('displays photo preview after cropping', async () => {
    renderWithRouter(<TalentForm />)
    
    const photoInput = screen.getByLabelText('Change')
    const file = new File(['photo'], 'photo.jpg', { type: 'image/jpeg' })
    
    fireEvent.change(photoInput.querySelector('input'), { target: { files: [file] } })
    
    const cropButton = await screen.findByText('Crop Photo')
    fireEvent.click(cropButton)
    
    await waitFor(() => {
      const preview = screen.getByAltText('Preview')
      expect(preview).toBeInTheDocument()
    })
  })

  it('shows hint when hint button is clicked', () => {
    renderWithRouter(<TalentForm />)
    
    const hintButton = screen.getByTitle('Show hint')
    fireEvent.click(hintButton)
    
    expect(screen.getByText(/Optional, but If entered this will take the place/)).toBeInTheDocument()
  })

  it('requires file uploads for submission', async () => {
    renderWithRouter(<TalentForm />)
    
    const checkbox = screen.getByRole('checkbox')
    fireEvent.click(checkbox)
    
    const submitButton = screen.getByRole('button', { name: 'Submit Talent Profile' })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument()
      expect(screen.getByText('Files Required')).toBeInTheDocument()
    })
  })

  it('validates required fields before submission', () => {
    renderWithRouter(<TalentForm />)
    
    const requiredInputs = screen.getAllByRole('textbox', { required: true })
    expect(requiredInputs.length).toBeGreaterThan(0)
    
    const requiredSelects = screen.getAllByRole('combobox', { required: true })
    expect(requiredSelects.length).toBeGreaterThan(0)
  })

  it('handles bio error display correctly', async () => {
    renderWithRouter(<TalentForm />)
    
    const bioTextarea = screen.getByRole('textbox', { name: /bio/i })
    fireEvent.change(bioTextarea, { target: { value: 'aaaaaaaaaaaaa' } })
    
    await waitFor(() => {
      expect(bioTextarea).toHaveClass('border-red-300')
    })
  })

  it('clears bio error when valid text is entered', async () => {
    renderWithRouter(<TalentForm />)
    
    const bioTextarea = screen.getByRole('textbox', { name: /bio/i })
    
    // First enter invalid text
    fireEvent.change(bioTextarea, { target: { value: 'aaaaaaaaaaaaa' } })
    
    await waitFor(() => {
      expect(screen.getByText('Bio cannot contain more than 10 consecutive same characters')).toBeInTheDocument()
    })
    
    // Then enter valid text
    fireEvent.change(bioTextarea, { target: { value: 'This is a valid bio' } })
    
    await waitFor(() => {
      expect(screen.queryByText('Bio cannot contain more than 10 consecutive same characters')).not.toBeInTheDocument()
    })
  })

  it('generates and stores submission ID', () => {
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem')
    
    renderWithRouter(<TalentForm />)
    
    expect(setItemSpy).toHaveBeenCalledWith('submissionId', expect.any(String))
  })

  it('handles successful form submission', async () => {
    global.fetch.mockResolvedValueOnce({
      json: () => Promise.resolve({ status: 'success' })
    })
    
    renderWithRouter(<TalentForm />)
    
    // Fill required fields and files
    const checkbox = screen.getByRole('checkbox')
    fireEvent.click(checkbox)
    
    // Mock file uploads
    const photoInput = screen.getByLabelText('Change').querySelector('input')
    const file = new File(['photo'], 'photo.jpg', { type: 'image/jpeg' })
    Object.defineProperty(photoInput, 'files', {
      value: [file],
      writable: false
    })
    fireEvent.change(photoInput, { target: { files: [file] } })
    
    const cropButton = await screen.findByText('Crop Photo')
    fireEvent.click(cropButton)
    
    // Mock tax form upload
    const taxFormInput = screen.getByText('Upload W9 (PDF)').nextElementSibling
    const pdfFile = new File(['tax'], 'w9.pdf', { type: 'application/pdf' })
    fireEvent.change(taxFormInput, { target: { files: [pdfFile] } })
    
    const submitButton = screen.getByRole('button', { name: 'Submit Talent Profile' })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('Submission Successful')).toBeInTheDocument()
    })
  })

  it('handles form submission error', async () => {
    global.fetch.mockResolvedValueOnce({
      json: () => Promise.resolve({ status: 'error', message: 'Server error' })
    })
    
    renderWithRouter(<TalentForm />)
    
    const checkbox = screen.getByRole('checkbox')
    fireEvent.click(checkbox)
    
    const submitButton = screen.getByRole('button', { name: 'Submit Talent Profile' })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('Submission Failed')).toBeInTheDocument()
      expect(screen.getByText('Server error')).toBeInTheDocument()
    })
  })

  it('disables submit button when submitting', async () => {
    renderWithRouter(<TalentForm />)
    
    // Fill required terms checkbox
    const checkbox = screen.getByRole('checkbox')
    fireEvent.click(checkbox)
    
    const submitButton = screen.getByRole('button', { name: 'Submit Talent Profile' })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Submitting...' })).toBeInTheDocument()
    })
  })
})