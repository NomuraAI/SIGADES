import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MapContainer as LMapContainer, TileLayer, ZoomControl, Marker, Popup, Circle, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Map as MapIcon, Satellite, Mountain, Navigation, Loader2 } from 'lucide-react';
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

interface MapContainerProps {
    selectedProject?: ProjectData | null;
}

const SearchSyncHandler = ({ onProjectFound }: { onProjectFound: (project: ProjectData | null) => void }) => {
    const map = useMap();

    const mapSupabaseToProjectData = useCallback((item: any, lat?: number, lng?: number): ProjectData => ({
        id: item.id,
        aksiPrioritas: item.aksi_prioritas || '',
        perangkatDaerah: item.perangkat_daerah || '',
        program: item.program || '',
        kegiatan: item.kegiatan || '',
        subKegiatan: item.sub_kegiatan || '',
        pekerjaan: item.pekerjaan || '',
        paguAnggaran: item.pagu_anggaran || 0,
        desa: item.desa || '',
        kecamatan: item.kecamatan || '',
        luasWilayah: item.luas_wilayah || '',
        jumlahPenduduk: item.jumlah_penduduk || 0,
        jumlahAngkaKemiskinan: item.jumlah_angka_kemiskinan || 0,
        jumlahBalitaStunting: item.jumlah_balita_stunting || 0,
        potensiDesa: item.potensi_desa || '',
        keterangan: item.keterangan || '',
        // Prioritaskan koordinat DB, fallback ke koordinat geosearch
        lat: item.lat || lat,
        lng: item.lng || lng
    }), []);


    useEffect(() => {
        const handleSearch = async (e: any) => {
            const searchTerm = e.location.label;
            // Ambil kata kunci pertama dari hasil pencarian (misal: "Senggigi, ..." -> "Senggigi")
            // Ini meningkatkan akurasi pencocokan dengan nama desa di database
            const searchKeyword = searchTerm.split(',')[0].trim();

            // 1. Cari data proyek di Supabase berdasarkan nama desa/kecamatan
            const { data, error } = await supabase
                .from('projects')
                .select('*')
                .or(`desa.ilike.%${searchKeyword}%,kecamatan.ilike.%${searchKeyword}%`)
                .limit(1);

            if (!error && data && data.length > 0) {
                const item = data[0];

                // 2. Petakan data Supabase ke ProjectData format
                const foundProject = mapSupabaseToProjectData(item, e.location.y, e.location.x);

                // 3. Kirim data proyek yang ditemukan ke MapContainer
                onProjectFound(foundProject);
            } else {
                // Jika tidak ada data proyek terkait, reset activeProject
                onProjectFound(null);
            }
        };

        map.on('geosearch/showlocation', handleSearch);
        return () => { map.off('geosearch/showlocation', handleSearch); };
    }, [map, onProjectFound, mapSupabaseToProjectData]);

    return null;
};

const MapContainer: React.FC<MapContainerProps> = ({ selectedProject }) => {
    const [activeLayer, setActiveLayer] = useState<'streets' | 'satellite' | 'terrain'>('streets');
    const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
    const [isLocating, setIsLocating] = useState(false);
    const [activeProject, setActiveProject] = useState<ProjectData | null>(null);

    // State untuk mengelola proyek yang perlu difokuskan (dari tabel atau pencarian)
    const [projectToFocus, setProjectToFocus] = useState<ProjectData | null>(null);
    const mapRef = useRef<L.Map>(null);

    // Sync selectedProject (dari DataDesa table) ke projectToFocus
    useEffect(() => {
        if (selectedProject) {
            setProjectToFocus(selectedProject);
            setActiveProject(selectedProject); // Set active project untuk rendering marker
        }
    }, [selectedProject]);

    // Sync activeProject (dari SearchSyncHandler) ke projectToFocus
    const handleProjectFound = useCallback((project: ProjectData | null) => {
        setActiveProject(project);
        setProjectToFocus(project);
    }, []);

    // Effect untuk menangani pergerakan peta ketika projectToFocus berubah
    useEffect(() => {
        if (projectToFocus && mapRef.current) {
            const map = mapRef.current;
            const provider = new OpenStreetMapProvider();

            const flyToLocation = async () => {
                if (projectToFocus.lat && projectToFocus.lng) {
                    map.flyTo([projectToFocus.lat, projectToFocus.lng], 15);
                } else {
                    // Jika koordinat hilang, coba geocode lokasi
                    const query = `Desa ${projectToFocus.desa}, ${projectToFocus.kecamatan}, Lombok Barat`;
                    const results = await provider.search({ query });
                    if (results.length > 0) {
                        map.flyTo([results[0].y, results[0].x], 15);
                    }
                }
            };

            // Beri waktu sebentar agar Leaflet siap
            const timer = setTimeout(flyToLocation, 100);
            return () => clearTimeout(timer);
        }
    }, [projectToFocus]);

    // Handle user location flyTo
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

                {/* SearchSyncHandler akan mencari data proyek berdasarkan hasil geosearch */}
                <SearchSyncHandler onProjectFound={handleProjectFound} />

                {/* ProjectMarkers akan menampilkan marker dan popup jika activeProject ada */}
                {activeProject && <ProjectMarkers projects={[activeProject]} />}

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
                            {/* Hover Tooltip */}
                            <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 px-2 py-1 bg-slate-800 text-white text-[10px] font-bold rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-xl">
                                {layers[key].name}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default MapContainer;