/**
 * Utility functions for reliable fetching from Supabase
 */

// Retry a function with exponential backoff
export async function fetchWithRetry(fn: Function, maxRetries = 3, initialDelay = 1000) {
  let retries = 0;
  let lastError;

  while (retries < maxRetries) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      retries++;
      console.log(`Retry ${retries}/${maxRetries} after error:`, error);
      
      if (retries >= maxRetries) break;
      
      // Exponential backoff with jitter
      const delay = initialDelay * Math.pow(2, retries - 1) + Math.random() * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError || new Error('Operation failed after retries');
}

// Timeout a promise after a specified duration
export function withTimeout(promise: Promise<any>, timeoutMs: number, errorMessage = 'Operation timed out') {
  let timeoutHandle: NodeJS.Timeout;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutHandle = setTimeout(() => reject(new Error(errorMessage)), timeoutMs);
  });

  return Promise.race([
    promise,
    timeoutPromise
  ]).finally(() => {
    clearTimeout(timeoutHandle);
  });
}

// Combine retry and timeout logic
export async function fetchWithRetryAndTimeout(
  fn: Function, 
  maxRetries = 3, 
  retryDelay = 1000,
  timeoutMs = 15000
) {
  return fetchWithRetry(
    () => withTimeout(fn(), timeoutMs), 
    maxRetries, 
    retryDelay
  );
}