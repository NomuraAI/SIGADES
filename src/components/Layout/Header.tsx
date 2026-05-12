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
}

const Header: React.FC<HeaderProps> = ({ 
    user, 
    onLogout, 
    selectedVersion, 
    availableVersions, 
    setSelectedVersion 
}) => {
    return (
        <header className="h-16 md:h-24 bg-gradient-to-r from-[#002e5d] to-[#001a35] text-white shadow-md flex items-center justify-between px-3 md:px-6 z-20 relative border-b border-white/10">
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

                {/* Version Selector - Moved from Sidebar */}
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
            </div>

            <div className="flex items-center gap-3 md:gap-6">
                {/* Weather Info - Moved from Sidebar */}
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
                        {/* User Icon Only - No Menu */}
                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/20 flex items-center justify-center border border-white/30 shadow-inner">
                            <UserIcon size={18} />
                        </div>
                    </div>
                )}

                <img 
                    src="/logo_kerja_nyata.png" 
                    alt="Logo Kerja Nyata" 
                    className="h-8 md:h-16 w-auto object-contain opacity-90 filter drop-shadow-[0_0_2px_rgba(255,255,255,0.8)]" 
                />
            </div>
        </header>
    );
};

export default Header;
