import React, { useState, useEffect } from 'react';
import { Marker, Popup } from 'react-leaflet';
import { ProjectData } from '../../types';
import { OpenStreetMapProvider } from 'leaflet-geosearch';

interface ProjectMarkersProps {
    projects: ProjectData[];
}

const ProjectMarkers: React.FC<ProjectMarkersProps> = ({ projects }) => {
    const [markerData, setMarkerData] = useState<ProjectData[]>([]);

    useEffect(() => {
        const prepareMarkers = async () => {
            const provider = new OpenStreetMapProvider();
            
            const processed = await Promise.all(projects.map(async (item) => {
                // Jika sudah ada koordinat, gunakan langsung
                if (item.lat && item.lng) return item;

                // Jika tidak ada, coba geocode secara real-time (hanya untuk beberapa data awal)
                try {
                    const results = await provider.search({ query: `Desa ${item.desa}, ${item.kecamatan}, Lombok Barat` });
                    if (results && results.length > 0) {
                        return { ...item, lat: results[0].y, lng: results[0].x };
                    }
                } catch (e) { console.error(e); }
                
                return item;
            }));

            setMarkerData(processed.filter(m => m.lat && m.lng));
        };

        if (projects.length > 0) {
            prepareMarkers();
        }
    }, [projects]);

    const formatRupiah = (value: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(value);
    };

    return (
        <>
            {markerData.map((item) => (
                <Marker key={item.id} position={[item.lat!, item.lng!]}>
                    <Popup className="glass-popup">
                        <div className="min-w-[280px] p-2">
                            <h3 className="font-bold text-lg mb-1 text-lobar-blue border-b pb-1">Desa {item.desa}</h3>
                            <p className="text-[10px] text-slate-400 uppercase mb-3">{item.kecamatan}</p>
                            
                            <div className="space-y-3 text-sm">
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Paket Pekerjaan</span>
                                    <span className="text-slate-800 font-bold leading-tight">{item.pekerjaan || 'Pembangunan Infrastruktur'}</span>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4 border-y border-dashed py-2">
                                    <div>
                                        <span className="text-[10px] font-bold text-slate-500 uppercase block mb-0.5">Anggaran</span>
                                        <span className="text-green-700 font-extrabold">{formatRupiah(item.paguAnggaran)}</span>
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-bold text-slate-500 uppercase block mb-0.5">Penduduk</span>
                                        <span className="text-slate-800 font-bold">{item.jumlahPenduduk?.toLocaleString() || '0'} Jiwa</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 pt-1">
                                    <div className="bg-red-50 p-2 rounded-lg border border-red-100">
                                        <span className="text-[9px] font-bold text-red-600 uppercase block mb-0.5">Kemiskinan</span>
                                        <span className="text-red-700 font-bold">{item.jumlahAngkaKemiskinan} Jiwa</span>
                                    </div>
                                    <div className="bg-orange-50 p-2 rounded-lg border border-orange-100">
                                        <span className="text-[9px] font-bold text-orange-600 uppercase block mb-0.5">Stunting</span>
                                        <span className="text-orange-700 font-bold">{item.jumlahBalitaStunting} Balita</span>
                                    </div>
                                </div>

                                {item.potensiDesa && (
                                    <div className="bg-blue-50/50 p-2 rounded-lg border border-blue-100">
                                        <span className="text-[10px] font-bold text-lobar-blue uppercase block mb-1">Potensi Desa</span>
                                        <span className="text-xs text-slate-600 italic leading-relaxed line-clamp-2">"{item.potensiDesa}"</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </Popup>
                </Marker>
            ))}
        </>
    );
};

export default ProjectMarkers;