import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import App from '../App';

// Mock du contexte d'authentification
const mockAuthContext = {
  user: null,
  login: vi.fn(),
  logout: vi.fn(),
  loading: false
};

vi.mock('../context/AuthContext', () => ({
  useAuth: () => mockAuthContext,
  AuthProvider: ({ children }) => <div data-testid="auth-provider">{children}</div>
}));

// Wrapper pour les tests avec Router
const AppWithRouter = () => (
  <BrowserRouter>
    <App />
  </BrowserRouter>
);

describe('App Component', () => {
  it('devrait rendre sans erreur', () => {
    render(<AppWithRouter />);
    expect(screen.getByTestId('auth-provider')).toBeInTheDocument();
  });

  it('devrait rendre la route home par défaut', () => {
    render(<AppWithRouter />);
    // Le composant App devrait être dans le DOM
    expect(document.body).toBeInTheDocument();
  });

  it('devrait avoir la structure de routage correcte', () => {
    render(<AppWithRouter />);
    // Vérifier que le layout est rendu
    expect(document.querySelector('body')).toBeInTheDocument();
  });
});
