// API Configuration for React Native App
// This file centralizes API endpoint management for easy switching between environments

export const API_CONFIG = {
  // Production API - Primary endpoint
  production: 'https://queryme.in/smondoville/app',
  
  // Alternative production endpoints (if primary fails)
  alternative: 'https://api.queryme.in/smondoville/app',
  
  // Development API (local backend)
  development: 'http://localhost:5500',
  
  // Fallback API
  fallback: 'https://queryme.in/smondoville/app',
};

// Get the appropriate API URL based on environment
export const getAPIUrl = (): string => {
  // Use production API by default
  return API_CONFIG.development;
};

// Get all available endpoints for fallback
export const getEndpointFallbacks = (): string[] => {
  return [
    API_CONFIG.production,
    API_CONFIG.alternative,
    API_CONFIG.fallback,
  ].filter((url, index, self) => self.indexOf(url) === index); // Remove duplicates
};

// Test API connectivity with detailed diagnostics
export const testAPIConnectivity = async (url: string): Promise<boolean> => {
  try {
    console.log(`[Diagnostic] Testing connectivity to: ${url}`);
    const startTime = Date.now();
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });
    
    const duration = Date.now() - startTime;
    console.log(`[Diagnostic] Response received in ${duration}ms. Status: ${response.status}`);
    
    return response.ok || response.status === 404; // 404 is fine for this test
  } catch (error: any) {
    const errorMsg = error?.message || String(error);
    console.log(`[Diagnostic] API test failed for ${url}`);
    console.log(`[Diagnostic] Error: ${errorMsg}`);
    console.log(`[Diagnostic] Error type: ${error?.name || 'Unknown'}`);
    return false;
  }
};

// Test all available endpoints and return the first working one
export const findWorkingEndpoint = async (): Promise<string | null> => {
  const endpoints = getEndpointFallbacks();
  console.log(`[Diagnostic] Testing ${endpoints.length} endpoints for availability...`);
  
  for (const endpoint of endpoints) {
    console.log(`[Diagnostic] Trying endpoint: ${endpoint}`);
    const isWorking = await testAPIConnectivity(endpoint);
    if (isWorking) {
      console.log(`[Diagnostic] ✅ Found working endpoint: ${endpoint}`);
      return endpoint;
    }
    console.log(`[Diagnostic] ❌ Endpoint failed: ${endpoint}`);
  }
  
  console.log(`[Diagnostic] ❌ No working endpoints found`);
  return null;
};

// Enhanced fetch with timeout, retry, and better error handling
export const fetchWithTimeout = async (
  url: string,
  options: RequestInit = {},
  timeoutMs: number = 30000, // Increased from 15000 to 30000
  retries: number = 2
): Promise<Response> => {
  let lastError: any;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.log(`[Network] Request timeout after ${timeoutMs}ms - attempt ${attempt + 1}/${retries + 1}`);
        controller.abort();
      }, timeoutMs);

      const requestStartTime = Date.now();
      console.log(`[Network] Attempt ${attempt + 1}/${retries + 1}: Sending request to ${url}`);
      
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Connection': 'keep-alive',
          'User-Agent': 'QueryMeApp/1.0',
          ...(options.headers || {}),
        },
      });

      const requestDuration = Date.now() - requestStartTime;
      clearTimeout(timeoutId);

      console.log(`[Network] Response received in ${requestDuration}ms: Status ${response.status}`);

      if (response.ok) {
        console.log(`[Network] API request successful on attempt ${attempt + 1}`);
        return response;
      }

      // If not ok, throw error for retry logic
      lastError = new Error(`HTTP ${response.status}: ${response.statusText}`);
      
      if (response.status === 429) {
        // Rate limited - wait before retry
        const waitTime = 1000 * (attempt + 1);
        console.log(`[Network] Rate limited (429). Waiting ${waitTime}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }

      // For other client/server errors, throw immediately
      if (response.status >= 400 && response.status < 500) {
        console.log(`[Network] HTTP client error ${response.status}. Not retrying.`);
        throw lastError;
      }

      // For 5xx errors, retry
      console.log(`[Network] Server error ${response.status}. Will retry...`);
    } catch (error: any) {
      lastError = error;
      const errorName = error?.name || 'Unknown';
      const errorMsg = error?.message || 'No message';
      const errorCode = error?.code || 'N/A';
      
      console.log(`[Network] Attempt ${attempt + 1}/${retries + 1} failed:`);
      console.log(`  - Error Name: ${errorName}`);
      console.log(`  - Error Message: ${errorMsg}`);
      console.log(`  - Error Code: ${errorCode}`);
      
      // Log additional diagnostics for network errors
      if (errorName === 'TypeError' && errorMsg.includes('Network')) {
        console.log(`[Network] DIAGNOSTIC: Network request failed`);
        console.log(`[Network] This usually means:`);
        console.log(`  1. Device cannot reach the API server`);
        console.log(`  2. DNS resolution failed for the domain`);
        console.log(`  3. Firewall is blocking the connection`);
        console.log(`  4. API server is unreachable from this network`);
      }

      // If last attempt, throw error
      if (attempt === retries) {
        console.log(`[Network] All ${retries + 1} attempts failed. Throwing error.`);
        throw lastError;
      }

      // Wait before retrying (exponential backoff)
      const backoffTime = 1000 * Math.pow(2, attempt); // 1s, 2s, 4s, etc.
      console.log(`[Network] Retrying in ${backoffTime}ms... (exponential backoff)`);
      await new Promise(resolve => setTimeout(resolve, backoffTime));
    }
  }

  throw lastError;
};

export default API_CONFIG;

