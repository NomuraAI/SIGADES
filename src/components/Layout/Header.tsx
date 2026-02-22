import React from 'react';
import { Menu, Map as MapIcon } from 'lucide-react';

interface HeaderProps {
    toggleSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ toggleSidebar }) => {
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
                        <p className="text-[8px] md:text-xs text-yellow-300 font-medium tracking-wider">KAB. LOMBOK BARAT</p>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-3">
                <img src="/logo_kerja_nyata.png" alt="Logo Kerja Nyata" className="h-10 md:h-20 w-auto object-contain drop-shadow-sm" />
                <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-white/10 border border-yellow-400/30 rounded-full text-white text-xs font-medium">
                    <MapIcon size={14} className="text-yellow-300" />
                    <span>PETA INFRASTRUKTUR</span>
                </div>
            </div>
        </header>
    );
};

export default Header;
