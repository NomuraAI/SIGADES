import { Menu, Map as MapIcon, User as UserIcon, LogOut, ChevronDown } from 'lucide-react';
import { User } from '../../types';

interface HeaderProps {
    toggleSidebar: () => void;
    user: User | null;
    onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ toggleSidebar, user, onLogout }) => {
    return (
        <header className="h-16 md:h-24 bg-gradient-to-r from-lobar-red to-red-800 text-white shadow-md flex items-center justify-between px-3 md:px-4 z-20 relative">
            <div className="flex items-center gap-2 md:gap-4">
                <button
                    onClick={toggleSidebar}
                    className="p-1.5 md:p-2 hover:bg-white/20 rounded-lg transition-colors text-white"
                >
                    <Menu className="w-5 h-5 md:w-6 md:h-6" />
                </button>
                <div className="flex items-center gap-2 md:gap-3">
                    <img src="/logo_lombok_barat.png" alt="Logo Lombok Barat" className="h-8 md:h-12 w-auto drop-shadow-md" />
                    <div>
                        <h1 className="text-lg md:text-xl font-bold text-white tracking-tight drop-shadow-sm leading-none md:leading-tight">
                            SIGADES
                        </h1>
                        <p className="text-[8px] md:text-xs text-yellow-300 font-medium tracking-wider uppercase">Bapperida LOBAR</p>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-4 md:gap-6">
                <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-white/10 border border-yellow-400/30 rounded-full text-white text-[10px] font-medium uppercase tracking-widest">
                    <MapIcon size={12} className="text-yellow-300" />
                    <span>Infrastruktur & Desa</span>
                </div>

                {user && (
                    <div className="flex items-center gap-3 pl-4 border-l border-white/20">
                        <div className="hidden md:block text-right">
                            <p className="text-xs font-bold text-white leading-none">{user.name}</p>
                            <p className="text-[10px] text-yellow-300/80 uppercase tracking-tighter mt-1">{user.role}</p>
                        </div>
                        <div className="group relative">
                            <button className="flex items-center gap-2 p-1 hover:bg-white/10 rounded-lg transition-all">
                                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/20 flex items-center justify-center border border-white/30">
                                    <UserIcon size={18} />
                                </div>
                                <ChevronDown size={14} className="opacity-50" />
                            </button>
                            
                            {/* Dropdown Menu */}
                            <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-2xl border border-slate-200 py-2 hidden group-hover:block lg:group-hover:block animate-in fade-in slide-in-from-top-2 duration-200">
                                <div className="px-4 py-2 border-b border-slate-100 mb-1">
                                    <p className="text-xs font-bold text-slate-800">{user.name}</p>
                                    <p className="text-[10px] text-slate-500 uppercase">{user.role}</p>
                                </div>
                                <button 
                                    onClick={onLogout}
                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50 transition-colors"
                                >
                                    <LogOut size={16} />
                                    <span className="font-bold">Keluar Sistem</span>
                                </button>
                            </div>
                        </div>

                        {/* Direct Logout for small screens or quick access */}
                        <button 
                            onClick={onLogout}
                            className="flex lg:hidden items-center justify-center p-2 text-white hover:bg-white/10 rounded-lg transition-all"
                            title="Keluar"
                        >
                            <LogOut size={20} />
                        </button>
                    </div>
                )}

                <img src="/logo_kerja_nyata.png" alt="Logo Kerja Nyata" className="h-8 md:h-16 w-auto object-contain drop-shadow-sm opacity-80" />
            </div>
        </header>
    );
};

export default Header;
