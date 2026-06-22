import React, { useState } from 'react';
import { Map as MapIcon, User as UserIcon, Database } from 'lucide-react';
import { User } from '../../types';
import WeatherInfo from './WeatherInfo';

interface HeaderProps {
    user: User | null;
    onLogout: () => void;
    selectedVersion: string;
    availableVersions: string[];
    setSelectedVersion: (version: string) => void;
    activePage: string;
    setActivePage: (page: string) => void;
    filterYear: string;
    setFilterYear: (year: string) => void;
}

const Header: React.FC<HeaderProps> = ({ 
    user, 
    onLogout, 
    selectedVersion, 
    availableVersions, 
    setSelectedVersion,
    activePage,
    setActivePage,
    filterYear,
    setFilterYear
}) => {
    const menuItems = [
        { id: 'Dashboard Interaktif', label: 'Dashboard', roles: ['admin', 'user', 'viewer'] },
        { id: 'Peta Interaktif', label: 'Peta', roles: ['admin', 'user', 'viewer'] },
        { id: 'Data Desa', label: 'Data Desa', roles: ['admin', 'user', 'viewer'] },
        { id: 'Pengaturan', label: 'Admin', roles: ['admin'] },
    ].filter(item => item.roles.includes(user?.role || 'viewer'));

    return (
        <header className="bg-gradient-to-r from-[#002e5d] to-[#001a35] text-white shadow-md flex flex-col z-20 relative border-b border-white/10">
            <div className="h-16 md:h-24 flex items-center justify-between px-3 md:px-6">
                <div className="flex items-center gap-4 md:gap-8">
                    <div className="flex items-center gap-2 md:gap-3">
                        <img src="/logo_lombok_barat.png" alt="Logo Lombok Barat" className="h-8 md:h-12 w-auto drop-shadow-md" />
                        <div>
                            <h1 className="text-lg md:text-xl font-bold text-white tracking-tight drop-shadow-sm leading-none md:leading-tight">
                                SIGADES
                            </h1>
                            <p className="text-[8px] md:text-xs text-yellow-300 font-medium tracking-wider uppercase">Bapperida LOBAR</p>
                        </div>
                    </div>

                    {/* Main Navigation - Desktop */}
                    <div className="hidden lg:flex items-center bg-white/10 rounded-full p-1 border border-white/10">
                        {menuItems.map(item => (
                            <button
                                key={item.id}
                                onClick={() => setActivePage(item.id)}
                                className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-300 ${activePage === item.id ? 'bg-yellow-400 text-slate-900 shadow-sm' : 'text-slate-300 hover:text-white hover:bg-white/20'}`}
                            >
                                {item.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex items-center gap-3 md:gap-6">
                    {/* Version Selector */}
                    <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-white/10 border border-white/20 rounded-full">
                        <Database size={14} className="text-yellow-300" />
                        <select
                            value={selectedVersion}
                            onChange={(e) => setSelectedVersion(e.target.value)}
                            className="bg-transparent text-white text-[10px] font-bold uppercase tracking-widest outline-none cursor-pointer"
                        >
                            {availableVersions.map(v => (
                                <option key={v} value={v} className="bg-slate-800 text-white">{v}</option>
                            ))}
                        </select>
                    </div>

                    {/* Weather Info */}
                    <div className="hidden sm:block">
                        <WeatherInfo />
                    </div>

                    {user && (
                        <div className="flex items-center gap-3 pl-4 border-l border-white/20">
                            <div className="hidden md:block text-right">
                                <p className="text-[10px] text-yellow-300 font-bold uppercase tracking-widest">
                                    {user.role === 'admin' ? 'Admin Bapperida' : 
                                     user.role === 'user' ? 'Staff Perencana' : 'Viewer Umum'}
                                </p>
                            </div>
                            {/* Logout Button */}
                            <button 
                                onClick={onLogout}
                                className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/10 hover:bg-rose-500/80 transition-colors flex items-center justify-center border border-white/30 shadow-inner group"
                                title="Keluar"
                            >
                                <UserIcon size={18} className="group-hover:hidden" />
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="hidden group-hover:block"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                            </button>
                        </div>
                    )}

                    <img 
                        src="/logo_kerja_nyata.png" 
                        alt="Logo Kerja Nyata" 
                        className="h-8 md:h-16 w-auto object-contain opacity-90 filter drop-shadow-[0_0_2px_rgba(255,255,255,0.8)]" 
                    />
                </div>
            </div>

            {/* Main Navigation - Mobile */}
            <div className="lg:hidden w-full overflow-x-auto flex items-center gap-2 px-3 pb-3 custom-scrollbar">
                {menuItems.map(item => (
                    <button
                        key={item.id}
                        onClick={() => setActivePage(item.id)}
                        className={`whitespace-nowrap px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-300 shadow-sm ${activePage === item.id ? 'bg-yellow-400 text-slate-900' : 'bg-white/10 text-white hover:bg-white/20'}`}
                    >
                        {item.label}
                    </button>
                ))}
            </div>
        </header>
    );
};

export default Header;
