import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent, screen } from '@testing-library/react';
import LoginForm from '../components/LoginForm';

vi.mock('axios');

describe('LoginForm Component', () => {
  it('renders the login form', () => {
    render(<LoginForm />);
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
  });

  it('submits the form with email and password', async () => {
    const mockLogin = vi.fn();

    render(<LoginForm login={mockLogin} />);

    fireEvent.change(screen.getByLabelText(/Email/i), {
      target: { value: 'test@example.com' }
    });

    fireEvent.change(screen.getByLabelText(/Password/i), {
      target: { value: 'password' }
    });

    fireEvent.click(screen.getByRole('button', { name: /Login/i }));

    expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password');
  });

  it('shows error on failed login attempt', async () => {
    render(<LoginForm />);

    fireEvent.change(screen.getByLabelText(/Email/i), {
      target: { value: 'fail@example.com' }
    });

    fireEvent.change(screen.getByLabelText(/Password/i), {
      target: { value: 'wrongpassword' }
    });

    fireEvent.click(screen.getByRole('button', { name: /Login/i }));

    const errorMessage = await screen.findByText(/Invalid credentials/i);
    expect(errorMessage).toBeInTheDocument();
  });
});
