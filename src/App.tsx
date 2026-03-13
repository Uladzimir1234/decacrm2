import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import ErrorBoundary from './components/ui/ErrorBoundary';
import DashboardLayout from './layouts/DashboardLayout';
import DatabaseLive from './pages/DatabaseLive';
import SellerBoard from './pages/SellerBoard';
import DealerPortal from './pages/DealerPortal';
import Login from './pages/Login';
import Settings from './pages/Settings';
import { Loader2 } from 'lucide-react';
import { Toaster } from 'sonner';

function ProtectedRoutes() {
  const { authenticated, loading, isSeller } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <Loader2 size={28} className="text-accent animate-spin" />
      </div>
    );
  }

  if (!authenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <AppProvider>
      <Routes>
        <Route element={<DashboardLayout />}>
          <Route path="/" element={
            isSeller
              ? <Navigate to="/board" replace />
              : <ErrorBoundary><DatabaseLive /></ErrorBoundary>
          } />
          <Route path="/board" element={<ErrorBoundary><SellerBoard /></ErrorBoundary>} />
          <Route path="/dealers" element={<ErrorBoundary><DealerPortal /></ErrorBoundary>} />
          <Route path="/settings" element={<ErrorBoundary><Settings /></ErrorBoundary>} />
        </Route>
      </Routes>
    </AppProvider>
  );
}

function LoginRoute() {
  const { authenticated, loading, isSeller } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <Loader2 size={28} className="text-accent animate-spin" />
      </div>
    );
  }

  if (authenticated) {
    return <Navigate to={isSeller ? '/board' : '/'} replace />;
  }

  return <Login />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginRoute />} />
          <Route path="/*" element={<ProtectedRoutes />} />
        </Routes>
      </AuthProvider>
      <Toaster position="bottom-right" richColors />
    </BrowserRouter>
  );
}
