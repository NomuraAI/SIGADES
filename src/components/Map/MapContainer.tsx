import React, { useState, useRef, useEffect } from 'react';
import { MapContainer as LMapContainer, TileLayer, ScaleControl, ZoomControl, Marker, Popup, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Layers, Navigation, Loader2 } from 'lucide-react';
import SearchControl from './SearchControl';
import ProjectMarkers from './ProjectMarkers';
import { supabase } from '../../lib/supabase';
import { ProjectData } from '../../types';

// Fix for default Leaflet marker icons in React
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

import { OpenStreetMapProvider } from 'leaflet-geosearch';

// Lombok Barat coordinates
const CENTER: [number, number] = [-8.6756, 116.1157];
const ZOOM = 11;

interface MapContainerProps {
    selectedProject?: ProjectData | null;
}

const MapContainer: React.FC<MapContainerProps> = ({ selectedProject }) => {
    const [activeLayer, setActiveLayer] = useState<'streets' | 'satellite' | 'terrain'>('streets');
    const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
    const [isLocating, setIsLocating] = useState(false);
    const [projects, setProjects] = useState<ProjectData[]>([]);
    const mapRef = useRef<L.Map>(null);

    const layers = {
        streets: {
            url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
            attribution: '&copy; OpenStreetMap contributors'
        },
        satellite: {
            url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
            attribution: '&copy; Esri'
        },
        terrain: {
            url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
            attribution: 'Tiles &copy; Esri'
        }
    };

    // Load all projects for markers
    useEffect(() => {
        const fetchProjects = async () => {
            const { data, error } = await supabase.from('projects').select('*');
            if (!error && data) {
                const mappedData: ProjectData[] = data.map(item => ({
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
                    lat: item.lat,
                    lng: item.lng
                }));
                setProjects(mappedData);
            }
        };
        fetchProjects();
    }, []);

    // Formatter Rupiah
    const formatRupiah = (value: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(value);
    };

    // Handle selected Project from prop (Fly to)
    useEffect(() => {
        if (selectedProject) {
            const locateProject = async () => {
                const provider = new OpenStreetMapProvider();
                let results = [];

                // Jika sudah ada lat/lng di DB, gunakan itu
                if (selectedProject.lat && selectedProject.lng) {
                    mapRef.current?.flyTo([selectedProject.lat, selectedProject.lng], 15, { duration: 2 });
                    return;
                }

                // Jika tidak, cari koordinatnya
                try {
                    results = await provider.search({ query: `Desa ${selectedProject.desa}, ${selectedProject.kecamatan}, Lombok Barat` });
                } catch (e) { console.error(e); }

                if (results && results.length > 0) {
                    const { x, y } = results[0];
                    mapRef.current?.flyTo([y, x], 15, { duration: 2 });
                }
            };

            locateProject();
        }
    }, [selectedProject]);

    const handleMyLocation = () => {
        setIsLocating(true);
        if (!navigator.geolocation) {
            alert("Geolocation tidak didukung browser Anda");
            setIsLocating(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                const newPos: [number, number] = [latitude, longitude];
                setUserLocation(newPos);
                setIsLocating(false);
                mapRef.current?.flyTo(newPos, 15, { duration: 2 });
            },
            () => {
                alert("Gagal mengambil lokasi.");
                setIsLocating(false);
            }
        );
    };

    return (
        <div className="w-full h-full relative z-0">
            <LMapContainer
                center={CENTER}
                zoom={ZOOM}
                className="w-full h-full"
                zoomControl={false}
                ref={mapRef}
            >
                <TileLayer
                    attribution={layers[activeLayer].attribution}
                    url={layers[activeLayer].url}
                />

                <ZoomControl position="bottomright" />
                <SearchControl />

                {/* Render markers for all projects */}
                <ProjectMarkers projects={projects} />

                {userLocation && (
                    <>
                        <Marker position={userLocation}>
                            <Popup>Lokasi Anda Saat Ini</Popup>
                        </Marker>
                        <Circle
                            center={userLocation}
                            radius={100}
                            pathOptions={{ color: '#009FE3', fillColor: '#009FE3', fillOpacity: 0.2 }}
                        />
                    </>
                )}

            </LMapContainer>

            {/* Layer Control & My Location */}
            <div className="absolute top-4 right-4 z-[400] flex flex-col gap-3">
                <button
                    onClick={handleMyLocation}
                    className="bg-white hover:bg-slate-50 text-slate-700 p-2.5 rounded-lg shadow-xl border border-slate-200 transition-all active:scale-95 flex items-center justify-center"
                    title="Lokasi Saya"
                >
                    {isLocating ? (
                        <Loader2 size={20} className="animate-spin text-lobar-blue" />
                    ) : (
                        <Navigation size={20} className={userLocation ? 'text-lobar-blue fill-current' : ''} />
                    )}
                </button>

                <div className="bg-white/90 backdrop-blur-md border border-white/20 p-2 rounded-lg shadow-xl flex flex-col gap-2">
                    <button
                        onClick={() => setActiveLayer('streets')}
                        className={`p-2 rounded-md transition-colors ${activeLayer === 'streets' ? 'bg-lobar-blue text-white' : 'hover:bg-slate-100 text-slate-600'}`}
                        title="Street View"
                    >
                        <Layers size={20} />
                    </button>
                    <button
                        onClick={() => setActiveLayer('satellite')}
                        className={`p-2 rounded-md transition-colors ${activeLayer === 'satellite' ? 'bg-lobar-blue text-white' : 'hover:bg-slate-100 text-slate-600'}`}
                        title="Satellite View"
                    >
                        <div className="w-5 h-5 rounded-sm border border-current bg-green-900/50"></div>
                    </button>
                    <button
                        onClick={() => setActiveLayer('terrain')}
                        className={`p-2 rounded-md transition-colors ${activeLayer === 'terrain' ? 'bg-lobar-blue text-white' : 'hover:bg-slate-100 text-slate-600'}`}
                        title="Terrain View"
                    >
                        <div className="w-5 h-5 rounded-sm border border-current bg-amber-700/50"></div>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MapContainer;