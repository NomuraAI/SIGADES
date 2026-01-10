import React, { useState, useRef } from 'react';
import { MapContainer as LMapContainer, TileLayer, ScaleControl, ZoomControl, Marker, Popup, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Layers, Navigation, Loader2 } from 'lucide-react';
import SearchControl from './SearchControl';

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
import { ProjectData } from '../../types';

// Lombok Barat coordinates
const CENTER: [number, number] = [-8.6756, 116.1157]; // Approximate center
const ZOOM = 11;

interface MapContainerProps {
    selectedProject?: ProjectData | null;
}

const MapContainer: React.FC<MapContainerProps> = ({ selectedProject }) => {
    const [activeLayer, setActiveLayer] = useState<'streets' | 'satellite' | 'terrain'>('streets');
    const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
    const [isLocating, setIsLocating] = useState(false);
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
            attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ, TomTom, Intermap, iPC, USGS, FAO, NPS, NRCAN, GeoBase, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), and the GIS User Community'
        }
    };

    // Formatter Rupiah
    const formatRupiah = (value: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(value);
    };

    // Handle selected Project from prop
    React.useEffect(() => {
        if (selectedProject) {
            const locateProject = async () => {
                const provider = new OpenStreetMapProvider();
                let results = [];

                // 1. Priority: Desa + Kecamatan
                try {
                    results = await provider.search({ query: `Desa ${selectedProject.desa}, ${selectedProject.kecamatan}, Lombok Barat` });
                } catch (e) { console.error(e); }

                // 2. Fallback: Just Kecamatan
                if (!results || results.length === 0) {
                    try {
                        results = await provider.search({ query: `Kecamatan ${selectedProject.kecamatan}, Lombok Barat` });
                        if (results.length > 0) console.log('Using Kecamatan fallback location');
                    } catch (e) { console.error(e); }
                }

                if (results && results.length > 0) {
                    const { x, y } = results[0];
                    // Fly to location
                    mapRef.current?.flyTo([y, x], 15, { duration: 2 });

                    // Create detailed popup content
                    const popupContent = `
                        <div class="p-1 min-w-[300px]">
                            <h3 class="font-bold text-lg mb-2 border-b pb-1 text-slate-800">Desa ${selectedProject.desa}</h3>
                             <p class="text-xs text-slate-500 italic mb-2">Kecamatan ${selectedProject.kecamatan}</p>
                            
                            <div class="grid grid-cols-[110px_1fr] gap-x-2 gap-y-1.5 text-sm">
                                <span class="font-semibold text-slate-600">Pekerjaan:</span>
                                <span class="text-slate-800 font-medium">${selectedProject.pekerjaan}</span>
                                
                                <span class="font-semibold text-slate-600">Pagu Anggaran:</span>
                                <span class="font-bold text-green-700">${formatRupiah(selectedProject.paguAnggaran)}</span>

                                <span class="font-semibold text-slate-600">Program:</span>
                                <span class="text-slate-800">${selectedProject.program || '-'}</span>
                                
                                <span class="font-semibold text-slate-600">Perangkat Daerah:</span>
                                <span class="text-slate-800">${selectedProject.perangkatDaerah || '-'}</span>

                                <div class="col-span-2 border-t border-dashed border-slate-200 my-1"></div>

                                <span class="font-semibold text-slate-600">Kemiskinan:</span>
                                <span class="text-slate-800">${selectedProject.jumlahAngkaKemiskinan?.toLocaleString() || '0'} Jiwa</span>

                                <span class="font-semibold text-slate-600">Stunting:</span>
                                <span class="text-slate-800">${selectedProject.jumlahBalitaStunting?.toLocaleString() || '0'} Jiwa</span>
                                
                                <span class="font-semibold text-slate-600">Potensi:</span>
                                <span class="text-slate-800">${selectedProject.potensiDesa || '-'}</span>
                            </div>
                        </div>
                    `;

                    // Show Popup
                    L.popup({ minWidth: 300, maxWidth: 350 })
                        .setLatLng([y, x])
                        .setContent(popupContent)
                        .openOn(mapRef.current!);
                } else {
                    console.warn(`Lokasi desa ${selectedProject.desa} tidak ditemukan`);
                    alert(`Lokasi Desa ${selectedProject.desa} atau Kecamatan ${selectedProject.kecamatan} tidak ditemukan di peta.`);
                }
            };

            locateProject();
        }
    }, [selectedProject]);

    const handleMyLocation = () => {
        setIsLocating(true);
        if (!navigator.geolocation) {
            alert("Geolocation is not supported by your browser");
            setIsLocating(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                const newPos: [number, number] = [latitude, longitude];
                setUserLocation(newPos);
                setIsLocating(false);

                // Fly to location
                mapRef.current?.flyTo(newPos, 15, {
                    duration: 2
                });
            },
            (error) => {
                console.error(error);
                alert("Tidak dapat mengambil lokasi Anda. Pastikan GPS aktif.");
                setIsLocating(false);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
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

                {/* User Location Marker & Accuracy Circle */}
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
                {/* My Location Button */}
                <button
                    onClick={handleMyLocation}
                    className="bg-white hover:bg-slate-50 text-slate-700 p-2.5 rounded-lg shadow-xl border border-slate-200 transition-all active:scale-95 flex items-center justify-center group"
                    title="Lokasi Saya"
                >
                    {isLocating ? (
                        <Loader2 size={20} className="animate-spin text-lobar-blue" />
                    ) : (
                        <Navigation size={20} className={userLocation ? 'text-lobar-blue fill-current' : ''} />
                    )}
                </button>

                {/* Layer Toggles */}
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
