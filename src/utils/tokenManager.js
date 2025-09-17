import { auth } from "../firebase";

export const TOKEN_STORAGE_KEYS = {
  ID_TOKEN: 'firebase_id_token',
  REFRESH_TOKEN: 'firebase_refresh_token',
  TOKEN_EXPIRY: 'firebase_token_expiry'
};


export const saveTokens = async (tokenResponse) => {
  try {    
    const expiryTime = Date.now() + (60 * 60 * 1000); // 1 hour from now
    
    localStorage.setItem(TOKEN_STORAGE_KEYS.ID_TOKEN, tokenResponse.idToken);
    localStorage.setItem(TOKEN_STORAGE_KEYS.REFRESH_TOKEN, tokenResponse.refreshToken);
    localStorage.setItem(TOKEN_STORAGE_KEYS.TOKEN_EXPIRY, expiryTime.toString());
    
    
    return { idToken: tokenResponse.idToken, refreshToken: tokenResponse.refreshToken };
  } catch (error) {
  
    throw error;
  }
};


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
    throw error;
  }
};


export const getStoredIdToken = () => {
  return localStorage.getItem(TOKEN_STORAGE_KEYS.ID_TOKEN);
};


export const isTokenExpired = () => {
  const expiry = localStorage.getItem(TOKEN_STORAGE_KEYS.TOKEN_EXPIRY);
  if (!expiry) return true;
  
  return Date.now() >= parseInt(expiry);
};


export const clearTokens = () => {
  localStorage.removeItem(TOKEN_STORAGE_KEYS.ID_TOKEN);
  localStorage.removeItem(TOKEN_STORAGE_KEYS.REFRESH_TOKEN);
  localStorage.removeItem(TOKEN_STORAGE_KEYS.TOKEN_EXPIRY);
};


export const refreshIdToken = async () => {
  try {
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
  // ...removed console.error
      throw new Error('No authenticated user for token refresh');
    }
    
    const newIdToken = await currentUser.getIdToken(true);
    
    // Update stored tokens
    const expiryTime = Date.now() + (60 * 60 * 1000); // 1 hour from now
    localStorage.setItem(TOKEN_STORAGE_KEYS.ID_TOKEN, newIdToken);
    localStorage.setItem(TOKEN_STORAGE_KEYS.TOKEN_EXPIRY, expiryTime.toString());
    
    
    return newIdToken;
  } catch (error) {
    clearTokens();
    throw error;
  }
};
