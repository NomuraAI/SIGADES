import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MapContainer as LMapContainer, TileLayer, ZoomControl, Marker, Popup, Circle, useMap, GeoJSON } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Map as MapIcon, Satellite, Mountain, Navigation, Loader2, Layers } from 'lucide-react';
import SearchControl from './SearchControl';
import ProjectMarkers from './ProjectMarkers';
import { supabase } from '../../lib/supabase';
import { ProjectData } from '../../types';
import { OpenStreetMapProvider } from 'leaflet-geosearch';

// Fix for default Leaflet marker icons
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;



const CENTER: [number, number] = [-8.6756, 116.1157];
const ZOOM = 11;

import { getProjectService } from '../../services/projectService';

interface MapContainerProps {
    selectedProject?: ProjectData | null;
    selectedVersion: string;
    filterYear: string;
    dataSourceMode?: 'supabase' | 'local';
}

const SearchSyncHandler = ({ onSearchComplete, permanentProjects }: { onSearchComplete: (location: any, projects: ProjectData[]) => void, permanentProjects: ProjectData[] }) => {
    const map = useMap();

    useEffect(() => {
        const handleSearch = (e: any) => {
            const searchTerm = e.location.label || '';
            const searchKeyword = searchTerm.split(',')[0].trim().toLowerCase();

            const foundProjects = permanentProjects.filter(item => 
                (item.desaKelurahan || '').toLowerCase().includes(searchKeyword) ||
                (item.kecamatan || '').toLowerCase().includes(searchKeyword)
            );

            if (foundProjects.length > 0) {
                const updatedProjects = foundProjects.map(p => ({
                    ...p,
                    latitude: p.latitude || e.location.y,
                    longitude: p.longitude || e.location.x
                }));
                onSearchComplete(e.location, updatedProjects);
            } else {
                onSearchComplete(e.location, []);
            }
        };

        map.on('geosearch/showlocation', handleSearch);
        return () => { map.off('geosearch/showlocation', handleSearch); };
    }, [map, onSearchComplete, permanentProjects]);

    return null;
};

