import { useEffect, useState } from 'react';
import { authApi } from '../api';
import { useAuthStore } from '../stores/authStore';
import { toast } from '../stores/toastStore';

type Mode = 'login' | 'register' | 'forgot' | 'reset';

export default function AuthPage() {
  // URL に ?reset_token=xxx&email=yyy が乗っている場合は reset モードで起動
  const initial: { mode: Mode; token: string; email: string } = (() => {
    if (typeof window === 'undefined') return { mode: 'login', token: '', email: '' };
    const params = new URLSearchParams(window.location.search);
    const t = params.get('reset_token');
    const e = params.get('email');
    if (t && e) return { mode: 'reset', token: t, email: e };
    return { mode: 'login', token: '', email: '' };
  })();

  const [mode, setMode]   = useState<Mode>(initial.mode);
  const [token, setToken] = useState<string>(initial.token);
  const { login, register, isLoading, error, clearError } = useAuthStore();

  const [name, setName]                                 = useState('');
  const [email, setEmail]                               = useState(initial.email);
  const [password, setPassword]                         = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [busy, setBusy] = useState(false);

  // reset モードに入っていたら URL クエリは消す（token を URL に残さない）
  useEffect(() => {
    if (initial.mode === 'reset' && window.history.replaceState) {
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, [initial.mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    if (mode === 'login') {
      try { await login(email, password); }
      catch { /* store に保持 */ }
      return;
    }
    if (mode === 'register') {
      try { await register(name, email, password, passwordConfirmation); }
      catch { /* store に保持 */ }
      return;
    }
    if (mode === 'forgot') {
      setBusy(true);
      try {
        const { message } = await authApi.forgotPassword(email);
        toast.success(message);
        setMode('login');
      } catch (err: any) {
        toast.error(err.message ?? 'リセットリンク送信に失敗しました');
      } finally {
        setBusy(false);
      }
      return;
    }
    if (mode === 'reset') {
      if (password !== passwordConfirmation) {
        toast.error('パスワードが一致しません');
        return;
      }
      setBusy(true);
      try {
        const { message } = await authApi.resetPassword({
          token,
          email,
          password,
          password_confirmation: passwordConfirmation,
        });
        toast.success(message);
        setMode('login');
        setPassword('');
        setPasswordConfirmation('');
        setToken('');
      } catch (err: any) {
        toast.error(err.message ?? 'パスワードのリセットに失敗しました');
      } finally {
        setBusy(false);
      }
    }
  };

  const switchMode = (next: Mode) => {
    setMode(next);
    clearError();
  };

  const submitting = isLoading || busy;

  const submitLabel = (() => {
    if (submitting) return '処理中...';
    if (mode === 'login')    return 'ログイン';
    if (mode === 'register') return '登録する';
    if (mode === 'forgot')   return 'リセットリンクを送信';
    return 'パスワードを更新';
  })();

  const showName            = mode === 'register';
  const showPassword        = mode === 'login' || mode === 'register' || mode === 'reset';
  const showPasswordConfirm = mode === 'register' || mode === 'reset';
  const showEmailField      = true;

  return (
    <div className="auth-root">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="logo-mark">B</div>
          <span className="logo-text">家計バランスシート</span>
        </div>

        {(mode === 'login' || mode === 'register') && (
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
        )}

        {mode === 'forgot' && (
          <div className="auth-help">
            登録済みのメールアドレスを入力してください。リセット用リンクを送信します。
          </div>
        )}

        {mode === 'reset' && (
          <div className="auth-help">
            新しいパスワードを設定してください。
          </div>
        )}

        {error && <div className="auth-error">{error}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          {showName && (
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

          {showEmailField && (
            <label className="field">
              <span>メールアドレス</span>
              <input
                type="email"
                value={email}
                required
                autoComplete="email"
                onChange={e => setEmail(e.target.value)}
                placeholder="taro@example.com"
                readOnly={mode === 'reset'}
              />
            </label>
          )}

          {showPassword && (
            <label className="field">
              <span>{mode === 'reset' ? '新しいパスワード' : 'パスワード'}</span>
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
          )}

          {showPasswordConfirm && (
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

          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitLabel}
          </button>
        </form>

        {mode === 'login' && (
          <button
            type="button"
            className="auth-link"
            onClick={() => switchMode('forgot')}
          >
            パスワードを忘れた方
          </button>
        )}

        {(mode === 'forgot' || mode === 'reset') && (
          <button
            type="button"
            className="auth-link"
            onClick={() => switchMode('login')}
          >
            ← ログインに戻る
          </button>
        )}
      </div>
    </div>
  );
}
