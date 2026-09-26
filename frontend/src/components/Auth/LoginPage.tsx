import React, { useState } from 'react';
import {
  CloudRain,
  ShieldCheck,
  Award,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
  AlertCircle,
  CheckCircle2,
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
  const [username, setUsername] = useState('Gaurav');
  const [password, setPassword] = useState('Varsha@SIH2026');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
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

  const handleQuickDemo = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const resp = await api.demoLogin();
      onLoginSuccess(resp.user);
    } catch (err: any) {
      // Fallback local session if backend auth route is momentarily unavailable
      const fallbackUser: UserProfile = {
        username: 'Gaurav',
        name: 'Gaurav Gautam',
        role: 'Lead Meteorologist',
        is_demo: true,
      };
      api.setToken('demo_session_token_sih26080');
      localStorage.setItem('auth_user', JSON.stringify(fallbackUser));
      onLoginSuccess(fallbackUser);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-center items-center bg-slate-900 text-slate-100 relative overflow-hidden px-4 py-8">
      {/* Live Atmospheric Weather Canvas Background */}
      <LiveWeatherBackground fixed={true} isDarkMode={true} opacity={0.35} />

      {/* Background Radial Glow */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-emerald-600/20 rounded-full blur-3xl pointer-events-none" />

      {onBackToLanding && (
        <button
          onClick={onBackToLanding}
          className="relative z-20 mb-4 px-3 py-1.5 rounded-full text-xs font-semibold bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 transition flex items-center space-x-1.5 cursor-pointer"
        >
          <span>← Back to Interactive Showcase</span>
        </button>
      )}

      {/* Top Header Badge */}
      <div className="relative z-10 mb-6 flex flex-col items-center text-center space-y-2 max-w-lg">
        <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-400/30 text-indigo-300 text-xs font-semibold">
          <ShieldCheck className="h-3.5 w-3.5 text-indigo-400" />
          <span>MoES / IMD Meteorological Intelligence</span>
        </div>

        <div className="flex items-center space-x-3 mt-2">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-sky-400 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <CloudRain className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            VarshaPurvanuman AI
          </h1>
        </div>

        <p className="text-xs sm:text-sm text-slate-400">
          Regime-Aware AI Post-Processing of Monsoon Rainfall Forecasts
        </p>
      </div>

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md bg-slate-800/90 backdrop-blur-md border border-slate-700/80 rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6">
        <div className="border-b border-slate-700/60 pb-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center space-x-2">
              <Lock className="h-4 w-4 text-indigo-400" />
              <span>Platform Access</span>
            </h2>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Interactive Demo
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Sign in with operational credentials or launch instant demo session.
          </p>
        </div>

        {error && (
          <div className="flex items-start space-x-2 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Username / Evaluator ID
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
                className="w-full pl-9 pr-3 py-2 bg-slate-900/80 border border-slate-700 rounded-lg text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
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
                className="w-full pl-9 pr-10 py-2 bg-slate-900/80 border border-slate-700 rounded-lg text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
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
            <span className="text-[11px] text-slate-500 font-mono">Pre-configured Access</span>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm rounded-lg shadow-lg shadow-indigo-600/30 transition transform hover:-translate-y-0.5 cursor-pointer flex items-center justify-center space-x-2 disabled:opacity-50"
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

        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-slate-700/80" />
          <span className="flex-shrink mx-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            or instant evaluation
          </span>
          <div className="flex-grow border-t border-slate-700/80" />
        </div>

        {/* Quick Demo Access Button */}
        <button
          type="button"
          onClick={handleQuickDemo}
          disabled={isLoading}
          className="w-full py-2.5 px-4 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 font-bold text-xs sm:text-sm rounded-lg transition cursor-pointer flex items-center justify-center space-x-2 disabled:opacity-50"
        >
          <Sparkles className="h-4 w-4 text-emerald-400" />
          <span>Quick Demo Access</span>
        </button>
      </div>

      {/* Footer Info */}
      <div className="relative z-10 mt-6 text-center space-y-1">
        <div className="flex items-center justify-center space-x-2 text-[11px] text-slate-400">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
          <span>Ministry of Earth Sciences (MoES) / IMD Monsoon Benchmark</span>
        </div>
        <p className="text-[10px] text-slate-500">
          Verified IMD 0.25° Gridded Rainfall & NOAA GFS 0.25° Atmospheric Dataset
        </p>
      </div>
    </div>
  );
};
