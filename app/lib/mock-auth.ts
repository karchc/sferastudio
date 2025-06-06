// Mock auth utilities for bypassing authentication

// Mock user for authentication bypass
export const mockUser = {
  id: 'mock-user-id',
  email: 'test@example.com',
  user_metadata: {
    name: 'Test User',
  },
  role: 'authenticated',
  app_metadata: {
    provider: 'bypass',
    is_admin: true,
  },
};

// Mock session for authentication bypass
export const mockSession = {
  access_token: 'mock-access-token',
  refresh_token: 'mock-refresh-token',
  expires_in: 3600,
  expires_at: Date.now() + 3600000,
  token_type: 'bearer',
  user: mockUser,
};

// Mock auth response
export const mockAuthResponse = {
  data: {
    session: mockSession,
    user: mockUser,
  },
  error: null,
};