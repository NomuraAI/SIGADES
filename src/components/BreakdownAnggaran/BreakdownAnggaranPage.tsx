import React, { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { ProjectData } from '../../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { Loader2, Filter, DollarSign, Building2, Wallet, LayoutDashboard, BarChart3, PieChart as PieChartIcon, Users, Baby, Sprout } from 'lucide-react';

interface BreakdownAnggaranPageProps {
    selectedVersion: string;
}

const BreakdownAnggaranPage: React.FC<BreakdownAnggaranPageProps> = ({ selectedVersion }) => {
    const [data, setData] = useState<ProjectData[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterKecamatan, setFilterKecamatan] = useState<string>('Gerung');
    const [filterBudget, setFilterBudget] = useState<'all' | 'above1M' | 'below1M'>('all');

    // Refs for scrolling
    const sectionStatsRef = useRef<HTMLDivElement>(null);
    const sectionFiltersRef = useRef<HTMLDivElement>(null);
    const sectionBudgetChartRef = useRef<HTMLDivElement>(null);
    const sectionPovertyChartRef = useRef<HTMLDivElement>(null);
    const sectionStuntingChartRef = useRef<HTMLDivElement>(null);
    const sectionPotentialChartRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchData();
    }, [selectedVersion]);

    const fetchData = async () => {
        try {
            setLoading(true);
            let allData: any[] = [];
            let page = 0;
            const pageSize = 1000;
            let hasMore = true;

            while (hasMore) {
                let query = supabase
                    .from('projects')
                    .select('*')
                    .range(page * pageSize, (page + 1) * pageSize - 1);

                if (selectedVersion) {
                    query = query.eq('data_version', selectedVersion);
                }

                const { data: chunk, error } = await query;

                if (error) throw error;

                if (chunk && chunk.length > 0) {
                    allData = [...allData, ...chunk];
                    if (chunk.length < pageSize) hasMore = false;
                    page++;
                } else {
                    hasMore = false;
                }
            }

            const projects = allData;

            const mappedData: ProjectData[] = (projects || []).map(item => ({
                id: item.id,
                aksiPrioritas: item.aksi_prioritas || '',
                perangkatDaerah: item.perangkat_daerah || '',
                program: item.program || '',
                kegiatan: item.kegiatan || '',
                subKegiatan: item.sub_kegiatan || '',
                pekerjaan: item.pekerjaan || '',
                paguAnggaran: item.pagu_anggaran || 0,
                kodeDesa: item.kode_desa || '',
                desaKelurahan: item.desa_kelurahan || item.desa || '',
                kodeKecamatan: item.kode_kecamatan || '',
                kecamatan: item.kecamatan || '',
                luasWilayah: item.luas_wilayah || '',
                jumlahPenduduk: item.jumlah_penduduk || 0,
                jumlahAngkaKemiskinan: item.jumlah_angka_kemiskinan || 0,
                jumlahBalitaStunting: item.jumlah_balita_stunting || 0,
                keterangan: item.keterangan || '',
                potensiDesa: item.potensi_desa || '',
                latitude: item.latitude || item.lat || null,
                longitude: item.longitude || item.lng || null
            }));
            setData(mappedData);
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

    // Aggregate Data based on filters
    // 1. Budget Data (Existing)
    const budgetData = useMemo(() => {
        let filtered = data;
        if (filterKecamatan) {
            filtered = filtered.filter(item => item.kecamatan === filterKecamatan);
        }

        const desaGroups: { [key: string]: { total: number, originalName: string } } = {};

        filtered.forEach(item => {
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

    // 2. Poverty Data (Top 20)
    const povertyData = useMemo(() => {
        let filtered = data;
        if (filterKecamatan) filtered = filtered.filter(item => item.kecamatan === filterKecamatan);

        const desaGroups: { [key: string]: { val: number, name: string } } = {};

        filtered.forEach(item => {
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
        let filtered = data;
        if (filterKecamatan) filtered = filtered.filter(item => item.kecamatan === filterKecamatan);

        const desaGroups: { [key: string]: { val: number, name: string } } = {};

        filtered.forEach(item => {
            const key = (item.desaKelurahan || 'Lainnya').trim().toUpperCase();
            if (!desaGroups[key]) desaGroups[key] = { val: 0, name: item.desaKelurahan || 'Lainnya' };
            desaGroups[key].val = Math.max(desaGroups[key].val, item.jumlahBalitaStunting || 0);
        });

        return Object.values(desaGroups)
            .sort((a, b) => b.val - a.val)
            .slice(0, 20);
    }, [data, filterKecamatan]);

    // 4. Potential Data (Pie Chart)
    const potentialData = useMemo(() => {
        let filtered = data;
        if (filterKecamatan) filtered = filtered.filter(item => item.kecamatan === filterKecamatan);

        const counts: { [key: string]: number } = {};
        filtered.forEach(item => {
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
    }, [data, filterKecamatan]);


    const stats = useMemo(() => {
        const totalBudget = budgetData.reduce((acc, curr) => acc + curr.total, 0);
        const totalDesa = budgetData.length; // Actually distinct desas from budget grouping
        const above1MCount = budgetData.filter(d => d.total >= 1000000000).length;

        // Sum of MAX per desa to avoid duplicate counting of poverty/stunting if rows are duplicated
        const totalPoverty = povertyData.reduce((acc, curr) => acc + curr.val, 0); // Note: this is top 20 sum only? No wait, povertyData is top 20. 
        // We want GLOBAL sum for stats. Re-calc global unique.

        // Helper for global sums based on current filter
        const uniqueDesaMap: { [k: string]: any } = {};
        let filtered = data;
        if (filterKecamatan) filtered = filtered.filter(item => item.kecamatan === filterKecamatan);

        filtered.forEach(item => {
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
            <div className="flex-none pt-6 px-6 pb-2 z-30 bg-slate-50 border-b border-slate-100">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">Dashboard Interaktif</h1>
                        <p className="text-slate-500 text-sm">Analisis distribusi anggaran dan statistik proyek desa</p>
                    </div>

                    {/* Navigation Pills */}
                    <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm overflow-x-auto custom-scrollbar">
                        <button onClick={() => scrollToSection(sectionStatsRef)} className="whitespace-nowrap flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-600 hover:text-lobar-blue hover:bg-slate-50 rounded-lg transition-all">
                            <LayoutDashboard size={14} /> Ringkasan
                        </button>
                        <button onClick={() => scrollToSection(sectionFiltersRef)} className="whitespace-nowrap flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-600 hover:text-lobar-blue hover:bg-slate-50 rounded-lg transition-all">
                            <Filter size={14} /> Filter
                        </button>
                        <button onClick={() => scrollToSection(sectionBudgetChartRef)} className="whitespace-nowrap flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-600 hover:text-lobar-blue hover:bg-slate-50 rounded-lg transition-all">
                            <BarChart3 size={14} /> Anggaran
                        </button>
                        <button onClick={() => scrollToSection(sectionPovertyChartRef)} className="whitespace-nowrap flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all">
                            <Users size={14} /> Kemiskinan
                        </button>
                        <button onClick={() => scrollToSection(sectionStuntingChartRef)} className="whitespace-nowrap flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-all">
                            <Baby size={14} /> Stunting
                        </button>
                        <button onClick={() => scrollToSection(sectionPotentialChartRef)} className="whitespace-nowrap flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all">
                            <PieChartIcon size={14} /> Potensi
                        </button>
                    </div>
                </div>
            </div>

            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto px-6 pb-6 custom-scrollbar scroll-smooth">
                <div className="max-w-7xl mx-auto space-y-8 pt-6">

                    {/* Section 1: Stats Cards */}
                    <div ref={sectionStatsRef} className="scroll-mt-32 grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Row 1 */}
                        <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-5 rounded-2xl shadow-lg text-white relative overflow-hidden transition-transform hover:-translate-y-1 duration-300">
                            <div className="absolute top-0 right-0 p-4 opacity-10"><Wallet size={64} /></div>
                            <p className="text-blue-100 text-xs font-bold uppercase mb-1">Total Anggaran</p>
                            <h3 className="text-2xl font-bold">{formatRupiah(stats.totalBudget)}</h3>
                        </div>

                        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-center transition-transform hover:-translate-y-1 duration-300">
                            <p className="text-slate-400 text-xs font-bold uppercase mb-1">Jumlah Desa</p>
                            <div className="flex items-end gap-2">
                                <h3 className="text-2xl font-bold text-slate-800">{stats.totalDesa}</h3>
                                <span className="text-sm text-slate-500 mb-1">Desa</span>
                            </div>
                        </div>

                        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-center transition-transform hover:-translate-y-1 duration-300">
                            <p className="text-slate-400 text-xs font-bold uppercase mb-1">Status Capaian {'>'} 1M</p>
                            <div className="flex items-end gap-2">
                                <h3 className="text-2xl font-bold text-green-600">{stats.above1MCount}</h3>
                                <span className="text-sm text-slate-500 mb-1">Desa Tercapai</span>
                            </div>
                        </div>

                        {/* Row 2: New Metrics */}
                        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-center transition-transform hover:-translate-y-1 duration-300 border-b-4 border-b-red-500">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-slate-400 text-xs font-bold uppercase mb-1">Kemiskinan Desil 1</p>
                                    <h3 className="text-2xl font-bold text-slate-800">{stats.realTotalPoverty.toLocaleString()} <span className="text-sm text-slate-400 font-normal">Jiwa</span></h3>
                                </div>
                                <div className="p-2 bg-red-50 text-red-500 rounded-lg"><Users size={20} /></div>
                            </div>
                        </div>

                        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-center transition-transform hover:-translate-y-1 duration-300 border-b-4 border-b-orange-500">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-slate-400 text-xs font-bold uppercase mb-1">Balita Stunting</p>
                                    <h3 className="text-2xl font-bold text-slate-800">{stats.realTotalStunting.toLocaleString()} <span className="text-sm text-slate-400 font-normal">Anak</span></h3>
                                </div>
                                <div className="p-2 bg-orange-50 text-orange-500 rounded-lg"><Baby size={20} /></div>
                            </div>
                        </div>

                        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-center transition-transform hover:-translate-y-1 duration-300 border-b-4 border-b-green-500">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-slate-400 text-xs font-bold uppercase mb-1">Potensi Desa</p>
                                    <h3 className="text-2xl font-bold text-slate-800">{potentialData.length} <span className="text-sm text-slate-400 font-normal">Kategori</span></h3>
                                </div>
                                <div className="p-2 bg-green-50 text-green-500 rounded-lg"><Sprout size={20} /></div>
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Filters */}
                    <div ref={sectionFiltersRef} className="scroll-mt-32 bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-wrap gap-4 items-center sticky top-0 z-20">
                        <div className="flex items-center gap-2">
                            <div className="bg-slate-100 p-2 rounded-lg text-slate-500"><Filter size={18} /></div>
                            <div className="flex flex-col">
                                <label className="text-[10px] font-bold text-slate-400 uppercase">Kecamatan</label>
                                <select className="bg-transparent font-bold text-slate-700 outline-none cursor-pointer min-w-[150px]" value={filterKecamatan} onChange={(e) => setFilterKecamatan(e.target.value)}>
                                    <option value="">Semua Kecamatan</option>
                                    {uniqueKecamatan.map(kec => (<option key={kec} value={kec}>{kec}</option>))}
                                </select>
                            </div>
                        </div>
                        <div className="w-px h-10 bg-slate-200 mx-2 hidden md:block"></div>
                        <div className="flex items-center gap-2">
                            <div className="bg-slate-100 p-2 rounded-lg text-slate-500"><DollarSign size={18} /></div>
                            <div className="flex flex-col">
                                <label className="text-[10px] font-bold text-slate-400 uppercase">Filter Anggaran</label>
                                <select className="bg-transparent font-bold text-slate-700 outline-none cursor-pointer min-w-[150px]" value={filterBudget} onChange={(e) => setFilterBudget(e.target.value as any)}>
                                    <option value="all">Semua Anggaran</option>
                                    <option value="above1M">Di Atas 1 Miliar</option>
                                    <option value="below1M">Di Bawah 1 Miliar</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Section 3: Budget Analysis */}
                    <div ref={sectionBudgetChartRef} className="scroll-mt-32 bg-white rounded-xl shadow-sm border border-slate-200 p-6 relative flex flex-col min-h-[500px]">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2"><BarChart3 className="text-lobar-blue" /> Analisis Anggaran per Desa</h3>
                            <div className="text-xs text-slate-400 font-medium bg-slate-50 px-3 py-1 rounded-full">{filterKecamatan || 'Semua Wilayah'}</div>
                        </div>
                        {budgetData.length > 0 ? (
                            <div className="w-full overflow-x-auto pb-4 custom-scrollbar">
                                <div style={{ minWidth: Math.max(1000, budgetData.length * 60), height: 500 }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={budgetData} margin={{ top: 20, right: 30, left: 40, bottom: 100 }} layout="horizontal">
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                            <XAxis dataKey="name" angle={-45} textAnchor="end" interval={0} tick={{ fontSize: 11, fill: '#64748b' }} />
                                            <YAxis tickFormatter={(val) => `Rp ${(val / 1000000000).toFixed(1)} M`} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f1f5f9' }} />
                                            <Bar dataKey="total" radius={[4, 4, 0, 0]} maxBarSize={50}>
                                                {budgetData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.total >= 1000000000 ? '#16a34a' : '#f59e0b'} />))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        ) : <div className="h-64 flex items-center justify-center text-slate-400">Data tidak tersedia</div>}
                    </div>

                    {/* Section 4: Poverty Analysis */}
                    <div ref={sectionPovertyChartRef} className="scroll-mt-32 bg-white rounded-xl shadow-sm border border-slate-200 p-6 relative flex flex-col">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2"><Users className="text-red-500" /> Analisis Kemiskinan Desil 1 (Top 20 Tertinggi)</h3>
                        </div>
                        <div className="h-[400px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={povertyData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis dataKey="name" angle={-45} textAnchor="end" interval={0} tick={{ fontSize: 11, fill: '#64748b' }} />
                                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                    <Tooltip content={<CustomTooltip />} cursor={{ fill: '#fef2f2' }} />
                                    <Bar dataKey="val" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={50} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Section 5: Stunting Analysis */}
                    <div ref={sectionStuntingChartRef} className="scroll-mt-32 bg-white rounded-xl shadow-sm border border-slate-200 p-6 relative flex flex-col">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2"><Baby className="text-orange-500" /> Analisis Balita Stunting (Top 20 Tertinggi)</h3>
                        </div>
                        <div className="h-[400px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={stuntingData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis dataKey="name" angle={-45} textAnchor="end" interval={0} tick={{ fontSize: 11, fill: '#64748b' }} />
                                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                    <Tooltip content={<CustomTooltip />} cursor={{ fill: '#fff7ed' }} />
                                    <Bar dataKey="val" fill="#f97316" radius={[4, 4, 0, 0]} maxBarSize={50} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Section 6: Potential Analysis (Pie) */}
                    <div ref={sectionPotentialChartRef} className="scroll-mt-32 bg-white rounded-xl shadow-sm border border-slate-200 p-6 relative flex flex-col">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2"><Sprout className="text-green-500" /> Distribusi Potensi Desa</h3>
                        </div>
                        <div className="h-[400px] flex flex-col md:flex-row items-center justify-center">
                            <div className="w-full md:w-2/3 h-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={potentialData}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                                                const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                                                const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
                                                const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);
                                                return percent > 0.05 ? (
                                                    <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize={12} fontWeight="bold">
                                                        {`${(percent * 100).toFixed(0)}%`}
                                                    </text>
                                                ) : null;
                                            }}
                                            outerRadius={150}
                                            fill="#8884d8"
                                            dataKey="value"
                                        >
                                            {potentialData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.fill} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="w-full md:w-1/3 p-4">
                                <h4 className="font-bold text-slate-600 mb-3 text-sm uppercase">Kategori Potensi</h4>
                                <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                                    {potentialData.map((entry, index) => (
                                        <div key={index} className="flex items-center justify-between text-sm">
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.fill }}></div>
                                                <span className="text-slate-600">{entry.name || 'Lainnya'}</span>
                                            </div>
                                            <span className="font-bold text-slate-800">{entry.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Padding */}
                    <div className="h-20"></div>

                </div>
            </div>
        </div>
    );
};

export default BreakdownAnggaranPage;
