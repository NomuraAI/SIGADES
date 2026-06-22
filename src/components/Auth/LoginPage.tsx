import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Lock, ArrowRight, ShieldCheck, Info, ChevronLeft, RefreshCcw, Hash } from 'lucide-react';
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
  const [captcha, setCaptcha] = useState({ question: '', answer: 0 });
  const [captchaInput, setCaptchaInput] = useState('');
  const [isRobotChecked, setIsRobotChecked] = useState(false);

  const generateCaptcha = () => {
    const num1 = Math.floor(Math.random() * 10) + 1;
    const num2 = Math.floor(Math.random() * 10) + 1;
    setCaptcha({
      question: `${num1} + ${num2}`,
      answer: num1 + num2
    });
    setCaptchaInput('');
  };

  useEffect(() => {
    generateCaptcha();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (!isRobotChecked) {
      setError('Silakan verifikasi bahwa Anda bukan robot.');
      setIsLoading(false);
      return;
    }

    if (parseInt(captchaInput) !== captcha.answer) {
      setError('Jawaban CAPTCHA salah.');
      generateCaptcha();
      setIsLoading(false);
      return;
    }

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
          className="absolute -top-16 left-0 flex items-center space-x-2 text-sky-300 hover:text-sky-200 transition-colors group"
        >
          <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm tracking-widest uppercase font-bold">Kembali</span>
        </button>

        <div className="bg-[#0f172a]  border border-sky-400/30 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
          {/* Animated top border */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-sky-400 via-indigo-500 to-sky-400 animate-gradient-x" />
          
          <div className="text-center mb-8">
            <motion.img 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              src="/Logo Lobar Blue.png" 
              alt="Logo" 
              className="w-20 h-20 mx-auto mb-4 filter drop-shadow-[0_0_15px_rgba(56,189,248,0.4)]"
            />
            <h1 className="text-3xl font-bold text-white tracking-tight drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">SI-GADES</h1>
            <p className="text-sky-300 text-xs tracking-[0.2em] uppercase mt-1 font-medium">Masuk ke Sistem</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-4">
              {/* Username Input */}
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-sky-400 group-focus-within:text-sky-300 transition-colors">
                  <User className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Username"
                  className="w-full bg-[#030a12] border border-sky-500/30 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder:text-sky-500/40 focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400/50 transition-all"
                  required
                />
              </div>

              {/* Password Input */}
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-sky-400 group-focus-within:text-sky-300 transition-colors">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full bg-[#030a12] border border-sky-500/30 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder:text-sky-500/40 focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400/50 transition-all"
                  required
                />
              </div>

              {/* Verification Section */}
              <div className="space-y-4">
                {/* I'm not a robot checkbox */}
                <div 
                  onClick={() => setIsRobotChecked(!isRobotChecked)}
                  className={`flex items-center space-x-3 bg-[#030a12] border ${isRobotChecked ? 'border-sky-400 bg-sky-400/5 shadow-[0_0_15px_rgba(56,189,248,0.1)]' : 'border-sky-500/30'} rounded-xl p-4 cursor-pointer transition-all hover:border-sky-400 group/robot`}
                >
                  <div className={`w-6 h-6 rounded flex items-center justify-center border-2 transition-all duration-300 ${isRobotChecked ? 'bg-sky-500 border-sky-500' : 'border-sky-500/30 bg-[#030a12]'}`}>
                    {isRobotChecked && (
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                        <ShieldCheck className="w-4 h-4 text-white" />
                      </motion.div>
                    )}
                  </div>
                  <span className={`text-sm font-bold tracking-widest uppercase transition-colors ${isRobotChecked ? 'text-sky-300' : 'text-sky-500/60'}`}>
                    Saya bukan robot
                  </span>
                  <div className="ml-auto opacity-40 group-hover/robot:opacity-100 transition-opacity">
                    <img src="/Logo Lobar Blue.png" alt="Captcha" className="w-5 h-5 grayscale group-hover/robot:grayscale-0 transition-all" />
                  </div>
                </div>

                {/* Math CAPTCHA Section - Revealed after checking robot box */}
                {isRobotChecked && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0, y: -10 }}
                    animate={{ opacity: 1, height: 'auto', y: 0 }}
                    className="space-y-3 overflow-hidden pt-2 border-t border-sky-500/10"
                  >
                    <div className="flex items-center justify-between">
                      <label className="text-sky-400/70 text-[10px] uppercase tracking-[0.2em] font-bold ml-1">Verifikasi Keamanan Tambahan</label>
                      <button 
                        type="button"
                        onClick={generateCaptcha}
                        className="text-sky-400 hover:text-sky-300 transition-colors flex items-center space-x-1 group/refresh"
                      >
                        <span className="text-[10px] uppercase tracking-widest font-bold">Ganti Soal</span>
                        <RefreshCcw className="w-3 h-3 group-hover/refresh:rotate-180 transition-transform duration-500" />
                      </button>
                    </div>
                    
                    <div className="flex space-x-3">
                      <div className="flex-1 bg-[#030a12] border border-sky-500/30 rounded-xl flex items-center justify-center p-3 relative overflow-hidden">
                        <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #38bdf8 1px, transparent 1px)', backgroundSize: '10px 10px' }}></div>
                        <span className="text-2xl font-black text-white tracking-[0.3em] italic select-none drop-shadow-[0_0_8px_rgba(56,189,248,0.5)]">
                          {captcha.question}
                        </span>
                      </div>
                      
                      <div className="relative w-1/3">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-sky-400">
                          <Hash className="w-4 h-4" />
                        </div>
                        <input
                          type="number"
                          value={captchaInput}
                          onChange={(e) => setCaptchaInput(e.target.value)}
                          placeholder="?"
                          className="w-full bg-[#030a12] border border-sky-500/30 rounded-xl py-3.5 pl-9 pr-2 text-white placeholder:text-sky-500/40 focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400/50 transition-all text-center font-bold"
                          required
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center space-x-2 text-rose-400 bg-rose-500/10 p-3 rounded-lg border border-rose-500/30 text-sm font-medium"
              >
                <Info className="w-4 h-4" />
                <span>{error}</span>
              </motion.div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full relative group overflow-hidden bg-sky-500 hover:bg-sky-400 py-4 rounded-xl text-white font-bold tracking-widest transition-all disabled:opacity-50 shadow-lg shadow-sky-500/20"
            >
              <div className="relative z-10 flex items-center justify-center space-x-2">
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>AUTENTIKASI SISTEM</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </div>
              
              {/* Shine effect */}
              <div className="absolute top-0 -left-[100%] w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:left-[100%] transition-all duration-1000 ease-in-out" />
            </button>
          </form>

          {/* Quick Info / Roles for Demo */}
          <div className="mt-8 pt-6 border-t border-sky-500/20 text-center">
            <div className="inline-flex items-center space-x-2 text-sky-300 text-[10px] tracking-[0.2em] uppercase bg-sky-500/10 px-4 py-2 rounded-full border border-sky-500/20">
              <ShieldCheck className="w-3 h-3 text-sky-400" />
              <span>Sistem Keamanan Terintegrasi</span>
            </div>
            
            <div className="mt-6 grid grid-cols-3 gap-2 opacity-50 group hover:opacity-100 transition-opacity">
               <div className="text-[10px] text-sky-300 p-1.5 border border-sky-500/20 rounded cursor-help font-bold tracking-widest" title="LobarAdmin / @Lombok1_1">ADMIN</div>
               <div className="text-[10px] text-sky-300 p-1.5 border border-sky-500/20 rounded cursor-help font-bold tracking-widest" title="LobarUser / @Lombok2_2">STAFF</div>
               <div className="text-[10px] text-sky-300 p-1.5 border border-sky-500/20 rounded cursor-help font-bold tracking-widest" title="LobarView / @Lombok3_3">VIEWER</div>
            </div>
          </div>
        </div>
        
        <p className="mt-8 text-center text-sky-400/50 text-xs tracking-[0.3em] uppercase font-medium">
          © 2024 BAPPERIDA LOMBOK BARAT
        </p>
      </motion.div>
    </div>
  );
};

export default LoginPage;
