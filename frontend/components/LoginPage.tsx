
import React, { useState } from 'react';
import { Button } from './Button';
import { UserProfile } from '../types';

interface LoginPageProps {
  onLogin: (user: UserProfile) => void;
}

const HIERARCHY_LEVELS = [
  'Supervisor', 'World Team', 'Active World Team', 'GET', 'GET 2500', 'Millionaire Team', 'Millionaire Team 7500', 'President Team', 'Chairman Club', 'Founder Circle'
];

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [businessLevel, setBusinessLevel] = useState('Supervisor');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    // Simulate API delay
    setTimeout(() => {
      // Logic for Multi-Admin Support:
      // In a real app, this would be a fetch to POST /api/register or /api/login
      const users = JSON.parse(localStorage.getItem('biztrack_all_users') || '[]');
      
      if (isRegistering) {
        // Handle Account Creation
        if (users.find((u: any) => u.email.toLowerCase() === email.toLowerCase())) {
          setError("An account with this email already exists.");
          setIsLoading(false);
          return;
        }

        const newUser: UserProfile = {
          name,
          email,
          role: businessLevel,
          team: 'Independent Admin',
          status: 'Active',
          lastLogin: new Date().toLocaleString(),
          joinedDate: new Date().toISOString().split('T')[0],
          phone: '',
          bio: `Professional ${businessLevel} admin account.`,
          agendaReminderTime: '09:00'
        };

        users.push(newUser);
        localStorage.setItem('biztrack_all_users', JSON.stringify(users));
        setIsLoading(false);
        onLogin(newUser);
      } else {
        // Handle Secure Login
        const found = users.find((u: any) => u.email.toLowerCase() === email.toLowerCase());
        
        // Simple mock: we accept any password for valid emails for this demo
        if (found) {
            found.lastLogin = new Date().toLocaleString();
            localStorage.setItem('biztrack_all_users', JSON.stringify(users));
            setIsLoading(false);
            onLogin(found);
        } else if (email === 'john.doe@biztrack.com') {
            // Default built-in Demo account
            setIsLoading(false);
            onLogin({
                name: 'John Doe',
                email: 'john.doe@biztrack.com',
                role: 'President Team',
                team: 'Global Sales',
                status: 'Active',
                lastLogin: new Date().toLocaleString(),
                joinedDate: '2023-01-15',
                phone: '+1 (555) 000-0000',
                agendaReminderTime: '09:00'
            });
        } else {
            setError("Account not found. Please verify your email or create a new account.");
            setIsLoading(false);
        }
      }
    }, 1000);
  };

  const inputClasses = "appearance-none block w-full pl-10 pr-10 py-2.5 border border-slate-300 rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-accent focus:border-accent sm:text-sm transition-all";

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans animate-fade-in">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center items-center gap-3">
            <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center text-accent shadow-xl shadow-blue-500/10">
                <i className="fa-solid fa-chart-line text-2xl"></i>
            </div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter">BizTrack</h1>
        </div>
        <h2 className="mt-8 text-center text-2xl font-bold tracking-tight text-slate-800">
          {isRegistering ? "Create your admin profile" : "Admin Authentication"}
        </h2>
        <p className="mt-2 text-center text-sm text-slate-500">
          {isRegistering 
            ? "Set up your independent business environment" 
            : "Secure access for registered business administrators"}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-10 px-6 shadow-2xl shadow-slate-200/50 sm:rounded-3xl sm:px-12 border border-slate-100 relative overflow-hidden">
          
          {/* Subtle decoration */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full -mr-16 -mt-16 pointer-events-none"></div>
          
          {/* Auth Tab Toggle */}
          <div className="flex mb-10 bg-slate-50 p-1.5 rounded-2xl border border-slate-100 relative z-10">
             <button 
                onClick={() => { setIsRegistering(false); setError(null); setShowPassword(false); }}
                className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${!isRegistering ? 'bg-white text-primary shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
             >
                Sign In
             </button>
             <button 
                onClick={() => { setIsRegistering(true); setError(null); setShowPassword(false); }}
                className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${isRegistering ? 'bg-white text-primary shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
             >
                Create Account
             </button>
          </div>

          <form className="space-y-6 relative z-10" onSubmit={handleSubmit}>
            {error && (
                <div className="bg-red-50 border border-red-100 text-red-600 text-xs p-3.5 rounded-xl flex items-start gap-3 animate-shake">
                    <i className="fa-solid fa-circle-exclamation mt-0.5 flex-shrink-0"></i>
                    <span>{error}</span>
                </div>
            )}

            {isRegistering && (
                <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Admin Name</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <i className="fa-regular fa-user text-slate-400 text-sm"></i>
                        </div>
                        <input
                            type="text"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className={inputClasses}
                            placeholder="e.g. Robert Williams"
                        />
                    </div>
                </div>
            )}

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Email address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <i className="fa-regular fa-envelope text-slate-400 text-sm"></i>
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClasses}
                  placeholder="admin@business.com"
                />
              </div>
            </div>

            {isRegistering && (
                <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Business Level</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <i className="fa-solid fa-award text-slate-400 text-sm"></i>
                        </div>
                        <select 
                            value={businessLevel}
                            onChange={(e) => setBusinessLevel(e.target.value)}
                            className={`${inputClasses} cursor-pointer appearance-none`}
                        >
                            {HIERARCHY_LEVELS.map(lvl => <option key={lvl} value={lvl}>{lvl}</option>)}
                        </select>
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            <i className="fa-solid fa-chevron-down text-slate-300 text-[10px]"></i>
                        </div>
                    </div>
                </div>
            )}

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Security Token / Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <i className="fa-solid fa-shield-halved text-slate-400 text-sm"></i>
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={inputClasses}
                  placeholder="••••••••"
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
                  tabIndex={-1}
                >
                  <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'} text-sm`}></i>
                </button>
              </div>
            </div>

            <Button
                type="submit"
                className="w-full py-3.5 text-base shadow-xl shadow-accent/20 font-bold active:scale-[0.98] transition-all"
                isLoading={isLoading}
            >
                {isRegistering ? "Confirm & Enter" : "Sign In to Dashboard"}
            </Button>
          </form>

          {!isRegistering && (
            <div className="mt-8 text-center">
                <button type="button" className="text-xs font-bold text-slate-400 hover:text-accent transition-colors uppercase tracking-widest">
                    Recovery Access
                </button>
            </div>
          )}
        </div>
        
        <p className="mt-12 text-center text-[10px] text-slate-400 uppercase tracking-[0.2em] font-bold">
            BizTrack Enterprise Management &bull; Individual Instance
        </p>
      </div>
      
      <style>{`
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-4px); }
            75% { transform: translateX(4px); }
        }
        .animate-shake { animation: shake 0.2s ease-in-out 0s 2; }
      `}</style>
    </div>
  );
};
