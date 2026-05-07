import { useAuthStore } from './stores/authStore';
import AuthPage from './pages/AuthPage';
import AppLayout from './components/layout/AppLayout';
import Toaster from './components/Toaster';
import './styles.css';

export default function App() {
  const { token } = useAuthStore();
  return (
    <>
      {token ? <AppLayout /> : <AuthPage />}
      <Toaster />
    </>
  );
}
