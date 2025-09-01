import { getValidIdToken, refreshIdToken, clearTokens, getStoredIdToken } from './tokenManager';
import { auth } from '../firebase';

/**
 * Enhanced fetch wrapper that handles authentication and automatic token refresh
 */
export const authenticatedFetch = async (url, options = {}) => {
  const maxRetries = 2;
  let retryCount = 0;
  
  const makeRequest = async (token) => {
    const headers = {
      ...options.headers
    };
    
    // Only add Content-Type if not already set and not FormData
    if (!headers['Content-Type'] && !(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
      console.log('Making request with token:', token.substring(0, 50) + '...');
    } else {
      console.warn('Making request without token');
    }
    
    return fetch(url, {
      ...options,
      headers
    });
  };
  
  try {
    // Try to get a fresh token if user is currently authenticated
    let token = getStoredIdToken();
    
    // If we have a current Firebase user, prefer getting a fresh token
    if (auth.currentUser) {
      try {
        console.log('Getting fresh token from current user...');
        token = await auth.currentUser.getIdToken();
        console.log('Got fresh token:', token.substring(0, 50) + '...');
      } catch (freshTokenError) {
        console.warn('Failed to get fresh token, using stored token:', freshTokenError);
        // Fall back to stored token
      }
    } else {
      console.log('No current user, using stored token:', token ? token.substring(0, 50) + '...' : 'No token');
    }
    
    let response = await makeRequest(token);
    console.log('First request response status:', response.status);
    
    // If we get 401 and haven't retried yet, try to refresh token
    if (response.status === 401 && retryCount < maxRetries) {
      retryCount++;
      console.log('Received 401, attempting to refresh token...');
      
      try {
        // Try to refresh the token
        token = await refreshIdToken();
        console.log('Token refreshed, retrying request...');
        
        // Retry the request with new token
        response = await makeRequest(token);
        console.log('Retry request response status:', response.status);
        
        if (response.status === 401) {
          // Still 401 after refresh, clear tokens and throw error
          console.error('Still unauthorized after token refresh');
          clearTokens();
          throw new Error('Authentication failed - please log in again');
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        clearTokens();
        throw new Error('Authentication failed - please log in again');
      }
    }
    
    return response;
  } catch (error) {
    console.error('Authenticated fetch error:', error);
    throw error;
  }
};

/**
 * Wrapper for GET requests with authentication
 */
export const authenticatedGet = async (url, options = {}) => {
  return authenticatedFetch(url, {
    ...options,
    method: 'GET'
  });
};

/**
 * Wrapper for POST requests with authentication
 */
export const authenticatedPost = async (url, data, options = {}) => {
  const isFormData = data instanceof FormData;
  
  return authenticatedFetch(url, {
    ...options,
    method: 'POST',
    body: isFormData ? data : JSON.stringify(data),
    headers: isFormData ? options.headers : {
      'Content-Type': 'application/json',
      ...options.headers
    }
  });
};

/**
 * Wrapper for PUT requests with authentication
 */
export const authenticatedPut = async (url, data, options = {}) => {
  return authenticatedFetch(url, {
    ...options,
    method: 'PUT',
    body: JSON.stringify(data)
  });
};

/**
 * Wrapper for DELETE requests with authentication
 */
export const authenticatedDelete = async (url, options = {}) => {
  return authenticatedFetch(url, {
    ...options,
    method: 'DELETE'
  });
};
