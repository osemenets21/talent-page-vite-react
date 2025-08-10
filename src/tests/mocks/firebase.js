export const auth = {
  currentUser: { uid: 'test-uid', email: 'test@example.com' }
}

export const signInWithEmailAndPassword = vi.fn(() => 
  Promise.resolve({ user: { uid: 'test-uid', email: 'test@example.com' } })
)

export const createUserWithEmailAndPassword = vi.fn(() => 
  Promise.resolve({ user: { uid: 'test-uid', email: 'test@example.com' } })
)

export const signOut = vi.fn(() => Promise.resolve())

export const sendPasswordResetEmail = vi.fn(() => Promise.resolve())

export const onAuthStateChanged = vi.fn((auth, callback) => {
  callback({ uid: 'test-uid', email: 'test@example.com' })
  return () => {} // unsubscribe function
})