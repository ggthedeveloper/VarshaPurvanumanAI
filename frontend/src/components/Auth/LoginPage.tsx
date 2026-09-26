import React, { useState } from 'react';
import {
  CloudRain,
  ShieldCheck,
  Lock,
  User,
  Mail,
  Shield,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  UserPlus,
} from 'lucide-react';
import { api } from '../../api/client';
import { UserProfile } from '../../types/api';
import { LiveWeatherBackground } from '../Weather/LiveWeatherBackground';

interface LoginPageProps {
  onLoginSuccess: (user: UserProfile) => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  onBackToLanding?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onLoginSuccess,
  isDarkMode,
  onToggleTheme,
  onBackToLanding,
}) => {
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  // Sign In state
  const [username, setUsername] = useState('Gaurav');
  const [password, setPassword] = useState('Varsha@SIH2026');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Register state
  const [regName, setRegName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState('Meteorological Analyst');

  // Status & loading
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showGoogleModal, setShowGoogleModal] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const resp = await api.login({ username, password });
      onLoginSuccess(resp.user);
    } catch (err: any) {
      setError(
        err.message || 'Invalid username or password. You can also use Quick Demo Access.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim() || !regUsername.trim() || !regPassword.trim()) {
      setError('Please fill in your name, username, and password.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const resp = await api.register({
        name: regName.trim(),
        username: regUsername.trim(),
        email: regEmail.trim() || undefined,
        password: regPassword,
        role: regRole,
      });
      onLoginSuccess(resp.user);
    } catch (err: any) {
      setError(err.message || 'Registration failed. Username may already exist.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async (googleEmail?: string, googleName?: string) => {
    setIsLoading(true);
    setError(null);
    setShowGoogleModal(false);

    try {
      const email = googleEmail || 'ggraipurchor@gmail.com';
      const name = googleName || 'Gaurav Gautam';
      const resp = await api.googleLogin({
        email,
        name,
        avatar_url: undefined,
      });
      onLoginSuccess(resp.user);
    } catch (err: any) {
      setError(err.message || 'Google sign-in failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemo = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const resp = await api.demoLogin();
      onLoginSuccess(resp.user);
    } catch (err: any) {
      const fallbackUser: UserProfile = {
        username: 'Gaurav',
        name: 'Gaurav Gautam',
        role: 'Chief Meteorological Officer',
        email: 'ggraipurchor@gmail.com',
        is_demo: true,
      };
      api.setToken('demo_session_token_varsha');
      localStorage.setItem('auth_user', JSON.stringify(fallbackUser));
      onLoginSuccess(fallbackUser);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-center items-center text-slate-100 relative overflow-hidden px-4 py-8">
      {/* Live Atmospheric Weather Canvas Background */}
      <LiveWeatherBackground fixed={true} isDarkMode={true} opacity={0.92} />

      {/* Atmospheric Ambient Glows */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-amber-600/20 rounded-full blur-3xl pointer-events-none" />

      {onBackToLanding && (
        <button
          onClick={onBackToLanding}
          className="relative z-20 mb-4 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-slate-900/60 hover:bg-slate-900/80 text-slate-300 border border-white/10 backdrop-blur-md transition flex items-center space-x-1.5 cursor-pointer shadow-lg"
        >
          <span>← Back to Operational Overview</span>
        </button>
      )}

      {/* Top Header Badge */}
      <div className="relative z-10 mb-6 flex flex-col items-center text-center space-y-2 max-w-lg">
        <div className="flex items-center space-x-2 px-3.5 py-1 rounded-full bg-white/10 border border-white/15 text-indigo-200 text-xs font-semibold backdrop-blur-md shadow-sm">
          <ShieldCheck className="h-3.5 w-3.5 text-indigo-400" />
          <span>MoES / IMD Meteorological Intelligence</span>
        </div>

        <div className="flex items-center space-x-3 mt-2">
          <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-indigo-500 to-sky-400 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <CloudRain className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white drop-shadow-sm">
            VarshaPurvanuman AI
          </h1>
        </div>

        <p className="text-xs sm:text-sm text-slate-300 drop-shadow-xs">
          Regime-Aware AI Post-Processing of Monsoon Rainfall Forecasts
        </p>
      </div>

      {/* Auth Card */}
      <div className="relative z-10 w-full max-w-md bg-slate-900/75 backdrop-blur-xl border border-white/15 rounded-3xl shadow-2xl p-6 sm:p-8 space-y-5">
        {/* Header & Tabs */}
        <div>
          <div className="flex items-center justify-between pb-3">
            <h2 className="text-lg font-bold text-white flex items-center space-x-2">
              <Lock className="h-4 w-4 text-indigo-400" />
              <span>Platform Access</span>
            </h2>
            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Operational Gate
            </span>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-2 gap-1 p-1 bg-slate-950/50 rounded-xl border border-white/10 text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setAuthMode('login');
                setError(null);
              }}
              className={`py-1.5 rounded-lg transition cursor-pointer ${
                authMode === 'login'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('register');
                setError(null);
              }}
              className={`py-1.5 rounded-lg transition cursor-pointer flex items-center justify-center space-x-1 ${
                authMode === 'register'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <UserPlus className="h-3.5 w-3.5 mr-1" />
              <span>Register</span>
            </button>
          </div>
        </div>

        {/* Google SSO Login */}
        <button
          type="button"
          onClick={() => setShowGoogleModal(true)}
          disabled={isLoading}
          className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 text-slate-800 font-semibold text-xs sm:text-sm rounded-xl border border-slate-200 shadow-sm transition flex items-center justify-center space-x-2.5 cursor-pointer disabled:opacity-50"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Continue with Google</span>
        </button>

        <div className="relative flex py-0.5 items-center">
          <div className="flex-grow border-t border-slate-700/60" />
          <span className="flex-shrink mx-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            or with credentials
          </span>
          <div className="flex-grow border-t border-slate-700/60" />
        </div>

        {error && (
          <div className="flex items-start space-x-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Tab 1: Sign In Form */}
        {authMode === 'login' ? (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Username / Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Gaurav"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-950/60 border border-slate-700 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-10 py-2.5 bg-slate-950/60 border border-slate-700 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center space-x-2 text-slate-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-slate-700 text-indigo-600 focus:ring-0"
                />
                <span>Remember session</span>
              </label>
              <span className="text-[11px] text-slate-400 font-mono">Pre-configured Access</span>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-indigo-600/30 transition transform hover:-translate-y-0.5 cursor-pointer flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {isLoading ? (
                <span>Authenticating...</span>
              ) : (
                <>
                  <span>Sign In to Dashboard</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        ) : (
          /* Tab 2: Register Form */
          <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Full Display Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  required
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="e.g. Gaurav Gautam"
                  className="w-full pl-9 pr-3 py-2 bg-slate-950/60 border border-slate-700 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  required
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value)}
                  placeholder="e.g. gaurav"
                  className="w-full px-3 py-2 bg-slate-950/60 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Email (Optional)
                </label>
                <input
                  type="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="name@imd.gov.in"
                  className="w-full px-3 py-2 bg-slate-950/60 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Operational Role
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Shield className="h-4 w-4" />
                </div>
                <select
                  value={regRole}
                  onChange={(e) => setRegRole(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-950/60 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 transition cursor-pointer"
                >
                  <option value="Chief Meteorological Officer">Chief Meteorological Officer</option>
                  <option value="Senior Monsoon Forecaster">Senior Monsoon Forecaster</option>
                  <option value="Meteorological Analyst">Meteorological Analyst</option>
                  <option value="Disaster Management Authority">Disaster Management Authority</option>
                  <option value="Agricultural Resilience Planner">Agricultural Resilience Planner</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full pl-9 pr-10 py-2 bg-slate-950/60 border border-slate-700 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-indigo-600/30 transition transform hover:-translate-y-0.5 cursor-pointer flex items-center justify-center space-x-2 disabled:opacity-50 mt-2"
            >
              {isLoading ? (
                <span>Registering Account...</span>
              ) : (
                <>
                  <UserPlus className="h-4 w-4" />
                  <span>Create Account & Enter Dashboard</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* Quick Demo Access Button */}
        <div className="pt-2 border-t border-slate-700/60">
          <button
            type="button"
            onClick={handleQuickDemo}
            disabled={isLoading}
            className="w-full py-2.5 px-4 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 font-bold text-xs sm:text-sm rounded-xl transition cursor-pointer flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            <Sparkles className="h-4 w-4 text-emerald-400" />
            <span>Quick Demo Access</span>
          </button>
        </div>
      </div>

      {/* Google Account Chooser Modal */}
      {showGoogleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 text-slate-900 dark:text-white">
            <div className="text-center space-y-1">
              <svg className="h-8 w-8 mx-auto" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <h3 className="text-base font-bold">Sign in with Google</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Choose an account to continue to VarshaPurvanuman AI
              </p>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => handleGoogleLogin('ggraipurchor@gmail.com', 'Gaurav Gautam')}
                className="w-full p-3 rounded-2xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/80 flex items-center space-x-3 text-left transition cursor-pointer"
              >
                <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-indigo-500 to-sky-400 flex items-center justify-center text-white font-bold text-sm">
                  G
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold truncate">Gaurav Gautam</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    ggraipurchor@gmail.com
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleGoogleLogin('forecaster@imd.gov.in', 'Dr. S. K. Raman')}
                className="w-full p-3 rounded-2xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/80 flex items-center space-x-3 text-left transition cursor-pointer"
              >
                <div className="h-9 w-9 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-sm">
                  S
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold truncate">Dr. S. K. Raman</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    forecaster@imd.gov.in
                  </div>
                </div>
              </button>
            </div>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => setShowGoogleModal(false)}
                className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-semibold cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer Info */}
      <div className="relative z-10 mt-6 text-center space-y-1">
        <div className="flex items-center justify-center space-x-2 text-[11px] text-slate-300">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
          <span>Ministry of Earth Sciences (MoES) / IMD Monsoon Benchmark</span>
        </div>
        <p className="text-[10px] text-slate-400">
          Verified IMD 0.25° Gridded Rainfall & NOAA GFS 0.25° Atmospheric Dataset
        </p>
      </div>
    </div>
  );
};
