import React, { useState, useEffect, useRef } from 'react';
import { Search, Filter, Plus, Edit2, Trash2, MapPin, ArrowLeft, FileSpreadsheet, X, Check } from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from '../../lib/supabase';
import { ProjectData } from '../../types';

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
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<ProjectData | null>(null);
    const [newItem, setNewItem] = useState<Partial<ProjectData>>({});
    const fileInputRef = useRef<HTMLInputElement>(null);

    const itemsPerPage = 25;

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const { data: dbData, error } = await supabase
                .from('projects')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            if (dbData) {
                const mappedData: ProjectData[] = dbData.map(item => ({
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
                        aksi_prioritas: row.aksi_prioritas || row.prioritas || '',
                        perangkat_daerah: row.perangkat_daerah || row.opd || row.dinas || '',
                        program: row.program || '',
                        kegiatan: row.kegiatan || '',
                        sub_kegiatan: row.sub_kegiatan || '',
                        pekerjaan: row.pekerjaan || row.nama_paket || '',
                        pagu_anggaran: parseInt(row.pagu_anggaran || row.pagu || row.anggaran || '0'),
                        desa: row.desa || '',
                        kecamatan: row.kecamatan || '',
                        luas_wilayah: row.luas_wilayah || row.luas || '',
                        jumlah_penduduk: parseInt(row.jumlah_penduduk || row.penduduk || '0'),
                        jumlah_angka_kemiskinan: parseInt(row.jumlah_angka_kemiskinan || row.kemiskinan || '0'),
                        jumlah_balita_stunting: parseInt(row.jumlah_balita_stunting || row.stunting || '0'),
                        potensi_desa: row.potensi_desa || row.potensi || '',
                        keterangan: row.keterangan || ''
                    };
                });

                const { error } = await supabase.from('projects').insert(projectsToInsert);
                if (error) throw error;
                
                alert('Berhasil mengimpor data!');
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
            desa: item.desa,
            kecamatan: item.kecamatan,
            luas_wilayah: item.luasWilayah,
            jumlah_penduduk: item.jumlahPenduduk,
            jumlah_angka_kemiskinan: item.jumlahAngkaKemiskinan,
            jumlah_balita_stunting: item.jumlahBalitaStunting,
            potensi_desa: item.potensiDesa,
            keterangan: item.keterangan
        };

        try {
            if (isEdit && editingItem) {
                const { error } = await supabase.from('projects').update(payload).eq('id', editingItem.id);
                if (error) throw error;
            } else {
                const { error } = await supabase.from('projects').insert([payload]);
                if (error) throw error;
            }
            setIsEditModalOpen(false);
            setIsAddModalOpen(false);
            fetchData();
        } catch (error) {
            console.error('Error saving:', error);
        }
    };

    const filteredData = data.filter(item => 
        item.pekerjaan.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.desa.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.kecamatan.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const formatRupiah = (val: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);

    return (
        <div className="flex flex-col h-full bg-slate-50 p-6 overflow-hidden">
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".xlsx, .xls" />

            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-4">
                    {onBack && <button onClick={onBack} className="p-2 bg-white border rounded-lg hover:bg-slate-50 transition-colors"><ArrowLeft size={20} /></button>}
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">Manajemen Data Desa</h1>
                        <p className="text-slate-500 text-sm">Kelola informasi infrastruktur dan profil desa</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm">
                        <FileSpreadsheet size={18} /> Import Excel
                    </button>
                    <button onClick={() => { setNewItem({}); setIsAddModalOpen(true); }} className="flex items-center gap-2 px-4 py-2 bg-lobar-blue text-white rounded-lg hover:bg-lobar-blue-dark transition-colors shadow-sm">
                        <Plus size={18} /> Tambah Data
                    </button>
                </div>
            </div>

            {/* Filter & Search */}
            <div className="bg-white p-4 rounded-xl shadow-sm border mb-4 flex gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                        type="text" 
                        placeholder="Cari pekerjaan, desa, atau kecamatan..." 
                        className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-lobar-blue focus:border-lobar-blue outline-none"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Table */}
            <div className="flex-1 bg-white rounded-xl shadow-sm border overflow-hidden flex flex-col">
                <div className="overflow-auto flex-1">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-600 font-semibold sticky top-0 z-10 border-b">
                            <tr>
                                <th className="px-4 py-3">Pekerjaan / Program</th>
                                <th className="px-4 py-3">Lokasi (Desa/Kec)</th>
                                <th className="px-4 py-3">Pagu Anggaran</th>
                                <th className="px-4 py-3">Kemiskinan</th>
                                <th className="px-4 py-3">Stunting</th>
                                <th className="px-4 py-3 text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {loading ? (
                                <tr><td colSpan={6} className="text-center py-10 text-slate-400">Memuat data...</td></tr>
                            ) : paginatedData.length === 0 ? (
                                <tr><td colSpan={6} className="text-center py-10 text-slate-400">Data tidak ditemukan.</td></tr>
                            ) : paginatedData.map((item) => (
                                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-4 py-3">
                                        <div className="font-bold text-slate-800">{item.pekerjaan || 'Tanpa Nama'}</div>
                                        <div className="text-[10px] text-slate-500 uppercase">{item.perangkatDaerah}</div>
                                    </td>
                                    <td className="px-4 py-3 text-slate-600">
                                        <div className="font-medium">{item.desa}</div>
                                        <div className="text-xs">{item.kecamatan}</div>
                                    </td>
                                    <td className="px-4 py-3 font-semibold text-green-700">{formatRupiah(item.paguAnggaran)}</td>
                                    <td className="px-4 py-3"><span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs">{item.jumlahAngkaKemiskinan} Jiwa</span></td>
                                    <td className="px-4 py-3"><span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full text-xs">{item.jumlahBalitaStunting} Balita</span></td>
                                    <td className="px-4 py-3">
                                        <div className="flex justify-center gap-2">
                                            <button onClick={() => onViewMap && onViewMap(item)} title="Lihat di Peta" className="p-1.5 text-lobar-blue hover:bg-blue-50 rounded"><MapPin size={16} /></button>
                                            <button onClick={() => { setEditingItem(item); setIsEditModalOpen(true); }} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded"><Edit2 size={16} /></button>
                                            <button onClick={async () => { if(confirm('Hapus data?')) { await supabase.from('projects').delete().eq('id', item.id); fetchData(); } }} className="p-1.5 text-red-600 hover:bg-red-50 rounded"><Trash2 size={16} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Add/Edit */}
            {(isAddModalOpen || isEditModalOpen) && (
                <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                        <div className="p-6 border-b flex justify-between items-center bg-slate-50">
                            <h2 className="text-xl font-bold text-slate-800">{isEditModalOpen ? 'Edit Data Proyek/Desa' : 'Tambah Data Baru'}</h2>
                            <button onClick={() => { setIsEditModalOpen(false); setIsAddModalOpen(false); }} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {/* Input fields based on Database Schema */}
                            <FormField label="Aksi Prioritas" value={(isEditModalOpen ? editingItem?.aksiPrioritas : newItem.aksiPrioritas) || ''} onChange={(val) => isEditModalOpen ? setEditingItem({...editingItem!, aksiPrioritas: val}) : setNewItem({...newItem, aksiPrioritas: val})} />
                            <FormField label="Pekerjaan" value={(isEditModalOpen ? editingItem?.pekerjaan : newItem.pekerjaan) || ''} onChange={(val) => isEditModalOpen ? setEditingItem({...editingItem!, pekerjaan: val}) : setNewItem({...newItem, pekerjaan: val})} />
                            <FormField label="Perangkat Daerah (OPD)" value={(isEditModalOpen ? editingItem?.perangkatDaerah : newItem.perangkatDaerah) || ''} onChange={(val) => isEditModalOpen ? setEditingItem({...editingItem!, perangkatDaerah: val}) : setNewItem({...newItem, perangkatDaerah: val})} />
                            <FormField label="Desa" value={(isEditModalOpen ? editingItem?.desa : newItem.desa) || ''} onChange={(val) => isEditModalOpen ? setEditingItem({...editingItem!, desa: val}) : setNewItem({...newItem, desa: val})} />
                            <FormField label="Kecamatan" value={(isEditModalOpen ? editingItem?.kecamatan : newItem.kecamatan) || ''} onChange={(val) => isEditModalOpen ? setEditingItem({...editingItem!, kecamatan: val}) : setNewItem({...newItem, kecamatan: val})} />
                            <FormField label="Pagu Anggaran" type="number" value={(isEditModalOpen ? editingItem?.paguAnggaran : newItem.paguAnggaran) || 0} onChange={(val) => isEditModalOpen ? setEditingItem({...editingItem!, paguAnggaran: Number(val)}) : setNewItem({...newItem, paguAnggaran: Number(val)})} />
                            <FormField label="Jumlah Kemiskinan (Jiwa)" type="number" value={(isEditModalOpen ? editingItem?.jumlahAngkaKemiskinan : newItem.jumlahAngkaKemiskinan) || 0} onChange={(val) => isEditModalOpen ? setEditingItem({...editingItem!, jumlahAngkaKemiskinan: Number(val)}) : setNewItem({...newItem, jumlahAngkaKemiskinan: Number(val)})} />
                            <FormField label="Jumlah Stunting (Balita)" type="number" value={(isEditModalOpen ? editingItem?.jumlahBalitaStunting : newItem.jumlahBalitaStunting) || 0} onChange={(val) => isEditModalOpen ? setEditingItem({...editingItem!, jumlahBalitaStunting: Number(val)}) : setNewItem({...newItem, jumlahBalitaStunting: Number(val)})} />
                            <FormField label="Program" value={(isEditModalOpen ? editingItem?.program : newItem.program) || ''} onChange={(val) => isEditModalOpen ? setEditingItem({...editingItem!, program: val}) : setNewItem({...newItem, program: val})} />
                            <FormField label="Kegiatan" value={(isEditModalOpen ? editingItem?.kegiatan : newItem.kegiatan) || ''} onChange={(val) => isEditModalOpen ? setEditingItem({...editingItem!, kegiatan: val}) : setNewItem({...newItem, kegiatan: val})} />
                            <FormField label="Sub Kegiatan" value={(isEditModalOpen ? editingItem?.subKegiatan : newItem.subKegiatan) || ''} onChange={(val) => isEditModalOpen ? setEditingItem({...editingItem!, subKegiatan: val}) : setNewItem({...newItem, subKegiatan: val})} />
                            <FormField label="Luas Wilayah" value={(isEditModalOpen ? editingItem?.luasWilayah : newItem.luasWilayah) || ''} onChange={(val) => isEditModalOpen ? setEditingItem({...editingItem!, luasWilayah: val}) : setNewItem({...newItem, luasWilayah: val})} />
                            <FormField label="Jumlah Penduduk" type="number" value={(isEditModalOpen ? editingItem?.jumlahPenduduk : newItem.jumlahPenduduk) || 0} onChange={(val) => isEditModalOpen ? setEditingItem({...editingItem!, jumlahPenduduk: Number(val)}) : setNewItem({...newItem, jumlahPenduduk: Number(val)})} />
                            <div className="col-span-1 md:col-span-2 lg:col-span-3">
                                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Potensi Desa</label>
                                <textarea className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-lobar-blue outline-none text-sm" rows={2} value={(isEditModalOpen ? editingItem?.potensiDesa : newItem.potensiDesa) || ''} onChange={(e) => isEditModalOpen ? setEditingItem({...editingItem!, potensiDesa: e.target.value}) : setNewItem({...newItem, potensiDesa: e.target.value})} />
                            </div>
                        </div>
                        <div className="p-6 border-t bg-slate-50 flex justify-end gap-3">
                            <button onClick={() => { setIsEditModalOpen(false); setIsAddModalOpen(false); }} className="px-6 py-2 border rounded-lg hover:bg-white text-slate-600 font-medium">Batal</button>
                            <button onClick={() => handleSave(isEditModalOpen)} className="px-6 py-2 bg-lobar-blue text-white rounded-lg hover:bg-lobar-blue-dark font-bold shadow-lg shadow-blue-500/20">Simpan Data</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const FormField = ({ label, value, onChange, type = "text" }: { label: string, value: string | number, onChange: (val: string) => void, type?: string }) => (
    <div className="space-y-1">
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</label>
        <input 
            type={type} 
            value={value} 
            onChange={(e) => onChange(e.target.value)} 
            className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-lobar-blue outline-none text-sm"
        />
    </div>
);

export default DataDesa;