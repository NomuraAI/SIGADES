import React from 'react';
import { motion } from 'framer-motion';
import { 
  PieChart, 
  MapPin, 
  Building2, 
  Settings, 
  LogOut,
  LayoutDashboard
} from 'lucide-react';
import { User } from '../../types';

interface FloatingMenuProps {
  activeItem: string;
  setActiveItem: (item: string) => void;
  user: User | null;
  onLogout: () => void;
}

const FloatingMenu: React.FC<FloatingMenuProps> = ({ 
  activeItem, 
  setActiveItem, 
  user, 
  onLogout 
}) => {
  const allMenuItems = [
    { 
      id: 'Dashboard Interaktif', 
      icon: <LayoutDashboard className="w-6 h-6" />, 
      label: 'Dashboard', 
      color: 'from-indigo-500 to-purple-600',
      roles: ['admin', 'user', 'viewer'] 
    },
    { 
      id: 'Peta Interaktif', 
      icon: <MapPin className="w-6 h-6" />, 
      label: 'Peta', 
      color: 'from-emerald-400 to-teal-600',
      roles: ['admin', 'user', 'viewer'] 
    },
    { 
      id: 'Data Desa', 
      icon: <Building2 className="w-6 h-6" />, 
      label: 'Data Desa', 
      color: 'from-amber-400 to-orange-600',
      roles: ['admin', 'user'] 
    },
    { 
      id: 'Pengaturan', 
      icon: <Settings className="w-6 h-6" />, 
      label: 'Admin', 
      color: 'from-slate-400 to-slate-600',
      roles: ['admin'] 
    },
  ];

  const menuItems = allMenuItems.filter(item => item.roles.includes(user?.role || 'viewer'));

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 px-4 w-full max-w-fit">
      <motion.div 
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-slate-900/80 backdrop-blur-2xl border border-white/20 rounded-full p-2 shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex items-center gap-1 md:gap-4"
      >
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveItem(item.id)}
            className="relative group px-3 md:px-6 py-3 flex flex-col items-center gap-1 transition-all"
          >
            {activeItem === item.id && (
              <motion.div 
                layoutId="floating-active"
                className="absolute inset-0 bg-white/10 rounded-full border border-white/20"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
            
            <div className={`
              relative z-10 p-2 rounded-xl transition-all duration-300
              ${activeItem === item.id 
                ? `bg-gradient-to-br ${item.color} text-white shadow-lg scale-110` 
                : 'text-slate-400 group-hover:text-white group-hover:scale-110'}
            `}>
              {item.icon}
            </div>
            
            <span className={`
              text-[10px] font-bold uppercase tracking-widest transition-all duration-300
              ${activeItem === item.id ? 'text-white opacity-100' : 'text-slate-500 opacity-0 group-hover:opacity-100'}
            `}>
              {item.label}
            </span>
          </button>
        ))}

        <div className="w-px h-10 bg-white/10 mx-2" />

        <button
          onClick={onLogout}
          className="relative group px-3 md:px-6 py-3 flex flex-col items-center gap-1 text-rose-500 hover:text-rose-400 transition-all"
        >
          <div className="p-2 rounded-xl group-hover:bg-rose-500/10 group-hover:scale-110 transition-all">
            <LogOut className="w-6 h-6" />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100">Keluar</span>
        </button>
      </motion.div>
    </div>
  );
};

export default FloatingMenu;
