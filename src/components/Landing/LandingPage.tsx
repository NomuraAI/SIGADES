import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogIn, MapPin, Radio, Share2 } from 'lucide-react';

interface LandingPageProps {
  onLogin: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onLogin }) => {
  const [showContent, setShowContent] = useState(false);
  const [mapFaded, setMapFaded] = useState(false);

  useEffect(() => {
    // Sequence of animations
    const timer1 = setTimeout(() => setMapFaded(true), 2800);
    const timer2 = setTimeout(() => setShowContent(true), 3000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  return (
    <div className="relative min-h-screen w-full bg-[#030a12] overflow-hidden font-['Rajdhani'] selection:bg-sky-500/30">
      {/* Grid Background & Crosshairs */}
      <div 
        className="absolute inset-0 z-1 opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(rgba(14, 165, 233, 0.15) 1px, transparent 1px),
            linear-gradient(90deg, rgba(14, 165, 233, 0.15) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
          backgroundPosition: 'center center'
        }}
      />
      
      {/* Crosshairs */}
      <div className="absolute top-5 left-5 w-12 h-12 border-l-2 border-t-2 border-sky-400/50 z-2" />
      <div className="absolute top-5 right-5 w-12 h-12 border-r-2 border-t-2 border-sky-400/50 z-2" />
      <div className="absolute bottom-5 left-5 w-12 h-12 border-l-2 border-b-2 border-sky-400/50 z-2" />
      <div className="absolute bottom-5 right-5 w-12 h-12 border-r-2 border-b-2 border-sky-400/50 z-2" />

      {/* Map Layers */}
      <AnimatePresence>
        {!mapFaded && (
          <motion.div 
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.2, filter: 'blur(10px)' }}
            transition={{ duration: 1 }}
            className="absolute inset-0 flex items-center justify-center z-2 pointer-events-none"
          >
            {/* Radar Box */}
            <div className="relative w-[350px] h-[350px] md:w-[450px] md:h-[450px] border border-sky-500/20 rounded-full flex items-center justify-center">
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 rounded-full"
                style={{
                  background: 'conic-gradient(from 0deg, transparent 70%, rgba(14, 165, 233, 0.4) 100%)'
                }}
              />
              
              {/* Network SVG */}
              <svg className="w-[320px] h-[200px] z-3" viewBox="0 0 320 200">
                {/* Paths */}
                <motion.path 
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1.5, delay: 0.2 }}
                  d="M 40 160 L 120 100 L 200 130 L 280 60"
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="2.5"
                  className="drop-shadow-[0_0_5px_#38bdf8]"
                />
                <motion.path 
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1.5, delay: 0.7 }}
                  d="M 120 100 L 100 40"
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="2.5"
                  className="drop-shadow-[0_0_5px_#38bdf8]"
                />
                <motion.path 
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1.5, delay: 1.2 }}
                  d="M 200 130 L 230 180"
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="2.5"
                  className="drop-shadow-[0_0_5px_#38bdf8]"
                />
                
                {/* Nodes */}
                {[
                  { cx: 40, cy: 160, delay: 0.2 },
                  { cx: 100, cy: 40, delay: 0.7 },
                  { cx: 120, cy: 100, delay: 1.2 },
                  { cx: 230, cy: 180, delay: 1.7 },
                  { cx: 280, cy: 60, delay: 2.2 },
                ].map((node, i) => (
                  <motion.circle 
                    key={i}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 20, delay: node.delay }}
                    cx={node.cx}
                    cy={node.cy}
                    r={6}
                    fill="#f97316"
                    className="drop-shadow-[0_0_8px_#f97316]"
                  />
                ))}
              </svg>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 text-center">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -100, scale: 0.5 }}
          animate={showContent ? { opacity: 1, y: 0, scale: 1 } : {}}
          transition={{ type: 'spring', stiffness: 100, damping: 15, delay: 0.2 }}
          className="relative mb-8 group"
        >
          {/* Pulsing glow */}
          <div className="absolute -inset-4 bg-sky-500/20 rounded-full blur-2xl group-hover:bg-sky-500/30 transition-all duration-500 animate-pulse" />
          
          <img 
            src="/Logo Lobar Blue.png" 
            alt="Logo Lombok Barat" 
            className="w-32 h-32 md:w-40 md:h-40 object-contain relative z-10 filter drop-shadow-2xl"
          />
          
          {/* Reflection beneath logo */}
          <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-4/5 h-4 bg-radial-gradient from-sky-500/40 to-transparent blur-sm" />
        </motion.div>

        {/* Text Area */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={showContent ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="space-y-4"
        >
          <div className="space-y-1">
            <h1 className="text-6xl md:text-8xl font-bold tracking-[0.1em] text-white drop-shadow-[0_0_20px_rgba(14,165,233,0.5)]">
              SI-GADES
            </h1>
            <div className="h-1 w-24 bg-orange-500 mx-auto rounded-full shadow-[0_0_10px_#f97316]" />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-xl md:text-2xl font-semibold tracking-[0.3em] text-orange-500">
              BAPPERIDA KABUPATEN LOMBOK BARAT
            </h2>
            <p className="text-sky-300/60 font-['Inter'] text-sm md:text-base tracking-widest uppercase">
              Sistem Infrastruktur Geo-Spasial Berbasis Desa
            </p>
          </div>

          {/* Login Button */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={showContent ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.5, delay: 1 }}
            className="pt-12"
          >
            <button
              onClick={onLogin}
              className="group relative px-10 py-4 bg-transparent overflow-hidden rounded-lg transition-all duration-300"
            >
              {/* Button Background with animated gradient */}
              <div className="absolute inset-0 bg-gradient-to-r from-sky-600/20 to-indigo-600/20 border border-sky-500/50 group-hover:border-sky-400 group-hover:from-sky-600/40 group-hover:to-indigo-600/40 transition-all duration-300" />
              
              {/* Corner Accents */}
              <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-sky-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-sky-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-sky-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-sky-400 opacity-0 group-hover:opacity-100 transition-opacity" />

              {/* Content */}
              <div className="relative z-10 flex items-center space-x-3 text-sky-100 font-bold text-lg tracking-widest">
                <LogIn className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                <span>LOGIN KE SI-GADES</span>
              </div>
              
              {/* Hover Glow */}
              <div className="absolute inset-0 -z-10 bg-sky-400/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </button>
          </motion.div>
        </motion.div>
      </div>

      {/* Decorative Elements */}
      <div className="fixed bottom-10 left-10 flex flex-col space-y-4 opacity-30 text-sky-400 text-xs tracking-tighter">
        <div className="flex items-center space-x-2">
          <Radio className="w-3 h-3 animate-pulse" />
          <span>LAT: -8.6853 | LONG: 116.1167</span>
        </div>
        <div className="flex items-center space-x-2">
          <MapPin className="w-3 h-3" />
          <span>PRECISION: HIGH-RESOLUTION</span>
        </div>
      </div>
      
      <div className="fixed bottom-10 right-10 flex space-x-6 opacity-30 text-sky-400 text-xs uppercase tracking-[0.2em]">
        <span className="flex items-center gap-2"><Share2 className="w-3 h-3" /> G-SYSTEM v2.0</span>
        <span>© 2024 BAPPERIDA</span>
      </div>
    </div>
  );
};

export default LandingPage;
