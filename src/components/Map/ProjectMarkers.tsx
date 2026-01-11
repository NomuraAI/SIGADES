import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import { projectsData } from '../../data/projects';
import L from 'leaflet';

const ProjectMarkers: React.FC = () => {

    // Formatter Rupiah
    const formatRupiah = (value: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(value);
    };

    return (
        <>
            {projectsData.map((item) => {
                if (!item.lat || !item.lng) return null;
                return (
                    <Marker key={item.id} position={[item.lat, item.lng]}>
                        <Popup>
                            <div className="min-w-[250px] p-1">
                                <h3 className="font-bold text-lg mb-2 border-b pb-1 text-slate-800">Desa {item.desa}</h3>
                                <div className="grid grid-cols-[100px_1fr] gap-x-2 gap-y-1 text-sm">
                                    <span className="font-semibold text-slate-600">Luas:</span>
                                    <span className="text-slate-800">{item.luasWilayah}</span>

                                    <span className="font-semibold text-slate-600">Status:</span>
                                    <span className="text-slate-800">
                                        <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${item.statusDesa === 'Maju' ? 'bg-green-100 text-green-700' :
                                            item.statusDesa === 'Berkembang' ? 'bg-yellow-100 text-yellow-700' :
                                                'bg-red-100 text-red-700'}`}>
                                            {item.statusDesa}
                                        </span>
                                    </span>

                                    <span className="font-semibold text-slate-600">Pekerjaan:</span>
                                    <span className="text-slate-800">{item.pekerjaan}</span>

                                    <span className="font-semibold text-slate-600">Anggaran:</span>
                                    <span className="font-medium text-green-700">{formatRupiah(item.paguAnggaran)}</span>

                                    <span className="font-semibold text-slate-600">Potensi:</span>
                                    <span className="text-slate-800">{item.potensiDesa}</span>
                                </div>
                            </div>
                        </Popup>
                    </Marker>
                )
            })}
        </>
    );
};

export default ProjectMarkers;
