/**
 * Creates a redirect response that properly handles GitHub Codespaces URLs
 * Codespaces URLs already include the port in the subdomain, so we need to avoid adding it again
 */
export function createRedirect(path: string, request: Request): Response {
  // Get the host header - this should be the correct hostname without port duplication
  const hostHeader = request.headers.get('host')
  
  // Parse the request URL
  const url = new URL(request.url)
  
  // Determine the correct base URL
  let baseUrl: string
  
  // For GitHub Codespaces, we need special handling
  if (url.hostname.includes('.github.dev')) {
    // The hostname already includes the port number in the subdomain
    // e.g., curly-fiesta-9v44gx5rwxq295wv-3000.app.github.dev
    // So we should use just the protocol and hostname, no port
    
    if (hostHeader && !hostHeader.includes(':3000')) {
      // If we have a clean host header, use it
      baseUrl = `${url.protocol}//${hostHeader}`
    } else {
      // Otherwise, extract just the hostname
      baseUrl = `${url.protocol}//${url.hostname}`
    }
  } else {
    // For non-Codespaces environments, use the standard origin
    baseUrl = url.origin
  }
  
  const redirectUrl = `${baseUrl}${path}`
  
  console.log('[Redirect Debug]', {
    requestUrl: request.url,
    hostHeader,
    hostname: url.hostname,
    port: url.port,
    origin: url.origin,
    baseUrl,
    path,
    redirectUrl
  })
  
  // Create a manual redirect response
  return new Response(null, {
    status: 302,
    headers: {
      'Location': redirectUrl
    }
  })
}