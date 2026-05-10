import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

vi.mock('../api', () => ({
  authApi: {
    forgotPassword: vi.fn(),
    resetPassword:  vi.fn(),
  },
}));

vi.mock('../stores/authStore', () => ({
  useAuthStore: () => ({
    login:      vi.fn(),
    register:   vi.fn(),
    isLoading:  false,
    error:      null,
    clearError: vi.fn(),
  }),
}));

vi.mock('../stores/toastStore', () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

import AuthPage from '../pages/AuthPage';
import { authApi } from '../api';

describe('AuthPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // URL クエリをクリーンアップ
    window.history.replaceState(null, '', '/');
  });

  it('デフォルトでログインモードが表示される', () => {
    render(<AuthPage />);
    expect(screen.getAllByText('ログイン').length).toBeGreaterThan(0);
    expect(screen.getByText('パスワードを忘れた方')).toBeInTheDocument();
  });

  it('「パスワードを忘れた方」をクリックすると forgot モードに切り替わる', () => {
    render(<AuthPage />);
    fireEvent.click(screen.getByText('パスワードを忘れた方'));
    expect(screen.getByText('リセットリンクを送信')).toBeInTheDocument();
    expect(screen.getByText(/メールアドレスを入力してください/)).toBeInTheDocument();
  });

  it('forgot モードで送信すると authApi.forgotPassword が呼ばれる', async () => {
    (authApi.forgotPassword as any).mockResolvedValueOnce({ message: '送信しました' });
    render(<AuthPage />);
    fireEvent.click(screen.getByText('パスワードを忘れた方'));

    fireEvent.change(screen.getByPlaceholderText('taro@example.com'), {
      target: { value: 'me@example.com' },
    });
    fireEvent.click(screen.getByText('リセットリンクを送信'));

    await waitFor(() => {
      expect(authApi.forgotPassword).toHaveBeenCalledWith('me@example.com');
    });
  });

  it('URL に reset_token があると reset モードで起動する', () => {
    window.history.replaceState(null, '', '/?reset_token=abc123&email=me%40example.com');
    render(<AuthPage />);
    expect(screen.getByText('パスワードを更新')).toBeInTheDocument();
    expect((screen.getByPlaceholderText('taro@example.com') as HTMLInputElement).value).toBe('me@example.com');
  });
});
