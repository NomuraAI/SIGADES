import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import { ProjectData } from '../../types';

interface ProjectMarkersProps {
    projects: ProjectData[];
}

const ProjectMarkers: React.FC<ProjectMarkersProps> = ({ projects }) => {
    const formatRupiah = (value: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(value);
    };

    return (
        <>
            {projects.map((item) => {
                if (!item.lat || !item.lng) return null;
                return (
                    <Marker key={item.id} position={[item.lat, item.lng]}>
                        <Popup className="glass-popup">
                            <div className="min-w-[250px] p-2">
                                <h3 className="font-bold text-lg mb-1 text-lobar-blue border-b pb-1">Desa {item.desa}</h3>
                                <p className="text-[10px] text-slate-400 uppercase mb-3">{item.kecamatan}</p>
                                
                                <div className="space-y-2 text-sm">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase">Pekerjaan</span>
                                        <span className="text-slate-800 font-medium leading-tight">{item.pekerjaan || '-'}</span>
                                    </div>
                                    
                                    <div className="flex justify-between items-center border-t border-dashed pt-2">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase">Anggaran</span>
                                        <span className="text-green-700 font-bold">{formatRupiah(item.paguAnggaran)}</span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 border-t border-dashed pt-2">
                                        <div>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase block">Kemiskinan</span>
                                            <span className="text-red-600 font-bold">{item.jumlahAngkaKemiskinan} Jiwa</span>
                                        </div>
                                        <div>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase block">Stunting</span>
                                            <span className="text-orange-600 font-bold">{item.jumlahBalitaStunting} Balita</span>
                                        </div>
                                    </div>

                                    {item.potensiDesa && (
                                        <div className="bg-blue-50 p-2 rounded-lg mt-2">
                                            <span className="text-[10px] font-bold text-lobar-blue uppercase block mb-1">Potensi Desa</span>
                                            <span className="text-xs text-slate-700 line-clamp-2 italic">{item.potensiDesa}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Popup>
                    </Marker>
                );
            })}
        </>
    );
};

export default ProjectMarkers;