
const BACKEND_URL = typeof (import.meta as any).env?.BACKEND_URL !== 'undefined'
  ? (import.meta as any).env.BACKEND_URL
  : (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      ? 'http://localhost:5000'
      : '');

export const apiFetch = async (endpoint: string, userEmail: string, options: RequestInit = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    'x-user-email': userEmail,
    ...(options.headers || {})
  };

  const baseUrl = BACKEND_URL || '';
  
  try {
    const response = await fetch(`${baseUrl}${endpoint}`, { ...options, headers });
    
    if (!response.ok) {
      // More specific error handling can be added here
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    // Handle responses with no content
    if (response.status === 204) {
      return null;
    }
    
    return response.json();
  } catch (err) {
    console.warn(`Backend connectivity issue:`, err);
    // Re-throw the error to be handled by the calling function
    throw err;
  }
};
