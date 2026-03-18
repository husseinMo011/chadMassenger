// authService.test.js
// Unit tests for src/services/authService.js
// Framework: Jest with mocked apiClient (Axios instance)

import { login, signup, logout, getUserInfo, updateProfile } from '../services/authService';

// Mock the apiClient module so no real HTTP requests are made
jest.mock('../services/apiClient', () => ({
  __esModule: true,
  default: {
    post: jest.fn(),
    get: jest.fn(),
  },
}));

import apiClient from '../services/apiClient';

// Clear all mocks between tests
beforeEach(() => {
  jest.clearAllMocks();
});

// ─── 3.1.1 Successful Login ───────────────────────────────────────────────────
describe('authService.login', () => {
  test('3.1.1 - sends POST to /api/auth/login and returns user data on success', async () => {
    // Arrange
    const mockUser = { email: 'test@test.com', firstName: 'Test' };
    apiClient.post.mockResolvedValue({ data: { user: mockUser } });

    // Action
    const result = await login('test@test.com', 'Password123');

    // Assert
    expect(apiClient.post).toHaveBeenCalledWith('/api/auth/login', {
      email: 'test@test.com',
      password: 'Password123',
    });
    expect(result.user).toEqual(mockUser);
  });

  // ─── 3.1.2 Login with Invalid Credentials ──────────────────────────────────
  test('3.1.2 - throws error with status 401 when credentials are invalid', async () => {
    // Arrange
    const error = { response: { status: 401, data: { message: 'Invalid credentials' } } };
    apiClient.post.mockRejectedValue(error);

    // Action & Assert
    await expect(login('wrong@test.com', 'badpass')).rejects.toMatchObject({
      response: { status: 401 },
    });
  });
});

// ─── 3.1.3 Successful Signup ──────────────────────────────────────────────────
describe('authService.signup', () => {
  test('3.1.3 - sends POST to /api/auth/signup and returns created user', async () => {
    // Arrange
    const mockUser = { email: 'new@test.com' };
    apiClient.post.mockResolvedValue({ data: { user: mockUser } });

    // Action
    const result = await signup('new@test.com', 'SecurePass1');

    // Assert
    expect(apiClient.post).toHaveBeenCalledWith('/api/auth/signup', {
      email: 'new@test.com',
      password: 'SecurePass1',
    });
    expect(result.user.email).toBe('new@test.com');
  });
});

// ─── 3.1.4 Logout ─────────────────────────────────────────────────────────────
describe('authService.logout', () => {
  test('3.1.4 - sends POST to /api/auth/logout and returns success message', async () => {
    // Arrange
    apiClient.post.mockResolvedValue({ data: { message: 'Logged out' } });

    // Action
    const result = await logout();

    // Assert
    expect(apiClient.post).toHaveBeenCalledWith('/api/auth/logout');
    expect(result.message).toBe('Logged out');
  });
});

// ─── updateProfile ─────────────────────────────────────────────────────────────
describe('authService.updateProfile', () => {
  test('sends POST to /api/auth/update-profile with firstName and lastName', async () => {
    // Arrange
    apiClient.post.mockResolvedValue({ data: { user: { firstName: 'Nimo', lastName: 'Al-Azzawi' } } });

    // Action
    await updateProfile('Nimo', 'Al-Azzawi', null);

    // Assert
    expect(apiClient.post).toHaveBeenCalledWith('/api/auth/update-profile', {
      firstName: 'Nimo',
      lastName: 'Al-Azzawi',
    });
  });
});
