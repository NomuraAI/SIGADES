import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import { ProjectData } from '../../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { Loader2, Filter, DollarSign, Building2, Wallet } from 'lucide-react';

const BreakdownAnggaranPage: React.FC = () => {
    const [data, setData] = useState<ProjectData[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterKecamatan, setFilterKecamatan] = useState<string>('Gerung'); // Default filter example mentioned by user
    const [filterBudget, setFilterBudget] = useState<'all' | 'above1M' | 'below1M'>('all');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            let allData: any[] = [];
            let page = 0;
            const pageSize = 1000;
            let hasMore = true;

            while (hasMore) {
                const { data: chunk, error } = await supabase
                    .from('projects')
                    .select('*')
                    .range(page * pageSize, (page + 1) * pageSize - 1);

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
    const aggregatedData = useMemo(() => {
        // 1. Filter by Kecamatan first (User requirement: "Misalkan contoh : saat memilih filter kecamatan Gerung")
        let filtered = data;
        if (filterKecamatan) {
            filtered = filtered.filter(item => item.kecamatan === filterKecamatan);
        }

        // 2. Group by Desa (Normalized to prevent duplicates)
        const desaGroups: { [key: string]: { total: number, originalName: string } } = {};

        filtered.forEach(item => {
            const rawName = item.desaKelurahan || 'Lainnya';
            // Normalize: trim whitespace and uppercase to ensure "Desa A" equals "Desa A "
            const normalizedKey = rawName.replace(/\s+/g, ' ').trim().toUpperCase();

            if (!desaGroups[normalizedKey]) {
                desaGroups[normalizedKey] = { total: 0, originalName: rawName.trim() };
            }
            desaGroups[normalizedKey].total += (item.paguAnggaran || 0);
        });

        // 3. Convert to Array and Apply Budget Filter
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

        // Sort by Total Descending
        return result.sort((a, b) => b.total - a.total);

    }, [data, filterKecamatan, filterBudget]);

    const stats = useMemo(() => {
        const totalBudget = aggregatedData.reduce((acc, curr) => acc + curr.total, 0);
        const totalDesa = aggregatedData.length;
        const above1MCount = aggregatedData.filter(d => d.total >= 1000000000).length;

        return { totalBudget, totalDesa, above1MCount };
    }, [aggregatedData]);

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
                    <p className="font-bold text-slate-800 mb-1">{label}</p>
                    <p className="text-lobar-blue font-bold text-lg mb-1">
                        {formatRupiah(data.total)}
                    </p>
                    <div className={`inline-block px-2 py-1 rounded text-xs font-bold ${data.status === 'Sudah Tercapai' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                        {data.status}
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="flex flex-col h-full bg-slate-50 overflow-hidden">
            {/* Sticky Header Section */}
            <div className="flex-none p-6 pb-0 z-30 bg-slate-50">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-slate-800">Breakdown Anggaran Desa</h1>
                    <p className="text-slate-500 text-sm">Analisis distribusi anggaran per desa berdasarkan kecamatan</p>
                </div>

                {/* Filters */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 flex flex-wrap gap-4 items-center">
                    <div className="flex items-center gap-2">
                        <div className="bg-slate-100 p-2 rounded-lg text-slate-500">
                            <Filter size={18} />
                        </div>
                        <div className="flex flex-col">
                            <label className="text-[10px] font-bold text-slate-400 uppercase">Kecamatan</label>
                            <select
                                className="bg-transparent font-bold text-slate-700 outline-none cursor-pointer min-w-[150px]"
                                value={filterKecamatan}
                                onChange={(e) => setFilterKecamatan(e.target.value)}
                            >
                                <option value="">Semua Kecamatan</option>
                                {uniqueKecamatan.map(kec => (
                                    <option key={kec} value={kec}>{kec}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="w-px h-10 bg-slate-200 mx-2 hidden md:block"></div>

                    <div className="flex items-center gap-2">
                        <div className="bg-slate-100 p-2 rounded-lg text-slate-500">
                            <DollarSign size={18} />
                        </div>
                        <div className="flex flex-col">
                            <label className="text-[10px] font-bold text-slate-400 uppercase">Filter Anggaran</label>
                            <select
                                className="bg-transparent font-bold text-slate-700 outline-none cursor-pointer min-w-[150px]"
                                value={filterBudget}
                                onChange={(e) => setFilterBudget(e.target.value as any)}
                            >
                                <option value="all">Semua Anggaran</option>
                                <option value="above1M">Di Atas 1 Miliar</option>
                                <option value="below1M">Di Bawah 1 Miliar</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-5 rounded-2xl shadow-lg text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10"><Wallet size={64} /></div>
                        <p className="text-blue-100 text-xs font-bold uppercase mb-1">Total Anggaran (Terfilter)</p>
                        <h3 className="text-2xl font-bold">{formatRupiah(stats.totalBudget)}</h3>
                    </div>

                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-center">
                        <p className="text-slate-400 text-xs font-bold uppercase mb-1">Jumlah Desa</p>
                        <div className="flex items-end gap-2">
                            <h3 className="text-2xl font-bold text-slate-800">{stats.totalDesa}</h3>
                            <span className="text-sm text-slate-500 mb-1">Desa</span>
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-center">
                        <p className="text-slate-400 text-xs font-bold uppercase mb-1">Status Capaian {'>'} 1M</p>
                        <div className="flex items-end gap-2">
                            <h3 className="text-2xl font-bold text-green-600">{stats.above1MCount}</h3>
                            <span className="text-sm text-slate-500 mb-1">Desa Tercapai</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto px-6 pb-6 custom-scrollbar">
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 relative flex flex-col">
                    {loading ? (
                        <div className="h-[400px] flex items-center justify-center">
                            <div className="flex flex-col items-center">
                                <Loader2 className="animate-spin text-lobar-blue mb-2" size={32} />
                                <p className="text-slate-500 font-medium">Memuat Data...</p>
                            </div>
                        </div>
                    ) : aggregatedData.length === 0 ? (
                        <div className="h-[400px] flex items-center justify-center text-slate-400 flex-col">
                            <Building2 size={48} className="mb-2 opacity-50" />
                            <p>Tidak ada data untuk filter ini.</p>
                        </div>
                    ) : (
                        // Horizontal Scroll Container for Chart
                        <div className="w-full overflow-x-auto pb-4 custom-scrollbar">
                            <div style={{ minWidth: Math.max(1000, aggregatedData.length * 60), height: 500 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={aggregatedData}
                                        margin={{ top: 20, right: 30, left: 40, bottom: 100 }}
                                        layout="horizontal"
                                    >
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                        <XAxis
                                            dataKey="name"
                                            angle={-45}
                                            textAnchor="end"
                                            interval={0}
                                            tick={{ fontSize: 11, fill: '#64748b' }}
                                        />
                                        <YAxis
                                            tickFormatter={(val) => `Rp ${(val / 1000000000).toFixed(1)} M`}
                                            tick={{ fontSize: 11, fill: '#64748b' }}
                                            axisLine={false}
                                            tickLine={false}
                                        />
                                        <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f1f5f9' }} />
                                        <Bar dataKey="total" radius={[4, 4, 0, 0]} maxBarSize={50}>
                                            {aggregatedData.map((entry, index) => (
                                                <Cell
                                                    key={`cell-${index}`}
                                                    fill={entry.total >= 1000000000 ? '#16a34a' : '#f59e0b'}
                                                />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BreakdownAnggaranPage;