const MapContainer: React.FC<MapContainerProps> = ({ selectedProject, selectedVersion, filterYear, dataSourceMode = 'supabase' }) => {

    const [activeLayer, setActiveLayer] = useState<'streets' | 'satellite' | 'terrain'>('streets');
    const [vizMode, setVizMode] = useState<'default' | 'stunting' | 'poverty' | 'priority' | 'kepadatan' | 'budget'>('default');
    const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
    const [isLocating, setIsLocating] = useState(false);
    const [activeProjects, setActiveProjects] = useState<ProjectData[]>([]);
    const [searchResult, setSearchResult] = useState<{ lat: number, lng: number, label: string } | null>(null);
    const [projectToFocus, setProjectToFocus] = useState<ProjectData | null>(null);
    const [batasDesaData, setBatasDesaData] = useState<any>(null);
    const [showBatasDesa, setShowBatasDesa] = useState(true);
    const mapRef = useRef<L.Map>(null);

    const [permanentProjects, setPermanentProjects] = useState<ProjectData[]>([]);

    const normalizeName = (name: string) => {
        if (!name) return '';
        return name.toLowerCase()
            .replace(/^desa\s+/, '')
            .replace(/^kelurahan\s+/, '')
            .replace(/^kel\.\s+/, '')
            .trim();
    };

    // Calculate total budget per village
    const villageBudgets = React.useMemo(() => {
        const budgets: { [key: string]: number } = {};
        [...permanentProjects, ...activeProjects].forEach(p => {
            if (p.desaKelurahan) {
                const name = normalizeName(p.desaKelurahan);
                budgets[name] = (budgets[name] || 0) + (p.paguAnggaran || 0);
            }
        });
        return budgets;
    }, [permanentProjects, activeProjects]);

    const getBudgetColor = (amount: number) => {
        if (amount >= 10000000000) return '#15803d'; // > 10M - Hijau Tua
        if (amount >= 5000000000) return '#22c55e';  // 5-10M - Hijau
        if (amount >= 2000000000) return '#84cc16';  // 2-5M - Lime
        if (amount >= 1000000000) return '#eab308';  // 1-2M - Kuning
        if (amount > 0) return '#f97316';            // < 1M - Oranye
        return '#94a3b8';                            // No Data - Abu
    };

    const getStuntingColor = (count: number) => {
        if (count >= 50) return '#ef4444'; // Sangat Tinggi (> 50) - Merah
        if (count >= 30) return '#f97316'; // Tinggi (30-50) - Oranye
        if (count >= 15) return '#facc15'; // Sedang (15-30) - Kuning
        if (count >= 5) return '#a3e635';  // Rendah (5-15) - Lime
        if (count > 0) return '#4ade80';   // Sangat Rendah (1-5) - Hijau
        return '#94a3b8';                  // Tidak ada data
    };

    const getPovertyColor = (count: number) => {
        if (count >= 500) return '#ea580c'; // Sangat Tinggi
        if (count >= 250) return '#f97316'; // Tinggi
        if (count >= 100) return '#f59e0b'; // Sedang
        if (count >= 50) return '#38bdf8';  // Rendah
        if (count > 0) return '#2563eb';   // Sangat Rendah
        return '#94a3b8';
    };

    const getPriorityColor = (score: number) => {
        if (score >= 5) return '#7f1d1d'; // Sangat Tinggi / Kritis
        if (score >= 3) return '#ea580c'; // Tinggi / Waspada
        if (score >= 1) return '#f59e0b'; // Sedang / Pantauan
        return '#f1f5f9';                 // Rendah / Stabil
    };

    const getDensityColor = (count: number) => {
        if (count >= 4500) return '#134e4a'; // Sangat Padat
        if (count >= 3000) return '#0d9488'; // Padat
        if (count >= 1500) return '#2dd4bf'; // Sedang
        if (count >= 500) return '#a7f3d0';  // Rendah
        return '#f0fdfa';                  // Sangat Rendah
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(value);
    };

    // Fetch ALL projects on load (even those without coordinates for budget calculation)
    useEffect(() => {
        const fetchAllMarkers = async () => {
            const service = getProjectService(dataSourceMode);
            let allData: ProjectData[] = [];
            let page = 0;
            const pageSize = 1000;
            let hasMore = true;

            while (hasMore) {
                try {
                    const response = await service.getAllProjects(selectedVersion, page, pageSize);
                    let chunk = response.data;

                    if (filterYear) {
                        chunk = chunk.filter(item => item.dataVersion?.includes(filterYear));
                    }

                    if (chunk && chunk.length > 0) {
                        allData = [...allData, ...chunk];
                    }
                    hasMore = response.hasMore;
                    page++;
                } catch (error) {
                    console.error("[MAP DEBUG] Fetch Error:", error);
                    hasMore = false;
                }
            }

            setPermanentProjects(allData);
        };

        fetchAllMarkers();
    }, [selectedVersion, filterYear, dataSourceMode]);

    // Fetch Batas Desa GeoJSON
    useEffect(() => {
        fetch('/batas_desa.json')
            .then(res => res.json())
            .then(data => setBatasDesaData(data))
            .catch(err => console.error("Error loading boundaries:", err));
    }, []);

    // Sync selectedProject (dari DataDesa table) ke projectToFocus dan fetch related
    useEffect(() => {
        const fetchRelatedProjects = async () => {
            if (selectedProject) {
                let relatedProjects: ProjectData[] = [];
                if (selectedProject.desaKelurahan) {
                    relatedProjects = permanentProjects.filter(p => p.desaKelurahan === selectedProject.desaKelurahan);
                }

                if (relatedProjects.length === 0) {
                    relatedProjects = [selectedProject];
                }

                if (selectedProject.latitude && selectedProject.longitude) {
                    setActiveProjects(relatedProjects);
                    if (mapRef.current) {
                        mapRef.current.flyTo([selectedProject.latitude, selectedProject.longitude], 18);
                    }
                }
                else {
                    const provider = new OpenStreetMapProvider();
                    const query = `Desa ${selectedProject.desaKelurahan}, ${selectedProject.kecamatan}, Lombok Barat`;

                    try {
                        const results = await provider.search({ query });
                        if (results.length > 0) {
                            const { x: lng, y: lat } = results[0];
                            const updatedProjects = relatedProjects.map(p => ({
                                ...p,
                                latitude: p.latitude || lat,
                                longitude: p.longitude || lng
                            }));
                            setActiveProjects(updatedProjects);
                            if (mapRef.current) {
                                mapRef.current.flyTo([lat, lng], 15);
                            }
                        } else {
                            setActiveProjects(relatedProjects);
                        }
                    } catch (error) {
                        console.error("Geocoding error:", error);
                        setActiveProjects(relatedProjects);
                    }
                }
                setSearchResult(null);
            }
        };
        fetchRelatedProjects();
    }, [selectedProject, permanentProjects]);

    const handleSearchComplete = useCallback((location: any, projects: ProjectData[]) => {
        if (projects.length > 0) {
            setActiveProjects(projects);
            setProjectToFocus(projects[0]);
            setSearchResult(null);
        } else {
            setActiveProjects([]);
            setProjectToFocus(null);
            setSearchResult({
                lat: location.y,
                lng: location.x,
                label: location.label
            });
            if (mapRef.current) {
                mapRef.current.flyTo([location.y, location.x], 15);
            }
        }
    }, []);

    useEffect(() => {
        if (userLocation && mapRef.current) {
            mapRef.current.flyTo(userLocation, 15);
        }
    }, [userLocation]);


    const layers = {
        streets: {
            url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
            attribution: '&copy; OSM',
            name: 'Peta Jalan',
            icon: <MapIcon size={20} />,
            color: 'bg-blue-500'
        },
        satellite: {
            url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
            attribution: '&copy; Esri',
            name: 'Satelit',
            icon: <Satellite size={20} />,
            color: 'bg-emerald-600'
        },
        terrain: {
            url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
            attribution: '&copy; Esri',
            name: 'Topografi',
            icon: <Mountain size={20} />,
            color: 'bg-amber-600'
        }
    };

    const handleMyLocation = () => {
        setIsLocating(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const newPos: [number, number] = [pos.coords.latitude, pos.coords.longitude];
                setUserLocation(newPos);
                setIsLocating(false);
            },
            () => setIsLocating(false)
        );
    };


    return (
        <div className="w-full h-full relative z-0">
            <LMapContainer center={CENTER} zoom={ZOOM} className="w-full h-full" zoomControl={false} ref={mapRef}>
                <TileLayer attribution={layers[activeLayer].attribution} url={layers[activeLayer].url} />
                <ZoomControl position="bottomright" />
                <SearchControl />

                {/* Batas Desa Layer */}
                {showBatasDesa && batasDesaData && (
                    <GeoJSON 
                        key={vizMode} // Force re-render when vizMode changes
                        data={batasDesaData} 
                        style={(feature) => {
                            const desaName = normalizeName(feature?.properties.DESA || '');
                            const villageProjects = [...permanentProjects, ...activeProjects].filter(p => 
                                normalizeName(p.desaKelurahan || '') === desaName
                            );

                            let value = 0;
                            let fillColor = '#fdba74';
                            let fillOpacity = 0.1;
                            let weight = 2;

                            if (vizMode === 'budget') {
                                value = villageProjects.reduce((sum, p) => sum + (p.paguAnggaran || 0), 0);
                                fillColor = getBudgetColor(value);
                                fillOpacity = 0.7;
                                weight = 1;
                            } else if (vizMode === 'stunting') {
                                value = villageProjects[0]?.jumlahBalitaStunting || 0;
                                fillColor = getStuntingColor(value);
                                fillOpacity = 0.7;
                                weight = 1;
                            } else if (vizMode === 'poverty') {
                                value = villageProjects[0]?.jumlahAngkaKemiskinan || 0;
                                fillColor = getPovertyColor(value);
                                fillOpacity = 0.7;
                                weight = 1;
                            } else if (vizMode === 'kepadatan') {
                                const density = typeof villageProjects[0]?.kepadatanPenduduk === 'string' 
                                    ? parseFloat((villageProjects[0].kepadatanPenduduk as string).replace(/,/g, '')) 
                                    : villageProjects[0]?.kepadatanPenduduk || 0;
                                value = density;
                                fillColor = getDensityColor(value);
                                fillOpacity = 0.7;
                                weight = 1;
                            } else if (vizMode === 'priority') {
                                // Hitung Skor Komposit (Analytical Priority)
                                const stunting = villageProjects[0]?.jumlahBalitaStunting || 0;
                                const poverty = villageProjects[0]?.jumlahAngkaKemiskinan || 0;
                                
                                let score = 0;
                                // Poin Stunting
                                if (stunting >= 50) score += 3;
                                else if (stunting >= 30) score += 2;
                                else if (stunting >= 15) score += 1;
                                
                                // Poin Kemiskinan
                                if (poverty >= 500) score += 3;
                                else if (poverty >= 250) score += 2;
                                else if (poverty >= 100) score += 1;

                                value = score;
                                fillColor = getPriorityColor(score);
                                fillOpacity = 0.8;
                                weight = 1;
                            }

                            return {
                                color: vizMode === 'budget' ? 'white' : '#f97316',
                                weight: weight,
                                opacity: 0.8,
                                fillColor: fillColor,
                                fillOpacity: fillOpacity
                            };
                        }}
                        onEachFeature={(feature, layer) => {
                            if (feature.properties && feature.properties.DESA) {
                                const desaNameStr = feature.properties.DESA;
                                const normalized = normalizeName(desaNameStr);
                                const villageProjects = [...permanentProjects, ...activeProjects].filter(p => 
                                    normalizeName(p.desaKelurahan || '') === normalized
                                );
                                const budget = villageBudgets[normalized] || 0;

                                layer.bindPopup(`
                                    <div class="p-1 min-w-[180px]">
                                        <h4 class="font-bold text-lobar-blue text-sm border-b pb-1 mb-2">Desa ${feature.properties.DESA}</h4>
                                        <div class="space-y-1.5">
                                            <div class="flex justify-between items-center gap-4">
                                                <span class="text-[9px] text-slate-500 uppercase font-bold">Total Proyek</span>
                                                <span class="text-xs font-extrabold text-blue-700">${villageProjects.length}</span>
                                            </div>
                                            <div class="flex justify-between items-center gap-4">
                                                <span class="text-[9px] text-slate-500 uppercase font-bold">Total Anggaran</span>
                                                <span class="text-xs font-extrabold text-green-700">${formatCurrency(budget)}</span>
                                            </div>
                                            ${vizMode === 'stunting' ? `
                                                <div class="flex justify-between items-center gap-4 border-t pt-1">
                                                    <span class="text-[9px] text-slate-500 uppercase font-bold">Balita Stunting</span>
                                                    <span class="text-xs font-extrabold text-red-600">${villageProjects[0]?.jumlahBalitaStunting || 0}</span>
                                                </div>
                                            ` : vizMode === 'poverty' ? `
                                                <div class="flex justify-between items-center gap-4 border-t pt-1">
                                                    <span class="text-[9px] text-slate-500 uppercase font-bold">Penduduk Miskin</span>
                                                    <span class="text-xs font-extrabold text-orange-600">${villageProjects[0]?.jumlahAngkaKemiskinan || 0} Jiwa</span>
                                                </div>
                                            ` : vizMode === 'priority' ? `
                                                <div class="flex justify-between items-center gap-4 border-t pt-1">
                                                    <span class="text-[9px] text-slate-500 uppercase font-bold">Tingkat Urgensi</span>
                                                    <span class="text-xs font-extrabold ${villageProjects[0]?.jumlahBalitaStunting >= 50 || villageProjects[0]?.jumlahAngkaKemiskinan >= 500 ? 'text-red-700' : 'text-amber-600'}">
                                                        ${(villageProjects[0]?.jumlahBalitaStunting || 0) + (villageProjects[0]?.jumlahAngkaKemiskinan || 0) > 0 ? 
                                                            ((villageProjects[0]?.jumlahBalitaStunting >= 30 && villageProjects[0]?.jumlahAngkaKemiskinan >= 250) ? 'KRITIS' : 'WASPADA') 
                                                            : 'STABIL'}
                                                    </span>
                                                </div>
                                                <div class="text-[8px] text-slate-500 mt-1 italic">
                                                    *Berdasarkan irisan data Stunting & Kemiskinan
                                                </div>
                                            ` : vizMode === 'kepadatan' ? `
                                                <div class="flex justify-between items-center gap-4 border-t pt-1">
                                                    <span class="text-[9px] text-slate-500 uppercase font-bold">Kepadatan Penduduk</span>
                                                    <span class="text-xs font-extrabold text-teal-700">${villageProjects[0]?.kepadatanPenduduk || 0} Jiwa/Km²</span>
                                                </div>
                                            ` : ''}
                                            <div class="flex justify-between items-center gap-4">
                                                <span class="text-[9px] text-slate-500 uppercase font-bold">Kecamatan</span>
                                                <span class="text-[10px] text-slate-700 font-semibold">${feature.properties.KECAMATAN}</span>
                                            </div>
                                        </div>
                                        <p class="text-[8px] text-slate-400 mt-3 italic border-t pt-1">${feature.properties.SUMBER || ''}</p>
                                    </div>
                                `);
                            }
                            layer.on({
                                mouseover: (e) => {
                                    const l = e.target;
                                    // Jika sedang dalam mode visualisasi (bukan default), pertahankan opacity tinggi
                                    l.setStyle({ 
                                        fillOpacity: vizMode !== 'default' ? 0.9 : 0.3, 
                                        weight: 3 
                                    });
                                },
                                mouseout: (e) => {
                                    const l = e.target;
                                    l.setStyle({ 
                                        fillOpacity: vizMode !== 'default' ? 0.7 : 0.1, 
                                        weight: vizMode !== 'default' ? 1 : 2 
                                    });
                                }
                            });
                        }}
                    />
                )}

                <SearchSyncHandler onSearchComplete={handleSearchComplete} permanentProjects={permanentProjects} />

                {vizMode === 'default' && (activeProjects.length > 0 || permanentProjects.length > 0) && (
                    <ProjectMarkers projects={[...permanentProjects, ...activeProjects]} vizMode={vizMode} />
                )}

                {activeProjects.length === 0 && permanentProjects.length === 0 && searchResult && (
                    <Marker position={[searchResult.lat, searchResult.lng]} icon={DefaultIcon}>
                        <Popup>{searchResult.label}</Popup>
                    </Marker>
                )}

                {userLocation && (
                    <>
                        <Marker position={userLocation}><Popup>Lokasi Anda</Popup></Marker>
                        <Circle center={userLocation} radius={100} pathOptions={{ color: '#009FE3', fillOpacity: 0.2 }} />
                    </>
                )}
            </LMapContainer>

            {/* Float Controls */}
            <div className="absolute top-4 right-4 z-[400] flex flex-col gap-3">
                {/* My Location Button */}
                <div className="group relative">
                    <button
                        onClick={handleMyLocation}
                        className="bg-white p-2.5 rounded-lg shadow-xl border border-slate-200 hover:bg-slate-50 transition-colors"
                    >
                        {isLocating ? <Loader2 size={20} className="animate-spin text-lobar-blue" /> : <Navigation size={20} className={userLocation ? 'text-lobar-blue fill-current' : 'text-slate-600'} />}
                    </button>
                    <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 px-2 py-1 bg-slate-800 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                        Lokasi Saya
                    </span>
                </div>

                {/* Batas Desa Toggle */}
                <div className="group relative">
                    <button
                        onClick={() => setShowBatasDesa(!showBatasDesa)}
                        className={`p-2.5 rounded-lg shadow-xl border transition-all duration-300 ${showBatasDesa ? 'bg-orange-500 text-white border-orange-600' : 'bg-white text-slate-400 border-slate-200 hover:bg-slate-50'}`}
                    >
                        <Layers size={20} />
                    </button>
                    <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 px-2 py-1 bg-slate-800 text-white text-[10px] font-bold rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-xl">
                        {showBatasDesa ? 'Sembunyikan Batas Desa' : 'Tampilkan Batas Desa'}
                    </span>
                </div>

                {/* Layer Switcher */}
                <div className="bg-white/90 backdrop-blur-md p-1.5 rounded-xl shadow-2xl border border-white/20 flex flex-col gap-1.5">
                    {(Object.keys(layers) as Array<keyof typeof layers>).map((key) => (
                        <div key={key} className="group relative">
                            <button
                                onClick={() => setActiveLayer(key)}
                                className={`p-2.5 rounded-lg transition-all duration-300 flex items-center justify-center
                                    ${activeLayer === key
                                        ? `${layers[key].color} text-white shadow-lg scale-105`
                                        : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'}`}
                            >
                                {layers[key].icon}
                            </button>
                            <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 px-2 py-1 bg-slate-800 text-white text-[10px] font-bold rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-xl">
                                {layers[key].name}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Visualization Mode Switcher (Bottom Left) */}
            <div className="absolute bottom-10 left-4 z-[400] bg-white/90 backdrop-blur-md p-2 rounded-xl shadow-2xl border border-white/20 flex flex-col gap-2 max-w-[200px]">
                <span className="text-[10px] font-bold text-slate-500 uppercase px-1">Mode Visualisasi</span>
                <div className="flex flex-wrap gap-1">
                    <button
                        onClick={() => setVizMode('default')}
                        className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${vizMode === 'default' ? 'bg-lobar-blue text-white shadow-md' : 'text-slate-500 hover:bg-slate-100'}`}
                    >
                        Proyek
                    </button>
                    <button
                        onClick={() => setVizMode('budget')}
                        className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${vizMode === 'budget' ? 'bg-green-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100'}`}
                    >
                        Anggaran
                    </button>
                    <button
                        onClick={() => setVizMode('stunting')}
                        className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${vizMode === 'stunting' ? 'bg-red-500 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100'}`}
                    >
                        Stunting
                    </button>
                    <button
                        onClick={() => setVizMode('poverty')}
                        className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${vizMode === 'poverty' ? 'bg-orange-500 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100'}`}
                    >
                        Kemiskinan
                    </button>
                    <button
                        onClick={() => setVizMode('priority')}
                        className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${vizMode === 'priority' ? 'bg-indigo-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100'}`}
                    >
                        Prioritas
                    </button>
                    <button
                        onClick={() => setVizMode('kepadatan')}
                        className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${vizMode === 'kepadatan' ? 'bg-teal-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100'}`}
                    >
                        Kepadatan
                    </button>
                </div>

                {vizMode === 'budget' && (
                    <div className="mt-1 pt-2 border-t border-slate-200">
                        <div className="flex flex-col gap-1.5">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded bg-[#15803d]"></div>
                                <span className="text-[9px] font-bold text-slate-600">&gt; 10 Miliar</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded bg-[#22c55e]"></div>
                                <span className="text-[9px] font-bold text-slate-600">5 - 10 Miliar</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded bg-[#84cc16]"></div>
                                <span className="text-[9px] font-bold text-slate-600">2 - 5 Miliar</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded bg-[#eab308]"></div>
                                <span className="text-[9px] font-bold text-slate-600">1 - 2 Miliar</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded bg-[#f97316]"></div>
                                <span className="text-[9px] font-bold text-slate-600">&lt; 1 Miliar</span>
                            </div>
                        </div>
                    </div>
                )}

                {vizMode === 'stunting' && (
                    <div className="mt-1 pt-2 border-t border-slate-200">
                        <div className="flex flex-col gap-1.5">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded bg-[#ef4444]"></div>
                                <span className="text-[9px] font-bold text-slate-600">&gt; 50 Kasus</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded bg-[#f97316]"></div>
                                <span className="text-[9px] font-bold text-slate-600">30 - 50 Kasus</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded bg-[#facc15]"></div>
                                <span className="text-[9px] font-bold text-slate-600">15 - 30 Kasus</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded bg-[#a3e635]"></div>
                                <span className="text-[9px] font-bold text-slate-600">5 - 15 Kasus</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded bg-[#4ade80]"></div>
                                <span className="text-[9px] font-bold text-slate-600">1 - 5 Kasus</span>
                            </div>
                        </div>
                    </div>
                )}

                {vizMode === 'poverty' && (
                    <div className="mt-1 pt-2 border-t border-slate-200">
                        <div className="flex flex-col gap-1.5">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded bg-[#ea580c]"></div>
                                <span className="text-[9px] font-bold text-slate-600">&gt; 500 Jiwa</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded bg-[#f97316]"></div>
                                <span className="text-[9px] font-bold text-slate-600">250 - 500 Jiwa</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded bg-[#f59e0b]"></div>
                                <span className="text-[9px] font-bold text-slate-600">100 - 250 Jiwa</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded bg-[#38bdf8]"></div>
                                <span className="text-[9px] font-bold text-slate-600">50 - 100 Jiwa</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded bg-[#2563eb]"></div>
                                <span className="text-[9px] font-bold text-slate-600">1 - 50 Jiwa</span>
                            </div>
                        </div>
                    </div>
                )}

                {vizMode === 'priority' && (
                    <div className="mt-1 pt-2 border-t border-slate-200">
                        <div className="flex flex-col gap-1.5">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded bg-[#7f1d1d]"></div>
                                <span className="text-[9px] font-bold text-slate-600">Sangat Tinggi (Kritis)</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded bg-[#ea580c]"></div>
                                <span className="text-[9px] font-bold text-slate-600">Tinggi (Waspada)</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded bg-[#f59e0b]"></div>
                                <span className="text-[9px] font-bold text-slate-600">Sedang (Pantauan)</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded bg-[#f1f5f9] border border-slate-200"></div>
                                <span className="text-[9px] font-bold text-slate-600">Rendah (Stabil)</span>
                            </div>
                        </div>
                        <div className="mt-2 text-[8px] text-slate-400 italic leading-tight text-center">
                            Skor dihitung dari akumulasi tingkat Stunting & Kemiskinan
                        </div>
                    </div>
                )}

                {vizMode === 'kepadatan' && (
                    <div className="mt-1 pt-2 border-t border-slate-200">
                        <div className="flex flex-col gap-1.5">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded bg-[#134e4a]"></div>
                                <span className="text-[9px] font-bold text-slate-600">&gt; 4500 Jiwa/Km²</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded bg-[#0d9488]"></div>
                                <span className="text-[9px] font-bold text-slate-600">3000 - 4500 Jiwa/Km²</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded bg-[#2dd4bf]"></div>
                                <span className="text-[9px] font-bold text-slate-600">1500 - 3000 Jiwa/Km²</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded bg-[#a7f3d0]"></div>
                                <span className="text-[9px] font-bold text-slate-600">500 - 1500 Jiwa/Km²</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded bg-[#f0fdfa] border border-slate-200"></div>
                                <span className="text-[9px] font-bold text-slate-600">&lt; 500 Jiwa/Km²</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div >
    );
};


export default MapContainer;