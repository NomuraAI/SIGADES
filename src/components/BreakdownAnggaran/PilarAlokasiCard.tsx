import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Info, ChevronDown } from 'lucide-react';

const pillars = [
    {
        id: 'ekonomi',
        title: 'Penguatan Ekonomi Desa',
        color: 'from-amber-400 to-amber-600',
        bgLight: 'bg-amber-50',
        textColor: 'text-amber-700',
        borderColor: 'border-amber-200',
        target: '30-40%',
        val2026: 11.62,
        val2027: 18.0,
        pagu2026: 1119408740,
        pagu2027: 24748573314,
        description: 'BUMDes, Alat produksi UMKM, Desa Wisata, Dukungan Pertanian/Perikanan'
    },
    {
        id: 'sdm',
        title: 'Peningkatan Kualitas SDM',
        color: 'from-blue-500 to-blue-700',
        bgLight: 'bg-blue-50',
        textColor: 'text-blue-700',
        borderColor: 'border-blue-200',
        target: '20-25%',
        val2026: 52.31,
        val2027: 52.3,
        pagu2026: 5040198840,
        pagu2027: 71929522233.65,
        description: 'Intervensi Stunting, Posyandu, Beasiswa, Pelatihan Keterampilan Kerja'
    },
    {
        id: 'infrastruktur',
        title: 'Infrastruktur Dasar',
        color: 'from-emerald-500 to-emerald-700',
        bgLight: 'bg-emerald-50',
        textColor: 'text-emerald-700',
        borderColor: 'border-emerald-200',
        target: '20-25%',
        val2026: 33.88,
        val2027: 23.68,
        pagu2026: 3264477920,
        pagu2027: 32563536989,
        description: 'Jalan lingkungan, Irigasi kecil, Air bersih, Sanitasi/Rutilahu'
    },
    {
        id: 'sosial',
        title: 'Sosial & Kelembagaan',
        color: 'from-slate-500 to-slate-700',
        bgLight: 'bg-slate-50',
        textColor: 'text-slate-700',
        borderColor: 'border-slate-200',
        target: '10-15%',
        val2026: 2.19,
        val2027: 6.01,
        pagu2026: 211125000,
        pagu2027: 8264204253,
        description: 'Kapasitas Pemdes, Karang Taruna, Perlindungan sosial komunitas'
    }
];

// Mapping for matching DB values to our pillar IDs
export const mapDBPilarToId = (dbPilar: string) => {
    if (!dbPilar) return null;
    const lower = dbPilar.toLowerCase();
    if (lower.includes('ekonomi')) return 'ekonomi';
    if (lower.includes('sdm')) return 'sdm';
    if (lower.includes('infrastruktur')) return 'infrastruktur';
    if (lower.includes('sosial')) return 'sosial';
    return null;
};

const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(val);
};

const formatShortRupiah = (val: number) => {
    if (val >= 1000000000) {
        return `Rp ${(val / 1000000000).toFixed(1)} Miliar`;
    } else if (val >= 1000000) {
        return `Rp ${(val / 1000000).toFixed(1)} Juta`;
    }
    return formatRupiah(val);
};

interface PilarAlokasiCardProps {
    filterYear: string;
    data: any[]; // ProjectData array
}

