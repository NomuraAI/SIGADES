import React, { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { ProjectData } from '../../types';
import { getProjectService } from '../../services/projectService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, PieChart, Pie, Treemap, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ScatterChart, Scatter, ZAxis } from 'recharts';
import { Loader2, Filter, DollarSign, Building2, Wallet, LayoutDashboard, BarChart3, PieChart as PieChartIcon, Users, Baby, Sprout, Target, ArrowUp } from 'lucide-react';
import { motion } from 'framer-motion';
import PilarAlokasiCard, { mapDBPilarToId } from './PilarAlokasiCard';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#8dd1e1'];

const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(val);
};

const CustomScatterTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="bg-white/95 backdrop-blur-md p-4 border border-slate-200/50 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] min-w-[200px]">
                <p className="font-bold text-slate-800 text-sm mb-3 pb-2 border-b border-slate-100">{data.name}</p>
                <div className="space-y-2">
                    <div className="flex justify-between items-center gap-4"><span className="text-xs font-medium text-slate-500"><Users size={12} className="inline mr-1 text-red-500"/>Kemiskinan:</span> <span className="text-xs font-bold text-slate-800">{data.kemiskinan}</span></div>
                    <div className="flex justify-between items-center gap-4"><span className="text-xs font-medium text-slate-500"><Baby size={12} className="inline mr-1 text-orange-500"/>Stunting:</span> <span className="text-xs font-bold text-slate-800">{data.stunting}</span></div>
                    <div className="flex justify-between items-center gap-4"><span className="text-xs font-medium text-slate-500"><Wallet size={12} className="inline mr-1 text-blue-500"/>Pagu:</span> <span className="text-xs font-bold text-lobar-blue">{formatRupiah(data.pagu)}</span></div>
                </div>
            </div>
        );
    }
    return null;
};

const CustomPilarTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        let total = 0;
        payload.forEach((p: any) => { total += p.value; });
        return (
            <div className="bg-white p-3 border border-slate-200 rounded-lg shadow-xl min-w-[200px]">
                <p className="font-bold text-slate-800 text-sm mb-2 pb-2 border-b border-slate-100">{label}</p>
                {payload.map((entry: any, index: number) => (
                    <div key={`item-${index}`} className="flex justify-between items-center gap-4 mb-1">
                        <span className="text-xs font-medium" style={{ color: entry.color }}>{entry.name}:</span>
                        <span className="text-xs font-bold text-slate-700">{formatRupiah(entry.value)}</span>
                    </div>
                ))}
                <div className="flex justify-between items-center gap-4 mt-2 pt-2 border-t border-slate-100">
                    <span className="text-xs font-bold text-slate-500">Total:</span>
                    <span className="text-xs font-black text-lobar-blue">{formatRupiah(total)}</span>
                </div>
            </div>
        );
    }
    return null;
};

interface BreakdownAnggaranPageProps {
    selectedVersion: string;
    dataSourceMode: 'supabase' | 'local';
    filterYear: string;
    setFilterYear: (year: string) => void;
}

