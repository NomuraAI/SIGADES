import React, { useState, useRef } from 'react';
import Header from './Header';
import { User } from '../../types';
import { ArrowUp } from 'lucide-react';

interface MainLayoutProps {
    children: React.ReactNode;
    activePage: string;
    setActivePage: (page: string) => void;
    selectedVersion: string;
    availableVersions: string[];
    setSelectedVersion: (version: string) => void;
    filterYear: string;
    setFilterYear: (year: string) => void;
    user: User | null;
    onLogout: () => void;
}

const MainLayout: React.FC<MainLayoutProps> = ({ 
    children, 
    activePage, 
    setActivePage, 
    selectedVersion, 
    availableVersions, 
    setSelectedVersion,
    filterYear,
    setFilterYear,
    user,
    onLogout
}) => {
    const [showScrollTop, setShowScrollTop] = useState(false);
    const mainRef = useRef<HTMLElement>(null);

    const handleScroll = (e: React.UIEvent<HTMLElement>) => {
        if (e.currentTarget.scrollTop > 300) {
            setShowScrollTop(true);
        } else {
            setShowScrollTop(false);
        }
    };

    const scrollToTop = () => {
        mainRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <div className="flex h-[100dvh] w-full bg-slate-900 overflow-hidden font-['Inter']">
            <div className="flex-1 flex flex-col h-full w-full relative">
                <Header 
                    user={user} 
                    onLogout={onLogout} 
                    selectedVersion={selectedVersion}
                    availableVersions={availableVersions}
                    setSelectedVersion={setSelectedVersion}
                    filterYear={filterYear}
                    setFilterYear={setFilterYear}
                    activePage={activePage}
                    setActivePage={setActivePage}
                />

                <main 
                    id="main-scroll-container" 
                    ref={mainRef}
                    onScroll={handleScroll}
                    className="flex-1 relative overflow-y-auto overflow-x-hidden bg-slate-50 min-h-0 pb-24 md:pb-0"
                >
                    {children}
                </main>

                {/* Global Scroll to Top Button */}
                <button
                    onClick={scrollToTop}
                    className={`absolute bottom-8 right-8 z-[999] p-4 bg-lobar-blue text-white rounded-full shadow-2xl hover:bg-blue-700 transition-all duration-300 hover:-translate-y-2 group ${showScrollTop ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}
                    title="Kembali ke atas"
                >
                    <ArrowUp size={24} className="group-hover:animate-bounce" />
                </button>
            </div>
        </div>
    );
};

export default MainLayout;
