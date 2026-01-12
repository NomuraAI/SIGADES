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

const mapItemToProjectData = (item: any, lat?: number, lng?: number): ProjectData => ({
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
    // Prioritaskan koordinat DB latitude/longitude, fallback ke lat/lng, lalu ke argument function
    lat: item.latitude || item.lat || lat,
    lng: item.longitude || item.lng || lng
});

const SearchSyncHandler = ({ onSearchComplete }: { onSearchComplete: (location: any, projects: ProjectData[]) => void }) => {
    const map = useMap();

    useEffect(() => {
        const handleSearch = async (e: any) => {
            const searchTerm = e.location.label;
            const searchKeyword = searchTerm.split(',')[0].trim();

            // 1. Cari data proyek di Supabase berdasarkan nama desa/kecamatan
            const { data, error } = await supabase
                .from('projects')
                .select('*')
                .or(`desa.ilike.%${searchKeyword}%,kecamatan.ilike.%${searchKeyword}%`);

            if (!error && data && data.length > 0) {
                // 2. Petakan data Supabase ke ProjectData format
                const foundProjects = data.map(item => mapItemToProjectData(item, e.location.y, e.location.x));

                // 3. Kirim data proyek yang ditemukan ke MapContainer
                onSearchComplete(e.location, foundProjects);
            } else {
                // Jika tidak ada data proyek terkait, kirim lokasi saja
                onSearchComplete(e.location, []);
            }
        };

        map.on('geosearch/showlocation', handleSearch);
        return () => { map.off('geosearch/showlocation', handleSearch); };
    }, [map, onSearchComplete]);

    return null;
};

const MapContainer: React.FC<MapContainerProps> = ({ selectedProject }) => {
    const [activeLayer, setActiveLayer] = useState<'streets' | 'satellite' | 'terrain'>('streets');
    const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
    const [isLocating, setIsLocating] = useState(false);
    const [activeProjects, setActiveProjects] = useState<ProjectData[]>([]);
    const [searchResult, setSearchResult] = useState<{ lat: number, lng: number, label: string } | null>(null);
    const [projectToFocus, setProjectToFocus] = useState<ProjectData | null>(null);
    const mapRef = useRef<L.Map>(null);

    const [permanentProjects, setPermanentProjects] = useState<ProjectData[]>([]);

    // Fetch ALL projects with coordinates on load
    useEffect(() => {
        const fetchAllMarkers = async () => {
            const { data, error } = await supabase
                .from('projects')
                .select('*')
                .not('latitude', 'is', null)
                .not('longitude', 'is', null);

            if (!error && data) {
                const mapped = data.map(item => mapItemToProjectData(item));
                setPermanentProjects(mapped);
            }
        };

        fetchAllMarkers();
    }, []);

    // Sync selectedProject (dari DataDesa table) ke projectToFocus dan fetch related
    useEffect(() => {
        const fetchRelatedProjects = async () => {
            if (selectedProject) {
                // 1. Fetch projects with same Desa
                let relatedProjects: ProjectData[] = [];
                if (selectedProject.desa) {
                    const { data, error } = await supabase
                        .from('projects')
                        .select('*')
                        .eq('desa', selectedProject.desa);

                    if (!error && data) {
                        relatedProjects = data.map(item => mapItemToProjectData(item));
                    }
                }

                if (relatedProjects.length === 0) {
                    relatedProjects = [selectedProject];
                }

                // 2. Cari koordinat desa jika perlu (geocoding) untuk fallback
                const provider = new OpenStreetMapProvider();
                const query = `Desa ${selectedProject.desa}, ${selectedProject.kecamatan}, Lombok Barat`;

                try {
                    const results = await provider.search({ query });

                    if (results.length > 0) {
                        const { x: lng, y: lat } = results[0];

                        // 3. Update activeProjects dengan koordinat fallback
                        const updatedProjects = relatedProjects.map(p => ({
                            ...p,
                            lat: p.lat || lat,
                            lng: p.lng || lng
                        }));

                        setActiveProjects(updatedProjects);

                        // Focus ke lokasi hasil geocode
                        if (mapRef.current) {
                            mapRef.current.flyTo([lat, lng], 15);
                        }
                    } else {
                        // Jika geocode gagal, pakai data apa adanya
                        setActiveProjects(relatedProjects);

                        // Coba flyto jika selectedProject punya coord
                        if (selectedProject.lat && selectedProject.lng && mapRef.current) {
                            mapRef.current.flyTo([selectedProject.lat, selectedProject.lng], 15);
                        }
                    }
                } catch (error) {
                    console.error("Geocoding error:", error);
                    setActiveProjects(relatedProjects);
                }

                setSearchResult(null);
            }
        };
        fetchRelatedProjects();
    }, [selectedProject]);

    // Handle search complete event
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
            // Manual flyTo untuk hasil search yang tidak ada di DB
            if (mapRef.current) {
                mapRef.current.flyTo([location.y, location.x], 15);
            }
        }
    }, []);

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
                <SearchSyncHandler onSearchComplete={handleSearchComplete} />

                {/* ProjectMarkers akan menampilkan marker dan popup jika activeProjects ada ATAU permanentProjects ada */}
                {(activeProjects.length > 0 || permanentProjects.length > 0) && (
                    <ProjectMarkers projects={[...permanentProjects, ...activeProjects]} />
                )}

                {/* Jika tidak ada project match, tapi ada hasil search, tampilkan marker basic */}
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