
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
