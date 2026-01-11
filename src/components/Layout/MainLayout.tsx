import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

interface MainLayoutProps {
    children: React.ReactNode;
    activePage: string;
    setActivePage: (page: string) => void;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children, activePage, setActivePage }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    return (
        <div className="flex h-screen w-full bg-slate-900 overflow-hidden">
            <Sidebar
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
                activeItem={activePage}
                setActiveItem={setActivePage}
            />

            <div className="flex-1 flex flex-col h-full w-full relative">
                <Header toggleSidebar={toggleSidebar} />

                <main className="flex-1 relative overflow-hidden bg-slate-50">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default MainLayout;
