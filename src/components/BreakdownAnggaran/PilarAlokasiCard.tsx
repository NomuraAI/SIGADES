import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Info } from 'lucide-react';

const pillars = [
    {
        id: 'ekonomi',
        title: 'Penguatan Ekonomi Desa',
        color: 'from-amber-400 to-amber-600',
        bgLight: 'bg-amber-50',
        textColor: 'text-amber-700',
        borderColor: 'border-amber-200',
        target: '30-40%',
        val2026: 6.15,
        val2027: 11.6,
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
        val2026: 29.39,
        val2027: 52.3,
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
        val2026: 60.03,
        val2027: 60.0,
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
        val2026: 4.42,
        val2027: 4.42,
        description: 'Kapasitas Pemdes, Karang Taruna, Perlindungan sosial komunitas'
    }
];

const PilarAlokasiCard = () => {
    const [hovered, setHovered] = useState<string | null>(null);

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 overflow-hidden relative w-full mb-8">
            {/* Background Accent */}
            <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                <Target size={200} />
            </div>

            {/* Note: The header was removed because it is already present in BreakdownAnggaranPage sticky header */}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10 pt-2">
                {pillars.map((pillar) => (
                    <motion.div 
                        key={pillar.id}
                        className={`relative rounded-xl border-2 ${pillar.borderColor} ${pillar.bgLight} overflow-hidden transition-all duration-300 shadow-sm hover:shadow-md cursor-pointer`}
                        onMouseEnter={() => setHovered(pillar.id)}
                        onMouseLeave={() => setHovered(null)}
                        layout
                    >
                        {/* Header Pillar */}
                        <div className={`bg-gradient-to-r ${pillar.color} p-4 text-white min-h-[90px] flex items-center justify-center text-center shadow-inner`}>
                            <h4 className="font-bold text-sm md:text-base leading-tight drop-shadow-sm">{pillar.title}</h4>
                        </div>

                        {/* Content */}
                        <div className="p-5 flex flex-col items-center">
                            
                            {/* Target Ringkasan */}
                            <div className="w-full bg-white/60 rounded-lg p-3 border border-white/50 shadow-sm mb-5 text-center relative overflow-hidden group">
                                <div className="absolute top-0 left-0 w-1 h-full bg-slate-300 group-hover:bg-lobar-blue transition-colors"></div>
                                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Target Alokasi</span>
                                <span className={`block text-2xl font-black ${pillar.textColor}`}>{pillar.target}</span>
                            </div>

                            {/* Progres Tahunan */}
                            <div className="w-full space-y-4">
                                <div>
                                    <div className="flex justify-between items-end mb-1">
                                        <span className="text-xs font-bold text-slate-600">Tahun 2026</span>
                                        <span className={`text-sm font-black ${pillar.textColor}`}>{pillar.val2026}%</span>
                                    </div>
                                    <div className="w-full bg-slate-200/80 rounded-full h-2.5 overflow-hidden shadow-inner relative">
                                        <motion.div 
                                            initial={{ width: 0 }}
                                            animate={{ width: `${Math.min(pillar.val2026, 100)}%` }}
                                            transition={{ duration: 1, ease: "easeOut" }}
                                            className={`bg-gradient-to-r ${pillar.color} h-2.5 rounded-full`}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <div className="flex justify-between items-end mb-1">
                                        <span className="text-xs font-bold text-slate-600">Tahun 2027</span>
                                        <span className={`text-sm font-black ${pillar.textColor}`}>{pillar.val2027}%</span>
                                    </div>
                                    <div className="w-full bg-slate-200/80 rounded-full h-2.5 overflow-hidden shadow-inner relative">
                                        <motion.div 
                                            initial={{ width: 0 }}
                                            animate={{ width: `${Math.min(pillar.val2027, 100)}%` }}
                                            transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
                                            className={`bg-gradient-to-r ${pillar.color} h-2.5 rounded-full`}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Expandable Info via Hover */}
                        <AnimatePresence>
                            {hovered === pillar.id && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    transition={{ duration: 0.2 }}
                                    className="absolute inset-0 bg-white/95 backdrop-blur-sm p-6 flex flex-col justify-center items-center text-center z-20"
                                >
                                    <div className={`p-3 rounded-full ${pillar.bgLight} ${pillar.textColor} mb-3`}>
                                        <Info size={24} />
                                    </div>
                                    <h5 className={`font-bold text-sm mb-2 ${pillar.textColor}`}>Cakupan Program</h5>
                                    <p className="text-sm font-medium text-slate-600 leading-relaxed">
                                        {pillar.description}
                                    </p>
                                    <span className="text-[10px] text-slate-400 mt-4 uppercase font-bold tracking-widest border border-slate-200 px-2 py-1 rounded">Arah Kebijakan</span>
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
