import React, { useState, useEffect, useRef } from 'react';
import { Search, Filter, Plus, Edit2, Trash2, MapPin, Eye, ArrowLeft, Upload, FileSpreadsheet, X } from 'lucide-react';
import { motion } from 'framer-motion';
import * as XLSX from 'xlsx';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { supabase } from '../../lib/supabase';
import { ProjectData } from '../../types';

// Fix for default marker icon in React Leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface DataDesaProps {
    onBack?: () => void;
    onViewMap?: (data: ProjectData) => void;
}

const DataDesa: React.FC<DataDesaProps> = ({ onBack, onViewMap }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [data, setData] = useState<ProjectData[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<ProjectData | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const itemsPerPage = 250;

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            let allData: any[] = [];
            let from = 0;
            const step = 1000;
            let more = true;

            while (more) {
                const to = from + step - 1;
                const { data: chunk, error } = await supabase
                    .from('projects')
                    .select('*')
                    .range(from, to)
                    .order('created_at', { ascending: false });

                if (error) throw error;

                if (chunk) {
                    allData = [...allData, ...chunk];
                    if (chunk.length < step) {
                        more = false;
                    } else {
                        from += step;
                    }
                } else {
                    more = false;
                }
            }

            if (allData.length > 0) {
                const mappedData: ProjectData[] = allData.map(item => ({
                    id: item.id,
                    aksiPrioritas: item.aksi_prioritas || '',
                    perangkatDaerah: item.perangkat_daerah || '',
                    program: item.program || '',
                    kegiatan: item.kegiatan || '',
                    subKegiatan: item.sub_kegiatan || '',
                    pekerjaan: item.pekerjaan || '',
                    paguAnggaran: item.pagu_anggaran || 0,
                    desa: item.desa || '',
                    kecamatan: item.kecamatan || '',
                    luasWilayah: item.luas_wilayah || '',
                    jumlahPenduduk: item.jumlah_penduduk || 0,
                    jumlahAngkaKemiskinan: item.jumlah_angka_kemiskinan || 0,
                    jumlahBalitaStunting: item.jumlah_balita_stunting || 0,
                    statusDesa: item.status_desa || '',
                    potensiDesa: item.potensi_desa || '',
                    keterangan: item.keterangan || '',
                    lat: item.lat,
                    lng: item.lng
                }));
                setData(mappedData);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (evt) => {
            try {
                const ab = evt.target?.result;
                const workbook = XLSX.read(ab);
                const wsname = workbook.SheetNames[0];
                const ws = workbook.Sheets[wsname];
                const jsonData = XLSX.utils.sheet_to_json(ws);

                if (jsonData.length === 0) return;

                setLoading(true);
                const projectsToInsert = jsonData.map((rawRow: any) => {
                    const row: { [key: string]: any } = {};
                    Object.keys(rawRow).forEach(key => {
                        const normalizedKey = key.trim().toLowerCase();
                        row[normalizedKey] = rawRow[key];
                    });

                    const getVal = (...keys: string[]) => {
                        for (const k of keys) {
                            if (row[k] !== undefined) return row[k];
                        }
                        return '';
                    };

                    const getNum = (...keys: string[]) => {
                        const val = getVal(...keys);
                        let num = 0;
                        if (typeof val === 'number') {
                            num = val;
                        } else if (typeof val === 'string') {
                            const s = val.trim();
                            if (!isNaN(Number(s)) && !s.includes('Rp')) {
                                num = Number(s);
                            } else {
                                const clean = s.replace(/[^\d]/g, '');
                                num = parseInt(clean || '0');
                            }
                        }
                        return Math.floor(num);
                    };

                    return {
                        aksi_prioritas: getVal('aksi prioritas', 'aksi_prioritas', 'prioritas', 'aksi'),
                        perangkat_daerah: getVal('perangkat daerah', 'perangkat_daerah', 'opd', 'skpd', 'dinas'),
                        program: getVal('program', 'nama program'),
                        kegiatan: getVal('kegiatan', 'nama kegiatan'),
                        sub_kegiatan: getVal('sub kegiatan', 'sub_kegiatan', 'subkegiatan'),
                        pekerjaan: getVal('pekerjaan', 'nama pekerjaan', 'paket pekerjaan', 'nama paket', 'paket'),
                        pagu_anggaran: getNum('pagu anggaran', 'pagu_anggaran', 'pagu', 'anggaran', 'biaya'),
                        desa: getVal('desa', 'nama desa', 'lokasi desa'),
                        kecamatan: getVal('kecamatan', 'nama kecamatan', 'lokasi kecamatan'),
                        luas_wilayah: getVal('luas', 'luas_wilayah', 'luas wilayah'),
                        jumlah_penduduk: getNum('penduduk', 'jumlah_penduduk', 'jumlah penduduk', 'total penduduk'),
                        jumlah_angka_kemiskinan: getNum('kemiskinan', 'jumlah_angka_kemiskinan', 'jumlah kemiskinan', 'angka kemiskinan'),
                        jumlah_balita_stunting: getNum('stunting', 'jumlah_balita_stunting', 'jumlah stunting', 'angka stunting', 'balita stunting'),
                        status_desa: getVal('status', 'status_desa', 'status desa'),
                        potensi_desa: getVal('potensi desa', 'potensi_desa', 'potensi'),
                        keterangan: getVal('keterangan', 'ket', 'catatan'),
                    };
                });

                const { data: inserted, error } = await supabase.from('projects').insert(projectsToInsert).select();

                if (error) throw error;
                if (inserted) {
                    alert(`Berhasil mengimpor ${inserted.length} data!`);
                    fetchData();
                }
            } catch (error: any) {
                console.error('Error uploading file:', error);
                alert('Gagal mengimpor file:\n' + error.message);
            } finally {
                setLoading(false);
                if (fileInputRef.current) fileInputRef.current.value = '';
            }
        };
        reader.readAsArrayBuffer(file);
    };

    const filteredData = data.filter((item) =>
        Object.values(item).some((val) =>
            val && val.toString().toLowerCase().includes(searchTerm.toLowerCase())
        )
    );

    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    const formatRupiah = (value: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(value);
    };

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<{ id: string, nama: string } | null>(null);

    const handleDeleteClick = (id: string, namaPekerjaan: string) => {
        setItemToDelete({ id, nama: namaPekerjaan });
        setIsDeleteModalOpen(true);
    };

    const handleEditClick = (item: ProjectData) => {
        setEditingItem(item);
        setIsEditModalOpen(true);
    };

    const confirmDelete = async () => {
        if (itemToDelete) {
            try {
                const { error } = await supabase.from('projects').delete().eq('id', itemToDelete.id);
                if (error) throw error;
                setData(prev => prev.filter(item => item.id !== itemToDelete.id));
                setIsDeleteModalOpen(false);
                setItemToDelete(null);
            } catch (error) {
                console.error('Error deleting data:', error);
            }
        }
    };

    const handleSaveEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (editingItem) {
            try {
                const updatePayload = {
                    pekerjaan: editingItem.pekerjaan,
                    pagu_anggaran: editingItem.paguAnggaran,
                    desa: editingItem.desa,
                    kecamatan: editingItem.kecamatan,
                    jumlah_angka_kemiskinan: editingItem.jumlahAngkaKemiskinan,
                    jumlah_balita_stunting: editingItem.jumlahBalitaStunting,
                    status_desa: editingItem.statusDesa,
                    keterangan: editingItem.keterangan,
                    aksi_prioritas: editingItem.aksiPrioritas,
                    perangkat_daerah: editingItem.perangkatDaerah,
                    program: editingItem.program,
                    kegiatan: editingItem.kegiatan,
                    sub_kegiatan: editingItem.subKegiatan,
                    luas_wilayah: editingItem.luasWilayah,
                    jumlah_penduduk: editingItem.jumlahPenduduk,
                    potensi_desa: editingItem.potensiDesa
                };

                const { error } = await supabase
                    .from('projects')
                    .update(updatePayload)
                    .eq('id', editingItem.id);

                if (error) throw error;

                setData(prev => prev.map(item => item.id === editingItem.id ? editingItem : item));
                setIsEditModalOpen(false);
                setEditingItem(null);
            } catch (error) {
                console.error('Error updating data:', error);
            }
        }
    };

    const totalPagu = data.reduce((sum, item) => sum + (item.paguAnggaran || 0), 0);
    const totalKegiatan = data.length;
    const totalDesa = new Set(data.map(item => item.desa).filter(d => d)).size;

    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [visibleColumns, setVisibleColumns] = useState<string[]>([
        'aksiPrioritas', 'pekerjaan', 'paguAnggaran', 'desa', 'kecamatan', 'statusDesa'
    ]);

    const toggleColumn = (column: string) => {
        setVisibleColumns(prev =>
            prev.includes(column)
                ? prev.filter(c => c !== column)
                : [...prev, column]
        );
    };

    const columnLabels: { [key: string]: string } = {
        aksiPrioritas: 'Aksi Prioritas',
        perangkatDaerah: 'Perangkat Daerah',
        program: 'Program',
        kegiatan: 'Kegiatan',
        subKegiatan: 'Sub Kegiatan',
        pekerjaan: 'Pekerjaan',
        paguAnggaran: 'Pagu Anggaran',
        desa: 'Desa',
        kecamatan: 'Kecamatan',
        luasWilayah: 'Luas Wilayah',
        jumlahPenduduk: 'Jumlah Penduduk',
        jumlahAngkaKemiskinan: 'Kemiskinan',
        jumlahBalitaStunting: 'Stunting',
        statusDesa: 'Status Desa',
        potensiDesa: 'Potensi Desa',
        keterangan: 'Keterangan'
    };

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newItem, setNewItem] = useState<Partial<ProjectData>>({
        pekerjaan: '',
        paguAnggaran: 0,
        desa: '',
        kecamatan: '',
        jumlahAngkaKemiskinan: 0,
        jumlahBalitaStunting: 0,
        statusDesa: '',
        keterangan: '',
        aksiPrioritas: '',
        perangkatDaerah: '',
        program: '',
        kegiatan: '',
        subKegiatan: '',
        luasWilayah: '',
        jumlahPenduduk: 0,
        potensiDesa: ''
    });

    const handleAddSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                pekerjaan: newItem.pekerjaan,
                pagu_anggaran: newItem.paguAnggaran,
                desa: newItem.desa,
                kecamatan: newItem.kecamatan,
                jumlah_angka_kemiskinan: newItem.jumlahAngkaKemiskinan,
                jumlah_balita_stunting: newItem.jumlahBalitaStunting,
                status_desa: newItem.statusDesa,
                keterangan: newItem.keterangan,
                aksi_prioritas: newItem.aksiPrioritas,
                perangkat_daerah: newItem.perangkatDaerah,
                program: newItem.program,
                kegiatan: newItem.kegiatan,
                sub_kegiatan: newItem.subKegiatan,
                luas_wilayah: newItem.luasWilayah,
                jumlah_penduduk: newItem.jumlahPenduduk,
                potensi_desa: newItem.potensiDesa
            };

            const { data: insertedData, error } = await supabase
                .from('projects')
                .insert([payload])
                .select();

            if (error) throw error;

            if (insertedData) {
                fetchData();
                setIsAddModalOpen(false);
                setNewItem({
                    pekerjaan: '',
                    paguAnggaran: 0,
                    desa: '',
                    kecamatan: '',
                    jumlahAngkaKemiskinan: 0,
                    jumlahBalitaStunting: 0,
                    statusDesa: '',
                    keterangan: '',
                    aksiPrioritas: '',
                    perangkatDaerah: '',
                    program: '',
                    kegiatan: '',
                    subKegiatan: '',
                    luasWilayah: '',
                    jumlahPenduduk: 0,
                    potensiDesa: ''
                });
                alert('Data berhasil ditambahkan!');
            }
        } catch (error) {
            console.error('Error adding data:', error);
        }
    };

    return (
        <div className="flex flex-col h-full bg-slate-50 p-6 overflow-hidden relative">
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".xlsx, .xls" />

            {/* Delete Confirmation Modal */}
            {isDeleteModalOpen && itemToDelete && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 animate-in fade-in zoom-in duration-200">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Trash2 size={32} />
                            </div>
                            <h3 className="text-lg font-bold text-slate-800 mb-2">Hapus Data?</h3>
                            <p className="text-slate-600 mb-6">
                                Apakah Anda yakin ingin menghapus data <br />
                                <span className="font-semibold text-slate-800">"{itemToDelete.nama}"</span>?
                            </p>
                            <div className="flex justify-center gap-3">
                                <button onClick={() => setIsDeleteModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium">Batal</button>
                                <button onClick={confirmDelete} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium">Ya, Hapus</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Data Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
                            <h2 className="text-xl font-bold text-slate-800">Tambah Data Baru</h2>
                            <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-2xl">&times;</button>
                        </div>
                        <form onSubmit={handleAddSubmit} className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-500">Aksi Prioritas</label>
                                <input className="w-full p-2 border border-slate-200 rounded text-sm" value={newItem.aksiPrioritas} onChange={e => setNewItem({ ...newItem, aksiPrioritas: e.target.value })} />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-500">Pekerjaan</label>
                                <input className="w-full p-2 border border-slate-200 rounded text-sm" value={newItem.pekerjaan} onChange={e => setNewItem({ ...newItem, pekerjaan: e.target.value })} />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-500">Pagu Anggaran</label>
                                <input type="number" className="w-full p-2 border border-slate-200 rounded text-sm" value={newItem.paguAnggaran} onChange={e => setNewItem({ ...newItem, paguAnggaran: Number(e.target.value) })} />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-500">Desa</label>
                                <input className="w-full p-2 border border-slate-200 rounded text-sm" value={newItem.desa} onChange={e => setNewItem({ ...newItem, desa: e.target.value })} />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-500">Kecamatan</label>
                                <input className="w-full p-2 border border-slate-200 rounded text-sm" value={newItem.kecamatan} onChange={e => setNewItem({ ...newItem, kecamatan: e.target.value })} />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-500">Status Desa</label>
                                <select className="w-full p-2 border border-slate-200 rounded text-sm" value={newItem.statusDesa} onChange={e => setNewItem({ ...newItem, statusDesa: e.target.value })}>
                                    <option value="">Pilih Status</option>
                                    <option value="Maju">Maju</option>
                                    <option value="Berkembang">Berkembang</option>
                                    <option value="Tertinggal">Tertinggal</option>
                                </select>
                            </div>
                            <div className="col-span-1 md:col-span-2 lg:col-span-3 flex justify-end gap-3 mt-4">
                                <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium">Batal</button>
                                <button type="submit" className="px-4 py-2 bg-lobar-blue text-white rounded-lg hover:bg-blue-700 text-sm font-medium">Simpan Data</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {isEditModalOpen && editingItem && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
                            <h2 className="text-xl font-bold text-slate-800">Edit Data</h2>
                            <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-2xl">&times;</button>
                        </div>
                        <form onSubmit={handleSaveEdit} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-500">Pekerjaan</label>
                                <input className="w-full p-2 border border-slate-200 rounded text-sm" value={editingItem.pekerjaan || ''} onChange={e => setEditingItem({ ...editingItem, pekerjaan: e.target.value })} />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-500">Pagu Anggaran</label>
                                <input type="number" className="w-full p-2 border border-slate-200 rounded text-sm" value={editingItem.paguAnggaran || 0} onChange={e => setEditingItem({ ...editingItem, paguAnggaran: Number(e.target.value) })} />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-500">Desa</label>
                                <input className="w-full p-2 border border-slate-200 rounded text-sm" value={editingItem.desa || ''} onChange={e => setEditingItem({ ...editingItem, desa: e.target.value })} />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-500">Status Desa</label>
                                <select className="w-full p-2 border border-slate-200 rounded text-sm" value={editingItem.statusDesa || ''} onChange={e => setEditingItem({ ...editingItem, statusDesa: e.target.value })}>
                                    <option value="">Pilih Status</option>
                                    <option value="Maju">Maju</option>
                                    <option value="Berkembang">Berkembang</option>
                                    <option value="Tertinggal">Tertinggal</option>
                                </select>
                            </div>
                            <div className="col-span-1 md:col-span-2 flex justify-end gap-3 mt-4">
                                <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium">Batal</button>
                                <button type="submit" className="px-4 py-2 bg-lobar-blue text-white rounded-lg hover:bg-blue-700 text-sm font-medium">Simpan Perubahan</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div className="flex items-center gap-4">
                    {onBack && (
                        <button onClick={onBack} className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 transition-colors shadow-sm">
                            <ArrowLeft size={20} />
                        </button>
                    )}
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">Data Desa & Proyek</h1>
                        <p className="text-slate-500 text-sm mt-1">Manajemen data terpadu infrastruktur desa</p>
                    </div>
                </div>

                <div className="flex gap-3">
                    <button onClick={() => setIsFilterOpen(!isFilterOpen)} className="flex items-center gap-2 px-4 py-2 bg-white text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 text-sm font-medium transition-colors">
                        <Filter size={18} />
                        Filter Tampilan
                    </button>
                    <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium transition-colors">
                        <FileSpreadsheet size={18} />
                        Import Excel
                    </button>
                    <button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-lobar-blue text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors">
                        <Plus size={18} />
                        Tambah Data
                    </button>
                </div>
            </div>

            {/* Table Section */}
            <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                <div className="overflow-auto flex-1 relative">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-600 font-semibold sticky top-0 z-10 shadow-sm">
                            <tr>
                                <th className="px-4 py-3 border-b border-slate-200">No</th>
                                {visibleColumns.includes('pekerjaan') && <th className="px-4 py-3 border-b border-slate-200">Pekerjaan</th>}
                                {visibleColumns.includes('paguAnggaran') && <th className="px-4 py-3 border-b border-slate-200">Pagu</th>}
                                {visibleColumns.includes('desa') && <th className="px-4 py-3 border-b border-slate-200">Desa</th>}
                                {visibleColumns.includes('statusDesa') && <th className="px-4 py-3 border-b border-slate-200">Status</th>}
                                <th className="px-4 py-3 border-b border-slate-200 text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {paginatedData.map((item, index) => (
                                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-4 py-3 text-slate-500">{startIndex + index + 1}</td>
                                    {visibleColumns.includes('pekerjaan') && <td className="px-4 py-3 text-slate-800 font-semibold">{item.pekerjaan}</td>}
                                    {visibleColumns.includes('paguAnggaran') && <td className="px-4 py-3 text-slate-600">{formatRupiah(item.paguAnggaran)}</td>}
                                    {visibleColumns.includes('desa') && <td className="px-4 py-3 text-slate-600">{item.desa}</td>}
                                    {visibleColumns.includes('statusDesa') && (
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${item.statusDesa === 'Maju' ? 'bg-green-100 text-green-700' : item.statusDesa === 'Berkembang' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                                                {item.statusDesa || 'N/A'}
                                            </span>
                                        </td>
                                    )}
                                    <td className="px-4 py-3">
                                        <div className="flex justify-center items-center gap-2">
                                            <button onClick={() => onViewMap && onViewMap(item)} className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-md"><MapPin size={16} /></button>
                                            <button onClick={() => handleEditClick(item)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 size={16} /></button>
                                            <button onClick={() => handleDeleteClick(item.id, item.pekerjaan)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default DataDesa;