const PilarAlokasiCard: React.FC<PilarAlokasiCardProps> = ({ filterYear, data }) => {
    const [expanded, setExpanded] = useState<string | null>(null);

    // Calculate dynamic values
    const dynamicData = React.useMemo(() => {
        let totalPaguGlobal = 0;
        const pilarPagu: Record<string, number> = {
            ekonomi: 0, sdm: 0, infrastruktur: 0, sosial: 0
        };

        data.forEach(item => {
            const val = Number(item.paguAnggaran || 0);
            totalPaguGlobal += val;
            
            const pilarId = mapDBPilarToId(item.pilar);
            if (pilarId) {
                pilarPagu[pilarId] += val;
            }
        });

        const pilarStats: Record<string, { pagu: number, percentage: number }> = {};
        Object.keys(pilarPagu).forEach(key => {
            const pagu = pilarPagu[key];
            const percentage = totalPaguGlobal > 0 ? (pagu / totalPaguGlobal) * 100 : 0;
            pilarStats[key] = { pagu, percentage };
        });

        return { stats: pilarStats, total: totalPaguGlobal };
    }, [data]);

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 overflow-hidden relative w-full mb-8">
            {/* Background Accent */}
            <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                <Target size={200} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10 pt-2 items-start">
                {pillars.map((pillar) => (
                    <motion.div 
                        key={pillar.id}
                        className={`relative rounded-xl border-2 ${pillar.borderColor} ${pillar.bgLight} overflow-hidden transition-all duration-300 shadow-sm hover:shadow-md cursor-pointer flex flex-col`}
                        onClick={() => setExpanded(expanded === pillar.id ? null : pillar.id)}
                        layout
                    >
                        {/* Header Pillar */}
                        <motion.div layout="position" className={`bg-gradient-to-r ${pillar.color} p-4 text-white min-h-[90px] flex items-center justify-between text-left shadow-inner`}>
                            <h4 className="font-bold text-sm md:text-base leading-tight drop-shadow-sm pr-2">{pillar.title}</h4>
                            <div className="bg-white/20 p-1.5 rounded-full flex-shrink-0">
                                <motion.div animate={{ rotate: expanded === pillar.id ? 180 : 0 }}>
                                    <ChevronDown size={18} />
                                </motion.div>
                            </div>
                        </motion.div>

                        {/* Content Overview (Always visible) */}
                        <motion.div layout="position" className="p-5 flex flex-col items-center flex-1">
                            {/* Target Ringkasan */}
                            <div className="w-full bg-white/60 rounded-lg p-3 border border-white/50 shadow-sm mb-5 text-center relative overflow-hidden group">
                                <div className="absolute top-0 left-0 w-1 h-full bg-slate-300 group-hover:bg-lobar-blue transition-colors"></div>
                                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Target Alokasi</span>
                                <span className={`block text-2xl font-black ${pillar.textColor}`}>{pillar.target}</span>
                            </div>

                                {(() => {
                                    const dynStats = dynamicData.stats[pillar.id] || { pagu: 0, percentage: 0 };
                                    const currentPct = dynStats.percentage.toFixed(2);
                                    
                                    return (
                                        <div className="w-full space-y-3">
                                            {/* Dynamic Current Year Progress */}
                                            <div>
                                                <div className="flex justify-between items-end mb-1">
                                                    <span className="text-xs font-bold text-slate-600">Tahun {filterYear || 'Berjalan'} (Live)</span>
                                                    <span className={`text-sm font-black ${pillar.textColor}`}>{currentPct}%</span>
                                                </div>
                                                <div className="w-full bg-slate-200/80 rounded-full h-2.5 overflow-hidden shadow-inner relative mb-1">
                                                    <motion.div 
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${Math.min(dynStats.percentage, 100)}%` }}
                                                        transition={{ duration: 1, ease: "easeOut" }}
                                                        className={`bg-gradient-to-r ${pillar.color} h-2.5 rounded-full`}
                                                    />
                                                </div>
                                                <div className="text-[10px] font-bold text-slate-500 text-left">
                                                    {formatShortRupiah(dynStats.pagu || 0)}
                                                </div>
                                            </div>

                                            {/* Target Musrenbang (Static comparison if needed, or we can hide it. Let's show it as target comparison) */}
                                            <div>
                                                <div className="flex justify-between items-end mb-1">
                                                    <span className="text-xs font-bold text-slate-600 opacity-60">Plafon {filterYear}</span>
                                                    <span className={`text-sm font-black text-slate-400`}>{filterYear === '2026' ? pillar.val2026 : pillar.val2027}%</span>
                                                </div>
                                                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden shadow-inner relative opacity-60 mb-1">
                                                    <motion.div 
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${Math.min(filterYear === '2026' ? pillar.val2026 : pillar.val2027, 100)}%` }}
                                                        transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
                                                        className={`bg-slate-300 h-1.5 rounded-full`}
                                                    />
                                                </div>
                                                <div className="text-[10px] font-bold text-slate-400 text-left">
                                                    {formatShortRupiah(filterYear === '2026' ? pillar.pagu2026 : pillar.pagu2027)}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })()}
                        </motion.div>

                        {/* Collapsible Info (Visible on Click) */}
                        <AnimatePresence>
                            {expanded === pillar.id && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.3, ease: "easeInOut" }}
                                    className="overflow-hidden"
                                >
                                    <div className="px-5 pb-5 pt-2 border-t border-slate-200/50 mt-auto">
                                        <div className="bg-white rounded-lg p-4 shadow-inner border border-slate-100">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Info size={16} className={pillar.textColor} />
                                                <h5 className={`font-bold text-xs uppercase tracking-wider ${pillar.textColor}`}>Cakupan Program</h5>
                                            </div>
                                            <p className="text-xs font-medium text-slate-600 leading-relaxed mb-4">
                                                {pillar.description}
                                            </p>
                                            
                                            <div className="border-t border-dashed border-slate-200 pt-3">
                                                <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Alokasi Riil (Live Data)</h5>
                                                <div className="flex items-baseline gap-1">
                                                    <span className={`text-xl font-black ${pillar.textColor}`}>
                                                        {formatShortRupiah(dynamicData.stats[pillar.id]?.pagu || 0)}
                                                    </span>
                                                </div>
                                                <span className="text-[10px] text-slate-400 font-medium">{formatRupiah(dynamicData.stats[pillar.id]?.pagu || 0)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                    </motion.div>
                ))}
            </div>
        </div>
    );
};

export default PilarAlokasiCard;
