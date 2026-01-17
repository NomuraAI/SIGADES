import { supabase } from '../lib/supabase';
import { ProjectData } from '../types';

export interface ProjectService {
    getAllProjects(version?: string, page?: number, pageSize?: number): Promise<{ data: ProjectData[], hasMore: boolean }>;
    getUniqueVersions(): Promise<string[]>;
    createProject(data: Partial<ProjectData>): Promise<ProjectData>;
    updateProject(id: string, data: Partial<ProjectData>): Promise<ProjectData>;
    deleteProject(id: string): Promise<void>;
    batchInsertProjects(data: Partial<ProjectData>[]): Promise<void>;
    clearAllProjects(): Promise<void>;
}

// Helper to map DB row to ProjectData (moved from DataDesa to here for reuse)
const mapDbRowToProject = (item: any): ProjectData => ({
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
    longitude: item.longitude || item.lng || null,
    dataVersion: item.data_version || 'Default'
});

// Helper to map ProjectData to DB row
const mapProjectToDbRow = (item: Partial<ProjectData>) => ({
    aksi_prioritas: item.aksiPrioritas,
    perangkat_daerah: item.perangkatDaerah,
    program: item.program,
    kegiatan: item.kegiatan,
    sub_kegiatan: item.subKegiatan,
    pekerjaan: item.pekerjaan,
    pagu_anggaran: item.paguAnggaran,
    kode_desa: item.kodeDesa,
    desa_kelurahan: item.desaKelurahan,
    kode_kecamatan: item.kodeKecamatan,
    kecamatan: item.kecamatan,
    luas_wilayah: item.luasWilayah,
    jumlah_penduduk: item.jumlahPenduduk,
    jumlah_angka_kemiskinan: item.jumlahAngkaKemiskinan,
    jumlah_balita_stunting: item.jumlahBalitaStunting,
    potensi_desa: item.potensiDesa,
    keterangan: item.keterangan,
    latitude: item.latitude,
    longitude: item.longitude,
    data_version: item.dataVersion
});

export class SupabaseProjectService implements ProjectService {
    async getAllProjects(version?: string, page: number = 0, pageSize: number = 1000) {
        let query = supabase
            .from('projects')
            .select('*')
            .order('created_at', { ascending: false })
            .range(page * pageSize, (page + 1) * pageSize - 1);

        if (version) {
            query = query.eq('data_version', version);
        }

        const { data, error } = await query;
        if (error) throw error;

        const mappedData = (data || []).map(mapDbRowToProject);
        const hasMore = (data?.length || 0) === pageSize;

        return { data: mappedData, hasMore };
    }

    async getUniqueVersions() {
        // Fetch all unique versions by paging (client-side distinct)
        // Note: For very large datasets, this should be replaced by a Postgres RPC function: 
        // CREATE FUNCTION get_distinct_versions() RETURNS TABLE(v text) AS $$ SELECT DISTINCT data_version FROM projects $$ LANGUAGE sql;

        const versions = new Set<string>();
        let page = 0;
        const pageSize = 1000;
        let hasMore = true;

        while (hasMore) {
            const { data, error } = await supabase
                .from('projects')
                .select('data_version')
                .not('data_version', 'is', null)
                .range(page * pageSize, (page + 1) * pageSize - 1);

            if (error) {
                console.warn("Error fetching versions page " + page, error);
                break;
            }

            if (data && data.length > 0) {
                data.forEach(item => {
                    if (item.data_version) versions.add(item.data_version);
                });

                if (data.length < pageSize) {
                    hasMore = false;
                } else {
                    page++;
                    // Safety break to prevent infinite loops on massive tables if RPC not used
                    if (page > 20) hasMore = false; // Limit to scanning top 20,000 rows for now
                }
            } else {
                hasMore = false;
            }
        }

        return [...versions].sort();
    }

    async createProject(data: Partial<ProjectData>) {
        const payload = mapProjectToDbRow(data);
        const { data: inserted, error } = await supabase.from('projects').insert([payload]).select().single();
        if (error) throw error;
        return mapDbRowToProject(inserted);
    }

    async updateProject(id: string, data: Partial<ProjectData>) {
        const payload = mapProjectToDbRow(data);
        const { data: updated, error } = await supabase.from('projects').update(payload).eq('id', id).select().single();
        if (error) throw error;
        return mapDbRowToProject(updated);
    }

    async deleteProject(id: string) {
        const { error } = await supabase.from('projects').delete().eq('id', id);
        if (error) throw error;
    }

    async batchInsertProjects(data: Partial<ProjectData>[]) {
        const payload = data.map(mapProjectToDbRow);
        const BATCH_SIZE = 50;

        for (let i = 0; i < payload.length; i += BATCH_SIZE) {
            const batch = payload.slice(i, i + BATCH_SIZE);
            const { error } = await supabase.from('projects').insert(batch);
            if (error) throw error;
        }
    }

    async clearAllProjects() {
        throw new Error("Fitur 'Hapus Semua' dinonaktifkan untuk mode Live (Supabase) demi keamanan.");
    }
}

