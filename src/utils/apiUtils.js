import { getValidIdToken, refreshIdToken, clearTokens, getStoredIdToken } from './tokenManager';
import { auth } from '../firebase';


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
    } else {
  // ...removed console.warn
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
        token = await auth.currentUser.getIdToken();
      } catch (freshTokenError) {
  // ...removed console.warn
        // Fall back to stored token
      }
    } else {
  // ...removed console.log
    }
    
    let response = await makeRequest(token);
    
    // If we get 401 and haven't retried yet, try to refresh token
    if (response.status === 401 && retryCount < maxRetries) {
      retryCount++;
  // ...removed console.log
      
      try {
        // Try to refresh the token
        token = await refreshIdToken();
  // ...removed console.log
        
        // Retry the request with new token
        response = await makeRequest(token);
  // ...removed console.log
        
        if (response.status === 401) {
          // Still 401 after refresh, clear tokens and throw error
          // ...removed console.error
          clearTokens();
          throw new Error('Authentication failed - please log in again');
        }
      } catch (refreshError) {
  // ...removed console.error
        clearTokens();
        throw new Error('Authentication failed - please log in again');
      }
    }
    
    return response;
  } catch (error) {
  // ...removed console.error
    throw error;
  }
};


export const authenticatedGet = async (url, options = {}) => {
  return authenticatedFetch(url, {
    ...options,
    method: 'GET'
  });
};


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


export const authenticatedPut = async (url, data, options = {}) => {
  return authenticatedFetch(url, {
    ...options,
    method: 'PUT',
    body: JSON.stringify(data)
  });
};


export const authenticatedDelete = async (url, options = {}) => {
  return authenticatedFetch(url, {
    ...options,
    method: 'DELETE'
  });
};
