import { beforeAll, afterEach, afterAll } from 'vitest'
import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom'

// Mock Firebase
beforeAll(() => {
  global.ResizeObserver = class ResizeObserver {
    constructor(cb) {
      this.cb = cb
    }
    observe() {}
    unobserve() {}
    disconnect() {}
  }

  // Mock fetch
  global.fetch = vi.fn()

  // Mock URL.createObjectURL
  global.URL.createObjectURL = vi.fn(() => 'mocked-url')
  global.URL.revokeObjectURL = vi.fn()
})

// Cleanup after each test
afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})