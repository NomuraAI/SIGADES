import React, { useState, useEffect } from 'react'
import MainLayout from './components/Layout/MainLayout'
import MapContainer from './components/Map/MapContainer'
import DataDesa from './components/DataDesa/DataDesa'
import { getProjectService } from './services/projectService'
import { Database, HardDrive } from 'lucide-react'

import ComingSoon from './components/Common/ComingSoon';
import BreakdownAnggaranPage from './components/BreakdownAnggaran/BreakdownAnggaranPage';
import LandingPage from './components/Landing/LandingPage';
import LoginPage from './components/Auth/LoginPage';

import { ProjectData, User } from './types';

const App = () => {
    const [step, setStep] = useState<'landing' | 'login' | 'app'>(() => {
        const savedUser = localStorage.getItem('sigades_user');
        return savedUser ? 'app' : 'landing';
    });
    const [user, setUser] = useState<User | null>(() => {
        const savedUser = localStorage.getItem('sigades_user');
        return savedUser ? JSON.parse(savedUser) : null;
    });
    
    const [activePage, setActivePage] = useState('Dashboard Interaktif');
    const [selectedProject, setSelectedProject] = useState<ProjectData | null>(null);
    const [selectedVersion, setSelectedVersion] = useState<string>('Default');
    const [availableVersions, setAvailableVersions] = useState<string[]>(['Default']);

    // Global Data Source Mode
    const [dataSourceMode, setDataSourceMode] = useState<'supabase' | 'local'>(() => {
        return (localStorage.getItem('sigades_data_mode') as 'supabase' | 'local') || 'supabase';
    });

    useEffect(() => {
        localStorage.setItem('sigades_data_mode', dataSourceMode);
        if (step === 'app') {
            fetchVersions();
        }
    }, [dataSourceMode, step]); // Refetch when mode changes or app starts

    const fetchVersions = async (newSelectedVersion?: string) => {
        try {
            console.log('Fetching versions... Mode:', dataSourceMode);
            const service = getProjectService(dataSourceMode);
            const versions = await service.getUniqueVersions();

            console.log('Unique versions:', versions);

            if (versions.length > 0) {
                setAvailableVersions(versions);

                // If a specific version was requested (e.g. after import), select it
                if (newSelectedVersion && versions.includes(newSelectedVersion)) {
                    setSelectedVersion(newSelectedVersion);
                }
                // Automatically select the active version if the current one is no longer available
                else if (!versions.includes(selectedVersion)) {
                    setSelectedVersion(versions[0]);
                }
            } else {
                setAvailableVersions(['Default']);
            }
        } catch (error) {
            console.error('Error fetching versions:', error);
        }
    };

    const handleLogin = (userData: User) => {
        setUser(userData);
        localStorage.setItem('sigades_user', JSON.stringify(userData));
        setStep('app');
    };

    const handleLogout = () => {
        localStorage.removeItem('sigades_user');
        setUser(null);
        setStep('login');
    };

    const handleViewMap = (project: ProjectData) => {
        setSelectedProject(project);
        setActivePage('Peta Interaktif');
    };

    if (step === 'landing') {
        return <LandingPage onLogin={() => setStep('login')} />;
    }

    if (step === 'login') {
        return <LoginPage onLogin={handleLogin} onBack={() => setStep('landing')} />;
    }

    return (
        <MainLayout
            activePage={activePage}
            setActivePage={setActivePage}
            selectedVersion={selectedVersion}
            availableVersions={availableVersions}
            setSelectedVersion={setSelectedVersion}
            user={user}
            onLogout={handleLogout}
        >
            {activePage === 'Peta Interaktif' && <MapContainer selectedProject={selectedProject} selectedVersion={selectedVersion} />}
            {activePage === 'Data Desa' && (
                <DataDesa
                    onBack={() => setActivePage('Peta Interaktif')}
                    onViewMap={handleViewMap}
                    selectedVersion={selectedVersion}
                    onVersionChange={fetchVersions} // Refresh versions after import
                    dataSourceMode={dataSourceMode}
                    setDataSourceMode={setDataSourceMode}
                    user={user}
                />
            )}
            {activePage === 'Dashboard Interaktif' && <BreakdownAnggaranPage selectedVersion={selectedVersion} />}

            {activePage === 'Pengaturan' && (
                <ComingSoon title={activePage} />
            )}
        </MainLayout>
    )
}

export default App
