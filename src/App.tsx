import React, { useState, useEffect, useRef } from 'react'
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
    const [filterYear, setFilterYear] = useState<string>('2026');

    // Global Data Source Mode
    const [dataSourceMode, setDataSourceMode] = useState<'supabase' | 'local'>(() => {
        return (localStorage.getItem('sigades_data_mode') as 'supabase' | 'local') || 'supabase';
    });

    // Global Data State
    const [globalData, setGlobalData] = useState<ProjectData[]>([]);
    const [isGlobalLoading, setIsGlobalLoading] = useState(true);

    const latestFetchIdRef = useRef(0);

    const fetchGlobalData = React.useCallback(async () => {
        // Skip fetching if selectedVersion year doesn't match filterYear (intermediate state during sync)
        if (selectedVersion && selectedVersion !== 'Default') {
            const match = selectedVersion.match(/\b(202[0-9]|2030)\b/);
            if (match && match[0] !== filterYear) {
                console.log('Skipping fetch: year mismatch between selectedVersion and filterYear (sync in progress)');
                return;
            }
        }

        const fetchId = ++latestFetchIdRef.current;
        setIsGlobalLoading(true);

        try {
            const service = getProjectService(dataSourceMode);
            let allData: ProjectData[] = [];
            let page = 0;
            const pageSize = 1000;
            let hasMore = true;

            while (hasMore) {
                const response = await service.getAllProjects(selectedVersion || undefined, page, pageSize);
                if (fetchId !== latestFetchIdRef.current) {
                    console.log('Aborting stale fetch...');
                    return;
                }

                let chunk = response.data;
                if (filterYear) {
                    chunk = chunk.filter(item => item.dataVersion?.includes(filterYear));
                }
                if (chunk && chunk.length > 0) {
                    allData = [...allData, ...chunk];
                }
                hasMore = response.hasMore;
                page++;
            }

            if (fetchId === latestFetchIdRef.current) {
                setGlobalData(allData);
            }
        } catch (error) {
            if (fetchId === latestFetchIdRef.current) {
                console.error('Error fetching global data:', error);
            }
        } finally {
            if (fetchId === latestFetchIdRef.current) {
                setIsGlobalLoading(false);
            }
        }
    }, [dataSourceMode, selectedVersion, filterYear]);

    useEffect(() => {
        if (step === 'app') {
            fetchGlobalData();
        }
    }, [fetchGlobalData, step]);

    useEffect(() => {
        localStorage.setItem('sigades_data_mode', dataSourceMode);
        if (step === 'app') {
            fetchVersions();
        }
    }, [dataSourceMode, step]); // Refetch when mode changes or app starts

    // Single ref-based sync to resolve year & version synchronization conflicts
    const prevVersionRef = useRef(selectedVersion);
    const prevYearRef = useRef(filterYear);

    useEffect(() => {
        const prevVersion = prevVersionRef.current;
        const prevYear = prevYearRef.current;

        const hasVersions = availableVersions.length > 0 && !availableVersions.includes('Default');

        // 1. If version changed, sync year to version
        if (selectedVersion !== prevVersion) {
            prevVersionRef.current = selectedVersion;
            const match = selectedVersion.match(/\b(202[0-9]|2030)\b/);
            if (match && match[0] !== filterYear) {
                setFilterYear(match[0]);
                prevYearRef.current = match[0];
            }
        }
        // 2. If year changed, sync version to year (only if versions are loaded)
        else if (filterYear !== prevYear) {
            if (hasVersions) {
                prevYearRef.current = filterYear;
                const baseName = selectedVersion.replace(/\s\d{4}$/, '').trim() || 'Default';
                const targetVersion = `${baseName} ${filterYear}`.trim();
                
                if (availableVersions.includes(targetVersion) && selectedVersion !== targetVersion) {
                    setSelectedVersion(targetVersion);
                    prevVersionRef.current = targetVersion;
                } else if (!selectedVersion.includes(filterYear)) {
                    const fallback = availableVersions.find(v => v.includes(filterYear));
                    if (fallback && fallback !== selectedVersion) {
                        setSelectedVersion(fallback);
                        prevVersionRef.current = fallback;
                    }
                }
            }
        }
        // 3. If availableVersions just loaded, and we are out of sync, sync now!
        else if (hasVersions) {
            const match = selectedVersion.match(/\b(202[0-9]|2030)\b/);
            const versionYear = match ? match[0] : null;
            if (versionYear && versionYear !== filterYear) {
                const fallback = availableVersions.find(v => v.includes(filterYear));
                if (fallback && fallback !== selectedVersion) {
                    setSelectedVersion(fallback);
                    prevVersionRef.current = fallback;
                    prevYearRef.current = filterYear;
                }
            }
        }
    }, [selectedVersion, filterYear, availableVersions]);

    const fetchVersions = async (newSelectedVersion?: string) => {
        try {
            console.log('Fetching versions... Mode:', dataSourceMode);
            const service = getProjectService(dataSourceMode);
            const versions = await service.getUniqueVersions();

            console.log('Unique versions:', versions);

            if (newSelectedVersion && !versions.includes(newSelectedVersion)) {
                versions.push(newSelectedVersion);
                versions.sort();
            }

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
            filterYear={filterYear}
            setFilterYear={setFilterYear}
            user={user}
            onLogout={handleLogout}
            dataSourceMode={dataSourceMode}
            setDataSourceMode={setDataSourceMode}
        >
            {activePage === 'Peta Interaktif' && (
                <MapContainer 
                    selectedProject={selectedProject} 
                    selectedVersion={selectedVersion} 
                    filterYear={filterYear} 
                    dataSourceMode={dataSourceMode} 
                    globalData={globalData} 
                />
            )}
            {activePage === 'Data Desa' && (
                <DataDesa
                    onBack={() => setActivePage('Peta Interaktif')}
                    onViewMap={handleViewMap}
                    selectedVersion={selectedVersion}
                    filterYear={filterYear}
                    onVersionChange={fetchVersions} // Refresh versions after import
                    dataSourceMode={dataSourceMode}
                    setDataSourceMode={setDataSourceMode}
                    user={user}
                    globalData={globalData}
                    isGlobalLoading={isGlobalLoading}
                    refreshData={fetchGlobalData}
                />
            )}
            {activePage === 'Dashboard Interaktif' && (
                <BreakdownAnggaranPage 
                    selectedVersion={selectedVersion} 
                    dataSourceMode={dataSourceMode} 
                    filterYear={filterYear} 
                    setFilterYear={setFilterYear} 
                    globalData={globalData} 
                    isGlobalLoading={isGlobalLoading} 
                />
            )}

            {activePage === 'Pengaturan' && (
                <ComingSoon title={activePage} />
            )}
        </MainLayout>
    )
}

export default App
