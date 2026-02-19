import React from 'react';
import { CircleMarker, Popup } from 'react-leaflet';
import { ProjectData } from '../../types';

interface ProjectMarkersProps {
    projects: ProjectData[];
    vizMode?: 'default' | 'strata' | 'stunting' | 'poverty' | 'priority';
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
                const position = groupItems[0]; // Ambil koordinat dari item pertama
                if (!position.latitude || !position.longitude) return null;

                // Hitung Max Values untuk normalisasi (sekali saja atau memoize jika perlu, tapi disini ringan)
                // Note: Idealnya ini dihitung di parent atau useMemo globally, tapi untuk simplicitas kita hitung dr projects prop
                // Kita gunakan local max dari 'projects' yang ada di map
                const maxStunting = Math.max(...projects.map(p => p.jumlahBalitaStunting || 0), 1);
                const maxPoverty = Math.max(...projects.map(p => p.jumlahAngkaKemiskinan || 0), 1);

                // Determine Color
                let fillColor = '#009FE3'; // Default
                let radius = 8;

                if (vizMode === 'strata') {
                    const s = groupItems[0].strataDesa;
                    fillColor = s === 4 ? '#22c55e' :
                        s === 3 ? '#3b82f6' :
                            s === 2 ? '#eab308' :
                                s === 1 ? '#f97316' :
                                    s === 0 ? '#ef4444' : '#94a3b8';
                } else if (vizMode === 'stunting') {
                    const val = groupItems[0].jumlahBalitaStunting || 0;
                    const ratio = Math.min(val / maxStunting, 1);
                    // Green to Red
                    const r = Math.round(255 * ratio);
                    const g = Math.round(255 * (1 - ratio));
                    fillColor = `rgb(${r},${g},0)`;
                    radius = 6 + (ratio * 8); // Scale size with severity
                } else if (vizMode === 'poverty') {
                    const val = groupItems[0].jumlahAngkaKemiskinan || 0;
                    const ratio = Math.min(val / maxPoverty, 1);
                    // Blue to Orange
                    // Simple approach: Low=Blue(0,0,255), High=Orange(255,165,0)
                    // Interpolasi manual:
                    const r = Math.round(0 + (255 - 0) * ratio);
                    const g = Math.round(0 + (165 - 0) * ratio);
                    const b = Math.round(255 + (0 - 255) * ratio);
                    fillColor = `rgb(${r},${g},${b})`;
                    radius = 6 + (ratio * 8);
                } else if (vizMode === 'priority') {
                    const valStunt = groupItems[0].jumlahBalitaStunting || 0;
                    const valPov = groupItems[0].jumlahAngkaKemiskinan || 0;

                    const scoreStunt = valStunt / maxStunting;
                    const scorePov = valPov / maxPoverty;
                    const avgScore = (scoreStunt + scorePov) / 2;

                    // Low=Gray, High=Purple/DarkIndigo
                    const r = Math.round(200 + (75 - 200) * avgScore); // Gray 200 -> Indigo 75
                    const g = Math.round(200 + (0 - 200) * avgScore);   // Gray 200 -> 0
                    const b = Math.round(200 + (130 - 200) * avgScore); // Gray 200 -> 130

                    fillColor = `rgb(${r},${g},${b})`;
                    // Jika priority tinggi, buat lebih besar mencolok
                    if (avgScore > 0.7) {
                        fillColor = '#4c1d95'; // Dark Violet solid for very high
                        radius = 16;
                    } else {
                        radius = 6 + (avgScore * 8);
                    }
                }

                return (
                    <CircleMarker
                        key={key}
                        center={[position.latitude, position.longitude]}
                        radius={radius}
                        pathOptions={{
                            fillColor: fillColor,
                            fillOpacity: 0.8,
                            color: 'white',
                            weight: 2
                        }}
                        eventHandlers={{
                            click: (e) => {
                                e.target.openPopup();
                            }
                        }}
                    >
                        <PaginatedPopup items={groupItems} />
                    </CircleMarker>
                );
            })}
        </>
    );
};

export default ProjectMarkers;