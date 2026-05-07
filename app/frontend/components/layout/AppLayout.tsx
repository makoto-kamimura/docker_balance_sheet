import { useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import DashboardPage from '../../pages/DashboardPage';
import AssetsPage from '../../pages/AssetsPage';
import LiabilitiesPage from '../../pages/LiabilitiesPage';
import BalanceSheetPage from '../../pages/BalanceSheetPage';
import LifePlanPage from '../../pages/LifePlanPage';
import ExpensesPage from '../../pages/ExpensesPage';

type PageKey = 'dashboard' | 'assets' | 'liabilities' | 'balance-sheet' | 'life-plan' | 'expenses';

const NAV_ITEMS: { key: PageKey; label: string; icon: string }[] = [
  { key: 'dashboard',     label: 'ダッシュボード', icon: '◉' },
  { key: 'assets',        label: '資産管理',       icon: '＋' },
  { key: 'liabilities',   label: '負債管理',       icon: '－' },
  { key: 'balance-sheet', label: 'B/S レポート',    icon: '☰' },
  { key: 'life-plan',     label: 'ライフプラン',    icon: '⏱' },
  { key: 'expenses',      label: '家計簿（実績）', icon: '¥' },
];

export default function AppLayout() {
  const [page, setPage] = useState<PageKey>('dashboard');
  const { user, logout } = useAuthStore();

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-mark">B</div>
          <span className="logo-name">家計B/S</span>
        </div>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map(item => (
            <button
              key={item.key}
              className={`nav-item ${page === item.key ? 'active' : ''}`}
              onClick={() => setPage(item.key)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          {user && <div className="user-info">{user.name}</div>}
          <button className="btn-logout" onClick={logout}>ログアウト</button>
        </div>
      </aside>

      <main className="main-content">
        {page === 'dashboard'     && <DashboardPage />}
        {page === 'assets'        && <AssetsPage />}
        {page === 'liabilities'   && <LiabilitiesPage />}
        {page === 'balance-sheet' && <BalanceSheetPage />}
        {page === 'life-plan'     && <LifePlanPage />}
        {page === 'expenses'      && <ExpensesPage />}
      </main>
    </div>
  );
}
