/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Shield, Key, Mail, Lock, User, LogOut, ChevronRight, Settings } from 'lucide-react';
import ClientAssessment from './components/ClientAssessment';
import SalesDashboard from './components/SalesDashboard';
import AdminCMS from './components/AdminCMS';
import { User as UserType } from './types';

export default function App() {
  // Query parameter parsing
  const [refParam, setRefParam] = useState<string | null>(null);

  // Auth State
  const [user, setUser] = useState<UserType | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [authView, setAuthView] = useState<'login' | 'register'>('login');
  
  // Login / Register Inputs
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Admin View state (to switch between backpanel CMS and Sales dashboard views)
  const [adminView, setAdminView] = useState<'cms' | 'dashboard'>('dashboard');

  useEffect(() => {
    // 1. Check if ?ref=CODE query parameter exists, or fallback to localStorage
    const params = new URLSearchParams(window.location.search);
    const code = params.get('ref');
    
    if (code) {
      const formattedCode = code.toUpperCase();
      setRefParam(formattedCode);
      localStorage.setItem('samoia_ref_code', formattedCode);
    } else {
      const savedRef = localStorage.getItem('samoia_ref_code');
      if (savedRef) {
        setRefParam(savedRef);
      }
    }

    // 2. Check local storage for persistent session token
    const savedToken = localStorage.getItem('samoia_session_token');
    if (savedToken) {
      fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${savedToken}` }
      })
      .then(res => {
        if (res.ok) return res.json();
        throw new Error('Stale session');
      })
      .then(data => {
        setUser(data.user);
        setToken(savedToken);
        setLoading(false);
      })
      .catch(() => {
        localStorage.removeItem('samoia_session_token');
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal login');
      }

      localStorage.setItem('samoia_session_token', data.token);
      setToken(data.token);
      setUser(data.user);
    } catch (err: any) {
      setAuthError(err.message);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, nama: name })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal registrasi');
      }

      setAuthSuccess(data.message || 'Registrasi berhasil. Tunggu persetujuan admin.');
      setAuthView('login');
      setEmail('');
      setPassword('');
      setName('');
    } catch (err: any) {
      setAuthError(err.message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('samoia_session_token');
    setUser(null);
    setToken(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] text-[#F5F5F5] flex items-center justify-center font-mono text-xs">
        <div className="text-center space-y-4">
          <div className="w-6 h-6 border-t-2 border-white rounded-full animate-spin mx-auto"></div>
          <span className="tracking-[0.2em] uppercase text-[10px] text-white/60">INITIALIZING SECURE SESSION...</span>
        </div>
      </div>
    );
  }

  // A. IF CLIENT LEAD REFERRAL MODE IS ACTIVE, RENDER THE CLIENT ASSESSMENT
  if (refParam) {
    return <ClientAssessment referralCode={refParam} />;
  }

  // B. RENDER MAIN SALES/ADMIN PRIVATE PORTAL
  return (
    <div className="min-h-screen bg-[#050505] text-[#F5F5F5] font-sans antialiased flex flex-col justify-between selection:bg-white selection:text-black">
      
      {/* Universal Header */}
      <header className="border-b border-white/10 bg-[#050505]/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Logo / Branding */}
          <div className="flex items-baseline space-x-2">
            <span className="text-lg font-light tracking-[0.3em] uppercase text-white">Samoia</span>
            <span className="text-[10px] text-white/40 uppercase tracking-widest font-medium">Consulting / v2.0</span>
          </div>

          {/* Logged in navbar metrics */}
          {user && (
            <div className="flex items-center gap-6">
              
              {/* If Admin, show toggler to switch view */}
              {user.role === 'admin' && (
                <div className="flex items-center bg-white/5 border border-white/10 p-0.5 rounded-none">
                  <button
                    onClick={() => setAdminView('dashboard')}
                    className={`px-3 py-1 text-[10px] font-mono rounded-none transition-colors cursor-pointer uppercase tracking-wider ${
                      adminView === 'dashboard' ? 'bg-white text-black font-semibold' : 'text-white/50 hover:text-white'
                    }`}
                  >
                    Sales View
                  </button>
                  <button
                    onClick={() => setAdminView('cms')}
                    className={`px-3 py-1 text-[10px] font-mono rounded-none transition-colors cursor-pointer uppercase tracking-wider ${
                      adminView === 'cms' ? 'bg-white text-black font-semibold' : 'text-white/50 hover:text-white'
                    }`}
                  >
                    Admin CMS
                  </button>
                </div>
              )}

              <div className="flex items-center gap-4">
                <div className="hidden sm:block text-right">
                  <span className="text-xs font-semibold uppercase tracking-wider block text-white">{user.nama}</span>
                  <span className="text-[9px] text-white/40 font-mono block uppercase tracking-widest">{user.role} ADVISOR</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-1.5 border border-white/10 hover:border-white text-white/60 hover:text-white rounded-none transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 w-full">
        
        {user ? (
          // USER IS LOGGED IN
          user.role === 'admin' && adminView === 'cms' ? (
            <AdminCMS token={token!} adminUser={user} />
          ) : (
            <SalesDashboard 
              token={token!} 
              user={user} 
              onLogout={handleLogout} 
              onUpdateUser={(updated) => setUser(updated)} 
            />
          )
        ) : (
          // AUTHENTICATION LOGIN / REGISTER SCREEN
          <div className="max-w-md mx-auto my-12">
            
            <div className="text-center mb-8">
              <span className="inline-block px-3 py-1 bg-white/5 border border-white/10 rounded-none text-[9px] font-mono text-white/60 mb-3 uppercase tracking-[0.2em]">
                Private Advisor Access
              </span>
              <h2 className="text-3xl font-light tracking-tight uppercase">Samoia Portal</h2>
              <p className="text-white/40 text-xs mt-2 tracking-wide">Daftar atau masuk ke sistem internal manajemen leads, CRM, dan akademi belajar.</p>
            </div>

            {/* Error & Success indicators */}
            {authError && (
              <div className="bg-red-950/20 border border-red-500/20 p-4 rounded-none text-xs text-red-400 mb-5 leading-relaxed font-mono">
                [ERROR] {authError}
              </div>
            )}
            {authSuccess && (
              <div className="bg-emerald-950/20 border border-emerald-500/20 p-4 rounded-none text-xs text-emerald-400 mb-5 leading-relaxed font-mono">
                [SUCCESS] {authSuccess}
              </div>
            )}

            <div className="border border-white/10 bg-[#0A0A0A] p-6 sm:p-8 rounded-none">
              {authView === 'login' ? (
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className="block text-[9px] font-mono text-white/40 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                      <Mail className="w-3 h-3 text-white/40" /> Alamat Email
                    </label>
                    <input
                      type="email"
                      required
                      className="w-full bg-[#050505] border border-white/10 text-white rounded-none px-3.5 py-2 text-xs focus:outline-none focus:border-white font-mono transition-colors"
                      placeholder="sales@samoia.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-mono text-white/40 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                      <Lock className="w-3 h-3 text-white/40" /> Password Akun
                    </label>
                    <input
                      type="password"
                      required
                      className="w-full bg-[#050505] border border-white/10 text-white rounded-none px-3.5 py-2 text-xs focus:outline-none focus:border-white font-mono transition-colors"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-transparent border border-white hover:bg-white hover:text-black transition-all text-white font-semibold rounded-none text-xs uppercase tracking-[0.2em] mt-6 cursor-pointer"
                  >
                    Masuk Ke Portal
                  </button>

                  <p className="text-center text-[11px] text-white/40 pt-4 tracking-wide">
                    Belum memiliki akun sales?{' '}
                    <button
                      type="button"
                      onClick={() => setAuthView('register')}
                      className="text-white hover:text-white/80 font-medium underline underline-offset-4 decoration-white/20 cursor-pointer transition-colors"
                    >
                      Daftar Baru
                    </button>
                  </p>
                </form>
              ) : (
                <form onSubmit={handleRegister} className="space-y-4">
                  <div>
                    <label className="block text-[9px] font-mono text-white/40 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                      <User className="w-3 h-3 text-white/40" /> Nama Lengkap Advisor
                    </label>
                    <input
                      type="text"
                      required
                      className="w-full bg-[#050505] border border-white/10 text-white rounded-none px-3.5 py-2 text-xs focus:outline-none focus:border-white transition-colors"
                      placeholder="Contoh: Bima Satria"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-mono text-white/40 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                      <Mail className="w-3 h-3 text-white/40" /> Alamat Email Kerja
                    </label>
                    <input
                      type="email"
                      required
                      className="w-full bg-[#050505] border border-white/10 text-white rounded-none px-3.5 py-2 text-xs focus:outline-none focus:border-white font-mono transition-colors"
                      placeholder="sales@samoia.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-mono text-white/40 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                      <Lock className="w-3 h-3 text-white/40" /> Password Akun Baru
                    </label>
                    <input
                      type="password"
                      required
                      className="w-full bg-[#050505] border border-white/10 text-white rounded-none px-3.5 py-2 text-xs focus:outline-none focus:border-white font-mono transition-colors"
                      placeholder="Minimal 6 Karakter"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-transparent border border-white hover:bg-white hover:text-black transition-all text-white font-semibold rounded-none text-xs uppercase tracking-[0.2em] mt-6 cursor-pointer"
                  >
                    Ajukan Pendaftaran
                  </button>

                  <p className="text-center text-[11px] text-white/40 pt-4 tracking-wide">
                    Sudah terdaftar?{' '}
                    <button
                      type="button"
                      onClick={() => setAuthView('login')}
                      className="text-white hover:text-white/80 font-medium underline underline-offset-4 decoration-white/20 cursor-pointer transition-colors"
                    >
                      Masuk Di Sini
                    </button>
                  </p>
                </form>
              )}
            </div>

{/* Admin seeded info removed */}

          </div>
        )}

      </main>

      {/* Luxury Minimalist Status Footer */}
      <footer className="h-8 bg-white text-black flex items-center justify-between px-4 sm:px-8 text-[9px] uppercase tracking-[0.15em] font-medium mt-auto select-none">
        <div>SYSTEM STATUS: NOMINAL // SAMOIA CONSULTING SECURE TUNNEL</div>
        <div className="hidden sm:block">AUTO-SAVE ACTIVE — SESSION: SEC_4A-992B</div>
      </footer>

    </div>
  );
}
