import React from 'react';
import { CircleMarker, Popup } from 'react-leaflet';
import { ProjectData } from '../../types';

interface ProjectMarkersProps {
    projects: ProjectData[];
    vizMode?: 'default' | 'stunting' | 'poverty' | 'priority' | 'kepadatan';
}

const ProjectMarkers: React.FC<ProjectMarkersProps> = ({ projects, vizMode = 'default' }) => {
    // Deduplicate projects based on ID and Group by location
    const groupedProjects = React.useMemo(() => {
        const uniqueProjects = new Map<string, ProjectData>();
        projects.forEach(p => {
            if (p.id) uniqueProjects.set(p.id, p);
        });

        const groups: { [key: string]: ProjectData[] } = {};
        Array.from(uniqueProjects.values()).forEach(project => {
            if (project.latitude && project.longitude) {
                const key = `${project.latitude},${project.longitude}`;
                if (!groups[key]) {
                    groups[key] = [];
                }
                groups[key].push(project);
            }
        });
        return groups;
    }, [projects]);

    const formatRupiah = (value: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(value);
    };

    // Component internal untuk Popup dengan State pagination
    const PaginatedPopup = ({ items }: { items: ProjectData[] }) => {
        const [currentIndex, setCurrentIndex] = React.useState(0);
        const item = items[currentIndex];
        const totalItems = items.length;

        const handleNext = () => {
            setCurrentIndex((prev) => (prev + 1) % totalItems);
        };

        const handlePrev = () => {
            setCurrentIndex((prev) => (prev - 1 + totalItems) % totalItems);
        };

        return (
            <Popup className="glass-popup" minWidth={300}>
                <div className="min-w-[280px] p-2">
                    {/* Header dengan Navigasi jika items > 1 */}
                    <div className="flex justify-between items-start mb-2 border-b pb-2">
                        <div className="flex-1">
                            <h3 className="font-bold text-lg text-lobar-blue">Desa {item.desaKelurahan}</h3>
                            <div className="flex flex-col">
                                <p className="text-[10px] text-slate-400 uppercase tracking-widest">{item.kecamatan}</p>
                                {item.kodeKecamatan && <p className="text-[9px] text-slate-300 font-mono mt-0.5">Kode Kec: {item.kodeKecamatan}</p>}
                            </div>
                        </div>
                        {totalItems > 1 && (
                            <div className="flex items-center gap-2 pl-2">
                                <button
                                    onClick={(e) => { e.stopPropagation(); handlePrev(); }}
                                    className="p-1 hover:bg-slate-100 rounded text-slate-600 text-xs font-bold"
                                >
                                    &lt;
                                </button>
                                <span className="text-[10px] text-slate-500 font-mono">
                                    {currentIndex + 1}/{totalItems}
                                </span>
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleNext(); }}
                                    className="p-1 hover:bg-slate-100 rounded text-slate-600 text-xs font-bold"
                                >
                                    &gt;
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Summary Total Anggaran Desa */}
                    <div className="bg-indigo-50 rounded-md p-2 mb-3 border border-indigo-100 shadow-sm">
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] font-bold text-slate-500 uppercase">Total Pagu (Semua Paket)</span>
                            <span className="text-xs font-extrabold text-indigo-700">
                                {formatRupiah(items.reduce((sum, curr) => sum + (curr.paguAnggaran || 0), 0))}
                            </span>
                        </div>
                    </div>

                    <div className="space-y-3 text-sm">
                        <div className="flex flex-col">
                            {item.perangkatDaerah && (
                                <div className="mb-2">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">OPD Penanggung Jawab</span>
                                    <span className="text-xs text-lobar-blue font-bold">{item.perangkatDaerah}</span>
                                </div>
                            )}
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Paket Pekerjaan</span>
                            <span className="text-slate-800 font-bold leading-tight">{item.pekerjaan || 'Pembangunan Infrastruktur'}</span>
                        </div>

                        <div className="grid grid-cols-2 gap-4 border-y border-dashed py-2">
                            <div>
                                <span className="text-[10px] font-bold text-slate-500 uppercase block mb-0.5">Anggaran Paket</span>
                                <span className="text-green-700 font-extrabold">{formatRupiah(item.paguAnggaran)}</span>
                            </div>
                            <div>
                                <span className="text-[10px] font-bold text-slate-500 uppercase block mb-0.5">Luas Wilayah</span>
                                <span className="text-slate-800 font-bold">{item.luasWilayah || '0'} km²</span>
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

                        <div className="grid grid-cols-2 gap-4 pt-1">
                            <div className="bg-blue-50 p-2 rounded-lg border border-blue-100">
                                <span className="text-[9px] font-bold text-lobar-blue uppercase block mb-0.5">Penduduk</span>
                                <span className="text-lobar-blue font-bold">{item.jumlahPenduduk?.toLocaleString() || '0'} Jiwa</span>
                            </div>
                            <div className="bg-teal-50 p-2 rounded-lg border border-teal-100">
                                <span className="text-[9px] font-bold text-teal-600 uppercase block mb-0.5">Kepadatan</span>
                                <span className="text-teal-700 font-bold">{item.kepadatanPenduduk?.toLocaleString() || '0'} jw/km²</span>
                            </div>
                        </div>

                        {item.potensiDesa && (
                            <div className="bg-blue-50/50 p-2 rounded-lg border border-blue-100">
                                <span className="text-[10px] font-bold text-lobar-blue uppercase block mb-1">Potensi Desa</span>
                                <span className="text-xs text-slate-600 italic leading-relaxed">"{item.potensiDesa}"</span>
                            </div>
                        )}

                    </div>
                </div>
            </Popup>
        );
    };

    return (
        <>
            {Object.entries(groupedProjects).map(([key, groupItems]) => {
                const position = groupItems[0];
                if (!position.latitude || !position.longitude) return null;

                // 1. Find best representative data from group (Greedy Inheritance)
                const groupMaxStunting = Math.max(...groupItems.map(p => Number(p.jumlahBalitaStunting) || 0), 0);
                const groupMaxPoverty = Math.max(...groupItems.map(p => Number(p.jumlahAngkaKemiskinan) || 0), 0);
                const groupMaxKepadatan = Math.max(...groupItems.map(p => Number(p.kepadatanPenduduk) || 0), 0);
                const groupMaxPenduduk = Math.max(...groupItems.map(p => Number(p.jumlahPenduduk) || 0), 0);
                const groupMaxLuas = Math.max(...groupItems.map(p => Number(p.luasWilayah) || 0), 0);

                // 2. Patch ALL items in this group with the max values so the Popup is always correct
                const patchedItems = groupItems.map(item => ({
                    ...item,
                    jumlahBalitaStunting: item.jumlahBalitaStunting || groupMaxStunting,
                    jumlahAngkaKemiskinan: item.jumlahAngkaKemiskinan || groupMaxPoverty,
                    kepadatanPenduduk: item.kepadatanPenduduk || groupMaxKepadatan,
                    jumlahPenduduk: item.jumlahPenduduk || groupMaxPenduduk,
                    luasWilayah: item.luasWilayah || groupMaxLuas
                }));

                // 3. Global Normalization Constants
                const maxStunting = Math.max(...projects.map(p => Number(p.jumlahBalitaStunting) || 0), 1);
                const maxPoverty = Math.max(...projects.map(p => Number(p.jumlahAngkaKemiskinan) || 0), 1);
                const maxKepadatan = Math.max(...projects.map(p => Number(p.kepadatanPenduduk) || 0), 1);

                // 4. Visualization Logic
                let fillColor = '#009FE3';
                let radius = 8;

                if (vizMode === 'stunting') {
                    const ratio = Math.min(groupMaxStunting / maxStunting, 1);
                    const r = Math.round(255 * ratio);
                    const g = Math.round(255 * (1 - ratio));
                    fillColor = `rgb(${r},${g},0)`;
                    radius = 6 + (ratio * 10);
                } else if (vizMode === 'poverty') {
                    const ratio = Math.min(groupMaxPoverty / maxPoverty, 1);
                    const r = Math.round(255 * ratio);
                    const g = Math.round(200 * (1 - ratio));
                    const b = Math.round(255 * (1 - ratio));
                    fillColor = `rgb(${r},${g},${b})`;
                    radius = 6 + (ratio * 10);
                } else if (vizMode === 'priority') {
                    const score = (groupMaxStunting / maxStunting + groupMaxPoverty / maxPoverty) / 2;
                    fillColor = score > 0.7 ? '#4c1d95' : `rgb(${Math.round(200 - 125 * score)}, ${Math.round(200 - 200 * score)}, ${Math.round(200 - 70 * score)})`;
                    radius = 6 + (score * 12);
                } else if (vizMode === 'kepadatan') {
                    const ratio = Math.min(groupMaxKepadatan / maxKepadatan, 1);
                    const r = Math.round(153 + (19 - 153) * ratio);
                    const g = Math.round(246 + (78 - 246) * ratio);
                    const b = Math.round(228 + (74 - 228) * ratio);
                    fillColor = `rgb(${r},${g},${b})`;
                    radius = 8 + (ratio * 15); // Larger markers for density
                }

                return (
                    <CircleMarker
                        key={key}
                        center={[position.latitude, position.longitude]}
                        radius={radius}
                        pathOptions={{
                            fillColor: fillColor,
                            fillOpacity: 0.9,
                            color: 'white',
                            weight: 2
                        }}
                    >
                        <PaginatedPopup items={patchedItems} />
                    </CircleMarker>
                );
            })}
        </>
    );
};

export default ProjectMarkers;