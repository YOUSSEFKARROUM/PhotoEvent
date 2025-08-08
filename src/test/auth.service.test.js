import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getAuthToken, setAuthToken, clearAuthToken, isTokenValid } from '../utils/auth';

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

global.localStorage = mockLocalStorage;

describe('Auth Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAuthToken', () => {
    it('devrait retourner le token depuis localStorage', () => {
      const mockToken = 'mock-token-123';
      mockLocalStorage.getItem.mockReturnValue(mockToken);

      const token = getAuthToken();

      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('authToken');
      expect(token).toBe(mockToken);
    });

    it('devrait retourner null si aucun token n\'est trouvé', () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const token = getAuthToken();

      expect(token).toBeNull();
    });
  });

  describe('setAuthToken', () => {
    it('devrait sauvegarder le token dans localStorage', () => {
      const mockToken = 'new-token-456';

      setAuthToken(mockToken);

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('authToken', mockToken);
    });
  });

  describe('clearAuthToken', () => {
    it('devrait supprimer le token de localStorage', () => {
      clearAuthToken();

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('authToken');
    });
  });

  describe('isTokenValid', () => {
    it('devrait retourner false pour un token expiré', () => {
      // Token JWT avec expiration dans le passé
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiZXhwIjoxNTE2MjM5MDIyfQ.XbPfbIHMI6arZ3Y922BhjWgQzWXcXNrz0ogtVhfEd2o';

      const isValid = isTokenValid(expiredToken);

      expect(isValid).toBe(false);
    });

    it('devrait retourner false pour un token invalide', () => {
      const invalidToken = 'invalid-token';

      const isValid = isTokenValid(invalidToken);

      expect(isValid).toBe(false);
    });

    it('devrait retourner false pour un token null ou undefined', () => {
      expect(isTokenValid(null)).toBe(false);
      expect(isTokenValid(undefined)).toBe(false);
      expect(isTokenValid('')).toBe(false);
    });
  });

  describe('Token Management Integration', () => {
    it('devrait gérer le cycle complet de gestion des tokens', () => {
      const testToken = 'integration-test-token';

      // Set token
      setAuthToken(testToken);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('authToken', testToken);

      // Get token
      mockLocalStorage.getItem.mockReturnValue(testToken);
      const retrievedToken = getAuthToken();
      expect(retrievedToken).toBe(testToken);

      // Clear token
      clearAuthToken();
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('authToken');
    });
  });
});
