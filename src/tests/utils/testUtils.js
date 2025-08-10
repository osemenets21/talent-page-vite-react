import { render } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'

// Custom render function that includes router
export const renderWithRouter = (ui, options = {}) => {
  const Wrapper = ({ children }) => (
    <BrowserRouter>{children}</BrowserRouter>
  )
  
  return render(ui, { wrapper: Wrapper, ...options })
}

// Mock file creator
export const createMockFile = (name = 'test.jpg', type = 'image/jpeg') => {
  return new File(['test'], name, { type })
}

// Mock form data
export const createMockFormData = () => {
  return {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    phone: '123-456-7890',
    bio: 'Test bio',
    city: 'New York',
    country: 'USA',
    role: 'DJ'
  }
}