const BreakdownAnggaranPage: React.FC<BreakdownAnggaranPageProps> = ({ selectedVersion, dataSourceMode, filterYear, setFilterYear }) => {
    const [data, setData] = useState<ProjectData[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterKecamatan, setFilterKecamatan] = useState<string>('');
    const [filterDesa, setFilterDesa] = useState<string>('');
    const [activeTab, setActiveTab] = useState<'ringkasan' | 'anggaran' | 'demografi'>('ringkasan');
    const [filterBudget, setFilterBudget] = useState<'all' | 'above1M' | 'below1M'>('all');

    // Analyzer State
    const [analyzerPilar, setAnalyzerPilar] = useState<string>('ALL');
    const [analyzerKecamatan, setAnalyzerKecamatan] = useState<string>('ALL');
    const [analyzerDesa, setAnalyzerDesa] = useState<string>('ALL');

    // Budget Chart State
    const [budgetChartPilar, setBudgetChartPilar] = useState<string>('ALL');
    const [budgetChartKecamatan, setBudgetChartKecamatan] = useState<string>('ALL');
    const [budgetChartDesa, setBudgetChartDesa] = useState<string>('ALL');

    // Refs for scrolling
    const sectionStatsRef = useRef<HTMLDivElement>(null);
    const sectionFiltersRef = useRef<HTMLDivElement>(null);
    const sectionBudgetChartRef = useRef<HTMLDivElement>(null);
    const sectionPovertyChartRef = useRef<HTMLDivElement>(null);
    const sectionStuntingChartRef = useRef<HTMLDivElement>(null);
    const sectionPovertyLowestChartRef = useRef<HTMLDivElement>(null);
    const sectionStuntingLowestChartRef = useRef<HTMLDivElement>(null);
    const sectionDensityChartRef = useRef<HTMLDivElement>(null);
    const sectionPotentialChartRef = useRef<HTMLDivElement>(null);
    const sectionPilarTreemapRef = useRef<HTMLDivElement>(null);
    const sectionPilarChartRef = useRef<HTMLDivElement>(null);



    useEffect(() => {
        fetchData();
    }, [selectedVersion, filterYear]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const service = getProjectService(dataSourceMode);
            let allData: ProjectData[] = [];
            let page = 0;
            const pageSize = 1000;
            let hasMore = true;

            while (hasMore) {
                const response = await service.getAllProjects(selectedVersion, page, pageSize);
                
                let chunk = response.data;
                if (filterYear) {
                    chunk = chunk.filter(item => item.dataVersion?.includes(filterYear));
                }

                if (chunk && chunk.length > 0) {
                    allData = [...allData, ...chunk];
                }
                hasMore = response.hasMore;
                page++;
            }

            setData(allData);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    // Get unique Kecamatans
    const uniqueKecamatan = useMemo(() => {
        const kecs = [...new Set(data.map(item => item.kecamatan).filter(Boolean))];
        return kecs.sort();
    }, [data]);

    // Analyzer: Get unique Desa based on selected analyzerKecamatan
    const analyzerAvailableDesa = useMemo(() => {
        if (analyzerKecamatan === 'ALL') {
            const desas = data.map(d => d.desaKelurahan).filter(Boolean) as string[];
            return [...new Set(desas)].sort();
        }
        const desas = data.filter(d => d.kecamatan === analyzerKecamatan).map(d => d.desaKelurahan).filter(Boolean) as string[];
        return [...new Set(desas)].sort();
    }, [data, analyzerKecamatan]);

    // Analyzer Data for Bar Charts
    const analyzerBarData = useMemo(() => {
        const desaGroups: { [key: string]: { total: number, name: string } } = {};

        data.forEach(item => {
            if (analyzerKecamatan !== 'ALL' && item.kecamatan !== analyzerKecamatan) return;
            if (analyzerDesa !== 'ALL' && item.desaKelurahan !== analyzerDesa) return;
            
            const pilarId = mapDBPilarToId(item.pilar);
            if (analyzerPilar !== 'ALL' && pilarId !== analyzerPilar) return;

            const desaName = (item.desaKelurahan || 'Lainnya').trim();
            if (desaName.toLowerCase() === 'lainnya' || desaName === '') return;

            if (!desaGroups[desaName]) {
                desaGroups[desaName] = { total: 0, name: desaName };
            }
            desaGroups[desaName].total += Number(item.paguAnggaran || 0);
        });

        const sorted = Object.values(desaGroups).sort((a, b) => b.total - a.total);
        
        const top20 = sorted.slice(0, 20);
        const bottom20 = [...sorted].sort((a, b) => a.total - b.total).slice(0, 20);

        return { top20, bottom20 };
    }, [data, analyzerKecamatan, analyzerDesa, analyzerPilar]);

    // Apply global Kecamatan and Desa filter
    const filteredData = useMemo(() => {
        let result = data;
        if (filterKecamatan) {
            result = result.filter(item => item.kecamatan === filterKecamatan);
        }
        if (filterDesa) {
            result = result.filter(item => item.desaKelurahan === filterDesa);
        }
        return result;
    }, [data, filterKecamatan, filterDesa]);

    const scatterData = useMemo(() => {
        const desaGroups: { [key: string]: { kemiskinan: number, stunting: number, pagu: number, name: string } } = {};
        filteredData.forEach(item => {
            const rawName = item.desaKelurahan || 'Lainnya';
            const normalizedKey = rawName.replace(/\s+/g, ' ').trim().toUpperCase();
            if (!desaGroups[normalizedKey]) {
                desaGroups[normalizedKey] = { kemiskinan: 0, stunting: 0, pagu: 0, name: rawName.trim() };
            }
            desaGroups[normalizedKey].kemiskinan += Number(item.jumlahAngkaKemiskinan || 0);
            desaGroups[normalizedKey].stunting += Number(item.jumlahBalitaStunting || 0);
            desaGroups[normalizedKey].pagu += Number(item.paguAnggaran || 0);
        });
        return Object.values(desaGroups).filter(d => d.name !== 'Lainnya' && (d.kemiskinan > 0 || d.stunting > 0));
    }, [filteredData]);

    const availableGlobalDesa = useMemo(() => {
        if (!filterKecamatan) return [];
        const desas = data.filter(d => d.kecamatan === filterKecamatan).map(d => d.desaKelurahan).filter(Boolean) as string[];
        return [...new Set(desas)].sort();
    }, [data, filterKecamatan]);

    // Aggregate Data based on filters
    // 1. Budget Data (Existing)
    const budgetData = useMemo(() => {
        const desaGroups: { [key: string]: { total: number, originalName: string } } = {};

        filteredData.forEach(item => {
            const rawName = item.desaKelurahan || 'Lainnya';
            const normalizedKey = rawName.replace(/\s+/g, ' ').trim().toUpperCase();

            if (!desaGroups[normalizedKey]) {
                desaGroups[normalizedKey] = { total: 0, originalName: rawName.trim() };
            }
            desaGroups[normalizedKey].total += (item.paguAnggaran || 0);
        });

        let result = Object.values(desaGroups).map((group) => ({
            name: group.originalName,
            total: group.total,
            status: group.total >= 1000000000 ? 'Sudah Tercapai' : 'Belum Tercapai'
        }));

        if (filterBudget === 'above1M') {
            result = result.filter(item => item.total >= 1000000000);
        } else if (filterBudget === 'below1M') {
            result = result.filter(item => item.total < 1000000000);
        }

        return result.sort((a, b) => b.total - a.total);
    }, [data, filterKecamatan, filterBudget]);

    const budgetAvailableDesa = useMemo(() => {
        if (budgetChartKecamatan === 'ALL') {
            const desas = data.map(d => d.desaKelurahan).filter(Boolean) as string[];
            return [...new Set(desas)].sort();
        }
        const desas = data.filter(d => d.kecamatan === budgetChartKecamatan).map(d => d.desaKelurahan).filter(Boolean) as string[];
        return [...new Set(desas)].sort();
    }, [data, budgetChartKecamatan]);

    const budgetBarData = useMemo(() => {
        const desaGroups: { [key: string]: { total: number, name: string } } = {};

        data.forEach(item => {
            if (budgetChartKecamatan !== 'ALL' && item.kecamatan !== budgetChartKecamatan) return;
            if (budgetChartDesa !== 'ALL' && item.desaKelurahan !== budgetChartDesa) return;
            
            const pilarId = mapDBPilarToId(item.pilar);
            if (budgetChartPilar !== 'ALL' && pilarId !== budgetChartPilar) return;

            const desaName = (item.desaKelurahan || 'Lainnya').trim();
            if (desaName.toLowerCase() === 'lainnya' || desaName === '') return;

            if (!desaGroups[desaName]) {
                desaGroups[desaName] = { total: 0, name: desaName };
            }
            desaGroups[desaName].total += Number(item.paguAnggaran || 0);
        });

        const sorted = Object.values(desaGroups).sort((a, b) => b.total - a.total);
        
        const top20 = sorted.slice(0, 20);
        const bottom20 = [...sorted].sort((a, b) => a.total - b.total).slice(0, 20);

        return { top20, bottom20 };
    }, [data, budgetChartKecamatan, budgetChartDesa, budgetChartPilar]);

    // 2. Poverty Data (Top 20)
    const povertyData = useMemo(() => {
        const desaGroups: { [key: string]: { val: number, name: string } } = {};

        filteredData.forEach(item => {
            const key = (item.desaKelurahan || 'Lainnya').trim().toUpperCase();
            if (!desaGroups[key]) desaGroups[key] = { val: 0, name: item.desaKelurahan || 'Lainnya' };
            // Assuming each row is a project, usually poverty stats are per Desa, so we usually take the value from one row?
            // Or if it's de-normalized, we might sum? 
            // Logic: If 'jumlahAngkaKemiskinan' is redundant across project rows for same desa, max() is safer than sum().
            // But let's assume standard behavior: max of the group to avoid double counting if data is duplicated per project
            desaGroups[key].val = Math.max(desaGroups[key].val, item.jumlahAngkaKemiskinan || 0);
        });

        return Object.values(desaGroups)
            .sort((a, b) => b.val - a.val)
            .slice(0, 20);
    }, [data, filterKecamatan]);

    // 3. Stunting Data (Top 20)
    const stuntingData = useMemo(() => {
        const desaGroups: { [key: string]: { val: number, name: string } } = {};

        filteredData.forEach(item => {
            const key = (item.desaKelurahan || 'Lainnya').trim().toUpperCase();
            if (!desaGroups[key]) desaGroups[key] = { val: 0, name: item.desaKelurahan || 'Lainnya' };
            desaGroups[key].val = Math.max(desaGroups[key].val, item.jumlahBalitaStunting || 0);
        });

        return Object.values(desaGroups)
            .sort((a, b) => b.val - a.val)
            .slice(0, 20);
    }, [data, filterKecamatan]);

    // 3.b Poverty Data (Lowest 20)
    const povertyDataLowest = useMemo(() => {
        const desaGroups: { [key: string]: { val: number, name: string } } = {};

        filteredData.forEach(item => {
            const key = (item.desaKelurahan || 'Lainnya').trim().toUpperCase();
            if (!desaGroups[key]) desaGroups[key] = { val: 0, name: item.desaKelurahan || 'Lainnya' };
            desaGroups[key].val = Math.max(desaGroups[key].val, item.jumlahAngkaKemiskinan || 0);
        });

        // Filter out 0 values if desired? Usually 0 is good for "lowest". 
        // But if 0 means "no data", we might want to filter? 
        // For now, let's keep 0 as valid "lowest".
        return Object.values(desaGroups)
            .sort((a, b) => a.val - b.val)
            .slice(0, 20);
    }, [data, filterKecamatan]);

    // 3.c Stunting Data (Lowest 20)
    const stuntingDataLowest = useMemo(() => {
        const desaGroups: { [key: string]: { val: number, name: string } } = {};

        filteredData.forEach(item => {
            const key = (item.desaKelurahan || 'Lainnya').trim().toUpperCase();
            if (!desaGroups[key]) desaGroups[key] = { val: 0, name: item.desaKelurahan || 'Lainnya' };
            desaGroups[key].val = Math.max(desaGroups[key].val, item.jumlahBalitaStunting || 0);
        });

        return Object.values(desaGroups)
            .sort((a, b) => a.val - b.val)
            .slice(0, 20);
    }, [data, filterKecamatan]);

    // 3.d Population Density Data (Top 20)
    const densityData = useMemo(() => {
        const desaGroups: { [key: string]: { val: number, name: string } } = {};

        filteredData.forEach(item => {
            const key = (item.desaKelurahan || 'Lainnya').trim().toUpperCase();
            if (!desaGroups[key]) desaGroups[key] = { val: 0, name: item.desaKelurahan || 'Lainnya' };
            // Use padded 0 if undefined
            desaGroups[key].val = Math.max(desaGroups[key].val, item.kepadatanPenduduk || 0);
        });

        return Object.values(desaGroups)
            .sort((a, b) => b.val - a.val)
            .slice(0, 20);
    }, [data, filterKecamatan]);

    // 4. Potential Data (Pie Chart)
    const potentialData = useMemo(() => {
        const counts: { [key: string]: number } = {};
        filteredData.forEach(item => {
            const p = (item.potensiDesa || 'Tidak Ada Data').trim();
            // Simple Clean: Capitalize first word
            const label = p.charAt(0).toUpperCase() + p.slice(1).toLowerCase();
            counts[label] = (counts[label] || 0) + 1;
        });

        const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#8dd1e1'];

        return Object.keys(counts).map((key, index) => ({
            name: key,
            value: counts[key],
            fill: COLORS[index % COLORS.length]
        })).sort((a, b) => b.value - a.value); // Sort for better pie visual
    }, [filteredData]);

    // 4.b Pilar Distribution Data (Pie Chart)
    const pilarPieData = useMemo(() => {
        const pilarPagu: Record<string, number> = {
            ekonomi: 0, sdm: 0, infrastruktur: 0, sosial: 0
        };

        filteredData.forEach(item => {
            const val = Number(item.paguAnggaran || 0);
            const pilarId = mapDBPilarToId(item.pilar);
            if (pilarId) pilarPagu[pilarId] += val;
        });

        const pilarNames: any = {
            sdm: 'Peningkatan SDM',
            infrastruktur: 'Infrastruktur Dasar',
            ekonomi: 'Penguatan Ekonomi',
            sosial: 'Sosial & Kelembagaan'
        };
        const PIE_COLORS: any = {
            sdm: '#3b82f6',
            infrastruktur: '#10b981',
            ekonomi: '#f59e0b',
            sosial: '#64748b'
        };

        return Object.keys(pilarPagu)
            .filter(key => pilarPagu[key] > 0)
            .map(key => ({
                name: pilarNames[key],
                value: pilarPagu[key],
                fill: PIE_COLORS[key]
            }));
    }, [filteredData]);

    // 5. Stacked Bar Data (OPD -> Pilar)
    const pilarBarData = useMemo(() => {
        const opdMap: { [opd: string]: any } = {};

        filteredData.forEach(item => {
            const opd = (item.perangkatDaerah || 'Lainnya').replace('DINAS ', 'D. ').replace('BADAN ', 'B. ');
            const val = item.paguAnggaran || 0;
            const pilarId = mapDBPilarToId(item.pilar) || 'lainnya';

            if (!opdMap[opd]) {
                opdMap[opd] = { name: opd, total: 0, ekonomi: 0, sdm: 0, infrastruktur: 0, sosial: 0, lainnya: 0 };
            }
            opdMap[opd][pilarId] += val;
            opdMap[opd].total += val;
        });

        // Convert to array, sort by total descending, take top 20
        return Object.values(opdMap)
            .sort((a, b) => b.total - a.total)
            .slice(0, 20);
    }, [filteredData]);


    const stats = useMemo(() => {
        const totalBudget = budgetData.reduce((acc, curr) => acc + curr.total, 0);
        
        // Exclude 'Lainnya' (empty desa rows) from the village counts
        const validDesaBudget = budgetData.filter(d => d.name && d.name.toLowerCase() !== 'lainnya');
        const totalDesa = validDesaBudget.length; 
        const above1MCount = validDesaBudget.filter(d => d.total >= 1000000000).length;

        // Helper for global sums based on current filter
        const uniqueDesaMap: { [k: string]: any } = {};

        filteredData.forEach(item => {
            const k = (item.desaKelurahan || '').trim().toUpperCase();
            if (!uniqueDesaMap[k]) uniqueDesaMap[k] = { pov: 0, stunt: 0 };
            uniqueDesaMap[k].pov = Math.max(uniqueDesaMap[k].pov, item.jumlahAngkaKemiskinan || 0);
            uniqueDesaMap[k].stunt = Math.max(uniqueDesaMap[k].stunt, item.jumlahBalitaStunting || 0);
        });

        const realTotalPoverty = Object.values(uniqueDesaMap).reduce((acc: number, curr: any) => acc + curr.pov, 0);
        const realTotalStunting = Object.values(uniqueDesaMap).reduce((acc: number, curr: any) => acc + curr.stunt, 0);

        return { totalBudget, totalDesa, above1MCount, realTotalPoverty, realTotalStunting };
    }, [budgetData, data, filterKecamatan, povertyData]); // Deps ok?

    const formatRupiah = (val: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(val);
    };

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-white p-4 border border-slate-200 shadow-xl rounded-xl">
                    <p className="font-bold text-slate-800 mb-1">{data.name || label}</p>
                    {data.total !== undefined && (
                        <p className="text-lobar-blue font-bold text-lg mb-1">{formatRupiah(data.total)}</p>
                    )}
                    {data.val !== undefined && (
                        <p className="text-slate-800 font-bold text-lg mb-1">{data.val} Jiwa</p>
                    )}
                    {data.value !== undefined && (
                        <p className="text-slate-800 font-bold text-lg mb-1">{data.value} Desa</p>
                    )}
                    {data.status && (
                        <div className={`inline-block px-2 py-1 rounded text-xs font-bold ${data.status === 'Sudah Tercapai' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                            {data.status}
                        </div>
                    )}
                </div>
            );
        }
        return null;
    };

    const scrollToSection = (ref: React.RefObject<HTMLDivElement>) => {
        if (ref.current) {
            ref.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    return (
        <div className="flex flex-col h-full bg-slate-50 overflow-hidden">
            {/* Sticky Header Section */}
            <div className="flex-none pt-4 md:pt-6 px-4 md:px-6 pb-2 z-30 bg-slate-50 border-b border-slate-100">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-3 md:gap-4 mb-4">
                    <div>
                        <h1 className="text-xl md:text-2xl font-bold text-slate-800">Dashboard Interaktif</h1>
                        <p className="text-lobar-blue text-sm md:text-base font-bold mt-1">Pilar Alokasi Indikatif : Komposisi 1 Miliar Per Desa</p>
                        <p className="text-slate-500 text-xs md:text-sm mt-1 max-w-2xl font-medium">
                            Struktur alokasi yang dikunci untuk menjamin keseimbangan absolut antara pembangunan fisik dan pembangunan manusia.
                        </p>
                    </div>

                    {/* Tahun Tabulasi */}
                    <div className="flex bg-slate-200/50 p-1 rounded-xl shadow-inner overflow-x-auto custom-scrollbar max-w-[50vw]">
                        {['2026', '2027', '2028', '2029', '2030'].map(year => (
                            <button
                                key={year}
                                onClick={() => setFilterYear(year)}
                                className={`px-4 py-1.5 text-sm font-bold rounded-lg transition-all ${filterYear === year ? 'bg-white text-lobar-blue shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                {year}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Global Filters & Tabs */}
            <div className="flex-none px-4 md:px-6 pb-4 z-30 bg-slate-50 border-b border-slate-200">
                <div className="flex flex-col md:flex-row justify-between gap-4 mb-4">
                    {/* Global Filters */}
                    <div className="flex flex-wrap gap-3 items-center">
                        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-1.5 shadow-sm">
                            <Filter size={16} className="text-slate-400" />
                            <select
                                className="bg-transparent text-sm font-bold text-slate-700 outline-none"
                                value={filterKecamatan}
                                onChange={(e) => {
                                    setFilterKecamatan(e.target.value);
                                    setFilterDesa('');
                                }}
                            >
                                <option value="">Semua Kecamatan</option>
                                {uniqueKecamatan.map(kec => <option key={kec} value={kec}>{kec}</option>)}
                            </select>
                        </div>
                        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-1.5 shadow-sm">
                            <Building2 size={16} className="text-slate-400" />
                            <select
                                className="bg-transparent text-sm font-bold text-slate-700 outline-none"
                                value={filterDesa}
                                onChange={(e) => setFilterDesa(e.target.value)}
                                disabled={!filterKecamatan}
                            >
                                <option value="">Semua Desa</option>
                                {availableGlobalDesa.map(desa => <option key={desa} value={desa}>{desa}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex bg-slate-200/50 p-1 rounded-xl shadow-inner overflow-x-auto custom-scrollbar">
                        <button
                            onClick={() => setActiveTab('ringkasan')}
                            className={`px-4 py-1.5 text-sm font-bold rounded-lg transition-all ${activeTab === 'ringkasan' ? 'bg-white text-lobar-blue shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Ringkasan Eksekutif
                        </button>
                        <button
                            onClick={() => setActiveTab('anggaran')}
                            className={`px-4 py-1.5 text-sm font-bold rounded-lg transition-all ${activeTab === 'anggaran' ? 'bg-white text-lobar-blue shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Analisis Anggaran
                        </button>
                        <button
                            onClick={() => setActiveTab('demografi')}
                            className={`px-4 py-1.5 text-sm font-bold rounded-lg transition-all ${activeTab === 'demografi' ? 'bg-white text-lobar-blue shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Profil Demografi
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 w-full mx-auto p-4 md:p-6 lg:p-8 flex flex-col min-h-0 overflow-y-auto">
                <div className="flex-none w-full space-y-8">
                    {/* TAB: RINGKASAN EKSEKUTIF */}
                    {activeTab === 'ringkasan' && (
                        <div className="space-y-8">
                            {/* PILAR ALOKASI CARD - NOW DYNAMIC */}
                            <PilarAlokasiCard 
                                filterYear={filterYear} 
                                data={filteredData} 
                                onScrollToAnalyzer={(pilarId) => {
                                    setAnalyzerPilar(pilarId);
                                    setActiveTab('anggaran');
                                    setTimeout(() => {
                                        sectionPilarChartRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                    }, 100);
                                }}
                            />

                            {/* GRAFIK CAPAIAN 4 PILAR - SIDE BY SIDE */}
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8">
                                {/* Bar Chart */}
                                <motion.div 
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5, delay: 0.1 }}
                                    className="scroll-mt-32 bg-white/70 backdrop-blur-xl rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200/60 p-6 relative flex flex-col overflow-hidden group hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300"
                                >
                                    <div className="flex items-center justify-between mb-6 relative z-10">
                                        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                            <Target className="text-lobar-blue" />
                                            Capaian Pondasi 4 Pilar {filterDesa ? `- Desa ${filterDesa}` : filterKecamatan ? `- Kec. ${filterKecamatan}` : ''}
                                        </h3>
                                    </div>
                                    <div className="w-full h-[400px] flex items-center justify-center relative z-10">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart 
                                                data={[
                                                    { name: 'Penguatan Ekonomi', total: pilarPieData.find(d => d.name === 'Penguatan Ekonomi')?.value || 0 },
                                                    { name: 'Peningkatan SDM', total: pilarPieData.find(d => d.name === 'Peningkatan SDM')?.value || 0 },
                                                    { name: 'Infrastruktur Dasar', total: pilarPieData.find(d => d.name === 'Infrastruktur Dasar')?.value || 0 },
                                                    { name: 'Sosial & Kelembagaan', total: pilarPieData.find(d => d.name === 'Sosial & Kelembagaan')?.value || 0 }
                                                ]} 
                                                margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
                                            >
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                                <XAxis dataKey="name" angle={-45} textAnchor="end" interval={0} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 'bold' }} />
                                                <YAxis tickFormatter={(val) => val >= 1000000000 ? `Rp ${(val / 1000000000).toFixed(1)} M` : `Rp ${(val / 1000000).toFixed(0)} Jt`} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} width={80} />
                                                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                                                <Bar dataKey="total" radius={[4, 4, 0, 0]} maxBarSize={60}>
                                                    { [
                                                        { fill: '#f59e0b' },
                                                        { fill: '#3b82f6' },
                                                        { fill: '#10b981' },
                                                        { fill: '#64748b' }
                                                    ].map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </motion.div>

                                {/* Radar Chart */}
                                <motion.div 
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5, delay: 0.2 }}
                                    className="scroll-mt-32 bg-white/70 backdrop-blur-xl rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200/60 p-6 relative flex flex-col overflow-hidden group hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300"
                                >
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-lobar-blue/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
                                    <div className="flex items-center justify-between mb-6 relative z-10">
                                        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                            <Target className="text-lobar-blue" />
                                            Keseimbangan 4 Pilar {filterDesa ? `- Desa ${filterDesa}` : filterKecamatan ? `- Kec. ${filterKecamatan}` : ''}
                                        </h3>
                                    </div>
                                    <div className="w-full h-[320px] flex items-center justify-center relative z-10 mb-2">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={[
                                                { name: 'Ekonomi', total: pilarPieData.find(d => d.name === 'Penguatan Ekonomi')?.value || 0, fullMark: Math.max(...pilarPieData.map(d=>d.value), 1) },
                                                { name: 'SDM', total: pilarPieData.find(d => d.name === 'Peningkatan SDM')?.value || 0, fullMark: Math.max(...pilarPieData.map(d=>d.value), 1) },
                                                { name: 'Infrastruktur', total: pilarPieData.find(d => d.name === 'Infrastruktur Dasar')?.value || 0, fullMark: Math.max(...pilarPieData.map(d=>d.value), 1) },
                                                { name: 'Sosial', total: pilarPieData.find(d => d.name === 'Sosial & Kelembagaan')?.value || 0, fullMark: Math.max(...pilarPieData.map(d=>d.value), 1) }
                                            ]}>
                                                <PolarGrid stroke="#e2e8f0" />
                                                <PolarAngleAxis dataKey="name" tick={{ fill: '#475569', fontSize: 13, fontWeight: 'bold' }} />
                                                <PolarRadiusAxis angle={30} domain={[0, 'auto']} tickFormatter={(val) => `Rp ${(val / 1000000).toFixed(0)}Jt`} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                                                <Radar name="Realisasi Pagu" dataKey="total" stroke="#3b82f6" strokeWidth={3} fill="#3b82f6" fillOpacity={0.5} />
                                                <Tooltip formatter={(value: number) => formatRupiah(value)} />
                                            </RadarChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="mt-auto pt-4 border-t border-slate-100/60 relative z-10">
                                        <p className="text-[11px] text-slate-500 leading-relaxed mb-3">
                                            <strong className="text-slate-700">Panduan Membaca:</strong> Semakin luas area grafik ditarik ke suatu sudut, semakin besar porsi anggaran di pilar tersebut. Keseimbangan bentuk jaring merepresentasikan pemerataan fokus pembangunan di 4 fondasi utama:
                                        </p>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-[10px]">
                                            <div className="flex items-start gap-2"><div className="w-2 h-2 mt-0.5 shrink-0 rounded-full bg-[#f59e0b]"></div><span className="text-slate-600"><strong>Ekonomi:</strong> BUMDes & Ketahanan Pangan</span></div>
                                            <div className="flex items-start gap-2"><div className="w-2 h-2 mt-0.5 shrink-0 rounded-full bg-[#3b82f6]"></div><span className="text-slate-600"><strong>SDM:</strong> Edukasi & Penurunan Stunting</span></div>
                                            <div className="flex items-start gap-2"><div className="w-2 h-2 mt-0.5 shrink-0 rounded-full bg-[#10b981]"></div><span className="text-slate-600"><strong>Infrastruktur:</strong> Fisik, Jalan & Sanitasi</span></div>
                                            <div className="flex items-start gap-2"><div className="w-2 h-2 mt-0.5 shrink-0 rounded-full bg-[#64748b]"></div><span className="text-slate-600"><strong>Sosial:</strong> Bantuan & Pemberdayaan</span></div>
                                        </div>
                                    </div>
                                </motion.div>
                            </div>

                            {/* Section 1: Stats Cards (Bento Box) */}
                            <motion.div 
                                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}
                                ref={sectionStatsRef} className="scroll-mt-32 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
                            >
                                {/* Total Anggaran (Takes 2 cols) */}
                                <div className="lg:col-span-2 bg-gradient-to-br from-blue-600 to-indigo-700 p-6 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] text-white relative overflow-hidden transition-transform hover:-translate-y-1 hover:shadow-[0_8px_30px_rgb(0,0,0,0.2)] duration-300 flex flex-col justify-between">
                                    <div className="absolute -top-4 -right-4 p-4 opacity-10 rotate-12 scale-150"><Wallet size={80} /></div>
                                    <p className="text-blue-100 text-xs font-bold uppercase mb-2 tracking-wider">Total Anggaran (Pagu)</p>
                                    <h3 className="text-3xl font-black">{formatRupiah(stats.totalBudget)}</h3>
                                </div>

                                {/* Jumlah Desa & Status Capaian */}
                                <div className="bg-white/80 backdrop-blur-md p-6 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col justify-center transition-transform hover:-translate-y-1 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] duration-300">
                                    <p className="text-slate-400 text-[10px] font-bold uppercase mb-1 tracking-wider">Jumlah Desa Tersalur</p>
                                    <div className="flex items-end gap-2">
                                        <h3 className="text-3xl font-black text-slate-800">{stats.totalDesa}</h3>
                                        <span className="text-sm text-slate-500 font-medium mb-1">Desa</span>
                                    </div>
                                </div>
                                <div className="bg-white/80 backdrop-blur-md p-6 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col justify-center transition-transform hover:-translate-y-1 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] duration-300">
                                    <p className="text-slate-400 text-[10px] font-bold uppercase mb-1 tracking-wider">Tercapai {'>'} 1M</p>
                                    <div className="flex items-end gap-2">
                                        <h3 className="text-3xl font-black text-emerald-500">{stats.above1MCount}</h3>
                                        <span className="text-sm text-slate-500 font-medium mb-1">Desa</span>
                                    </div>
                                </div>

                                {/* Kemiskinan, Stunting, Potensi */}
                                <div className="bg-white/80 backdrop-blur-md p-6 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 border-l-4 border-l-red-500 flex flex-col justify-between transition-transform hover:-translate-y-1 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] duration-300">
                                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider flex items-center justify-between">Kemiskinan <Users size={14}/></p>
                                    <h3 className="text-2xl font-black text-slate-800 mt-2">{stats.realTotalPoverty.toLocaleString()} <span className="text-xs text-slate-400 font-medium">Jiwa</span></h3>
                                </div>
                                <div className="bg-white/80 backdrop-blur-md p-6 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 border-l-4 border-l-orange-500 flex flex-col justify-between transition-transform hover:-translate-y-1 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] duration-300">
                                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider flex items-center justify-between">Stunting <Baby size={14}/></p>
                                    <h3 className="text-2xl font-black text-slate-800 mt-2">{stats.realTotalStunting.toLocaleString()} <span className="text-xs text-slate-400 font-medium">Anak</span></h3>
                                </div>
                                <div className="lg:col-span-2 bg-white/80 backdrop-blur-md p-6 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 border-l-4 border-l-green-500 flex flex-col justify-between transition-transform hover:-translate-y-1 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] duration-300">
                                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider flex items-center justify-between">Potensi Desa <Sprout size={14}/></p>
                                    <h3 className="text-2xl font-black text-slate-800 mt-2">{potentialData.length} <span className="text-xs text-slate-400 font-medium">Kategori Dikelola</span></h3>
                                </div>
                            </motion.div>
                        </div>
                    )}

                    {/* TAB: ANALISIS ANGGARAN */}
                    {activeTab === 'anggaran' && (
                        <div className="space-y-8">
                            {/* Section: Pilar Analyzer Spesifik Desa (Bar Charts) */}
                            <div ref={sectionPilarChartRef} className="scroll-mt-32 bg-white rounded-xl shadow-sm border border-slate-200 p-6 relative flex flex-col mb-8">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2"><Target className="text-indigo-500" /> Analisis Pilar Spesifik Desa</h3>
                        </div>
                        
                        {/* Analyzer Filters */}
                        <div className="flex flex-wrap gap-4 mb-8 bg-slate-50 p-4 rounded-xl border border-slate-100">
                            <div className="flex flex-col w-full md:w-auto">
                                <label className="text-xs font-bold text-slate-500 mb-1 uppercase">1. Pilar</label>
                                <select 
                                    className="bg-white border border-slate-300 rounded-lg px-4 py-2 font-bold text-slate-700 outline-none focus:border-lobar-blue focus:ring-2 focus:ring-blue-100 min-w-[200px]" 
                                    value={analyzerPilar} 
                                    onChange={(e) => setAnalyzerPilar(e.target.value)}
                                >
                                    <option value="ALL">Semua Pilar</option>
                                    <option value="sdm">Peningkatan SDM</option>
                                    <option value="infrastruktur">Infrastruktur Dasar</option>
                                    <option value="ekonomi">Penguatan Ekonomi</option>
                                    <option value="sosial">Sosial & Kelembagaan</option>
                                </select>
                            </div>
                            <div className="flex flex-col w-full md:w-auto">
                                <label className="text-xs font-bold text-slate-500 mb-1 uppercase">2. Kecamatan</label>
                                <select 
                                    className="bg-white border border-slate-300 rounded-lg px-4 py-2 font-bold text-slate-700 outline-none focus:border-lobar-blue focus:ring-2 focus:ring-blue-100 min-w-[200px]" 
                                    value={analyzerKecamatan} 
                                    onChange={(e) => {
                                        setAnalyzerKecamatan(e.target.value);
                                        setAnalyzerDesa('ALL'); // reset desa
                                    }}
                                >
                                    <option value="ALL">Semua Kecamatan</option>
                                    {uniqueKecamatan.map(kec => (<option key={kec} value={kec}>{kec}</option>))}
                                </select>
                            </div>
                            <div className="flex flex-col w-full md:w-auto">
                                <label className="text-xs font-bold text-slate-500 mb-1 uppercase">3. Desa</label>
                                <select 
                                    className="bg-white border border-slate-300 rounded-lg px-4 py-2 font-bold text-slate-700 outline-none focus:border-lobar-blue focus:ring-2 focus:ring-blue-100 min-w-[200px]" 
                                    value={analyzerDesa} 
                                    onChange={(e) => setAnalyzerDesa(e.target.value)}
                                >
                                    <option value="ALL">Semua Desa</option>
                                    {analyzerAvailableDesa.map(desa => (<option key={desa} value={desa}>{desa}</option>))}
                                </select>
                            </div>
                        </div>

                        {/* Analyzer Results - Top 20 & Bottom 20 */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* 20 Tertinggi */}
                            <div className="flex flex-col">
                                <h4 className="text-md font-bold text-slate-700 mb-4 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                                    20 Tertinggi
                                </h4>
                                {analyzerBarData.top20.length > 0 ? (
                                    <div className="w-full overflow-x-auto pb-4 custom-scrollbar">
                                        <div style={{ minWidth: 500, height: 400 }}>
                                            <ResponsiveContainer width="99%" height={400}>
                                                <BarChart data={analyzerBarData.top20} margin={{ top: 20, right: 30, left: 20, bottom: 80 }} layout="horizontal">
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                                    <XAxis dataKey="name" angle={-45} textAnchor="end" interval={0} tick={{ fontSize: 11, fill: '#64748b' }} />
                                                    <YAxis tickFormatter={(val) => val >= 1000000000 ? `Rp ${(val / 1000000000).toFixed(1)} M` : `Rp ${(val / 1000000).toFixed(0)} Jt`} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} width={80} />
                                                    <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f1f5f9' }} />
                                                    <Bar dataKey="total" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={40} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                ) : <div className="h-48 flex items-center justify-center text-slate-400 border border-dashed border-slate-200 rounded-xl">Data tidak tersedia</div>}
                            </div>

                            {/* 20 Terendah */}
                            <div className="flex flex-col">
                                <h4 className="text-md font-bold text-slate-700 mb-4 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                    20 Terendah
                                </h4>
                                {analyzerBarData.bottom20.length > 0 ? (
                                    <div className="w-full overflow-x-auto pb-4 custom-scrollbar">
                                        <div style={{ minWidth: 500, height: 400 }}>
                                            <ResponsiveContainer width="99%" height={400}>
                                                <BarChart data={analyzerBarData.bottom20} margin={{ top: 20, right: 30, left: 20, bottom: 80 }} layout="horizontal">
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                                    <XAxis dataKey="name" angle={-45} textAnchor="end" interval={0} tick={{ fontSize: 11, fill: '#64748b' }} />
                                                    <YAxis tickFormatter={(val) => val >= 1000000000 ? `Rp ${(val / 1000000000).toFixed(1)} M` : `Rp ${(val / 1000000).toFixed(0)} Jt`} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} width={80} />
                                                    <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f1f5f9' }} />
                                                    <Bar dataKey="total" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                ) : <div className="h-48 flex items-center justify-center text-slate-400 border border-dashed border-slate-200 rounded-xl">Data tidak tersedia</div>}
                            </div>
                        </div>
                    </div>

                    {/* Section 3: Budget Analysis */}
                    <div ref={sectionBudgetChartRef} className="scroll-mt-32 bg-white rounded-xl shadow-sm border border-slate-200 p-6 relative flex flex-col mb-8">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2"><BarChart3 className="text-lobar-blue" /> Analisis Anggaran per Desa</h3>
                        </div>

                        {/* Budget Chart Filters */}
                        <div className="flex flex-wrap gap-4 mb-8 bg-slate-50 p-4 rounded-xl border border-slate-100">
                            <div className="flex flex-col w-full md:w-auto">
                                <label className="text-xs font-bold text-slate-500 mb-1 uppercase">1. Pilar</label>
                                <select 
                                    className="bg-white border border-slate-300 rounded-lg px-4 py-2 font-bold text-slate-700 outline-none focus:border-lobar-blue focus:ring-2 focus:ring-blue-100 min-w-[200px]" 
                                    value={budgetChartPilar} 
                                    onChange={(e) => setBudgetChartPilar(e.target.value)}
                                >
                                    <option value="ALL">Semua Pilar</option>
                                    <option value="sdm">Peningkatan SDM</option>
                                    <option value="infrastruktur">Infrastruktur Dasar</option>
                                    <option value="ekonomi">Penguatan Ekonomi</option>
                                    <option value="sosial">Sosial & Kelembagaan</option>
                                </select>
                            </div>
                            <div className="flex flex-col w-full md:w-auto">
                                <label className="text-xs font-bold text-slate-500 mb-1 uppercase">2. Kecamatan</label>
                                <select 
                                    className="bg-white border border-slate-300 rounded-lg px-4 py-2 font-bold text-slate-700 outline-none focus:border-lobar-blue focus:ring-2 focus:ring-blue-100 min-w-[200px]" 
                                    value={budgetChartKecamatan} 
                                    onChange={(e) => {
                                        setBudgetChartKecamatan(e.target.value);
                                        setBudgetChartDesa('ALL'); // reset desa
                                    }}
                                >
                                    <option value="ALL">Semua Kecamatan</option>
                                    {uniqueKecamatan.map(kec => (<option key={kec} value={kec}>{kec}</option>))}
                                </select>
                            </div>
                            <div className="flex flex-col w-full md:w-auto">
                                <label className="text-xs font-bold text-slate-500 mb-1 uppercase">3. Desa</label>
                                <select 
                                    className="bg-white border border-slate-300 rounded-lg px-4 py-2 font-bold text-slate-700 outline-none focus:border-lobar-blue focus:ring-2 focus:ring-blue-100 min-w-[200px]" 
                                    value={budgetChartDesa} 
                                    onChange={(e) => setBudgetChartDesa(e.target.value)}
                                >
                                    <option value="ALL">Semua Desa</option>
                                    {budgetAvailableDesa.map(desa => (<option key={desa} value={desa}>{desa}</option>))}
                                </select>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* 20 Tertinggi */}
                            <div className="flex flex-col">
                                <h4 className="text-md font-bold text-slate-700 mb-4 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                                    20 Tertinggi
                                </h4>
                                {budgetBarData.top20.length > 0 ? (
                                    <div className="w-full overflow-x-auto pb-4 custom-scrollbar">
                                        <div style={{ minWidth: 500, height: 400 }}>
                                            <ResponsiveContainer width="99%" height={400}>
                                                <BarChart data={budgetBarData.top20} margin={{ top: 20, right: 30, left: 20, bottom: 80 }} layout="horizontal">
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                                    <XAxis dataKey="name" angle={-45} textAnchor="end" interval={0} tick={{ fontSize: 11, fill: '#64748b' }} />
                                                    <YAxis tickFormatter={(val) => val >= 1000000000 ? `Rp ${(val / 1000000000).toFixed(1)} M` : `Rp ${(val / 1000000).toFixed(0)} Jt`} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} width={80} />
                                                    <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f1f5f9' }} />
                                                    <Bar dataKey="total" radius={[4, 4, 0, 0]} maxBarSize={40}>
                                                        {budgetBarData.top20.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.total >= 1000000000 ? '#16a34a' : '#f59e0b'} />))}
                                                    </Bar>
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                ) : <div className="h-48 flex items-center justify-center text-slate-400 border border-dashed border-slate-200 rounded-xl">Data tidak tersedia</div>}
                            </div>

                            {/* 20 Terendah */}
                            <div className="flex flex-col">
                                <h4 className="text-md font-bold text-slate-700 mb-4 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                                    20 Terendah
                                </h4>
                                {budgetBarData.bottom20.length > 0 ? (
                                    <div className="w-full overflow-x-auto pb-4 custom-scrollbar">
                                        <div style={{ minWidth: 500, height: 400 }}>
                                            <ResponsiveContainer width="99%" height={400}>
                                                <BarChart data={budgetBarData.bottom20} margin={{ top: 20, right: 30, left: 20, bottom: 80 }} layout="horizontal">
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                                    <XAxis dataKey="name" angle={-45} textAnchor="end" interval={0} tick={{ fontSize: 11, fill: '#64748b' }} />
                                                    <YAxis tickFormatter={(val) => val >= 1000000000 ? `Rp ${(val / 1000000000).toFixed(1)} M` : `Rp ${(val / 1000000).toFixed(0)} Jt`} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} width={80} />
                                                    <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f1f5f9' }} />
                                                    <Bar dataKey="total" radius={[4, 4, 0, 0]} maxBarSize={40}>
                                                        {budgetBarData.bottom20.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.total >= 1000000000 ? '#16a34a' : '#f59e0b'} />))}
                                                    </Bar>
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                ) : <div className="h-48 flex items-center justify-center text-slate-400 border border-dashed border-slate-200 rounded-xl">Data tidak tersedia</div>}
                            </div>
                        </div>
                    </div>

                    {/* Section 3.b: Stacked Bar Distribusi Pilar */}
                    <div ref={sectionPilarTreemapRef} className="scroll-mt-32 bg-white rounded-xl shadow-sm border border-slate-200 p-6 relative flex flex-col min-h-[500px]">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2"><Target className="text-indigo-600" /> Distribusi Pilar per OPD (Top 20)</h3>
                            <div className="text-xs text-slate-400 font-medium bg-slate-50 px-3 py-1 rounded-full">Berdasarkan Pagu Anggaran</div>
                        </div>
                        {pilarBarData.length > 0 ? (
                            <div className="w-full overflow-x-auto pb-4 custom-scrollbar">
                                <div style={{ minWidth: Math.max(1000, pilarBarData.length * 60), height: 500 }}>
                                    <ResponsiveContainer width="99%" height={500}>
                                        <BarChart data={pilarBarData} margin={{ top: 20, right: 30, left: 40, bottom: 100 }} layout="horizontal">
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                            <XAxis dataKey="name" angle={-45} textAnchor="end" interval={0} tick={{ fontSize: 11, fill: '#64748b' }} />
                                            <YAxis tickFormatter={(val) => `Rp ${(val / 1000000000).toFixed(1)} M`} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                            <Tooltip content={<CustomPilarTooltip />} cursor={{ fill: '#f1f5f9' }} />
                                            <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '12px', fontWeight: 'bold' }} />
                                            <Bar dataKey="sdm" name="Peningkatan Kualitas SDM" stackId="a" fill="#3b82f6" />
                                            <Bar dataKey="infrastruktur" name="Infrastruktur Dasar" stackId="a" fill="#10b981" />
                                            <Bar dataKey="ekonomi" name="Penguatan Ekonomi Desa" stackId="a" fill="#f59e0b" />
                                            <Bar dataKey="sosial" name="Sosial & Kelembagaan" stackId="a" fill="#64748b" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        ) : <div className="h-64 flex items-center justify-center text-slate-400">Data pilar tidak tersedia</div>}
                    </div>
                        </div>
                    )}

                    {/* TAB: PROFIL DEMOGRAFI */}
                    {activeTab === 'demografi' && (
                        <div className="space-y-8">
                            {/* Scatter Plot: Korelasi Demografi vs Anggaran */}
                            <motion.div 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5 }}
                                className="scroll-mt-32 bg-white/70 backdrop-blur-xl rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200/60 p-6 relative flex flex-col min-h-[500px]"
                            >
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                        <Target className="text-lobar-blue" /> Korelasi Kemiskinan & Stunting vs Pagu Anggaran
                                    </h3>
                                    <div className="text-xs text-slate-400 font-medium bg-slate-50 px-3 py-1 rounded-full">Sumbu X: Kemiskinan | Sumbu Y: Stunting | Ukuran: Pagu</div>
                                </div>
                                <div className="w-full h-[500px] flex items-center justify-center">
                                    <ResponsiveContainer width="99%" height="100%">
                                        <ScatterChart margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                            <XAxis type="number" dataKey="kemiskinan" name="Kemiskinan" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                            <YAxis type="number" dataKey="stunting" name="Stunting" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                            <ZAxis type="number" dataKey="pagu" range={[50, 400]} name="Pagu Anggaran" />
                                            <Tooltip content={<CustomScatterTooltip />} cursor={{ strokeDasharray: '3 3' }} />
                                            <Scatter name="Desa" data={scatterData} fill="#8884d8">
                                                {scatterData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.stunting > 50 && entry.kemiskinan > 1000 ? '#ef4444' : '#3b82f6'} fillOpacity={0.6} />
                                                ))}
                                            </Scatter>
                                        </ScatterChart>
                                    </ResponsiveContainer>
                                </div>
                            </motion.div>

                            {/* Section 4: Poverty Analysis */}
                            <div ref={sectionPovertyChartRef} className="scroll-mt-32 bg-white rounded-xl shadow-sm border border-slate-200 p-6 relative flex flex-col min-h-[500px]">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2"><Users className="text-red-500" /> Analisis Kemiskinan Desil 1 (Top 20 Tertinggi)</h3>
                        </div>
                        {povertyData.length > 0 ? (
                            <div className="w-full overflow-x-auto pb-4 custom-scrollbar">
                                <div style={{ minWidth: Math.max(800, povertyData.length * 60), height: 500 }}>
                                    <ResponsiveContainer width="99%" height={500}>
                                        <BarChart data={povertyData} margin={{ top: 20, right: 30, left: 20, bottom: 100 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                            <XAxis dataKey="name" angle={-45} textAnchor="end" interval={0} tick={{ fontSize: 11, fill: '#64748b' }} />
                                            <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#fef2f2' }} />
                                            <Bar dataKey="val" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={50} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        ) : <div className="h-64 flex items-center justify-center text-slate-400">Data tidak tersedia</div>}
                    </div>

                    {/* Section 5: Stunting Analysis */}
                    <div ref={sectionStuntingChartRef} className="scroll-mt-32 bg-white rounded-xl shadow-sm border border-slate-200 p-6 relative flex flex-col min-h-[500px]">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2"><Baby className="text-orange-500" /> Analisis Balita Stunting (Top 20 Tertinggi)</h3>
                        </div>
                        {stuntingData.length > 0 ? (
                            <div className="w-full overflow-x-auto pb-4 custom-scrollbar">
                                <div style={{ minWidth: Math.max(800, stuntingData.length * 60), height: 500 }}>
                                    <ResponsiveContainer width="99%" height={500}>
                                        <BarChart data={stuntingData} margin={{ top: 20, right: 30, left: 20, bottom: 100 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                            <XAxis dataKey="name" angle={-45} textAnchor="end" interval={0} tick={{ fontSize: 11, fill: '#64748b' }} />
                                            <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#fff7ed' }} />
                                            <Bar dataKey="val" fill="#f97316" radius={[4, 4, 0, 0]} maxBarSize={50} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        ) : <div className="h-64 flex items-center justify-center text-slate-400">Data tidak tersedia</div>}
                    </div>

                    {/* Section 5.b: Poverty Lowest Analysis */}
                    <div ref={sectionPovertyLowestChartRef} className="scroll-mt-32 bg-white rounded-xl shadow-sm border border-slate-200 p-6 relative flex flex-col min-h-[500px]">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2"><Users className="text-teal-500" /> Analisis Kemiskinan Desil 1 (20 Terendah)</h3>
                            <span className="text-xs bg-teal-100 text-teal-700 px-2 py-1 rounded-full font-bold">Terendah = Baik</span>
                        </div>
                        {povertyDataLowest.length > 0 ? (
                            <div className="w-full overflow-x-auto pb-4 custom-scrollbar">
                                <div style={{ minWidth: Math.max(800, povertyDataLowest.length * 60), height: 500 }}>
                                    <ResponsiveContainer width="99%" height={500}>
                                        <BarChart data={povertyDataLowest} margin={{ top: 20, right: 30, left: 20, bottom: 100 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                            <XAxis dataKey="name" angle={-45} textAnchor="end" interval={0} tick={{ fontSize: 11, fill: '#64748b' }} />
                                            <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f0fdf4' }} />
                                            <Bar dataKey="val" fill="#14b8a6" radius={[4, 4, 0, 0]} maxBarSize={50} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        ) : <div className="h-64 flex items-center justify-center text-slate-400">Data tidak tersedia</div>}
                    </div>

                    {/* Section 5.c: Stunting Lowest Analysis */}
                    <div ref={sectionStuntingLowestChartRef} className="scroll-mt-32 bg-white rounded-xl shadow-sm border border-slate-200 p-6 relative flex flex-col min-h-[500px]">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2"><Baby className="text-cyan-500" /> Analisis Balita Stunting (20 Terendah)</h3>
                            <span className="text-xs bg-cyan-100 text-cyan-700 px-2 py-1 rounded-full font-bold">Terendah = Baik</span>
                        </div>
                        {stuntingDataLowest.length > 0 ? (
                            <div className="w-full overflow-x-auto pb-4 custom-scrollbar">
                                <div style={{ minWidth: Math.max(800, stuntingDataLowest.length * 60), height: 500 }}>
                                    <ResponsiveContainer width="99%" height={500}>
                                        <BarChart data={stuntingDataLowest} margin={{ top: 20, right: 30, left: 20, bottom: 100 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                            <XAxis dataKey="name" angle={-45} textAnchor="end" interval={0} tick={{ fontSize: 11, fill: '#64748b' }} />
                                            <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#ecfeff' }} />
                                            <Bar dataKey="val" fill="#06b6d4" radius={[4, 4, 0, 0]} maxBarSize={50} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        ) : <div className="h-64 flex items-center justify-center text-slate-400">Data tidak tersedia</div>}
                    </div>

                    {/* Section 5.d: Density Analysis */}
                    <div ref={sectionDensityChartRef} className="scroll-mt-32 bg-white rounded-xl shadow-sm border border-slate-200 p-6 relative flex flex-col min-h-[500px]">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2"><Users className="text-purple-500" /> Analisis Kepadatan Penduduk (20 Tertinggi)</h3>
                        </div>
                        {densityData.length > 0 ? (
                            <div className="w-full overflow-x-auto pb-4 custom-scrollbar">
                                <div style={{ minWidth: Math.max(800, densityData.length * 60), height: 500 }}>
                                    <ResponsiveContainer width="99%" height={500}>
                                        <BarChart data={densityData} margin={{ top: 20, right: 30, left: 20, bottom: 100 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                            <XAxis dataKey="name" angle={-45} textAnchor="end" interval={0} tick={{ fontSize: 11, fill: '#64748b' }} />
                                            <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f3e8ff' }} />
                                            <Bar dataKey="val" fill="#9333ea" radius={[4, 4, 0, 0]} maxBarSize={50} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        ) : <div className="h-64 flex items-center justify-center text-slate-400">Data tidak tersedia</div>}
                    </div>

                    {/* Section 6 & 7: Pie Charts (Potensi & Pilar) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 scroll-mt-32" ref={sectionPotentialChartRef}>
                        {/* Potensi Desa */}
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 relative flex flex-col">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2"><Sprout className="text-green-500" /> Distribusi Potensi Desa</h3>
                            </div>
                            <div className="h-[400px] flex flex-col items-center justify-center">
                                <div className="w-full h-full">
                                    <ResponsiveContainer width="99%" height={400}>
                                        <PieChart>
                                            <Pie
                                                data={potentialData}
                                                cx="50%"
                                                cy="50%"
                                                labelLine={false}
                                                outerRadius={120}
                                                fill="#8884d8"
                                                dataKey="value"
                                                label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                                                    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                                                    const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
                                                    const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);
                                                    return percent > 0.05 ? (
                                                        <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize="12" fontWeight="bold">
                                                            {`${(percent * 100).toFixed(0)}%`}
                                                        </text>
                                                    ) : null;
                                                }}
                                            >
                                                {potentialData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.fill} />))}
                                            </Pie>
                                            <Tooltip formatter={(value: number) => [`${value} Desa`, 'Jumlah']} />
                                            <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '11px' }} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>

                        {/* Distribusi Pilar */}
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 relative flex flex-col">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2"><Target className="text-indigo-500" /> Distribusi Anggaran Pilar {filterKecamatan ? `(${filterKecamatan})` : ''}</h3>
                            </div>
                            <div className="h-[400px] flex flex-col items-center justify-center">
                                <div className="w-full h-full">
                                    <ResponsiveContainer width="99%" height={400}>
                                        <PieChart>
                                            <Pie
                                                data={pilarPieData}
                                                cx="50%"
                                                cy="50%"
                                                labelLine={false}
                                                innerRadius={60}
                                                outerRadius={120}
                                                fill="#8884d8"
                                                dataKey="value"
                                                label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                                                    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                                                    const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
                                                    const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);
                                                    return percent > 0.05 ? (
                                                        <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize="12" fontWeight="bold">
                                                            {`${(percent * 100).toFixed(0)}%`}
                                                        </text>
                                                    ) : null;
                                                }}
                                            >
                                                {pilarPieData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.fill} />))}
                                            </Pie>
                                            <Tooltip formatter={(value: number) => [formatRupiah(value), 'Pagu Anggaran']} />
                                            <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    </div>
                        </div>
                    )}

                    {/* Bottom Padding */}
                    <div className="h-20"></div>

                </div>
            </div>


        </div>
    );
};

export default BreakdownAnggaranPage;
