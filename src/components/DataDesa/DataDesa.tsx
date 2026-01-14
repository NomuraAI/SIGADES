import React, { useState, useEffect, useRef } from 'react';
import { Search, Plus, Edit2, Trash2, MapPin, ArrowLeft, FileSpreadsheet, X, Loader2, Wallet, Briefcase, Landmark, ChevronLeft, ChevronRight, Filter, Check } from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from '../../lib/supabase';
import { ProjectData } from '../../types';

interface DataDesaProps {
    onBack?: () => void;
    onViewMap?: (data: ProjectData) => void;
}

const DataDesa: React.FC<DataDesaProps> = ({ onBack, onViewMap }) => {
    const [searchDesa, setSearchDesa] = useState('');
    const [searchKecamatan, setSearchKecamatan] = useState('');
    const [data, setData] = useState<ProjectData[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<ProjectData | null>(null);
    const [newItem, setNewItem] = useState<Partial<ProjectData>>({});
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const filterRef = useRef<HTMLDivElement>(null);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const rowsPerPage = 250;

    // Column Visibility State
    const allColumns = [
        { key: 'aksiPrioritas', label: 'Aksi Prioritas', align: 'left' },
        { key: 'perangkatDaerah', label: 'Perangkat Daerah', align: 'left' },
        { key: 'program', label: 'Program', align: 'left' },
        { key: 'kegiatan', label: 'Kegiatan', align: 'left' },
        { key: 'subKegiatan', label: 'Sub Kegiatan', align: 'left' },
        { key: 'pekerjaan', label: 'Pekerjaan', align: 'left' },
        { key: 'paguAnggaran', label: 'Pagu Anggaran', align: 'right' },
        { key: 'kodeDesa', label: 'Kode Desa', align: 'left' }, // Added Kode Desa
        { key: 'desa', label: 'Desa', align: 'left' },
        { key: 'kodeKecamatan', label: 'Kode Kecamatan', align: 'left' },
        { key: 'kecamatan', label: 'Kecamatan', align: 'left' },
        { key: 'luasWilayah', label: 'Luas', align: 'left' },
        { key: 'jumlahPenduduk', label: 'Penduduk', align: 'center' },
        { key: 'jumlahAngkaKemiskinan', label: 'Kemiskinan', align: 'center' },
        { key: 'jumlahBalitaStunting', label: 'Stunting', align: 'center' },
        { key: 'potensiDesa', label: 'Potensi Desa', align: 'left' },
        { key: 'keterangan', label: 'Keterangan', align: 'left' },
        { key: 'lat', label: 'Latitude', align: 'center' },
        { key: 'lng', label: 'Longitude', align: 'center' },
    ];
    const [visibleColumns, setVisibleColumns] = useState<string[]>(allColumns.map(c => c.key));
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    // Handle click outside to close filter dropdown
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
                setIsFilterOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleColumn = (key: string) => {
        setVisibleColumns(prev =>
            prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
        );
    };

    const toggleAllColumns = (shouldShow: boolean) => {
        setVisibleColumns(shouldShow ? allColumns.map(c => c.key) : []);
    };

    const fetchData = async () => {
        try {
            setLoading(true);
            let allData: any[] = [];
            let page = 0;
            const pageSize = 1000;
            let hasMore = true;

            // Loop sampai semua data terambil
            while (hasMore) {
                const { data: chunk, error } = await supabase
                    .from('projects')
                    .select('*')
                    .order('created_at', { ascending: false })
                    .range(page * pageSize, (page + 1) * pageSize - 1);

                if (error) throw error;

                if (chunk) {
                    allData = [...allData, ...chunk];
                    if (chunk.length < pageSize) hasMore = false;
                    page++;
                } else {
                    hasMore = false;
                }
            }

            const mappedData: ProjectData[] = allData.map(item => ({
                id: item.id,
                aksiPrioritas: item.aksi_prioritas || '',
                perangkatDaerah: item.perangkat_daerah || '',
                program: item.program || '',
                kegiatan: item.kegiatan || '',
                subKegiatan: item.sub_kegiatan || '',
                pekerjaan: item.pekerjaan || '',
                paguAnggaran: item.pagu_anggaran || 0,
                kodeDesa: item.kode_desa || '', // Map from DB
                desa: item.desa || '',
                kodeKecamatan: item.kode_kecamatan || '',
                kecamatan: item.kecamatan || '',
                luasWilayah: item.luas_wilayah || '',
                jumlahPenduduk: item.jumlah_penduduk || 0,
                jumlahAngkaKemiskinan: item.jumlah_angka_kemiskinan || 0,
                jumlahBalitaStunting: item.jumlah_balita_stunting || 0,
                keterangan: item.keterangan || '',
                potensiDesa: item.potensi_desa || '',
                // Prioritize specific village coordinates if available
                lat: item.latitude || item.lat,
                lng: item.longitude || item.lng
            }));
            setData(mappedData);

        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const cleanNumber = (val: any) => {
        if (typeof val === 'number') return val;
        if (!val) return 0;
        // Hapus "Rp", titik, spasi, dll hanya sisakan angka
        // Contoh: "1.500.000" -> "1500000"
        const cleanStr = String(val).replace(/[^\d]/g, '');
        return parseInt(cleanStr || '0');
    };

    const cleanFloat = (val: any) => {
        if (typeof val === 'number') return val;
        if (!val) return null;
        // Ganti koma dengan titik jika ada, dan hapus karakter aneh selain . - dan angka
        const cleanStr = String(val).replace(',', '.').replace(/[^\d.-]/g, '');
        const num = parseFloat(cleanStr);
        return isNaN(num) ? null : num;
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (evt) => {
            try {
                const ab = evt.target?.result;
                const workbook = XLSX.read(ab);
                const ws = workbook.Sheets[workbook.SheetNames[0]];
                const jsonData = XLSX.utils.sheet_to_json(ws);

                if (jsonData.length === 0) return;

                setLoading(true);
                const projectsToInsert = jsonData.map((rawRow: any) => {
                    const row: { [key: string]: any } = {};
                    Object.keys(rawRow).forEach(key => {
                        row[key.trim().toLowerCase().replace(/\s+/g, '_')] = rawRow[key];
                    });

                    return {
                        aksi_prioritas: row.aksi_prioritas || row.prioritas || null,
                        perangkat_daerah: row.perangkat_daerah || row.opd || null,
                        program: row.program || null,
                        kegiatan: row.kegiatan || null,
                        sub_kegiatan: row.sub_kegiatan || null,
                        pekerjaan: row.pekerjaan || row.nama_paket || null,
                        pagu_anggaran: cleanNumber(row.pagu_anggaran || row.pagu),
                        kode_desa: row.kode_desa || row.kode || null, // Import support
                        desa: row.desa || null,
                        kode_kecamatan: row.kode_kecamatan || row.kode_kec || null,
                        kecamatan: row.kecamatan || null,
                        luas_wilayah: row.luas || row.luas_wilayah || null,
                        jumlah_penduduk: cleanNumber(row.penduduk || row.jumlah_penduduk),
                        jumlah_angka_kemiskinan: cleanNumber(row.jumlah_angka_kemiskinan || row.kemiskinan),
                        jumlah_balita_stunting: cleanNumber(row.jumlah_angka_stunting || row.stunting || row.jumlah_balita_stunting),
                        potensi_desa: row.potensi_desa || row.potensi || '',
                        keterangan: row.keterangan || '',

                        // Coba baca kolom koordinat juga jika ada di Excel. Prioritas nama standar.
                        latitude: cleanFloat(row.latitude || row.lat || row.llatitude),
                        longitude: cleanFloat(row.longitude || row.long || row.lng)
                    };
                });

                // Batch insert logic
                const BATCH_SIZE = 50;
                let successCount = 0;
                let failCount = 0;

                for (let i = 0; i < projectsToInsert.length; i += BATCH_SIZE) {
                    const batch = projectsToInsert.slice(i, i + BATCH_SIZE);
                    const { error } = await supabase.from('projects').insert(batch).select();

                    if (error) {
                        console.error(`Error inserting batch ${i} - ${i + BATCH_SIZE}:`, error);
                        failCount += batch.length;
                    } else {
                        successCount += batch.length;
                    }
                }

                if (failCount > 0) {
                    alert(`Impor selesai dengan catatan: ${successCount} berhasil, ${failCount} gagal. Cek console untuk detail.`);
                } else {
                    alert(`Berhasil mengimpor ${successCount} data!`);
                }

                fetchData();
            } catch (error: any) {
                alert('Gagal impor: ' + error.message);
            } finally {
                setLoading(false);
            }
        };
        reader.readAsArrayBuffer(file);
    };

    const handleSave = async (isEdit: boolean) => {
        const item = isEdit ? editingItem : newItem;
        if (!item) return;

        const payload = {
            aksi_prioritas: item.aksiPrioritas,
            perangkat_daerah: item.perangkatDaerah,
            program: item.program,
            kegiatan: item.kegiatan,
            sub_kegiatan: item.subKegiatan,
            pekerjaan: item.pekerjaan,
            pagu_anggaran: item.paguAnggaran,
            kode_desa: item.kodeDesa,
            desa: item.desa,
            kode_kecamatan: item.kodeKecamatan,
            kecamatan: item.kecamatan,
            luas_wilayah: item.luasWilayah,
            jumlah_penduduk: item.jumlahPenduduk,
            jumlah_angka_kemiskinan: item.jumlahAngkaKemiskinan,
            jumlah_balita_stunting: item.jumlahBalitaStunting,
            potensi_desa: item.potensiDesa,
            keterangan: item.keterangan,
            latitude: item.lat,
            longitude: item.lng
        };

        try {
            if (isEdit && editingItem) {
                const { error } = await supabase.from('projects').update(payload).eq('id', editingItem.id).select();
                if (error) throw error;
            } else {
                const { error } = await supabase.from('projects').insert([payload]).select();
                if (error) throw error;
            }
            setIsEditModalOpen(false);
            setIsAddModalOpen(false);
            fetchData();
        } catch (error) {
            console.error('Error saving:', error);
            alert('Gagal menyimpan data.');
        }
    };

    const handleDeleteClick = (id: string, e: React.MouseEvent) => {
        e.stopPropagation(); // Stop event from bubbling
        console.log("Delete clicked for ID:", id); // Debug log
        setItemToDelete(id);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!itemToDelete) return;

        try {
            const { error } = await supabase.from('projects').delete().eq('id', itemToDelete);
            if (error) throw error;
            fetchData();
            setIsDeleteModalOpen(false);
            setItemToDelete(null);
        } catch (error: any) {
            console.error('Error deleting:', error);
            alert('Gagal menghapus data: ' + error.message);
        }
    };

    const filteredData = data.filter(item =>
        item.desa.toLowerCase().includes(searchDesa.toLowerCase()) &&
        item.kecamatan.toLowerCase().includes(searchKecamatan.toLowerCase())
    );

    // Pagination Logic
    const totalPages = Math.ceil(filteredData.length / rowsPerPage);
    const indexOfLastRow = currentPage * rowsPerPage;
    const indexOfFirstRow = indexOfLastRow - rowsPerPage;
    const currentRows = filteredData.slice(indexOfFirstRow, indexOfLastRow);

    const handlePageChange = (pageNumber: number) => {
        setCurrentPage(pageNumber);
    };

    const formatRupiah = (val: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);

    return (
        <div className="flex flex-col h-full bg-slate-50 p-6 overflow-hidden">
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".xlsx, .xls" />

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div className="flex items-center gap-4">
                    {onBack && <button onClick={onBack} className="p-2 bg-white border rounded-lg hover:bg-slate-100 transition-colors"><ArrowLeft size={20} /></button>}
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">Manajemen Data Desa</h1>
                        <p className="text-slate-500 text-sm">Kelola 15 parameter utama pembangunan desa</p>
                    </div>
                </div>
                <div className="flex gap-2 relative" ref={filterRef}>
                    <button
                        onClick={() => setIsFilterOpen(!isFilterOpen)}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-100 transition-all shadow-sm font-medium"
                    >
                        <Filter size={18} /> Filter Kolom
                    </button>

                    {/* Column Filter Dropdown */}
                    {isFilterOpen && (
                        <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border border-slate-200 p-3 z-50 max-h-80 overflow-y-auto">
                            <p className="text-xs font-bold text-slate-500 uppercase mb-2 border-b pb-1">Tampilkan Kolom</p>

                            {/* Select All/Deselect All */}
                            <div
                                onClick={() => toggleAllColumns(visibleColumns.length !== allColumns.length)}
                                className="flex items-center justify-between p-2 text-sm text-lobar-blue font-bold cursor-pointer hover:bg-blue-50 rounded-lg transition-colors mb-1"
                            >
                                <span>{visibleColumns.length === allColumns.length ? 'Sembunyikan Semua' : 'Tampilkan Semua'}</span>
                                {visibleColumns.length === allColumns.length && <Check size={16} />}
                            </div>

                            <div className="space-y-1">
                                {allColumns.map((col) => (
                                    <div
                                        key={col.key}
                                        onClick={() => toggleColumn(col.key)}
                                        className="flex items-center justify-between p-2 text-sm text-slate-700 cursor-pointer hover:bg-slate-50 rounded-lg transition-colors"
                                    >
                                        <span>{col.label}</span>
                                        {visibleColumns.includes(col.key) && <Check size={16} className="text-lobar-blue" />}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all shadow-sm font-medium">
                        <FileSpreadsheet size={18} /> Impor Excel
                    </button>
                    <button onClick={() => { setNewItem({}); setIsAddModalOpen(true); }} className="flex items-center gap-2 px-4 py-2 bg-lobar-blue text-white rounded-lg hover:bg-lobar-blue-dark transition-all shadow-lg shadow-blue-500/20 font-bold">
                        <Plus size={18} /> Tambah Data
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 text-green-600 rounded-lg flex items-center justify-center"><Wallet size={20} /></div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Total Pagu Anggaran</p>
                        <h3 className="text-lg font-bold text-slate-800">{formatRupiah(filteredData.reduce((s, i) => s + (i.paguAnggaran || 0), 0))}</h3>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 text-lobar-blue rounded-lg flex items-center justify-center"><Landmark size={20} /></div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Desa Terdata</p>
                        <h3 className="text-lg font-bold text-slate-800">122 DESA/KELURAHAN</h3>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center"><Briefcase size={20} /></div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Total Pekerjaan</p>
                        <h3 className="text-lg font-bold text-slate-800">{data.length} Paket</h3>
                    </div>
                </div>
            </div>

            <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-200 mb-4 flex justify-between items-center">
                <div className="relative w-full md:w-auto flex gap-2">
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            type="text"
                            placeholder="Cari desa..."
                            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-lobar-blue outline-none text-sm transition-all"
                            value={searchDesa}
                            onChange={(e) => {
                                setSearchDesa(e.target.value);
                                setCurrentPage(1);
                            }}
                        />
                    </div>
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            type="text"
                            placeholder="Cari kecamatan..."
                            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-lobar-blue outline-none text-sm transition-all"
                            value={searchKecamatan}
                            onChange={(e) => {
                                setSearchKecamatan(e.target.value);
                                setCurrentPage(1);
                            }}
                        />
                    </div>
                </div>
                {totalPages > 1 && (
                    <div className="text-xs text-slate-500 font-medium">
                        Halaman {currentPage} dari {totalPages} ({filteredData.length} data)
                    </div>
                )}
            </div>

            <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                <div className="overflow-x-auto flex-1 scrollbar-thin scrollbar-thumb-slate-200">
                    <table className="w-full text-[12px] text-left border-collapse min-w-[2000px]">
                        <thead className="bg-slate-50 text-slate-600 font-bold sticky top-0 z-20 border-b">
                            <tr>
                                <th className="px-3 py-3 w-12 text-center">No</th>
                                {allColumns.map(col => visibleColumns.includes(col.key) && (
                                    <th key={col.key} className={`px-3 py-3 whitespace-nowrap text-${col.align}`}>{col.label}</th>
                                ))}
                                <th className="px-3 py-3 sticky right-0 bg-slate-50 shadow-[-2px_0_5px_rgba(0,0,0,0.05)] text-center w-24">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr><td colSpan={17} className="text-center py-20 text-slate-400"><Loader2 className="animate-spin mx-auto mb-2" /> Memuat data...</td></tr>
                            ) : currentRows.length === 0 ? (
                                <tr><td colSpan={17} className="text-center py-20 text-slate-400">Data tidak ditemukan.</td></tr>
                            ) : currentRows.map((item, index) => (
                                <tr key={item.id} className="hover:bg-blue-50/50 transition-colors">
                                    <td className="px-3 py-2.5 text-center font-medium text-slate-400">{indexOfFirstRow + index + 1}</td>

                                    {visibleColumns.includes('aksiPrioritas') && <td className="px-3 py-2.5 font-medium text-slate-700">{item.aksiPrioritas || '-'}</td>}
                                    {visibleColumns.includes('perangkatDaerah') && <td className="px-3 py-2.5 text-slate-600">{item.perangkatDaerah || '-'}</td>}
                                    {visibleColumns.includes('program') && <td className="px-3 py-2.5 text-slate-500">{item.program || '-'}</td>}
                                    {visibleColumns.includes('kegiatan') && <td className="px-3 py-2.5 text-slate-500">{item.kegiatan || '-'}</td>}
                                    {visibleColumns.includes('subKegiatan') && <td className="px-3 py-2.5 text-slate-500">{item.subKegiatan || '-'}</td>}
                                    {visibleColumns.includes('pekerjaan') && <td className="px-3 py-2.5 font-bold text-slate-900">{item.pekerjaan || '-'}</td>}
                                    {visibleColumns.includes('paguAnggaran') && <td className="px-3 py-2.5 text-right font-bold text-green-700">{formatRupiah(item.paguAnggaran)}</td>}
                                    {visibleColumns.includes('kodeDesa') && <td className="px-3 py-2.5 font-medium text-slate-600">{item.kodeDesa || '-'}</td>}
                                    {visibleColumns.includes('desa') && <td className="px-3 py-2.5 font-semibold text-lobar-blue">{item.desa || '-'}</td>}
                                    {visibleColumns.includes('kodeKecamatan') && <td className="px-3 py-2.5 text-slate-600">{item.kodeKecamatan || '-'}</td>}
                                    {visibleColumns.includes('kecamatan') && <td className="px-3 py-2.5 text-slate-600">{item.kecamatan || '-'}</td>}
                                    {visibleColumns.includes('luasWilayah') && <td className="px-3 py-2.5 text-slate-600">{item.luasWilayah || '-'}</td>}
                                    {visibleColumns.includes('jumlahPenduduk') && <td className="px-3 py-2.5 text-center text-slate-700">{item.jumlahPenduduk?.toLocaleString() || '0'}</td>}
                                    {visibleColumns.includes('jumlahAngkaKemiskinan') && (
                                        <td className="px-3 py-2.5 text-center">
                                            <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full font-bold">{item.jumlahAngkaKemiskinan}</span>
                                        </td>
                                    )}
                                    {visibleColumns.includes('jumlahBalitaStunting') && (
                                        <td className="px-3 py-2.5 text-center">
                                            <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full font-bold">{item.jumlahBalitaStunting}</span>
                                        </td>
                                    )}
                                    {visibleColumns.includes('potensiDesa') && <td className="px-3 py-2.5 text-slate-600">{item.potensiDesa || '-'}</td>}
                                    {visibleColumns.includes('keterangan') && <td className="px-3 py-2.5 text-slate-500 max-w-xs truncate" title={item.keterangan}>{item.keterangan || '-'}</td>}
                                    {visibleColumns.includes('lat') && <td className="px-3 py-2.5 text-slate-500">{item.lat || '-'}</td>}
                                    {visibleColumns.includes('lng') && <td className="px-3 py-2.5 text-slate-500">{item.lng || '-'}</td>}

                                    <td className="px-3 py-2.5 sticky right-0 bg-white shadow-[-2px_0_5px_rgba(0,0,0,0.05)]">
                                        <div className="flex justify-center gap-1">
                                            {/* Pindahkan tombol hapus ke kiri untuk menghindari masalah klik border kanan sticky */}
                                            <button type="button" onClick={(e) => handleDeleteClick(item.id, e)} title="Hapus" className="relative z-10 p-1 text-red-600 hover:bg-red-100 rounded transition-colors"><Trash2 size={14} /></button>
                                            <button type="button" onClick={() => { setEditingItem(item); setIsEditModalOpen(true); }} title="Edit" className="p-1 text-amber-600 hover:bg-amber-100 rounded transition-colors"><Edit2 size={14} /></button>
                                            <button type="button" onClick={() => onViewMap && onViewMap(item)} title="Lihat Peta" className="p-1 text-lobar-blue hover:bg-blue-100 rounded transition-colors"><MapPin size={14} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div className="bg-slate-50 px-6 py-3 border-t flex items-center justify-between">
                        <div className="text-xs text-slate-500">
                            Menampilkan <span className="font-bold">{indexOfFirstRow + 1}</span> - <span className="font-bold">{Math.min(indexOfLastRow, filteredData.length)}</span> dari <span className="font-bold">{filteredData.length}</span> data
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="p-1.5 bg-white border border-slate-200 rounded-md text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronLeft size={16} />
                            </button>

                            <div className="flex items-center gap-1">
                                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                    let pageNum = currentPage;
                                    if (currentPage <= 3) pageNum = i + 1;
                                    else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                                    else pageNum = currentPage - 2 + i;

                                    if (pageNum > 0 && pageNum <= totalPages) {
                                        return (
                                            <button
                                                key={pageNum}
                                                onClick={() => handlePageChange(pageNum)}
                                                className={`w-8 h-8 rounded-md text-xs font-bold transition-all ${currentPage === pageNum ? 'bg-lobar-blue text-white shadow-md' : 'bg-white border border-slate-200 text-slate-600 hover:border-lobar-blue hover:text-lobar-blue'}`}
                                            >
                                                {pageNum}
                                            </button>
                                        );
                                    }
                                    return null;
                                })}
                            </div>

                            <button
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className="p-1.5 bg-white border border-slate-200 rounded-md text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {(isAddModalOpen || isEditModalOpen) && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                        <div className="p-5 border-b flex justify-between items-center bg-slate-50">
                            <h2 className="text-xl font-bold text-slate-800">{isEditModalOpen ? 'Edit Data Desa' : 'Tambah Data Desa'}</h2>
                            <button onClick={() => { setIsEditModalOpen(false); setIsAddModalOpen(false); }} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all"><X size={20} /></button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <FormField label="Aksi Prioritas" value={(isEditModalOpen ? editingItem?.aksiPrioritas : newItem.aksiPrioritas) || ''} onChange={(val) => isEditModalOpen ? setEditingItem({ ...editingItem!, aksiPrioritas: val }) : setNewItem({ ...newItem, aksiPrioritas: val })} />
                                <FormField label="Perangkat Daerah" value={(isEditModalOpen ? editingItem?.perangkatDaerah : newItem.perangkatDaerah) || ''} onChange={(val) => isEditModalOpen ? setEditingItem({ ...editingItem!, perangkatDaerah: val }) : setNewItem({ ...newItem, perangkatDaerah: val })} />
                                <FormField label="Program" value={(isEditModalOpen ? editingItem?.program : newItem.program) || ''} onChange={(val) => isEditModalOpen ? setEditingItem({ ...editingItem!, program: val }) : setNewItem({ ...newItem, program: val })} />
                                <FormField label="Kegiatan" value={(isEditModalOpen ? editingItem?.kegiatan : newItem.kegiatan) || ''} onChange={(val) => isEditModalOpen ? setEditingItem({ ...editingItem!, kegiatan: val }) : setNewItem({ ...newItem, kegiatan: val })} />
                                <FormField label="Sub Kegiatan" value={(isEditModalOpen ? editingItem?.subKegiatan : newItem.subKegiatan) || ''} onChange={(val) => isEditModalOpen ? setEditingItem({ ...editingItem!, subKegiatan: val }) : setNewItem({ ...newItem, subKegiatan: val })} />
                                <FormField label="Pekerjaan" value={(isEditModalOpen ? editingItem?.pekerjaan : newItem.pekerjaan) || ''} onChange={(val) => isEditModalOpen ? setEditingItem({ ...editingItem!, pekerjaan: val }) : setNewItem({ ...newItem, pekerjaan: val })} />
                                <FormField label="Pagu Anggaran" type="number" value={(isEditModalOpen ? editingItem?.paguAnggaran : newItem.paguAnggaran) || 0} onChange={(val) => isEditModalOpen ? setEditingItem({ ...editingItem!, paguAnggaran: Number(val) }) : setNewItem({ ...newItem, paguAnggaran: Number(val) })} />
                                <FormField label="Kode Desa" value={(isEditModalOpen ? editingItem?.kodeDesa : newItem.kodeDesa) || ''} onChange={(val) => isEditModalOpen ? setEditingItem({ ...editingItem!, kodeDesa: val }) : setNewItem({ ...newItem, kodeDesa: val })} />
                                <FormField label="Desa" value={(isEditModalOpen ? editingItem?.desa : newItem.desa) || ''} onChange={(val) => isEditModalOpen ? setEditingItem({ ...editingItem!, desa: val }) : setNewItem({ ...newItem, desa: val })} />
                                <FormField label="Kode Kecamatan" value={(isEditModalOpen ? editingItem?.kodeKecamatan : newItem.kodeKecamatan) || ''} onChange={(val) => isEditModalOpen ? setEditingItem({ ...editingItem!, kodeKecamatan: val }) : setNewItem({ ...newItem, kodeKecamatan: val })} />
                                <FormField label="Kecamatan" value={(isEditModalOpen ? editingItem?.kecamatan : newItem.kecamatan) || ''} onChange={(val) => isEditModalOpen ? setEditingItem({ ...editingItem!, kecamatan: val }) : setNewItem({ ...newItem, kecamatan: val })} />
                                <FormField label="Luas" value={(isEditModalOpen ? editingItem?.luasWilayah : newItem.luasWilayah) || ''} onChange={(val) => isEditModalOpen ? setEditingItem({ ...editingItem!, luasWilayah: val }) : setNewItem({ ...newItem, luasWilayah: val })} />
                                <FormField label="Penduduk" type="number" value={(isEditModalOpen ? editingItem?.jumlahPenduduk : newItem.jumlahPenduduk) || 0} onChange={(val) => isEditModalOpen ? setEditingItem({ ...editingItem!, jumlahPenduduk: Number(val) }) : setNewItem({ ...newItem, jumlahPenduduk: Number(val) })} />
                                <FormField label="Jml Angka Kemiskinan" type="number" value={(isEditModalOpen ? editingItem?.jumlahAngkaKemiskinan : newItem.jumlahAngkaKemiskinan) || 0} onChange={(val) => isEditModalOpen ? setEditingItem({ ...editingItem!, jumlahAngkaKemiskinan: Number(val) }) : setNewItem({ ...newItem, jumlahAngkaKemiskinan: Number(val) })} />
                                <FormField label="Jml Angka Stunting" type="number" value={(isEditModalOpen ? editingItem?.jumlahBalitaStunting : newItem.jumlahBalitaStunting) || 0} onChange={(val) => isEditModalOpen ? setEditingItem({ ...editingItem!, jumlahBalitaStunting: Number(val) }) : setNewItem({ ...newItem, jumlahBalitaStunting: Number(val) })} />
                                <FormField label="Potensi Desa" value={(isEditModalOpen ? editingItem?.potensiDesa : newItem.potensiDesa) || ''} onChange={(val) => isEditModalOpen ? setEditingItem({ ...editingItem!, potensiDesa: val }) : setNewItem({ ...newItem, potensiDesa: val })} />
                                <FormField label="Latitude" type="string" value={(isEditModalOpen ? editingItem?.lat : newItem.lat) || ''} onChange={(val) => isEditModalOpen ? setEditingItem({ ...editingItem!, lat: Number(val) }) : setNewItem({ ...newItem, lat: Number(val) })} />
                                <FormField label="Longitude" type="string" value={(isEditModalOpen ? editingItem?.lng : newItem.lng) || ''} onChange={(val) => isEditModalOpen ? setEditingItem({ ...editingItem!, lng: Number(val) }) : setNewItem({ ...newItem, lng: Number(val) })} />
                                <div className="col-span-1 md:col-span-2 lg:col-span-3">
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Keterangan</label>
                                    <textarea className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-lobar-blue outline-none text-sm transition-all" rows={2} value={(isEditModalOpen ? editingItem?.keterangan : newItem.keterangan) || ''} onChange={(e) => isEditModalOpen ? setEditingItem({ ...editingItem!, keterangan: e.target.value }) : setNewItem({ ...newItem, keterangan: e.target.value })} placeholder="Tambahkan catatan jika perlu..." />
                                </div>
                            </div>
                        </div>
                        <div className="p-5 border-t bg-slate-50 flex justify-end gap-3">
                            <button onClick={() => { setIsEditModalOpen(false); setIsAddModalOpen(false); }} className="px-6 py-2 border border-slate-200 rounded-lg hover:bg-white text-slate-600 text-sm font-bold transition-all">Batal</button>
                            <button onClick={() => handleSave(isEditModalOpen)} className="px-8 py-2 bg-lobar-blue text-white rounded-lg hover:bg-lobar-blue-dark text-sm font-bold shadow-lg shadow-blue-500/20 transition-all">Simpan</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {isDeleteModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
                        <div className="p-6 text-center">
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Trash2 size={32} className="text-red-600" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-800 mb-2">Hapus Data Ini?</h3>
                            <p className="text-slate-500 text-sm">Data yang dihapus tidak dapat dikembalikan lagi.</p>
                        </div>
                        <div className="p-5 border-t bg-slate-50 flex gap-3">
                            <button
                                onClick={() => setIsDeleteModalOpen(false)}
                                className="flex-1 py-2.5 border border-slate-200 rounded-xl hover:bg-white text-slate-600 font-bold transition-all"
                            >
                                Batal
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="flex-1 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 font-bold shadow-lg shadow-red-500/20 transition-all"
                            >
                                Ya, Hapus
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const FormField = ({ label, value, onChange, type = "text" }: { label: string, value: string | number, onChange: (val: string) => void, type?: string }) => (
    <div>
        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">{label}</label>
        <input
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-lobar-blue outline-none text-sm transition-all"
        />
    </div>
);

export default DataDesa;