import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { BrainCircuit, Eye, EyeOff, Loader2, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const InputField = ({ id, label, type = 'text', value, onChange, error, placeholder, autoComplete }: any) => (
  <div>
    <label htmlFor={id} className="block text-sm font-medium text-zinc-300 mb-1.5">{label}</label>
    <input
      id={id} type={type} value={value} onChange={onChange}
      placeholder={placeholder} autoComplete={autoComplete}
      className={`w-full px-4 py-3 rounded-xl text-white placeholder-zinc-600 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all caret-indigo-400 ${
        error ? 'bg-red-500/5 border border-red-500/40' : 'bg-white/5 border border-white/10 hover:border-white/20'
      }`}
    />
    {error && <p className="text-red-400 text-xs mt-1.5">{error}</p>}
  </div>
);

const PasswordField = ({ id, label, value, onChange, error, placeholder, showPass, onToggle }: any) => (
  <div>
    <label htmlFor={id} className="block text-sm font-medium text-zinc-300 mb-1.5">{label}</label>
    <div className="relative">
      <input
        id={id} type={showPass ? 'text' : 'password'} value={value} onChange={onChange}
        placeholder={placeholder} autoComplete="current-password"
        className={`w-full px-4 py-3 pr-11 rounded-xl text-white placeholder-zinc-600 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all caret-indigo-400 ${
          error ? 'bg-red-500/5 border border-red-500/40' : 'bg-white/5 border border-white/10 hover:border-white/20'
        }`}
      />
      <button type="button" onClick={onToggle} tabIndex={-1}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors">
        {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
    {error && <p className="text-red-400 text-xs mt-1.5">{error}</p>}
  </div>
);

const AuthPage = ({ mode }: { mode: 'login' | 'signup' }) => {
  const { login, signup } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from?.pathname || '/dashboard';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!email) e.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Invalid email';
    if (mode === 'signup' && !name.trim()) e.name = 'Name is required';
    if (!password) e.password = 'Password is required';
    else if (mode === 'signup' && password.length < 6) e.password = 'Min 6 characters';
    if (mode === 'signup' && password !== confirm) e.confirm = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      if (mode === 'login') { await login(email, password); toast.success('Welcome back!'); }
      else { await signup(email, name.trim(), password); toast.success('Account created!'); }
      navigate(from, { replace: true });
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'Something went wrong');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#080810] flex items-center justify-center px-4 py-16">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-indigo-600/6 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-violet-600/6 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md animate-slide-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center glow-sm">
              <BrainCircuit size={20} className="text-white" />
            </div>
            <span className="text-2xl font-bold text-white tracking-tight">RecruitIQ</span>
          </Link>
          <h1 className="text-2xl font-bold text-white mb-2">
            {mode === 'login' ? 'Welcome back' : 'Create your account'}
          </h1>
          <p className="text-zinc-500 text-sm">
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <Link to={mode === 'login' ? '/signup' : '/login'} className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
              {mode === 'login' ? 'Sign up free' : 'Sign in'}
            </Link>
          </p>
        </div>

        <div className="glass rounded-2xl p-8 space-y-5">
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {mode === 'signup' && (
              <InputField id="name" label="Full Name" value={name}
                onChange={(e: any) => setName(e.target.value)} error={errors.name}
                placeholder="John Smith" autoComplete="name" />
            )}
            <InputField id="email" label="Email" type="email" value={email}
              onChange={(e: any) => setEmail(e.target.value)} error={errors.email}
              placeholder="you@example.com" autoComplete="email" />
            <PasswordField id="password" label="Password" value={password}
              onChange={(e: any) => setPassword(e.target.value)} error={errors.password}
              placeholder={mode === 'signup' ? 'Min 6 characters' : '••••••••'}
              showPass={showPass} onToggle={() => setShowPass(p => !p)} />
            {mode === 'signup' && (
              <PasswordField id="confirm" label="Confirm Password" value={confirm}
                onChange={(e: any) => setConfirm(e.target.value)} error={errors.confirm}
                placeholder="Repeat password" showPass={showPass} onToggle={() => setShowPass(p => !p)} />
            )}
            <button type="submit" disabled={loading}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2">
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <div className="flex items-center gap-2 justify-center pt-1">
            <Sparkles size={12} className="text-indigo-400" />
            <p className="text-zinc-600 text-xs">No spam. No temp emails. Real accounts only.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export const LoginPage = () => <AuthPage mode="login" />;
export const SignupPage = () => <AuthPage mode="signup" />;
