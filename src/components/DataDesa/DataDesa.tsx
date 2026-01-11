import React, { useState, useEffect, useRef } from 'react';
import { Search, Filter, Plus, Edit2, Trash2, MapPin, Eye, ArrowLeft, Upload, FileSpreadsheet, X } from 'lucide-react';
import { motion } from 'framer-motion';
import * as XLSX from 'xlsx';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

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

// Mock Data Type
// Imported from types.ts


// Dummy Data Generator
// Imported from types.ts
// Dummy Data Generator - Removed in favor of Supabase
// import { projectsData } from '../../data/projects'; 
import { supabase } from '../../lib/supabase';

import { ProjectData } from '../../types';

interface DataDesaProps {
    onBack?: () => void;
    onViewMap?: (data: ProjectData) => void;
}


// LocationModal removed - Integrated directly into MapContainer.tsx



const DataDesa: React.FC<DataDesaProps> = ({ onBack, onViewMap }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [data, setData] = useState<ProjectData[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<ProjectData | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const itemsPerPage = 250;

    // Fetch Data from Supabase
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
                    potensiDesa: item.potensi_desa || '',
                    keterangan: item.keterangan || '',
                    lat: item.lat,
                    lng: item.lng
                }));
                setData(mappedData);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            alert('Gagal mengambil data dari database.');
        } finally {
            setLoading(false);
        }
    };



    // useEffect removed
    /*
    useEffect(() => {
        // If we already have coords, no need to fetch
        if (coords) return;

        // If no coords, try geocoding
        const fetchCoords = async () => {
            setLoading(true);
            try {
                // Try specific search: Desa + Kecamatan + Lombok Barat
                const query = `${item.desa}, ${item.kecamatan}, Lombok Barat, Indonesia`;
                const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`);
                const data = await response.json();

                if (data && data.length > 0) {
                    setCoords({ lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) });
                } else {
                    // Fallback: Just Kecamatan
                    const query2 = `${item.kecamatan}, Lombok Barat, Indonesia`;
                    const res2 = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query2)}&limit=1`);
                    const data2 = await res2.json();

                    if (data2 && data2.length > 0) {
                        setCoords({ lat: parseFloat(data2[0].lat), lng: parseFloat(data2[0].lon) });
                        setError('Lokasi spesifik desa tidak ditemukan, menampilkan lokasi kecamatan.');
                    } else {
                        setError('Lokasi tidak ditemukan di peta.');
                    }
                }
            } catch (err) {
                console.error('Geocoding error:', err);
                setError('Gagal memuat lokasi peta.');
            } finally {
                setLoading(false);
            }
        };

        fetchCoords();
    }, [item]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center p-6 border-b border-slate-100">
                    <div>
                        <h3 className="text-xl font-bold text-slate-800">Lokasi Proyek</h3>
                        <p className="text-sm text-slate-500 mt-1">{item.pekerjaan}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-red-500"
                    >
                        <X size={24} />
                    </button>
                </div>

                <div className="h-[500px] w-full bg-slate-100 relative">
                    {loading ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500">
                            <div className="w-8 h-8 border-4 border-lobar-blue border-t-transparent rounded-full animate-spin mb-2"></div>
                            <p>Mencari titik lokasi desa...</p>
                        </div>
                    ) : coords ? (
                        <MapContainer
                            center={[coords.lat, coords.lng]}
                            zoom={13}
                            style={{ height: '100%', width: '100%' }}
                        >
                            <TileLayer
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />
                            <Marker position={[coords.lat, coords.lng]}>
                                <Popup>
                                    <div className="p-2">
                                        <h4 className="font-bold text-sm mb-1">{item.pekerjaan}</h4>
                                        <p className="text-xs text-slate-600 mb-1">{item.desa}, {item.kecamatan}</p>
                                        <p className="text-xs font-semibold text-green-600">
                                            {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(item.paguAnggaran)}
                                        </p>
                                        {error && <p className="text-[10px] text-orange-500 mt-1 italic">*{error}</p>}
                                    </div>
                                </Popup>
                            </Marker>
                        </MapContainer>
                    ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
                            <MapPin size={48} className="mb-2 opacity-50" />
                            <p>{error || 'Data lokasi tidak tersedia.'}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
    */

    // Excel Upload Handler
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        // Debug: Confirm event fired
        console.log('File Change Event Triggered');

        const file = e.target.files?.[0];
        if (!file) {
            alert('Tidak ada file yang dipilih.');
            return;
        }

        alert('Membaca file: ' + file.name + '...'); // User Feedback

        const reader = new FileReader();
        reader.onload = async (evt) => {
            try {
                const ab = evt.target?.result;
                const workbook = XLSX.read(ab);
                const wsname = workbook.SheetNames[0];
                const ws = workbook.Sheets[wsname];
                const jsonData = XLSX.utils.sheet_to_json(ws);

                // ... rest of logic remains same until next block ...
                if (jsonData.length === 0) {
                    alert('File Excel kosong atau tidak terbaca.');
                    return;
                }

                alert(`Ditemukan ${jsonData.length} baris data. Sedang memproses...`); // Progress Alert

                setLoading(true);
                const projectsToInsert = jsonData.map((rawRow: any) => {
                    // Normalize keys: lowercase and trim
                    const row: { [key: string]: any } = {};
                    Object.keys(rawRow).forEach(key => {
                        const normalizedKey = key.trim().toLowerCase();
                        row[normalizedKey] = rawRow[key];
                    });

                    // Helper to get value from multiple possible keys
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
                            // Trim whitespace
                            const s = val.trim();
                            // If clean number/float string (e.g. "150000000.01")
                            if (!isNaN(Number(s)) && !s.includes('Rp')) {
                                num = Number(s);
                            } else {
                                // Use old clean strategy for messed up strings
                                const clean = s.replace(/[^\d]/g, '');
                                num = parseInt(clean || '0');
                            }
                        }
                        return Math.floor(num);
                    };

                    // Debug Pagu for first row
                    if (rawRow === jsonData[0]) {
                        console.log('Debug Pagu Row 1:', {
                            raw: getVal('pagu anggaran', 'pagu_anggaran', 'pagu', 'anggaran'),
                            parsed: getNum('pagu anggaran', 'pagu_anggaran', 'pagu', 'anggaran')
                        });
                    }

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
                        potensi_desa: getVal('potensi desa', 'potensi_desa', 'potensi'),
                        keterangan: getVal('keterangan', 'ket', 'catatan'),
                    };
                });

                // Validation Phase
                if (projectsToInsert.length > 0) {
                    console.log('Payload Sample (Row 1):', projectsToInsert[0]); // Debug Payload
                    const sample = projectsToInsert[0];
                    const missingFields = [];
                    if (!sample.pekerjaan) missingFields.push('Pekerjaan');
                    if (!sample.pagu_anggaran) missingFields.push('Pagu Anggaran');
                    if (!sample.desa) missingFields.push('Desa');

                    const rawKeys = Object.keys(jsonData[0]).join(', ');

                    if (missingFields.length > 0) {
                        const confirmContinue = window.confirm(
                            `Peringatan: Kolom penting berikut tidak terdeteksi: ${missingFields.join(', ')}.\n\n` +
                            `Header yang ditemukan di Excel: ${rawKeys}\n\n` +
                            `Sistem membutuhkan header seperti 'Pekerjaan', 'Pagu Anggaran', 'Desa'.\n` +
                            `Apakah Anda ingin tetap mencoba menyimpan data ini?`
                        );
                        if (!confirmContinue) return;
                    }
                }

                // const { error } = await supabase.from('projects').insert(projectsToInsert);
                const { data: inserted, error } = await supabase.from('projects').insert(projectsToInsert).select();

                if (error) {
                    // Enrich error for user
                    console.error('Supabase Insert Error:', error);
                    throw new Error(`Database Error: ${error.message}. \nDetails: ${error.details || ''} \nHint: ${error.hint || 'Cek kelengkapan kolom database.'}`);
                }

                if (!inserted || inserted.length === 0) {
                    throw new Error('Data gagal disimpan ke database (hasil insert kosong).');
                }

                alert(`Berhasil mengimpor ${inserted.length} data!`);
                fetchData(); // Refresh data
            } catch (error: any) {
                console.error('Error uploading file:', error);
                alert('Gagal mengimpor file:\n' + error.message);
            } finally {
                setLoading(false);
                if (fileInputRef.current) fileInputRef.current.value = ''; // Reset input
            }
        };
        reader.readAsArrayBuffer(file);
    };


    // Filter Logic
    const filteredData = data.filter((item) =>
        Object.values(item).some((val) =>
            val && val.toString().toLowerCase().includes(searchTerm.toLowerCase())
        )
    );

    // Pagination Logic
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage);

    // Reset page on search
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    // Formatter Rupiah
    const formatRupiah = (value: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(value);
    };

    // Delete Modal State
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<{ id: string, nama: string } | null>(null);

    // Handlers
    const handleDeleteClick = (id: string, namaPekerjaan: string) => {
        setItemToDelete({ id, nama: namaPekerjaan });
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (itemToDelete) {
            try {
                const { error } = await supabase
                    .from('projects')
                    .delete()
                    .eq('id', itemToDelete.id);

                if (error) throw error;

                setData(prev => prev.filter(item => item.id !== itemToDelete.id));
                setIsDeleteModalOpen(false);
                setItemToDelete(null);
            } catch (error) {
                console.error('Error deleting data:', error);
                alert('Gagal menghapus data.');
            }
        }
    };

    const handleEditClick = (item: ProjectData) => {
        setEditingItem({ ...item });
        setIsEditModalOpen(true);
    };

    const handleSaveEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (editingItem) {
            try {
                // Map back to snake_case for Supabase
                const updatePayload = {
                    pekerjaan: editingItem.pekerjaan,
                    pagu_anggaran: editingItem.paguAnggaran,
                    desa: editingItem.desa,
                    kecamatan: editingItem.kecamatan,
                    jumlah_angka_kemiskinan: editingItem.jumlahAngkaKemiskinan,
                    jumlah_balita_stunting: editingItem.jumlahBalitaStunting,
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
                alert('Gagal mengupdate data.');
            }
        }
    };

    // Statistics Calculation
    const totalPagu = data.reduce((sum, item) => sum + (item.paguAnggaran || 0), 0);
    const totalKegiatan = data.length;
    const totalDesa = new Set(data.map(item => item.desa).filter(d => d)).size;

    // Filter Column State
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [visibleColumns, setVisibleColumns] = useState<string[]>([
        'aksiPrioritas', 'perangkatDaerah', 'program', 'kegiatan', 'subKegiatan',
        'pekerjaan', 'paguAnggaran', 'desa', 'kecamatan', 'luasWilayah',
        'jumlahPenduduk', 'jumlahAngkaKemiskinan', 'jumlahBalitaStunting',
        'potensiDesa', 'keterangan'
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
        potensiDesa: 'Potensi Desa',
        keterangan: 'Keterangan'
    };

    // Add Data Modal State
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newItem, setNewItem] = useState<Partial<ProjectData>>({
        pekerjaan: '',
        paguAnggaran: 0,
        desa: '',
        kecamatan: '',
        jumlahAngkaKemiskinan: 0,
        jumlahBalitaStunting: 0,
        keterangan: '',
        aksiPrioritas: '',
        perangkatDaerah: '',
        program: '',
        kegiatan: '',
        subKegiatan: '',
        luasWilayah: '',
        jumlahPenduduk: 0,
        potensiDesa: '',
        lat: undefined,
        lng: undefined
    });

    // Map Modal State (Moved to parent App.tsx / MapContainer)
    // const [isMapModalOpen, setIsMapModalOpen] = useState(false);
    // const [mapItem, setMapItem] = useState<ProjectData | null>(null);

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
                .select(); // Select to get the returned ID

            if (error) throw error;

            if (insertedData) {
                // Refresh data or append to local state
                // For simplicity and to get the correct ID, let's refresh
                fetchData();
                setIsAddModalOpen(false);
                setNewItem({
                    pekerjaan: '',
                    paguAnggaran: 0,
                    desa: '',
                    kecamatan: '',
                    jumlahAngkaKemiskinan: 0,
                    jumlahBalitaStunting: 0,
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
            alert('Gagal menambahkan data.');
        }
    };

    return (
        <div className="flex flex-col h-full bg-slate-50 p-6 overflow-hidden relative">
            {/* Hidden File Input */}
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="hidden"
                accept=".xlsx, .xls"
            />

            {/* Delete Confirmation Modal */}
            {
                isDeleteModalOpen && itemToDelete && (
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
                                    <br />Tindakan ini tidak dapat dibatalkan.
                                </p>
                                <div className="flex justify-center gap-3">
                                    <button
                                        onClick={() => setIsDeleteModalOpen(false)}
                                        className="px-4 py-2 text-slate-600 hover:bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium transition-colors"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        onClick={confirmDelete}
                                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium shadow-lg shadow-red-500/30 transition-colors"
                                    >
                                        Ya, Hapus
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Map Modal Removed - Integrated to Main Map */}

            {/* Add Data Modal */}
            {
                isAddModalOpen && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                            <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
                                <h2 className="text-xl font-bold text-slate-800">Tambah Data Baru</h2>
                                <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                    <span className="text-2xl">&times;</span>
                                </button>
                            </div>
                            <form onSubmit={handleAddSubmit} className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {/* Detailed Fields */}
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-500">Aksi Prioritas</label>
                                    <input className="w-full p-2 border border-slate-200 rounded text-sm" value={newItem.aksiPrioritas} onChange={e => setNewItem({ ...newItem, aksiPrioritas: e.target.value })} />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-500">Perangkat Daerah</label>
                                    <input className="w-full p-2 border border-slate-200 rounded text-sm" value={newItem.perangkatDaerah} onChange={e => setNewItem({ ...newItem, perangkatDaerah: e.target.value })} />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-500">Program</label>
                                    <input className="w-full p-2 border border-slate-200 rounded text-sm" value={newItem.program} onChange={e => setNewItem({ ...newItem, program: e.target.value })} />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-500">Kegiatan</label>
                                    <input className="w-full p-2 border border-slate-200 rounded text-sm" value={newItem.kegiatan} onChange={e => setNewItem({ ...newItem, kegiatan: e.target.value })} />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-500">Sub Kegiatan</label>
                                    <input className="w-full p-2 border border-slate-200 rounded text-sm" value={newItem.subKegiatan} onChange={e => setNewItem({ ...newItem, subKegiatan: e.target.value })} />
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
                                    <label className="text-xs font-semibold text-slate-500">Luas Wilayah</label>
                                    <input className="w-full p-2 border border-slate-200 rounded text-sm" value={newItem.luasWilayah} onChange={e => setNewItem({ ...newItem, luasWilayah: e.target.value })} />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-500">Jumlah Penduduk</label>
                                    <input type="number" className="w-full p-2 border border-slate-200 rounded text-sm" value={newItem.jumlahPenduduk} onChange={e => setNewItem({ ...newItem, jumlahPenduduk: Number(e.target.value) })} />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-500">Jumlah Kemiskinan</label>
                                    <input type="number" className="w-full p-2 border border-slate-200 rounded text-sm" value={newItem.jumlahAngkaKemiskinan} onChange={e => setNewItem({ ...newItem, jumlahAngkaKemiskinan: Number(e.target.value) })} />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-500">Jumlah Stunting</label>
                                    <input type="number" className="w-full p-2 border border-slate-200 rounded text-sm" value={newItem.jumlahBalitaStunting} onChange={e => setNewItem({ ...newItem, jumlahBalitaStunting: Number(e.target.value) })} />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-500">Potensi Desa</label>
                                    <input className="w-full p-2 border border-slate-200 rounded text-sm" value={newItem.potensiDesa} onChange={e => setNewItem({ ...newItem, potensiDesa: e.target.value })} />
                                </div>
                                <div className="space-y-1 col-span-1 md:col-span-2 lg:col-span-3">
                                    <label className="text-xs font-semibold text-slate-500">Keterangan</label>
                                    <textarea className="w-full p-2 border border-slate-200 rounded text-sm" value={newItem.keterangan} onChange={e => setNewItem({ ...newItem, keterangan: e.target.value })} rows={3} />
                                </div>

                                <div className="col-span-1 md:col-span-2 lg:col-span-3 flex justify-end gap-3 mt-4">
                                    <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium">Batal</button>
                                    <button type="submit" className="px-4 py-2 bg-lobar-blue text-white rounded-lg hover:bg-blue-700 text-sm font-medium">Simpan Data</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }

            {/* Edit Modal */}
            {
                isEditModalOpen && editingItem && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                            <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
                                <h2 className="text-xl font-bold text-slate-800">Edit Data</h2>
                                <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                    <span className="text-2xl">&times;</span>
                                </button>
                            </div>
                            <form onSubmit={handleSaveEdit} className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-500">Aksi Prioritas</label>
                                    <input className="w-full p-2 border border-slate-200 rounded text-sm" value={editingItem.aksiPrioritas || ''} onChange={e => setEditingItem({ ...editingItem, aksiPrioritas: e.target.value })} />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-500">Perangkat Daerah</label>
                                    <input className="w-full p-2 border border-slate-200 rounded text-sm" value={editingItem.perangkatDaerah || ''} onChange={e => setEditingItem({ ...editingItem, perangkatDaerah: e.target.value })} />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-500">Program</label>
                                    <input className="w-full p-2 border border-slate-200 rounded text-sm" value={editingItem.program || ''} onChange={e => setEditingItem({ ...editingItem, program: e.target.value })} />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-500">Kegiatan</label>
                                    <input className="w-full p-2 border border-slate-200 rounded text-sm" value={editingItem.kegiatan || ''} onChange={e => setEditingItem({ ...editingItem, kegiatan: e.target.value })} />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-500">Sub Kegiatan</label>
                                    <input className="w-full p-2 border border-slate-200 rounded text-sm" value={editingItem.subKegiatan || ''} onChange={e => setEditingItem({ ...editingItem, subKegiatan: e.target.value })} />
                                </div>
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
                                    <label className="text-xs font-semibold text-slate-500">Kecamatan</label>
                                    <input className="w-full p-2 border border-slate-200 rounded text-sm" value={editingItem.kecamatan || ''} onChange={e => setEditingItem({ ...editingItem, kecamatan: e.target.value })} />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-500">Luas Wilayah</label>
                                    <input className="w-full p-2 border border-slate-200 rounded text-sm" value={editingItem.luasWilayah || ''} onChange={e => setEditingItem({ ...editingItem, luasWilayah: e.target.value })} />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-500">Jumlah Penduduk</label>
                                    <input type="number" className="w-full p-2 border border-slate-200 rounded text-sm" value={editingItem.jumlahPenduduk || 0} onChange={e => setEditingItem({ ...editingItem, jumlahPenduduk: Number(e.target.value) })} />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-500">Jumlah Kemiskinan</label>
                                    <input type="number" className="w-full p-2 border border-slate-200 rounded text-sm" value={editingItem.jumlahAngkaKemiskinan || 0} onChange={e => setEditingItem({ ...editingItem, jumlahAngkaKemiskinan: Number(e.target.value) })} />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-500">Jumlah Stunting</label>
                                    <input type="number" className="w-full p-2 border border-slate-200 rounded text-sm" value={editingItem.jumlahBalitaStunting || 0} onChange={e => setEditingItem({ ...editingItem, jumlahBalitaStunting: Number(e.target.value) })} />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-500">Potensi Desa</label>
                                    <input className="w-full p-2 border border-slate-200 rounded text-sm" value={editingItem.potensiDesa || ''} onChange={e => setEditingItem({ ...editingItem, potensiDesa: e.target.value })} />
                                </div>
                                <div className="space-y-1 col-span-1 md:col-span-2 lg:col-span-3">
                                    <label className="text-xs font-semibold text-slate-500">Keterangan</label>
                                    <textarea className="w-full p-2 border border-slate-200 rounded text-sm" value={editingItem.keterangan || ''} onChange={e => setEditingItem({ ...editingItem, keterangan: e.target.value })} rows={3} />
                                </div>

                                <div className="col-span-1 md:col-span-2 lg:col-span-3 flex justify-end gap-3 mt-4">
                                    <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium">Batal</button>
                                    <button type="submit" className="px-4 py-2 bg-lobar-blue text-white rounded-lg hover:bg-blue-700 text-sm font-medium">Simpan Perubahan</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }

            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div className="flex items-center gap-4">
                    {onBack && (
                        <button
                            onClick={onBack}
                            className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 transition-colors shadow-sm"
                            title="Kembali ke Menu Utama"
                        >
                            <ArrowLeft size={20} />
                        </button>
                    )}
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">Data Desa & Proyek</h1>
                        <p className="text-slate-500 text-sm mt-1">Manajemen data terpadu infrastruktur desa</p>
                    </div>
                </div>

                <div className="flex gap-3">
                    <div className="relative">
                        <button
                            onClick={() => setIsFilterOpen(!isFilterOpen)}
                            className={`flex items-center gap-2 px-4 py-2 bg-white text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 text-sm font-medium transition-colors ${isFilterOpen ? 'bg-slate-50 ring-2 ring-lobar-blue/20' : ''}`}
                        >
                            <Filter size={18} />
                            Filter Tampilan
                        </button>

                        {/* Filter Dropdown */}
                        {isFilterOpen && (
                            <>
                                <div className="fixed inset-0 z-20" onClick={() => setIsFilterOpen(false)}></div>
                                <div className="absolute top-12 right-0 w-64 bg-white rounded-xl shadow-xl border border-slate-100 z-30 p-4 animate-in fade-in zoom-in duration-200 origin-top-right">
                                    <h3 className="text-sm font-bold text-slate-800 mb-3">Tampilkan Kolom</h3>
                                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                                        {/* Select All Option */}
                                        <label className="flex items-center gap-2 text-sm text-slate-800 font-semibold cursor-pointer hover:text-slate-900 pb-2 border-b border-slate-100 mb-2">
                                            <input
                                                type="checkbox"
                                                checked={visibleColumns.length === Object.keys(columnLabels).length}
                                                onChange={() => {
                                                    if (visibleColumns.length === Object.keys(columnLabels).length) {
                                                        setVisibleColumns([]);
                                                    } else {
                                                        setVisibleColumns(Object.keys(columnLabels));
                                                    }
                                                }}
                                                className="rounded border-slate-300 text-lobar-blue focus:ring-lobar-blue"
                                            />
                                            Pilih Semua
                                        </label>

                                        {Object.entries(columnLabels).map(([key, label]) => (
                                            <label key={key} className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer hover:text-slate-900">
                                                <input
                                                    type="checkbox"
                                                    checked={visibleColumns.includes(key)}
                                                    onChange={() => toggleColumn(key)}
                                                    className="rounded border-slate-300 text-lobar-blue focus:ring-lobar-blue"
                                                />
                                                {label}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium transition-colors shadow-lg shadow-green-500/30"
                    >
                        <FileSpreadsheet size={18} />
                        Import Excel
                    </button>

                    <div className='relative'>
                        {/* Button removed/updated later if needed to be actual add */}
                        <button
                            onClick={() => setIsAddModalOpen(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-lobar-blue text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors shadow-lg shadow-blue-500/30"
                        >
                            <Plus size={18} />
                            Tambah Data
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
                    <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Total Pagu Anggaran</p>
                        <p className="text-xl font-bold text-slate-800 mt-1">{formatRupiah(totalPagu)}</p>
                    </div>
                    <div className="p-2 bg-green-50 text-green-600 rounded-lg">
                        <span className="text-lg font-bold">💰</span>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
                    <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Total Kegiatan</p>
                        <p className="text-xl font-bold text-slate-800 mt-1">{totalKegiatan}</p>
                    </div>
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                        <span className="text-lg font-bold">🏗️</span>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
                    <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Desa Terdata</p>
                        <p className="text-xl font-bold text-slate-800 mt-1">{totalDesa}</p>
                    </div>
                    <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                        <span className="text-lg font-bold">🏘️</span>
                    </div>
                </div>
            </div>

            {/* Search Bar */}
            <div className="mb-4 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input
                    type="text"
                    placeholder="Cari data desa, kegiatan, atau kecamatan..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-lobar-blue/50 text-sm"
                />
            </div>

            {/* Table Section */}
            <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                <div className="overflow-auto flex-1 relative">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-600 font-semibold sticky top-0 z-10 shadow-sm">
                            <tr>
                                <th className="px-4 py-3 border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider min-w-[50px] sticky left-0 z-10 w-16">No</th>
                                {visibleColumns.includes('aksiPrioritas') && <th className="px-4 py-3 border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider min-w-[150px]">Aksi Prioritas</th>}
                                {visibleColumns.includes('pekerjaan') && <th className="px-4 py-3 border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider min-w-[200px]">Pekerjaan</th>}
                                {visibleColumns.includes('paguAnggaran') && <th className="px-4 py-3 border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider min-w-[150px]">Pagu</th>}
                                {visibleColumns.includes('desa') && <th className="px-4 py-3 border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider min-w-[120px]">Desa</th>}
                                {visibleColumns.includes('kecamatan') && <th className="px-4 py-3 border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider min-w-[120px]">Kecamatan</th>}
                                {visibleColumns.includes('perangkatDaerah') && <th className="px-4 py-3 border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider min-w-[150px]">Perangkat Daerah</th>}
                                {visibleColumns.includes('program') && <th className="px-4 py-3 border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider min-w-[150px]">Program</th>}
                                {visibleColumns.includes('kegiatan') && <th className="px-4 py-3 border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider min-w-[150px]">Kegiatan</th>}
                                {visibleColumns.includes('subKegiatan') && <th className="px-4 py-3 border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider min-w-[150px]">Sub Kegiatan</th>}
                                {visibleColumns.includes('luasWilayah') && <th className="px-4 py-3 border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider min-w-[100px]">Luas</th>}
                                {visibleColumns.includes('jumlahPenduduk') && <th className="px-4 py-3 border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider min-w-[100px]">Penduduk</th>}
                                {visibleColumns.includes('jumlahAngkaKemiskinan') && <th className="px-4 py-3 border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider min-w-[120px]">Kemiskinan</th>}
                                {visibleColumns.includes('jumlahBalitaStunting') && <th className="px-4 py-3 border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider min-w-[120px]">Stunting</th>}
                                {visibleColumns.includes('potensiDesa') && <th className="px-4 py-3 border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider min-w-[150px]">Potensi Desa</th>}
                                {visibleColumns.includes('keterangan') && <th className="px-4 py-3 border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider min-w-[200px]">Keterangan</th>}
                                <th className="px-4 py-3 border-b border-slate-200 bg-slate-50 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider min-w-[100px] sticky right-0 z-10 w-24 shadow-[-5px_0px_5px_-5px_rgba(0,0,0,0.1)]">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {paginatedData.map((item, index) => (
                                <tr key={item.id} className="hover:bg-slate-50 transition-colors group">
                                    <td className="px-4 py-3 text-center text-slate-500 bg-slate-50 sticky left-0 z-10">
                                        {startIndex + index + 1}
                                    </td>
                                    {visibleColumns.includes('aksiPrioritas') && <td className="px-4 py-3 text-slate-600 font-medium">{item.aksiPrioritas}</td>}
                                    {visibleColumns.includes('pekerjaan') && <td className="px-4 py-3 text-slate-800 font-semibold">{item.pekerjaan}</td>}
                                    {visibleColumns.includes('paguAnggaran') && <td className="px-4 py-3 text-slate-600">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(item.paguAnggaran)}</td>}
                                    {visibleColumns.includes('desa') && <td className="px-4 py-3 text-slate-600">{item.desa}</td>}
                                    {visibleColumns.includes('kecamatan') && <td className="px-4 py-3 text-slate-600">{item.kecamatan}</td>}
                                    {visibleColumns.includes('perangkatDaerah') && <td className="px-4 py-3 text-slate-600">{item.perangkatDaerah}</td>}
                                    {visibleColumns.includes('program') && <td className="px-4 py-3 text-slate-600">{item.program}</td>}
                                    {visibleColumns.includes('kegiatan') && <td className="px-4 py-3 text-slate-600">{item.kegiatan}</td>}
                                    {visibleColumns.includes('subKegiatan') && <td className="px-4 py-3 text-slate-600">{item.subKegiatan}</td>}
                                    {visibleColumns.includes('luasWilayah') && <td className="px-4 py-3 text-slate-600">{item.luasWilayah}</td>}
                                    {visibleColumns.includes('jumlahPenduduk') && <td className="px-4 py-3 text-slate-600">{item.jumlahPenduduk.toLocaleString()}</td>}
                                    {visibleColumns.includes('jumlahAngkaKemiskinan') && <td className="px-4 py-3 text-slate-600">{item.jumlahAngkaKemiskinan.toLocaleString()}</td>}
                                    {visibleColumns.includes('jumlahBalitaStunting') && <td className="px-4 py-3 text-slate-600">{item.jumlahBalitaStunting.toLocaleString()}</td>}
                                    {visibleColumns.includes('potensiDesa') && <td className="px-4 py-3 text-slate-600">{item.potensiDesa}</td>}
                                    {visibleColumns.includes('keterangan') && <td className="px-4 py-3 text-slate-600 min-w-[200px]">{item.keterangan || '-'}</td>}
                                    <td className="px-4 py-3 sticky right-0 z-10 bg-white shadow-[-5px_0_10px_-5px_rgba(0,0,0,0.1)]">
                                        <div className="flex justify-center items-center gap-2">
                                            <button
                                                onClick={() => {
                                                    if (onViewMap) onViewMap(item);
                                                }}
                                                className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-md transition-colors"
                                                title="Lihat Peta"
                                            >
                                                <MapPin size={16} />
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setEditingItem(item);
                                                    setIsEditModalOpen(true);
                                                }}
                                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors group relative"
                                            >
                                                <Edit2 size={16} />
                                                <span className="absolute hidden group-hover:block bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-800 text-white text-xs rounded whitespace-nowrap z-50">Edit</span>
                                            </button>
                                            <button
                                                onClick={() => handleDeleteClick(item.id, item.pekerjaan)}
                                                className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors group relative"
                                            >
                                                <Trash2 size={16} />
                                                <span className="absolute hidden group-hover:block bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-800 text-white text-xs rounded whitespace-nowrap z-50">Hapus</span>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Footer */}
                <div className="border-t border-slate-200 p-4 bg-slate-50 flex justify-between items-center text-sm">
                    <span className="text-slate-500">
                        Menampilkan {filteredData.length > 0 ? startIndex + 1 : 0}-{Math.min(startIndex + itemsPerPage, filteredData.length)} dari {filteredData.length} data
                    </span>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="px-3 py-1 bg-white border rounded hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed text-slate-600 transition-colors"
                        >
                            Previous
                        </button>
                        <span className="bg-white border px-3 py-1 rounded text-slate-600 font-medium">
                            {currentPage} / {totalPages || 1}
                        </span>
                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages || totalPages === 0}
                            className="px-3 py-1 bg-white border rounded hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed text-slate-600 transition-colors"
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>
        </div >
    );
};

export default DataDesa;
