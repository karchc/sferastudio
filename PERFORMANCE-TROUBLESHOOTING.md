# Performance Troubleshooting Guide

## Slow Loading Issues

If the application loads slowly in your regular browser but fast in incognito/new browsers, this indicates cache corruption or stale service worker data.

### Quick Fixes

#### 1. **Automatic Cache Clearing**
Visit: `http://localhost:3005/clear-cache`
- This page automatically clears localStorage, sessionStorage, and browser cache
- Redirects to homepage after clearing

#### 2. **Manual Browser Cache Clearing**
- **Chrome/Edge**: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
- **Firefox**: Ctrl+F5 (Windows) or Cmd+Shift+R (Mac)
- Or open Developer Tools → Application → Clear Storage → Clear all

#### 3. **Console Debug Commands**
Open browser console and run:
```javascript
// Clear cache and reload
window.debugHomepage.clearCache()

// Check current state
window.debugHomepage.currentState

// Manually reload data
window.debugHomepage.reloadData()
```

### Performance Monitoring

The homepage now includes detailed console logging:
- 🚀 Data load start
- 🔐 Session retrieval time
- 📚 Tests fetch time
- 🏁 Total load time

### Common Causes

1. **Stale Service Workers**: Clear cache or use incognito mode
2. **Corrupted localStorage**: Use `/clear-cache` page
3. **Multiple Supabase clients**: Fixed in latest version
4. **Cache headers**: Added cache-busting headers

### Image Issues

Logo expansion issues have been fixed with:
- Fixed height: `h-8 w-auto`
- Reduced hover scale: `scale-105` instead of `scale-110`
- Priority loading for LCP optimization

### If Issues Persist

1. Try incognito/private browsing mode
2. Clear browser data completely
3. Check network tab in DevTools for slow requests
4. Look for console errors
5. Use the debug tools mentioned above