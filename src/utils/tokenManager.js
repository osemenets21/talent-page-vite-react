import { auth } from "../firebase";

export const TOKEN_STORAGE_KEYS = {
  ID_TOKEN: 'firebase_id_token',
  REFRESH_TOKEN: 'firebase_refresh_token',
  TOKEN_EXPIRY: 'firebase_token_expiry'
};

/**
 * Save tokens to localStorage after successful authentication
 */
export const saveTokens = async (tokenResponse) => {
  try {    
    const expiryTime = Date.now() + (60 * 60 * 1000); // 1 hour from now
    
    localStorage.setItem(TOKEN_STORAGE_KEYS.ID_TOKEN, tokenResponse.idToken);
    localStorage.setItem(TOKEN_STORAGE_KEYS.REFRESH_TOKEN, tokenResponse.refreshToken);
    localStorage.setItem(TOKEN_STORAGE_KEYS.TOKEN_EXPIRY, expiryTime.toString());
    
    console.log('Tokens saved successfully', {
      tokenPreview: tokenResponse.idToken.substring(0, 50) + '...',
      hasRefreshToken: !!tokenResponse.refreshToken,
      expiryTime: new Date(expiryTime).toLocaleString()
    });
    return { idToken: tokenResponse.idToken, refreshToken: tokenResponse.refreshToken };
  } catch (error) {
    console.error('Error saving tokens:', error);
    throw error;
  }
};

/**
 * Get current ID token, refresh if necessary
 */
export const getValidIdToken = async () => {
  try {
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      // Wait a bit for auth state to be established
      await new Promise(resolve => setTimeout(resolve, 100));
      const retryUser = auth.currentUser;
      if (!retryUser) {
        throw new Error('No authenticated user');
      }
      return await retryUser.getIdToken(true);
    }
    
    // Force refresh to get a fresh token
    const idToken = await currentUser.getIdToken(true);
    
    // Update stored token and expiry
    const expiryTime = Date.now() + (60 * 60 * 1000); // 1 hour from now
    localStorage.setItem(TOKEN_STORAGE_KEYS.ID_TOKEN, idToken);
    localStorage.setItem(TOKEN_STORAGE_KEYS.TOKEN_EXPIRY, expiryTime.toString());
    
    return idToken;
  } catch (error) {
    console.error('Error getting valid ID token:', error);
    throw error;
  }
};

/**
 * Get stored ID token (may be expired)
 */
export const getStoredIdToken = () => {
  return localStorage.getItem(TOKEN_STORAGE_KEYS.ID_TOKEN);
};

/**
 * Check if stored token is expired
 */
export const isTokenExpired = () => {
  const expiry = localStorage.getItem(TOKEN_STORAGE_KEYS.TOKEN_EXPIRY);
  if (!expiry) return true;
  
  return Date.now() >= parseInt(expiry);
};

/**
 * Clear all stored tokens
 */
export const clearTokens = () => {
  localStorage.removeItem(TOKEN_STORAGE_KEYS.ID_TOKEN);
  localStorage.removeItem(TOKEN_STORAGE_KEYS.REFRESH_TOKEN);
  localStorage.removeItem(TOKEN_STORAGE_KEYS.TOKEN_EXPIRY);
  console.log('Tokens cleared');
};

/**
 * Refresh ID token using refresh token
 */
export const refreshIdToken = async () => {
  try {
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      console.error('No authenticated user for token refresh');
      throw new Error('No authenticated user for token refresh');
    }

    console.log('Attempting to refresh token for user:', currentUser.email);
    
    // Firebase handles refresh token automatically when we call getIdToken(true)
    const newIdToken = await currentUser.getIdToken(true);
    
    // Update stored tokens
    const expiryTime = Date.now() + (60 * 60 * 1000); // 1 hour from now
    localStorage.setItem(TOKEN_STORAGE_KEYS.ID_TOKEN, newIdToken);
    localStorage.setItem(TOKEN_STORAGE_KEYS.TOKEN_EXPIRY, expiryTime.toString());
    
    console.log('Token refreshed successfully', {
      tokenPreview: newIdToken.substring(0, 50) + '...',
      newExpiryTime: new Date(expiryTime).toLocaleString()
    });
    return newIdToken;
  } catch (error) {
    console.error('Error refreshing token:', error);
    // If refresh fails, clear tokens and redirect to login
    clearTokens();
    throw error;
  }
};
