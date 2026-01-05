
const getApiUrl = () => {
  // Safe access for Vite environment variables
  const env = (import.meta as any).env || {};
  
  // 1. Prioritize the VITE_API_URL environment variable (for Vercel/production)
  let url = env.VITE_API_URL;

  // 2. If not set, check if we are in a local development environment
  if (!url && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    url = 'http://localhost:5000';
  }

  // 3. Fallback to an empty string for same-origin requests if all else fails
  url = url || '';

  // 4. Remove trailing slash to prevent double-slash issues
  if (url.endsWith('/')) {
    url = url.slice(0, -1);
  }
  
  return url;
};

export const apiFetch = async (endpoint: string, userEmail: string, options: RequestInit = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    'x-user-email': userEmail,
    ...(options.headers || {})
  };

  const baseUrl = getApiUrl();
  
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
