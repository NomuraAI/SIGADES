import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Lock, ArrowRight, ShieldCheck, Info, ChevronLeft } from 'lucide-react';
import { UserRole, User as UserType } from '../../types';
import { userService } from '../../services/userService';

interface LoginPageProps {
  onLogin: (user: UserType) => void;
  onBack: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin, onBack }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const user = await userService.login(username, password);

      if (user) {
        onLogin(user);
      } else {
        setError('Username atau password salah.');
      }
    } catch (err) {
      setError('Terjadi kesalahan koneksi ke database.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-[#030a12] flex items-center justify-center p-4 font-['Rajdhani']">
      {/* Background elements to match Landing Page */}
      <div 
        className="absolute inset-0 z-0 opacity-10"
        style={{
          backgroundImage: `
            linear-gradient(rgba(14, 165, 233, 0.15) 1px, transparent 1px),
            linear-gradient(90deg, rgba(14, 165, 233, 0.15) 1px, transparent 1px)
          `,
          backgroundSize: '30px 30px',
        }}
      />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Back Button */}
        <button 
          onClick={onBack}
          className="absolute -top-16 left-0 flex items-center space-x-2 text-sky-400/60 hover:text-sky-400 transition-colors group"
        >
          <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm tracking-widest uppercase">Kembali</span>
        </button>

        <div className="bg-[#0a1524]/80 backdrop-blur-xl border border-sky-500/20 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
          {/* Animated top border */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-sky-600 via-indigo-600 to-sky-600 animate-gradient-x" />
          
          <div className="text-center mb-8">
            <motion.img 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              src="/Logo Lobar Blue.png" 
              alt="Logo" 
              className="w-20 h-20 mx-auto mb-4 filter drop-shadow-[0_0_10px_rgba(14,165,233,0.3)]"
            />
            <h1 className="text-3xl font-bold text-white tracking-tight">SI-GADES</h1>
            <p className="text-sky-400/60 text-sm tracking-widest uppercase">Masuk ke Sistem</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-4">
              {/* Username Input */}
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-sky-500/50 group-focus-within:text-sky-400 transition-colors">
                  <User className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Username"
                  className="w-full bg-[#030a12] border border-sky-500/20 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder:text-sky-500/20 focus:outline-none focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/50 transition-all"
                  required
                />
              </div>

              {/* Password Input */}
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-sky-500/50 group-focus-within:text-sky-400 transition-colors">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full bg-[#030a12] border border-sky-500/20 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder:text-sky-500/20 focus:outline-none focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/50 transition-all"
                  required
                />
              </div>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center space-x-2 text-rose-500 bg-rose-500/10 p-3 rounded-lg border border-rose-500/20 text-sm"
              >
                <Info className="w-4 h-4" />
                <span>{error}</span>
              </motion.div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full relative group overflow-hidden bg-sky-600 hover:bg-sky-500 py-4 rounded-xl text-white font-bold tracking-widest transition-all disabled:opacity-50"
            >
              <div className="relative z-10 flex items-center justify-center space-x-2">
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>AUTENTIKASI</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </div>
              
              {/* Shine effect */}
              <div className="absolute top-0 -left-[100%] w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:left-[100%] transition-all duration-1000 ease-in-out" />
            </button>
          </form>

          {/* Quick Info / Roles for Demo */}
          <div className="mt-8 pt-6 border-t border-sky-500/10 text-center">
            <div className="inline-flex items-center space-x-2 text-sky-400/40 text-[10px] tracking-[0.2em] uppercase bg-sky-500/5 px-4 py-2 rounded-full border border-sky-500/10">
              <ShieldCheck className="w-3 h-3" />
              <span>Sistem Keamanan Terintegrasi</span>
            </div>
            
            <div className="mt-6 grid grid-cols-3 gap-2 opacity-30 group hover:opacity-100 transition-opacity">
               <div className="text-[10px] text-sky-500/60 p-1 border border-sky-500/10 rounded cursor-help" title="admin / admin123">ADMIN</div>
               <div className="text-[10px] text-sky-500/60 p-1 border border-sky-500/10 rounded cursor-help" title="user / user123">STAFF</div>
               <div className="text-[10px] text-sky-500/60 p-1 border border-sky-500/10 rounded cursor-help" title="view / view123">VIEWER</div>
            </div>
          </div>
        </div>
        
        <p className="mt-8 text-center text-sky-500/30 text-xs tracking-[0.3em] uppercase">
          © 2024 BAPPERIDA LOMBOK BARAT
        </p>
      </motion.div>
    </div>
  );
};

export default LoginPage;
