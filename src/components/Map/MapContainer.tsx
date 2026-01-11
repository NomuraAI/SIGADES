import React, { useState, useRef, useEffect } from 'react';
import { MapContainer as LMapContainer, TileLayer, ZoomControl, Marker, Popup, Circle, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Layers, Navigation, Loader2 } from 'lucide-react';
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

// Component to handle search events and sync with database
const SearchSyncHandler = ({ onProjectFound }: { onProjectFound: (project: ProjectData | null) => void }) => {
    const map = useMap();

    useEffect(() => {
        const handleSearch = async (e: any) => {
            const label = e.location.label.toLowerCase();
            
            // Cari data di Supabase yang cocok dengan label hasil pencarian
            const { data, error } = await supabase
                .from('projects')
                .select('*')
                .or(`desa.ilike.%${e.location.label}%,kecamatan.ilike.%${e.location.label}%`)
                .limit(1);

            if (!error && data && data.length > 0) {
                const item = data[0];
                onProjectFound({
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
                    lat: item.lat || e.location.y,
                    lng: item.lng || e.location.x
                });
            } else {
                onProjectFound(null);
            }
        };

        map.on('geosearch/showlocation', handleSearch);
        return () => { map.off('geosearch/showlocation', handleSearch); };
    }, [map, onProjectFound]);

    return null;
};

const MapContainer: React.FC<MapContainerProps> = ({ selectedProject }) => {
    const [activeLayer, setActiveLayer] = useState<'streets' | 'satellite' | 'terrain'>('streets');
    const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
    const [isLocating, setIsLocating] = useState(false);
    const [activeProject, setActiveProject] = useState<ProjectData | null>(null);
    const mapRef = useRef<L.Map>(null);

    const layers = {
        streets: { url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', attribution: '&copy; OSM' },
        satellite: { url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', attribution: '&copy; Esri' },
        terrain: { url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', attribution: '&copy; Esri' }
    };

    // Sinkronkan saat prop selectedProject berubah (dari tabel Data Desa)
    useEffect(() => {
        if (selectedProject) {
            setActiveProject(selectedProject);
            
            // Fly to location
            const timer = setTimeout(async () => {
                if (selectedProject.lat && selectedProject.lng) {
                    mapRef.current?.flyTo([selectedProject.lat, selectedProject.lng], 15);
                } else {
                    const provider = new OpenStreetMapProvider();
                    const results = await provider.search({ query: `Desa ${selectedProject.desa}, ${selectedProject.kecamatan}, Lombok Barat` });
                    if (results.length > 0) {
                        mapRef.current?.flyTo([results[0].y, results[0].x], 15);
                    }
                }
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [selectedProject]);

    const handleMyLocation = () => {
        setIsLocating(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const newPos: [number, number] = [pos.coords.latitude, pos.coords.longitude];
                setUserLocation(newPos);
                setIsLocating(false);
                mapRef.current?.flyTo(newPos, 15);
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
                <SearchSyncHandler onProjectFound={setActiveProject} />

                {/* Hanya tampilkan pin jika ada project aktif (dipilih/dicari) */}
                {activeProject && <ProjectMarkers projects={[activeProject]} />}

                {userLocation && (
                    <>
                        <Marker position={userLocation}><Popup>Lokasi Anda</Popup></Marker>
                        <Circle center={userLocation} radius={100} pathOptions={{ color: '#009FE3', fillOpacity: 0.2 }} />
                    </>
                )}
            </LMapContainer>

            <div className="absolute top-4 right-4 z-[400] flex flex-col gap-3">
                <button onClick={handleMyLocation} className="bg-white p-2.5 rounded-lg shadow-xl border border-slate-200">
                    {isLocating ? <Loader2 size={20} className="animate-spin text-lobar-blue" /> : <Navigation size={20} className={userLocation ? 'text-lobar-blue fill-current' : ''} />}
                </button>
                <div className="bg-white/90 backdrop-blur-md p-2 rounded-lg shadow-xl flex flex-col gap-2">
                    {(['streets', 'satellite', 'terrain'] as const).map(l => (
                        <button key={l} onClick={() => setActiveLayer(l)} className={`p-2 rounded-md ${activeLayer === l ? 'bg-lobar-blue text-white' : 'text-slate-600'}`}>
                            {l === 'streets' ? <Layers size={20} /> : <div className="w-5 h-5 rounded-sm border border-current"></div>}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default MapContainer;