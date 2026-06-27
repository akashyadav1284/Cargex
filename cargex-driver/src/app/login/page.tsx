"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { API_URL } from '@/lib/config';

export default function DriverLogin() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');
    try {
      const body = identifier.includes('@') ? { email: identifier, password } : { phone: identifier, password };
      const res = await fetch(`${API_URL}/api/auth/login/driver`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('driverData', JSON.stringify(data));
        router.push('/dashboard');
      } else {
        setErrorMsg(data.message || 'Login failed.');
      }
    } catch {
      setErrorMsg('Network error connecting to the API.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="mb-10">
            <h1 className="text-3xl font-black tracking-tight mb-2">Cargex Driver</h1>
            <p className="text-muted text-sm">Sign in with the credentials provided by your admin.</p>
          </div>

          {errorMsg && <div className="bg-red-50 text-red-600 border border-red-200 p-3 rounded-lg text-sm mb-6 font-medium">{errorMsg}</div>}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="text-xs font-bold text-muted uppercase tracking-wider block mb-2">Email or Phone</label>
              <input type="text" placeholder="Enter your email or phone" value={identifier} onChange={e => setIdentifier(e.target.value)} className="w-full bg-inputBg border border-transparent rounded-lg px-4 py-4 text-base focus:outline-none focus:border-black focus:bg-white transition-all shadow-sm" required />
            </div>
            <div>
              <label className="text-xs font-bold text-muted uppercase tracking-wider block mb-2">Password</label>
              <input type="password" placeholder="Enter your password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-inputBg border border-transparent rounded-lg px-4 py-4 text-base focus:outline-none focus:border-black focus:bg-white transition-all shadow-sm" required />
            </div>
            <button type="submit" disabled={isLoading} className="w-full bg-black text-white py-4 rounded-xl font-bold text-lg hover:bg-[#333] transition-transform active:scale-[0.98] mt-4 shadow-lg disabled:opacity-50">
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="mt-8 text-center text-sm font-medium text-muted">
            If you want to become a driver, <a href="/register" className="text-black font-bold underline hover:text-gray-700">register here</a>
          </p>
        </div>
      </div>

      {/* Footer helpline quote */}
      <footer className="w-full bg-white border-t border-border py-6 z-10">
        <div className="max-w-7xl mx-auto px-6 text-center text-xs text-muted">
          <p className="font-semibold">"Driven by reliability, supported by our team."</p>
          <p className="mt-1 font-bold text-primary">Instant Driver Partner Helpline: +91 9467658854</p>
        </div>
      </footer>
    </div>
  );
}
