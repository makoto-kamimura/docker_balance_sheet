import { useToastStore, type ToastType } from '../stores/toastStore';

const COLORS: Record<ToastType, { bg: string; border: string; icon: string }> = {
  success: { bg: 'rgba(34, 197, 94, 0.15)',  border: '#4ade80', icon: '✓' },
  error:   { bg: 'rgba(239, 68, 68, 0.15)',  border: '#f87171', icon: '✕' },
  info:    { bg: 'rgba(59, 130, 246, 0.15)', border: '#60a5fa', icon: 'ℹ' },
};

export default function Toaster() {
  const { toasts, dismiss } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        zIndex: 9999,
        maxWidth: 360,
      }}
    >
      {toasts.map((t) => {
        const c = COLORS[t.type];
        return (
          <div
            key={t.id}
            onClick={() => dismiss(t.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '12px 16px',
              background: c.bg,
              borderLeft: `4px solid ${c.border}`,
              borderRadius: 8,
              boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
              cursor: 'pointer',
              backdropFilter: 'blur(8px)',
              color: '#f5f5f4',
              fontSize: 14,
            }}
          >
            <span style={{ color: c.border, fontWeight: 'bold', fontSize: 16 }}>{c.icon}</span>
            <span>{t.message}</span>
          </div>
        );
      })}
    </div>
  );
}
