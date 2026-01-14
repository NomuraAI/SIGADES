import React, { useState } from 'react'
import MainLayout from './components/Layout/MainLayout'
import MapContainer from './components/Map/MapContainer'
import DataDesa from './components/DataDesa/DataDesa'

import ComingSoon from './components/Common/ComingSoon';
import BreakdownAnggaranPage from './components/BreakdownAnggaran/BreakdownAnggaranPage';

import { ProjectData } from './types';

const App = () => {
    const [activePage, setActivePage] = useState('Peta Interaktif');
    const [selectedProject, setSelectedProject] = useState<ProjectData | null>(null);

    const handleViewMap = (project: ProjectData) => {
        setSelectedProject(project);
        setActivePage('Peta Interaktif');
    };

    return (
        <MainLayout activePage={activePage} setActivePage={setActivePage}>
            {activePage === 'Peta Interaktif' && <MapContainer selectedProject={selectedProject} />}
            {activePage === 'Data Desa' && <DataDesa onBack={() => setActivePage('Peta Interaktif')} onViewMap={handleViewMap} />}
            {activePage === 'Breakdown Anggaran Desa' && <BreakdownAnggaranPage />}

            {(activePage === 'Monitoring Proyek' || activePage === 'Pengaduan Warga' || activePage === 'Pengaturan') && (
                <ComingSoon title={activePage} />
            )}
        </MainLayout>
    )
}

export default App
