import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import NotFound from '../../components/NotFound'

const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  )
}

describe('NotFound', () => {
  it('renders 404 page correctly', () => {
    renderWithRouter(<NotFound />)
    
    expect(screen.getByText('404')).toBeInTheDocument()
    expect(screen.getByText('Page not found')).toBeInTheDocument()
  })

  it('has link to go back home', () => {
    renderWithRouter(<NotFound />)
    
    // The actual text is "Back to home" not "Go back home"
    const homeLink = screen.getByText('Back to home')
    expect(homeLink).toBeInTheDocument()
    expect(homeLink.closest('a')).toHaveAttribute('href', '/')
  })

  it('displays helpful message', () => {
    renderWithRouter(<NotFound />)
    
    // Use exact text match instead of regex
    expect(screen.getByText("Sorry, we couldn't find the page you're looking for.")).toBeInTheDocument()
  })
})