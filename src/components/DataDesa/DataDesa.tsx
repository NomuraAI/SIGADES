import React, { useState, useEffect, useRef } from 'react';
import { Search, Plus, Edit2, Trash2, MapPin, ArrowLeft, FileSpreadsheet, X, Loader2, Wallet, Briefcase, Landmark, ChevronLeft, ChevronRight, Filter, Check, RefreshCw, AlertCircle } from 'lucide-react';
import * as XLSX from 'xlsx';
import { ProjectData } from '../../types';
import { getProjectService } from '../../services/projectService';
import { Database, HardDrive } from 'lucide-react';

interface DataDesaProps {
    onBack?: () => void;
    onViewMap?: (data: ProjectData) => void;
    selectedVersion: string;
    onVersionChange?: (newVersion?: string) => void;
    dataSourceMode: 'supabase' | 'local';
    setDataSourceMode: (mode: 'supabase' | 'local') => void;
}

const DataDesa: React.FC<DataDesaProps> = ({ onBack, onViewMap, selectedVersion, onVersionChange, dataSourceMode, setDataSourceMode }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchMode, setSearchMode] = useState<'desa' | 'kecamatan'>('desa');
    const [filterOPD, setFilterOPD] = useState('');
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
        { key: 'kodeDesa', label: 'Kode Desa', align: 'left' },
        { key: 'desaKelurahan', label: 'Desa/Kelurahan', align: 'left' },
        { key: 'kodeKecamatan', label: 'Kode Kecamatan', align: 'left' },
        { key: 'kecamatan', label: 'Kecamatan', align: 'left' },
        { key: 'luasWilayah', label: 'Luas', align: 'left' },
        { key: 'jumlahPenduduk', label: 'Penduduk', align: 'center' },
        { key: 'jumlahAngkaKemiskinan', label: 'Kemiskinan', align: 'center' },
        { key: 'jumlahBalitaStunting', label: 'Stunting', align: 'center' },
        { key: 'potensiDesa', label: 'Potensi Desa', align: 'left' },
        { key: 'keterangan', label: 'Keterangan', align: 'left' },
        { key: 'latitude', label: 'Latitude', align: 'center' },
        { key: 'longitude', label: 'Longitude', align: 'center' },
        { key: 'latitude', label: 'Latitude', align: 'center' },
        { key: 'longitude', label: 'Longitude', align: 'center' },
        { key: 'strataDesa', label: 'Strata IDM', align: 'center' },
    ];
    const [visibleColumns, setVisibleColumns] = useState<string[]>(allColumns.map(c => c.key));
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [importVersionName, setImportVersionName] = useState('');
    const [fileToImport, setFileToImport] = useState<File | null>(null);
    const [importMode, setImportMode] = useState<'replace' | 'update'>('replace');

    // dataSourceMode is now from props

    useEffect(() => {
        fetchData();
    }, [selectedVersion, dataSourceMode]); // Refetch when version or mode changes

    // Column Toggles
    const toggleColumn = (key: string) => {
        if (visibleColumns.includes(key)) {
            setVisibleColumns(visibleColumns.filter(c => c !== key));
        } else {
            setVisibleColumns([...visibleColumns, key]);
        }
    };

    const toggleAllColumns = (showAll: boolean) => {
        if (showAll) {
            setVisibleColumns(allColumns.map(c => c.key));
        } else {
            setVisibleColumns([]);
        }
    };

    const fetchData = async () => {
        try {
            setLoading(true);
            const service = getProjectService(dataSourceMode);

            // Note: ProjectService handles pagination internally differently, 
            // but for now we'll just fetch all data as the UI expects it fully loaded for client-side filtering 
            // OR we rely on the service to return what it can.
            // The existing logic fetched ALL data in pages. Let's try to fetch all here too.

            let allData: ProjectData[] = [];
            let page = 0;
            let hasMore = true;

            while (hasMore) {
                const result = await service.getAllProjects(selectedVersion || undefined, page, 1000);
                allData = [...allData, ...result.data];
                hasMore = result.hasMore;
                page++;
            }

            setData(allData);
        } catch (error) {
            console.error('Error fetching data:', error);
            alert('Gagal mengambil data. Pastikan koneksi aman.');
        } finally {
            setLoading(false);
        }
    };

    const cleanNumber = (val: any) => {
        if (typeof val === 'number') return Math.round(val);
        if (!val) return 0;
        const cleanStr = String(val).replace(/[^\d]/g, '');
        return parseInt(cleanStr || '0');
    };

    const cleanFloat = (val: any) => {
        if (val === 0 || val === '0') return null;
        if (typeof val === 'number') return val;
        if (!val) return null;
        const str = String(val).trim().toUpperCase();
        if (['#N/A', '-', 'NAN', 'NULL'].includes(str)) return null;
        const cleanStr = String(val).replace(',', '.').replace(/[^\d.-]/g, '');
        const num = parseFloat(cleanStr);
        return (isNaN(num) || num === 0) ? null : num;
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFileToImport(e.target.files[0]);
            setIsImportModalOpen(true);
            setImportVersionName(selectedVersion); // Default to current
        }
    };

    const processImport = async () => {
        if (!fileToImport) return;
        const targetVersion = importVersionName.trim() || 'Default';

        // Confirmation (Adjusted for mode)
        const actionText = importMode === 'update' ? 'MEMPERBARUI (Smart Update)' : 'MENAMBAHKAN/MENIMPA';
        if (!window.confirm(`Anda akan ${actionText} data ke Versi: "${targetVersion}" (Mode: ${dataSourceMode.toUpperCase()}). Lanjutkan?`)) {
            return;
        }

        console.log(`Starting import... Mode: ${importMode}, Version: ${targetVersion}`);

        const reader = new FileReader();
        reader.onload = async (evt) => {
            try {
                const ab = evt.target?.result;
                const workbook = XLSX.read(ab);
                const ws = workbook.Sheets[workbook.SheetNames[0]];
                const jsonData = XLSX.utils.sheet_to_json(ws);

                if (jsonData.length === 0) return;

                setLoading(true);

                // Parse Excel Rows
                const parsedRows = jsonData.map((rawRow: any) => {
                    const row: { [key: string]: any } = {};
                    Object.keys(rawRow).forEach(key => {
                        row[key.trim().toLowerCase().replace(/[\s\/]+/g, '_')] = rawRow[key];
                    });

                    // Helper for fuzzy finding keys
                    const findKey = (keywords: string[]) => {
                        return Object.keys(row).find(key => keywords.some(kw => key.includes(kw)));
                    };

                    // Helper map Strata
                    let strataVal = row.strata_desa;
                    if (strataVal === undefined) {
                        const key = findKey(['strata', 'idm', 'status_desa', 'status']);
                        if (key) strataVal = row[key];
                    }

                    // Parse Strata Value (Handle numbers and strings)
                    let parsedStrata: number | undefined = undefined;
                    if (strataVal !== undefined && strataVal !== null) {
                        const sVal = String(strataVal).trim().toLowerCase();
                        if (!isNaN(Number(sVal)) && sVal !== '') {
                            parsedStrata = Number(sVal);
                        } else {
                            if (sVal.includes('mandiri')) parsedStrata = 4;
                            else if (sVal.includes('maju')) parsedStrata = 3;
                            else if (sVal.includes('berkembang')) parsedStrata = 2;
                            else if (sVal.includes('sangat tertinggal')) parsedStrata = 0; // Check "Sangat" first
                            else if (sVal.includes('tertinggal')) parsedStrata = 1;
                        }
                    }

                    // Kemiskinan Fuzzy Match
                    let kemiskinanVal = row.jumlah_angka_kemiskinan || row.kemiskinan;
                    if (kemiskinanVal === undefined) {
                        const key = findKey(['kemiskinan', 'miskin']);
                        if (key) kemiskinanVal = row[key];
                    }

                    // Stunting Fuzzy Match
                    let stuntingVal = row.jumlah_angka_stunting || row.stunting || row.jumlah_balita_stunting;
                    if (stuntingVal === undefined) {
                        const key = findKey(['stunting', 'balita']);
                        if (key) stuntingVal = row[key];
                    }

                    return {
                        aksiPrioritas: row.aksi_prioritas || row.prioritas || null,
                        perangkatDaerah: row.perangkat_daerah || row.opd || null,
                        program: row.program || null,
                        kegiatan: row.kegiatan || null,
                        subKegiatan: row.sub_kegiatan || null,
                        pekerjaan: row.pekerjaan || row.nama_paket || null,
                        paguAnggaran: cleanNumber(row.pagu_anggaran || row.pagu),
                        kodeDesa: String(row.kode_desa || row.kode || '').trim() || null,
                        desaKelurahan: row.desa_kelurahan || row.desa || row.nama_desa || row.desa_kel || row.nama_desa_kelurahan || null,
                        kodeKecamatan: String(row.kode_kecamatan || row.kode_kec || '').trim() || null,
                        kecamatan: row.kecamatan || null,
                        luasWilayah: row.luas || row.luas_wilayah || null,
                        jumlahPenduduk: cleanNumber(row.penduduk || row.jumlah_penduduk),
                        jumlahAngkaKemiskinan: cleanNumber(kemiskinanVal),
                        jumlahBalitaStunting: cleanNumber(stuntingVal),
                        potensiDesa: row.potensi_desa || row.potensi || '',
                        keterangan: row.keterangan || '',
                        latitude: cleanFloat(row.latitude || row.lat || row.llatitude),
                        longitude: cleanFloat(row.longitude || row.long || row.lng),
                        strataDesa: parsedStrata,
                        dataVersion: targetVersion
                    };
                });

                const service = getProjectService(dataSourceMode);

                if (importMode === 'update') {
                    // --- SMART UPDATE LOGIC ---

                    // 1. Fetch ALL existing data for this version to compare
                    let existingData: ProjectData[] = [];
                    let page = 0;
                    let hasMore = true;
                    while (hasMore) {
                        const res = await service.getAllProjects(targetVersion, page, 1000);
                        existingData = [...existingData, ...res.data];
                        hasMore = res.hasMore;
                        page++;
                    }

                    // 2. Build Map for fast lookup
                    // Key: KodeDesa + Pekerjaan (Normalized) + SubKegiatan (Normalized)
                    // We normalize strings to avoid case/space mismatches
                    const makeKey = (p: Partial<ProjectData>) => {
                        const k1 = (p.kodeDesa || 'NODESA').trim().toUpperCase();
                        const k2 = (p.pekerjaan || 'NOJOB').trim().toUpperCase().replace(/\s+/g, ' ');
                        const k3 = (p.subKegiatan || 'NOSUB').trim().toUpperCase().replace(/\s+/g, ' ');
                        return `${k1}|${k2}|${k3}`;
                    };

                    const existingMap = new Map<string, ProjectData>();
                    existingData.forEach(item => existingMap.set(makeKey(item), item));

                    // 3. Compare
                    const upsertList: Partial<ProjectData>[] = [];
                    let updateCount = 0;
                    let insertCount = 0;

                    parsedRows.forEach(newRow => {
                        const key = makeKey(newRow);
                        const existing = existingMap.get(key);

                        if (existing) {
                            // UPDATE: Use existing ID
                            upsertList.push({ ...newRow, id: existing.id });
                            updateCount++;
                        } else {
                            // INSERT: No ID (or let DB gen)
                            upsertList.push(newRow);
                            insertCount++;
                        }
                    });

                    // 4. Execute
                    if (upsertList.length > 0) {
                        await service.batchUpsertProjects(upsertList);
                        alert(`Smart Update Selesai!\n\nTotal Diproses: ${upsertList.length}\n- Diperbarui: ${updateCount}\n- Data Baru: ${insertCount}`);
                    } else {
                        alert("Tidak ada data valid untuk diproses.");
                    }

                } else {
                    // --- NORMAL INSERT (Original Logic) ---
                    await service.batchInsertProjects(parsedRows);
                    alert(`Impor selesai! ${parsedRows.length} data ditambahkan ke mode "${dataSourceMode.toUpperCase()}" versi "${targetVersion}".`);
                }

                setIsImportModalOpen(false);
                setFileToImport(null);

                if (onVersionChange) {
                    onVersionChange(targetVersion);
                } else {
                    // Manual trigger fetch if version didn't change but data did
                    fetchData();
                }

            } catch (error: any) {
                console.error('Import error:', error);
                alert('Gagal impor: ' + error.message);
            } finally {
                setLoading(false);
            }
        };
        reader.readAsArrayBuffer(fileToImport);
    };

    const handleSave = async (isEdit: boolean) => {
        const item = isEdit ? editingItem : newItem;
        if (!item) return;

        // Ensure we inject the CURRENTLY SELECTED version if it's missing (especially for new items)
        // If editing, we generally keep the original version unless we want to move it? 
        // Typically editing keeps the same version. New items inherit current view version.
        const payload = {
            ...item,
            dataVersion: item.dataVersion || selectedVersion || 'Default'
        };

        const service = getProjectService(dataSourceMode);

        try {
            if (isEdit && editingItem) {
                await service.updateProject(editingItem.id, payload);
            } else {
                await service.createProject(payload);
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

        const service = getProjectService(dataSourceMode);

        try {
            await service.deleteProject(itemToDelete);
            fetchData();
            setIsDeleteModalOpen(false);
            setItemToDelete(null);
        } catch (error: any) {
            console.error('Error deleting:', error);
            alert('Gagal menghapus data: ' + error.message);
        }
    };

    const handleResetLocalData = async () => {
        if (!window.confirm('Yakin ingin menghapus SEMUA data Local Storage? Data tidak bisa dikembalikan.')) return;

        try {
            setLoading(true);
            const service = getProjectService('local');
            await service.clearAllProjects();
            alert('Data Local berhasil dikosongkan.');
            fetchData();
            if (onVersionChange) onVersionChange('Default'); // Reset version filter
        } catch (error: any) {
            console.error(error);
            alert('Gagal reset: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const [filterKecamatan, setFilterKecamatan] = useState('');
    const [filterDesa, setFilterDesa] = useState('');

    const filteredData = data.filter(item => {
        const query = searchQuery.toLowerCase();
        const isMatch = searchMode === 'desa'
            ? item.desaKelurahan.toLowerCase().includes(query)
            : item.kecamatan.toLowerCase().includes(query);

        return isMatch &&
            (filterOPD === '' || item.perangkatDaerah === filterOPD) &&
            (filterKecamatan === '' || item.kecamatan === filterKecamatan) &&
            (filterDesa === '' || item.desaKelurahan === filterDesa);
    });

    // Get unique Perangkat Daerah for dropdown
    const uniqueOPD = React.useMemo(() => {
        return [...new Set(data.map(item => item.perangkatDaerah).filter(Boolean))].sort();
    }, [data]);

    // Get unique Kecamatans
    const uniqueKecamatan = React.useMemo(() => {
        return [...new Set(data.map(item => item.kecamatan).filter(Boolean))].sort();
    }, [data]);

    // Get dependent Desas
    const availableDesa = React.useMemo(() => {
        let source = data;
        if (filterKecamatan) {
            source = source.filter(item => item.kecamatan === filterKecamatan);
        }
        return [...new Set(source.map(item => item.desaKelurahan).filter(Boolean))].sort();
    }, [data, filterKecamatan]);

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
            <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept=".xlsx, .xls" />

            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div className="flex items-center gap-4">
                    {onBack && <button onClick={onBack} className="p-2 bg-white border rounded-lg hover:bg-slate-100 transition-colors"><ArrowLeft size={20} /></button>}
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">Manajemen Data Desa</h1>
                        <div className="flex items-center gap-2 text-slate-500 text-sm">
                            <p>Kelola 15 parameter utama pembangunan</p>
                            <span className="text-slate-300">|</span>
                            {/* Mode Toggle */}
                            <div className="flex items-center gap-2">
                                <div className="flex items-center bg-slate-200 rounded-lg p-0.5">
                                    <button
                                        onClick={() => setDataSourceMode('supabase')}
                                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1 transition-all ${dataSourceMode === 'supabase' ? 'bg-white text-lobar-blue shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        <Database size={10} /> Live
                                    </button>
                                    <button
                                        onClick={() => setDataSourceMode('local')}
                                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1 transition-all ${dataSourceMode === 'local' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        <HardDrive size={10} /> Local
                                    </button>
                                </div>
                                {dataSourceMode === 'local' && (
                                    <button
                                        onClick={handleResetLocalData}
                                        className="text-[10px] text-red-500 hover:text-red-700 underline font-semibold"
                                        title="Hapus semua data local"
                                    >
                                        Reset Data
                                    </button>
                                )}
                            </div>
                        </div>
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

            {/* Info Cards */}
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

            {/* Filters Row */}
            <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-200 mb-4 flex flex-col xl:flex-row justify-between items-center gap-4">
                <div className="relative w-full flex flex-col md:flex-row gap-2 flex-wrap">

                    {/* Kecamatan Dropdown */}
                    <div className="relative w-full md:w-56">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                            <MapPin size={16} />
                        </div>
                        <select
                            className="w-full pl-10 pr-8 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-lobar-blue outline-none text-sm transition-all appearance-none bg-white truncate"
                            value={filterKecamatan}
                            onChange={(e) => {
                                setFilterKecamatan(e.target.value);
                                setFilterDesa(''); // Reset desa when kecamatan changes
                                setCurrentPage(1);
                            }}
                        >
                            <option value="">Semua Kecamatan</option>
                            {uniqueKecamatan.map(kec => (
                                <option key={kec} value={kec}>{kec}</option>
                            ))}
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                            <ChevronLeft size={12} className="-rotate-90" />
                        </div>
                    </div>

                    {/* Desa Dropdown */}
                    <div className="relative w-full md:w-56">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                            <MapPin size={16} />
                        </div>
                        <select
                            className="w-full pl-10 pr-8 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-lobar-blue outline-none text-sm transition-all appearance-none bg-white truncate disabled:bg-slate-50 disabled:text-slate-400"
                            value={filterDesa}
                            onChange={(e) => {
                                setFilterDesa(e.target.value);
                                setCurrentPage(1);
                            }}
                            disabled={availableDesa.length === 0}
                        >
                            <option value="">{filterKecamatan ? 'Semua Desa di ' + filterKecamatan : 'Semua Desa'}</option>
                            {availableDesa.map(desa => (
                                <option key={desa} value={desa}>{desa}</option>
                            ))}
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                            <ChevronLeft size={12} className="-rotate-90" />
                        </div>
                    </div>

                    {/* OPD Dropdown */}
                    <div className="relative w-full md:w-64">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                            <Briefcase size={16} />
                        </div>
                        <select
                            className="w-full pl-10 pr-8 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-lobar-blue outline-none text-sm transition-all appearance-none bg-white truncate"
                            value={filterOPD}
                            onChange={(e) => {
                                setFilterOPD(e.target.value);
                                setCurrentPage(1);
                            }}
                        >
                            <option value="">Semua Perangkat Daerah</option>
                            {uniqueOPD.map(opd => (
                                <option key={opd} value={opd}>{opd}</option>
                            ))}
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                            <ChevronLeft size={12} className="-rotate-90" />
                        </div>
                    </div>

                    {/* Unified Search Bar */}
                    <div className="flex w-full md:w-auto">
                        <select
                            className="pl-3 pr-8 py-2 bg-slate-100 border border-r-0 border-slate-200 rounded-l-lg focus:ring-2 focus:ring-lobar-blue focus:z-10 outline-none text-sm font-medium text-slate-700 cursor-pointer transition-all appearance-none"
                            value={searchMode}
                            onChange={(e) => setSearchMode(e.target.value as 'desa' | 'kecamatan')}
                        >
                            <option value="desa">Desa</option>
                            <option value="kecamatan">Kecamatan</option>
                        </select>
                        <div className="relative w-full md:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input
                                type="text"
                                placeholder={`Cari nama ${searchMode}...`}
                                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-r-lg focus:ring-2 focus:ring-lobar-blue outline-none text-sm transition-all"
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setCurrentPage(1);
                                }}
                            />
                        </div>
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
                                    {visibleColumns.includes('desaKelurahan') && <td className="px-3 py-2.5 font-semibold text-lobar-blue">{item.desaKelurahan || '-'}</td>}
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
                                    {visibleColumns.includes('latitude') && <td className="px-3 py-2.5 text-slate-500">{item.latitude || '-'}</td>}
                                    {visibleColumns.includes('longitude') && <td className="px-3 py-2.5 text-slate-500">{item.longitude || '-'}</td>}
                                    {visibleColumns.includes('strataDesa') && (
                                        <td className="px-3 py-2.5 text-center">
                                            {item.strataDesa !== undefined ? (
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${item.strataDesa === 4 ? 'bg-green-100 text-green-700' :
                                                    item.strataDesa === 3 ? 'bg-blue-100 text-blue-700' :
                                                        item.strataDesa === 2 ? 'bg-yellow-100 text-yellow-700' :
                                                            item.strataDesa === 1 ? 'bg-orange-100 text-orange-700' :
                                                                'bg-red-100 text-red-700'
                                                    }`}>
                                                    {['Sangat Tertinggal', 'Tertinggal', 'Berkembang', 'Maju', 'Mandiri'][item.strataDesa] || item.strataDesa}
                                                </span>
                                            ) : '-'}
                                        </td>
                                    )}

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
                                <FormField label="Desa/Kelurahan" value={(isEditModalOpen ? editingItem?.desaKelurahan : newItem.desaKelurahan) || ''} onChange={(val) => isEditModalOpen ? setEditingItem({ ...editingItem!, desaKelurahan: val }) : setNewItem({ ...newItem, desaKelurahan: val })} />
                                <FormField label="Kode Kecamatan" value={(isEditModalOpen ? editingItem?.kodeKecamatan : newItem.kodeKecamatan) || ''} onChange={(val) => isEditModalOpen ? setEditingItem({ ...editingItem!, kodeKecamatan: val }) : setNewItem({ ...newItem, kodeKecamatan: val })} />
                                <FormField label="Kecamatan" value={(isEditModalOpen ? editingItem?.kecamatan : newItem.kecamatan) || ''} onChange={(val) => isEditModalOpen ? setEditingItem({ ...editingItem!, kecamatan: val }) : setNewItem({ ...newItem, kecamatan: val })} />
                                <FormField label="Luas" value={(isEditModalOpen ? editingItem?.luasWilayah : newItem.luasWilayah) || ''} onChange={(val) => isEditModalOpen ? setEditingItem({ ...editingItem!, luasWilayah: val }) : setNewItem({ ...newItem, luasWilayah: val })} />
                                <FormField label="Penduduk" type="number" value={(isEditModalOpen ? editingItem?.jumlahPenduduk : newItem.jumlahPenduduk) || 0} onChange={(val) => isEditModalOpen ? setEditingItem({ ...editingItem!, jumlahPenduduk: Number(val) }) : setNewItem({ ...newItem, jumlahPenduduk: Number(val) })} />
                                <FormField label="Jml Angka Kemiskinan" type="number" value={(isEditModalOpen ? editingItem?.jumlahAngkaKemiskinan : newItem.jumlahAngkaKemiskinan) || 0} onChange={(val) => isEditModalOpen ? setEditingItem({ ...editingItem!, jumlahAngkaKemiskinan: Number(val) }) : setNewItem({ ...newItem, jumlahAngkaKemiskinan: Number(val) })} />
                                <FormField label="Jml Angka Stunting" type="number" value={(isEditModalOpen ? editingItem?.jumlahBalitaStunting : newItem.jumlahBalitaStunting) || 0} onChange={(val) => isEditModalOpen ? setEditingItem({ ...editingItem!, jumlahBalitaStunting: Number(val) }) : setNewItem({ ...newItem, jumlahBalitaStunting: Number(val) })} />
                                <FormField label="Potensi Desa" value={(isEditModalOpen ? editingItem?.potensiDesa : newItem.potensiDesa) || ''} onChange={(val) => isEditModalOpen ? setEditingItem({ ...editingItem!, potensiDesa: val }) : setNewItem({ ...newItem, potensiDesa: val })} />
                                <FormField label="Latitude" type="number" value={(isEditModalOpen ? editingItem?.latitude : newItem.latitude) || ''} onChange={(val) => isEditModalOpen ? setEditingItem({ ...editingItem!, latitude: Number(val) }) : setNewItem({ ...newItem, latitude: Number(val) })} />
                                <FormField label="Longitude" type="number" value={(isEditModalOpen ? editingItem?.longitude : newItem.longitude) || ''} onChange={(val) => isEditModalOpen ? setEditingItem({ ...editingItem!, longitude: Number(val) }) : setNewItem({ ...newItem, longitude: Number(val) })} />
                                <div className="col-span-1">
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Strata IDM</label>
                                    <select
                                        value={(isEditModalOpen ? editingItem?.strataDesa : newItem.strataDesa) ?? ''}
                                        onChange={(e) => {
                                            const val = e.target.value ? Number(e.target.value) : undefined;
                                            isEditModalOpen ? setEditingItem({ ...editingItem!, strataDesa: val }) : setNewItem({ ...newItem, strataDesa: val });
                                        }}
                                        className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-lobar-blue outline-none text-sm transition-all bg-white"
                                    >
                                        <option value="">- Pilih Strata -</option>
                                        <option value="0">0 - Sangat Tertinggal</option>
                                        <option value="1">1 - Tertinggal</option>
                                        <option value="2">2 - Berkembang</option>
                                        <option value="3">3 - Maju</option>
                                        <option value="4">4 - Mandiri</option>
                                    </select>
                                </div>
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
            {/* Import Config Modal */}
            {isImportModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
                        <div className="p-6">
                            <h3 className="text-lg font-bold text-slate-800 mb-4">Konfigurasi Impor</h3>

                            <div className="mb-4">
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nama Versi / Skenario</label>
                                <input
                                    type="text"
                                    value={importVersionName}
                                    onChange={(e) => setImportVersionName(e.target.value)}
                                    placeholder="Contoh: APBD Perubahan 2026"
                                    className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-lobar-blue outline-none text-sm"
                                />
                                <p className="text-[10px] text-slate-400 mt-1">Masukkan nama baru untuk membuat versi data baru.</p>
                            </div>

                            <div className="mb-6">
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Metode Impor</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        onClick={() => setImportMode('replace')}
                                        className={`p-3 rounded-lg border text-xs font-bold transition-all flex flex-col items-center gap-2 ${importMode === 'replace' ? 'bg-blue-50 border-lobar-blue text-lobar-blue' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                                    >
                                        <Plus size={16} />
                                        <span>Tambah Baru</span>
                                    </button>
                                    <button
                                        onClick={() => setImportMode('update')}
                                        className={`p-3 rounded-lg border text-xs font-bold transition-all flex flex-col items-center gap-2 ${importMode === 'update' ? 'bg-green-50 border-green-500 text-green-600' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                                    >
                                        <RefreshCw size={16} />
                                        <span>Smart Update</span>
                                    </button>
                                </div>
                                <div className="mt-2 text-[10px] text-slate-500 bg-slate-50 p-2 rounded border border-slate-100 flex gap-2 items-start">
                                    <AlertCircle size={12} className="mt-0.5 shrink-0" />
                                    {importMode === 'replace'
                                        ? "Data Excel akan ditambahkan sebagai entri baru. Risiko duplikasi jika data sudah ada."
                                        : "Sistem akan mencocokkan 'Kode Desa' + 'Pekerjaan' + 'Sub Keg'. Jika cocok, data akan diperbarui. Jika tidak, akan ditambahkan."}
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => { setIsImportModalOpen(false); setFileToImport(null); }}
                                    className="flex-1 py-2 border border-slate-200 rounded-lg text-slate-600 font-bold hover:bg-slate-50"
                                >
                                    Batal
                                </button>
                                <button
                                    onClick={processImport}
                                    className="flex-1 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 shadow-lg"
                                >
                                    Mulai Impor
                                </button>
                            </div>
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