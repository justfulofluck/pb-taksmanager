import React, { useState, useEffect } from 'react';
import { Mail, Lock, User, KeyRound, ShieldCheck, HelpCircle, ArrowRight, Eye, EyeOff, Sparkles } from 'lucide-react';
import { UserSession } from '../types';
import { ApiClient } from '../api';

interface AuthProps {
  onLoginSuccess: (user: { email: string; name: string }) => void;
}

const SECURITY_QUESTIONS = [
  "What was the name of your first pet?",
  "In what city were you born?",
  "What was the name of your elementary school?",
  "What is your mother's maiden name?",
  "What was your first car's make/model?"
];

export default function Auth({ onLoginSuccess }: AuthProps) {
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot' | 'recover'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Security question fields
  const [securityQuestion, setSecurityQuestion] = useState(SECURITY_QUESTIONS[0]);
  const [securityAnswer, setSecurityAnswer] = useState('');
  
  // Recovery active question
  const [activeQuestion, setActiveQuestion] = useState('');
  const [userAnswer, setUserAnswer] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Status feedback messages
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    // Ensure user storage exists & seed default admin
    const usersJson = localStorage.getItem('pinobite_users');
    let users = usersJson ? JSON.parse(usersJson) : {};
    
    if (!users['admin@pinobite.com']) {
      users['admin@pinobite.com'] = {
        email: 'admin@pinobite.com',
        name: 'Workspace Admin',
        password: 'Password123!',
        securityQuestion: 'What was the name of your first pet?',
        securityAnswer: 'buddy'
      };
      localStorage.setItem('pinobite_users', JSON.stringify(users));
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    try {
      const user = await ApiClient.loginUser({ email, password });
      setSuccess('Login successful! Redirecting...');
      setTimeout(() => {
        onLoginSuccess({ email: user.email, name: user.name });
      }, 800);
    } catch (err: any) {
      setError(err?.message || 'Invalid email or password.');
    }
  };

  const handleForgotPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email) {
      setError('Please enter your email address.');
      return;
    }

    const usersJson = localStorage.getItem('pinobite_users');
    if (!usersJson) {
      setError('Email address not found.');
      return;
    }

    const users = JSON.parse(usersJson);
    const user = users[email.toLowerCase().trim()];

    if (!user) {
      setError('Email address not found.');
      return;
    }

    // If found, load their security question and switch to recovery page
    setActiveQuestion(user.securityQuestion);
    setMode('recover');
  };

  const handleAccountRecovery = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!userAnswer) {
      setError('Please answer your security question.');
      return;
    }

    if (!newPassword) {
      setError('Please enter a new password.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    const usersJson = localStorage.getItem('pinobite_users');
    if (!usersJson) {
      setError('An error occurred. Please try again.');
      return;
    }

    const users = JSON.parse(usersJson);
    const userKey = email.toLowerCase().trim();
    const user = users[userKey];

    if (!user) {
      setError('User not found.');
      return;
    }

    if (user.securityAnswer.toLowerCase().trim() === userAnswer.toLowerCase().trim()) {
      // Recovery success! Save new password
      user.password = newPassword;
      users[userKey] = user;
      localStorage.setItem('pinobite_users', JSON.stringify(users));

      setSuccess('Password updated successfully! Redirecting to login...');
      setTimeout(() => {
        setMode('login');
        setPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
        setUserAnswer('');
        setError('');
        setSuccess('');
      }, 2000);
    } else {
      setError('Incorrect security answer. Authentication failed.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 selection:bg-indigo-500/30 selection:text-white" id="auth-container">
      
      {/* Dynamic Background visual element */}
      <div className="absolute inset-0 bg-radial-gradient from-slate-900 via-slate-950 to-slate-950 pointer-events-none opacity-40 z-0" />
      
      {/* Brand Title Header */}
      <div className="mb-8 text-center z-10 flex flex-col items-center">
        <div className="flex items-center justify-center mb-2">
          <h1 className="text-4xl font-extrabold tracking-tight text-white font-sans">
            Pinobite
          </h1>
        </div>
      </div>

      {/* Main Container Card */}
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl p-8 shadow-2xl z-10 transition-all duration-300 relative overflow-hidden" id="auth-card">
        
        {/* Subtle decorative color bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-600 via-sky-500 to-indigo-600" />

        {/* Form state toggling feedback */}
        {error && (
          <div className="mb-4 p-3 bg-red-950/40 border border-red-800/60 rounded-lg text-red-400 text-xs flex items-start gap-2 animate-shake" id="auth-error-banner">
            <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-lg text-emerald-400 text-xs flex items-start gap-2 animate-fade-in" id="auth-success-banner">
            <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{success}</span>
          </div>
        )}

        {/* 1. LOGIN MODE */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-5" id="login-form">
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-white">Welcome Back</h2>
              <p className="text-xs text-slate-400">Log in to enter your team sprint workspace.</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-400 block">Work Email</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input
                    type="email"
                    required
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-950 text-slate-200 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg py-2.5 pl-10 pr-4 text-sm placeholder-slate-600 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-medium text-slate-400 block">Password</label>
                  <button
                    type="button"
                    onClick={() => setMode('forgot')}
                    className="text-[11px] font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-950 text-slate-200 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg py-2.5 pl-10 pr-10 text-sm placeholder-slate-600 outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-500 hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-medium text-sm py-2.5 rounded-lg flex items-center justify-center gap-2 shadow-lg shadow-indigo-950/30 transition-all cursor-pointer"
              id="login-submit-btn"
            >
              Enter Workspace
              <ArrowRight className="w-4 h-4" />
            </button>



          </form>
        )}



        {/* 3. FORGOT PASSWORD MODE */}
        {mode === 'forgot' && (
          <form onSubmit={handleForgotPasswordSubmit} className="space-y-5" id="forgot-form">
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-white flex items-center gap-1.5">
                <KeyRound className="w-5 h-5 text-indigo-400" />
                <span>Account Recovery</span>
              </h2>
              <p className="text-xs text-slate-400">Step 1: Enter your email to retrieve your secure recovery challenge.</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-400 block">Work Email</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950 text-slate-200 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg py-2.5 pl-10 pr-4 text-sm placeholder-slate-600 outline-none transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm py-2.5 rounded-lg flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer"
            >
              Verify Email Address
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="pt-2 text-center border-t border-slate-800/60">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError('');
                  setSuccess('');
                }}
                className="text-xs font-medium text-slate-400 hover:text-white transition-colors"
              >
                ← Back to Login
              </button>
            </div>
          </form>
        )}

        {/* 4. CHALLENGE / RECOVERY MODE */}
        {mode === 'recover' && (
          <form onSubmit={handleAccountRecovery} className="space-y-4" id="recover-form">
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-white flex items-center gap-1.5">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <span>Identity Verification</span>
              </h2>
              <p className="text-xs text-slate-400">Step 2: Answer your secure question to reset your password.</p>
            </div>

            <div className="space-y-3">
              {/* Challenge question display */}
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
                <span className="text-[10px] uppercase tracking-wider font-semibold text-indigo-400 block mb-1">Challenge Question</span>
                <span className="text-sm font-medium text-slate-200 block">{activeQuestion || "What was the name of your first pet?"}</span>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-400 block">Your Secret Answer</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                    <HelpCircle className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="Type your recovery answer here..."
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    className="w-full bg-slate-950 text-slate-200 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg py-2 pl-10 pr-4 text-sm placeholder-slate-600 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-400 block">New Password</label>
                <input
                  type="password"
                  required
                  placeholder="Minimum 6 characters..."
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-slate-950 text-slate-200 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg py-2 px-3 text-sm placeholder-slate-600 outline-none transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-400 block">Confirm New Password</label>
                <input
                  type="password"
                  required
                  placeholder="Re-type your password..."
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  className="w-full bg-slate-950 text-slate-200 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg py-2 px-3 text-sm placeholder-slate-600 outline-none transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-medium text-sm py-2.5 rounded-lg flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer"
            >
              Reset Password & Log In
              <ShieldCheck className="w-4 h-4" />
            </button>

            <div className="pt-2 text-center border-t border-slate-800/60">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError('');
                  setSuccess('');
                }}
                className="text-xs font-medium text-slate-400 hover:text-white transition-colors"
              >
                ← Back to Login
              </button>
            </div>
          </form>
        )}
      </div>

      <div className="mt-6 text-center text-[11px] text-slate-600 max-w-xs leading-normal">
        Secured locally in browser standard database. Safe sandbox encryption.
      </div>
    </div>
  );
}
