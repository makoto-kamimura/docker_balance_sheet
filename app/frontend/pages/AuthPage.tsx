import { useState } from 'react';
import { useAuthStore } from '../stores/authStore';

export default function AuthPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const { login, register, isLoading, error, clearError } = useAuthStore();

  const [name, setName]                                 = useState('');
  const [email, setEmail]                               = useState('');
  const [password, setPassword]                         = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register(name, email, password, passwordConfirmation);
      }
    } catch { /* エラーは store 側で保持 */ }
  };

  const switchMode = (next: 'login' | 'register') => {
    setMode(next);
    clearError();
  };

  return (
    <div className="auth-root">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="logo-mark">B</div>
          <span className="logo-text">家計バランスシート</span>
        </div>

        <div className="auth-tabs">
          <button
            type="button"
            className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
            onClick={() => switchMode('login')}
          >
            ログイン
          </button>
          <button
            type="button"
            className={`auth-tab ${mode === 'register' ? 'active' : ''}`}
            onClick={() => switchMode('register')}
          >
            新規登録
          </button>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          {mode === 'register' && (
            <label className="field">
              <span>お名前</span>
              <input
                type="text"
                value={name}
                required
                onChange={e => setName(e.target.value)}
                placeholder="山田 太郎"
              />
            </label>
          )}

          <label className="field">
            <span>メールアドレス</span>
            <input
              type="email"
              value={email}
              required
              autoComplete="email"
              onChange={e => setEmail(e.target.value)}
              placeholder="taro@example.com"
            />
          </label>

          <label className="field">
            <span>パスワード</span>
            <input
              type="password"
              value={password}
              required
              minLength={8}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              onChange={e => setPassword(e.target.value)}
              placeholder="8文字以上"
            />
          </label>

          {mode === 'register' && (
            <label className="field">
              <span>パスワード（確認）</span>
              <input
                type="password"
                value={passwordConfirmation}
                required
                minLength={8}
                autoComplete="new-password"
                onChange={e => setPasswordConfirmation(e.target.value)}
              />
            </label>
          )}

          <button type="submit" className="btn-primary" disabled={isLoading}>
            {isLoading
              ? '処理中...'
              : mode === 'login' ? 'ログイン' : '登録する'}
          </button>
        </form>
      </div>
    </div>
  );
}