export class LocalProjectService implements ProjectService {
    private STORAGE_KEY = 'sigades_local_projects';

    private getProjectsFromStorage(): any[] {
        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch {
            return [];
        }
    }

    private saveProjectsToStorage(projects: any[]) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(projects));
    }

    async getAllProjects(version?: string, page: number = 0, pageSize: number = 1000) {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 300));

        let projects = this.getProjectsFromStorage();

        // Seed if empty and requesting default/initial load
        if (projects.length === 0) {
            projects = this.seedDummyData();
        }

        if (version) {
            projects = projects.filter(p => p.data_version === version);
        }

        // Sort by created_at desc (mocked by unshift usually, but here just reverse logic or sort)
        // For simplicity, let's assume they are stored in order or just return as is.
        // Let's manually sort to match Supabase behavior if needed, but for dummy data exact order might not matter as much.

        // Logical pagination
        const start = page * pageSize;
        const end = start + pageSize;
        const slice = projects.slice(start, end);

        return {
            data: slice.map(mapDbRowToProject),
            hasMore: end < projects.length
        };
    }

    async getUniqueVersions() {
        const projects = this.getProjectsFromStorage();
        if (projects.length === 0) return ['Default'];

        const versions = [...new Set(projects.map(p => p.data_version || 'Default'))].sort();
        return versions;
    }

    async createProject(data: Partial<ProjectData>) {
        await new Promise(resolve => setTimeout(resolve, 300));
        const projects = this.getProjectsFromStorage();
        const newProject = {
            id: crypto.randomUUID(),
            created_at: new Date().toISOString(),
            ...mapProjectToDbRow(data)
        };
        // Add to beginning
        projects.unshift(newProject);
        this.saveProjectsToStorage(projects);
        return mapDbRowToProject(newProject);
    }

    async updateProject(id: string, data: Partial<ProjectData>) {
        await new Promise(resolve => setTimeout(resolve, 300));
        const projects = this.getProjectsFromStorage();
        const index = projects.findIndex(p => p.id === id);
        if (index === -1) throw new Error("Project not found");

        const updatedProject = {
            ...projects[index],
            ...mapProjectToDbRow(data)
        };
        projects[index] = updatedProject;
        this.saveProjectsToStorage(projects);
        return mapDbRowToProject(updatedProject);
    }

    async deleteProject(id: string) {
        await new Promise(resolve => setTimeout(resolve, 300));
        let projects = this.getProjectsFromStorage();
        projects = projects.filter(p => p.id !== id);
        this.saveProjectsToStorage(projects);
    }

    async batchInsertProjects(data: Partial<ProjectData>[]) {
        console.log(`[LocalProjectService] Batch inserting ${data.length} items...`);
        await new Promise(resolve => setTimeout(resolve, 500));
        const projects = this.getProjectsFromStorage();
        console.log(`[LocalProjectService] Current items in storage: ${projects.length}`);

        const newProjects = data.map(item => ({
            id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36),
            created_at: new Date().toISOString(),
            ...mapProjectToDbRow(item)
        }));

        const updatedList = [...newProjects, ...projects];
        this.saveProjectsToStorage(updatedList);
        console.log(`[LocalProjectService] New total items: ${updatedList.length}`);
    }

    async clearAllProjects() {
        localStorage.removeItem(this.STORAGE_KEY);
        // We don't verify here, just clear.
    }

    private seedDummyData() {
        // Create some dummy data structure matching DB fields
        const dummyData = [
            {
                id: 'dummy-1',
                aksi_prioritas: 'Peningkatan Jalan',
                perangkat_daerah: 'Dinas PU',
                program: 'Infrastruktur',
                kegiatan: 'Pembangunan Jalan Desa',
                pekerjaan: 'Hotmix Jalan Dusun A',
                pagu_anggaran: 200000000,
                desa_kelurahan: 'Batulayar',
                kecamatan: 'Batulayar',
                jumlah_penduduk: 1500,
                jumlah_angka_kemiskinan: 120,
                data_version: 'Default',
                created_at: new Date().toISOString(),
                latitude: -8.5,
                longitude: 116.1
            },
            {
                id: 'dummy-2',
                aksi_prioritas: 'Pemberdayaan UKM',
                perangkat_daerah: 'Dinas Koperasi',
                program: 'Ekonomi Kerakyatan',
                pekerjaan: 'Pelatihan Menjahit',
                pagu_anggaran: 50000000,
                desa_kelurahan: 'Senteluk',
                kecamatan: 'Batulayar',
                jumlah_penduduk: 1200,
                jumlah_angka_kemiskinan: 80,
                data_version: 'Default',
                created_at: new Date().toISOString(),
                latitude: -8.52,
                longitude: 116.12
            }
        ];
        this.saveProjectsToStorage(dummyData);
        return dummyData;
    }
}

export const getProjectService = (mode: 'supabase' | 'local'): ProjectService => {
    if (mode === 'local') {
        return new LocalProjectService();
    }
    return new SupabaseProjectService();
};
