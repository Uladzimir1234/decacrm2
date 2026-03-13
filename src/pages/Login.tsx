import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Lock, User, Eye, EyeOff } from 'lucide-react';
import { login } from '../services/auth';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const navigate = useNavigate();
  const { setAuthenticated } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!username.trim() || !password.trim()) return;
    setError('');
    setLoading(true);

    const result = await login(username.trim(), password);
    if (result.success) {
      setAuthenticated(true);
      navigate('/', { replace: true });
    } else {
      setError(result.error || 'Invalid credentials');
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-sidebar-bg flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-accent/15 border border-accent/25 mb-4">
            <Lock size={24} className="text-accent-light" />
          </div>
          <h1 className="text-2xl font-bold text-sidebar-text-active tracking-tight">DECA Hub</h1>
          <p className="text-sm text-sidebar-text mt-1">Sign in to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-sidebar-hover rounded-xl p-6 space-y-5 border border-sidebar-border">
          {error && (
            <div className="bg-red-500/10 border border-red-500/25 rounded-lg px-3 py-2.5 text-sm text-red-400">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label htmlFor="username" className="text-xs font-medium text-sidebar-text uppercase tracking-wider">
              Username
            </label>
            <div className="relative">
              <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-sidebar-text" />
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoFocus
                autoComplete="username"
                className="w-full pl-10 py-2.5 bg-sidebar-bg border border-sidebar-border rounded-lg text-sm text-sidebar-text-active placeholder:text-sidebar-text focus:border-accent focus:outline-none"
                placeholder="Enter username"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="password" className="text-xs font-medium text-sidebar-text uppercase tracking-wider">
              Password
            </label>
            <div className="relative">
              <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-sidebar-text" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                className="w-full pl-10 pr-10 py-2.5 bg-sidebar-bg border border-sidebar-border rounded-lg text-sm text-sidebar-text-active placeholder:text-sidebar-text focus:border-accent focus:outline-none"
                placeholder="Enter password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-sidebar-text hover:text-sidebar-text-active transition-colors"
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !username.trim() || !password.trim()}
            className="w-full py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 bg-accent hover:bg-accent-dark text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <p className="text-center text-[10px] text-sidebar-text mt-6">
          DECA Euro Windows & Doors
        </p>
      </div>
    </div>
  );
}
