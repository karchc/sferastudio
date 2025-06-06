/**
 * Creates a safe redirect that works in all environments including GitHub Codespaces
 * Uses client-side redirect to avoid server-side URL manipulation issues
 */
export function createSafeRedirect(path: string, request: Request): Response {
  // Parse the request URL to get the hostname
  const url = new URL(request.url)
  
  // For GitHub Codespaces, use just the hostname without port
  const baseUrl = url.hostname.includes('.github.dev')
    ? `https://${url.hostname}`
    : url.origin
    
  const redirectUrl = `${baseUrl}${path}`
  
  // Return an HTML page that does client-side redirect
  // This avoids any server-side URL manipulation issues
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>Redirecting...</title>
        <script>
          // Client-side redirect to avoid port duplication issues
          const redirectUrl = '${path}';
          window.location.href = redirectUrl;
        </script>
        <meta http-equiv="refresh" content="0; url=${path}">
      </head>
      <body>
        <p>Redirecting to <a href="${path}">${path}</a>...</p>
      </body>
    </html>
  `
  
  return new Response(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8'
    }
  })
}