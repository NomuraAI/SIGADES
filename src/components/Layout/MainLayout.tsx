import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

interface MainLayoutProps {
    children: React.ReactNode;
    activePage: string;
    setActivePage: (page: string) => void;
    selectedVersion: string;
    availableVersions: string[];
    setSelectedVersion: (version: string) => void;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children, activePage, setActivePage, selectedVersion, availableVersions, setSelectedVersion }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    return (
        <div className="flex h-[100dvh] w-full bg-slate-900 overflow-hidden">
            <Sidebar
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
                activeItem={activePage}
                setActiveItem={setActivePage}
                selectedVersion={selectedVersion}
                availableVersions={availableVersions}
                setSelectedVersion={setSelectedVersion}
            />

            <div className="flex-1 flex flex-col h-full w-full relative">
                <Header toggleSidebar={toggleSidebar} />

                <main className="flex-1 relative overflow-hidden bg-slate-50 min-h-0">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default MainLayout;
