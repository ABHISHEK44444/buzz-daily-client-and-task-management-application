// --- IMPORTANT ---
// PASTE YOUR FULL RENDER BACKEND URL HERE.
// Example: 'https://your-backend-name.onrender.com'
// Make sure there is NO trailing slash (/) at the end.
const BACKEND_URL = 'https://buzz-daily-client-and-task-management.onrender.com'; // <-- PASTE YOUR RENDER URL HERE

const getApiUrl = () => {
  // Prioritize the hardcoded backend URL.
  if (BACKEND_URL) {
    return BACKEND_URL;
  }
  
  // Fallback to localhost for local development if the hardcoded URL is not set.
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:5000';
  }

  // If deployed without setting the URL, it will attempt same-origin requests.
  return ''; 
};

export const apiFetch = async (endpoint: string, userEmail?: string, options: RequestInit = {}) => {
  // FIX: Use the Headers API to correctly handle various HeadersInit types (Headers, string[][], Record<string, string>).
  // The previous implementation with object spreading was incorrect for Headers objects and string arrays.
  const headers = new Headers(options.headers);

  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (userEmail) {
    headers.set('x-user-email', userEmail);
  }

  const baseUrl = getApiUrl();
  
  // Fail-fast check to ensure the backend URL is configured for deployed environments.
  if (!baseUrl && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    const errorMsg = "Backend URL is not configured. Please paste your Render URL into the BACKEND_URL variable in services/api.ts.";
    console.error(`❌ CONFIGURATION ERROR: ${errorMsg}`);
    // Throwing an error here will trigger the offline mode banner with a clear cause.
    throw new Error(errorMsg);
  }

  try {
    const response = await fetch(`${baseUrl}${endpoint}`, { ...options, headers });
    
    const responseText = await response.text(); // Read as text first to handle non-JSON responses gracefully

    if (!response.ok) {
      // Attempt to parse error as JSON, but fall back to the raw text
      try {
        const errorJson = JSON.parse(responseText);
        throw new Error(errorJson.error || `API request failed with status ${response.status}`);
      } catch (e) {
        // The error response wasn't JSON. Throw the raw text.
        throw new Error(responseText || `API request failed with status ${response.status}`);
      }
    }
    
    // Handle responses with no content
    if (response.status === 204 || !responseText) {
      return null;
    }
    
    // Safely parse the success response
    return JSON.parse(responseText);
  } catch (err) {
    console.warn(`Backend connectivity issue:`, err);
    // Re-throw the error to be handled by the calling function
    throw err;
  }
};
