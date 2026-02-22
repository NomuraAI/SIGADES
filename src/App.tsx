import React, { useState, useEffect } from 'react'
import MainLayout from './components/Layout/MainLayout'
import MapContainer from './components/Map/MapContainer'
import DataDesa from './components/DataDesa/DataDesa'
import { getProjectService } from './services/projectService'
import { Database, HardDrive } from 'lucide-react'

import ComingSoon from './components/Common/ComingSoon';
import BreakdownAnggaranPage from './components/BreakdownAnggaran/BreakdownAnggaranPage';

import { ProjectData } from './types';

const App = () => {
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
        fetchVersions();
    }, [dataSourceMode]); // Refetch when mode changes

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

    const handleViewMap = (project: ProjectData) => {
        setSelectedProject(project);
        setActivePage('Peta Interaktif');
    };

    return (
        <MainLayout
            activePage={activePage}
            setActivePage={setActivePage}
            selectedVersion={selectedVersion}
            availableVersions={availableVersions}
            setSelectedVersion={setSelectedVersion}

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
