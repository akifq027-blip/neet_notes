import React, { useState } from 'react';
import {
  X,
  Lock,
  Mail,
  User,
  Phone,
  ShieldCheck,
  ArrowRight,
  Eye,
  EyeOff,
} from 'lucide-react';
import { api } from '../services/api';
import { User as UserType } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register' | 'admin';
  onAuthSuccess: (user: UserType, token: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'login',
  onAuthSuccess,
}) => {
  const [mode, setMode] = useState<'login' | 'register' | 'admin'>(
    initialMode
  );

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  React.useEffect(() => {
    setMode(initialMode);
    setErrorMessage('');
    setEmail('');
    setPassword('');
    setName('');
    setPhone('');
  }, [initialMode, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsLoading(true);
    setErrorMessage('');

    try {
      if (mode === 'register') {
        const res = await api.register({
          name,
          email,
          password,
          phone,
        });

        if (res.success && res.token && res.user) {
          localStorage.setItem('neet_auth_token', res.token);

          onAuthSuccess(res.user, res.token);
          onClose();
        } else {
          setErrorMessage(res.message || 'Registration failed.');
        }
      } else if (mode === 'login') {
        const res = await api.login({
          email,
          password,
        });

        if (res.success && res.token && res.user) {
          localStorage.setItem('neet_auth_token', res.token);

          onAuthSuccess(res.user, res.token);
          onClose();
        } else {
          setErrorMessage(res.message || 'Invalid credentials.');
        }
      } else if (mode === 'admin') {
        const res = await api.adminLogin({
          email,
          password,
        });

        if (res.success && res.token && res.user) {
          localStorage.setItem('neet_auth_token', res.token);

          onAuthSuccess(res.user, res.token);
          onClose();
        } else {
          setErrorMessage(
            res.message || 'Invalid administrator credentials.'
          );
        }
      }
    } catch (err: any) {
      console.error('[Authentication Error]', err);

      setErrorMessage(
        err?.message || 'Authentication request failed. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const switchMode = (
    newMode: 'login' | 'register' | 'admin'
  ) => {
    setMode(newMode);
    setErrorMessage('');
    setEmail('');
    setPassword('');
    setName('');
    setPhone('');
    setShowPassword(false);
  };

  return (
    <div className="fixed inset-0 z-[70] overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">

        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {mode === 'admin' ? (
              <ShieldCheck className="w-5 h-5 text-amber-400" />
            ) : (
              <User className="w-5 h-5 text-emerald-400" />
            )}

            <h2 className="text-base font-bold">
              {mode === 'login' && 'Student Account Login'}
              {mode === 'register' && 'Create Student Account'}
              {mode === 'admin' && 'Faculty & Admin Portal'}
            </h2>
          </div>

          <button
            id="close-auth-modal-btn"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            type="button"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-bold">

          {/* Student Login */}
          <button
            id="tab-login"
            type="button"
            onClick={() => switchMode('login')}
            className={`flex-1 py-3 text-center transition-colors cursor-pointer ${
              mode === 'login'
                ? 'bg-white text-emerald-700 border-b-2 border-emerald-600'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Sign In
          </button>

          {/* Register */}
          <button
            id="tab-register"
            type="button"
            onClick={() => switchMode('register')}
            className={`flex-1 py-3 text-center transition-colors cursor-pointer ${
              mode === 'register'
                ? 'bg-white text-emerald-700 border-b-2 border-emerald-600'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Register
          </button>

          {/* Admin */}
          <button
            id="tab-admin"
            type="button"
            onClick={() => switchMode('admin')}
            className={`flex-1 py-3 text-center transition-colors cursor-pointer ${
              mode === 'admin'
                ? 'bg-white text-amber-700 border-b-2 border-amber-600'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Faculty Admin
          </button>
        </div>

        {/* Form Body */}
        <form
          onSubmit={handleSubmit}
          className="p-6 space-y-4"
        >

          {/* Admin Information */}
          {mode === 'admin' && (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs p-3 rounded-xl">
              <strong>Faculty & Administrator Access</strong>

              <p className="text-[11px] text-amber-700 mt-1">
                Authorized faculty and administrators only.
              </p>
            </div>
          )}

          {/* Name - Register Only */}
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Full Name
              </label>

              <div className="relative">
                <input
                  id="auth-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Aarav Sharma"
                  className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                />

                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>
          )}

          {/* Email */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Email Address
            </label>

            <div className="relative">
              <input
                id="auth-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={
                  mode === 'admin'
                    ? 'admin@example.com'
                    : 'student@example.com'
                }
                autoComplete="email"
                className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
              />

              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          {/* Phone - Register Only */}
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Mobile Phone (Optional for SMS)
              </label>

              <div className="relative">
                <input
                  id="auth-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  autoComplete="tel"
                  className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                />

                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>
          )}

          {/* Password */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Password
            </label>

            <div className="relative">
              <input
                id="auth-password"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete={
                  mode === 'register'
                    ? 'new-password'
                    : 'current-password'
                }
                className="w-full text-xs pl-9 pr-10 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
              />

              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                aria-label={
                  showPassword
                    ? 'Hide password'
                    : 'Show password'
                }
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Error */}
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium">
              {errorMessage}
            </div>
          )}

          {/* Submit */}
          <button
            id="auth-submit-btn"
            type="submit"
            disabled={isLoading}
            className={`w-full text-white font-bold py-3 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer text-xs sm:text-sm ${
              mode === 'admin'
                ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/20'
                : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
            } ${
              isLoading
                ? 'opacity-70 cursor-not-allowed'
                : ''
            }`}
          >
            {isLoading ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>
                  {mode === 'login' &&
                    'Sign In to My Account'}

                  {mode === 'register' &&
                    'Create Free Account'}

                  {mode === 'admin' &&
                    'Enter Admin Dashboard'}
                </span>

                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          {/* Security Notice */}
          <p className="text-[11px] text-center text-slate-400 pt-2">
            Secured with bcrypt password hashing & MySQL persistent tokens.
          </p>
        </form>
      </div>
    </div>
  );
};
