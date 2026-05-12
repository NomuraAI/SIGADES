import React from 'react';
import Header from './Header';
import FloatingMenu from './FloatingMenu';
import { User } from '../../types';

interface MainLayoutProps {
    children: React.ReactNode;
    activePage: string;
    setActivePage: (page: string) => void;
    selectedVersion: string;
    availableVersions: string[];
    setSelectedVersion: (version: string) => void;
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
    user,
    onLogout
}) => {
    return (
        <div className="flex h-[100dvh] w-full bg-slate-900 overflow-hidden font-['Inter']">
            <div className="flex-1 flex flex-col h-full w-full relative">
                <Header 
                    user={user} 
                    onLogout={onLogout} 
                    selectedVersion={selectedVersion}
                    availableVersions={availableVersions}
                    setSelectedVersion={setSelectedVersion}
                />

                <main className="flex-1 relative overflow-y-auto overflow-x-hidden bg-slate-50 min-h-0 pb-24 md:pb-0">
                    {children}
                </main>

                <FloatingMenu 
                    activeItem={activePage}
                    setActiveItem={setActivePage}
                    user={user}
                    onLogout={onLogout}
                />
            </div>
        </div>
    );
};

export default MainLayout;
