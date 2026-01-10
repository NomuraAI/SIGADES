import React from 'react';
import { Menu, Map as MapIcon } from 'lucide-react';

interface HeaderProps {
    toggleSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ toggleSidebar }) => {
    return (
        <header className="h-16 bg-gradient-to-r from-lobar-red to-red-800 text-white shadow-md flex items-center justify-between px-4 z-20 relative">
            <div className="flex items-center gap-4">
                <button
                    onClick={toggleSidebar}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors text-white"
                >
                    <Menu size={24} />
                </button>
                <div className="flex items-center gap-3">
                    <img src="/logo_lombok_barat.png" alt="Logo Lombok Barat" className="h-10 w-auto drop-shadow-md" />
                    <div>
                        <h1 className="text-xl font-bold text-white tracking-tight drop-shadow-sm">
                            SIGADES
                        </h1>
                        <p className="text-xs text-yellow-300 font-medium tracking-wider">KABUPATEN LOMBOK BARAT</p>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-3">
                <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-white/10 border border-yellow-400/30 rounded-full text-white text-xs font-medium">
                    <MapIcon size={14} className="text-yellow-300" />
                    <span>PETA INFRASTRUKTUR</span>
                </div>
            </div>
        </header>
    );
};

export default Header;
