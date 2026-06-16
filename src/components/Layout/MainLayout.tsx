import React from 'react';
import Header from './Header';
import { User } from '../../types';

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

                <main className="flex-1 relative overflow-y-auto overflow-x-hidden bg-slate-50 min-h-0 pb-24 md:pb-0">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default MainLayout;
