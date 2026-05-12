export interface ProjectData {
    id: string;
    aksiPrioritas: string;
    perangkatDaerah: string;
    program: string;
    kegiatan: string;
    subKegiatan: string;
    pekerjaan: string;
    paguAnggaran: number;
    kodeDesa: string;
    desaKelurahan: string;
    kodeKecamatan: string;
    kecamatan: string;
    latitude: number | null;
    longitude: number | null;
    luasWilayah: number | string;
    jumlahPenduduk: number;
    jumlahAngkaKemiskinan: number;
    jumlahBalitaStunting: number;
    potensiDesa: string;
    keterangan: string;
    kepadatanPenduduk?: number;
    dataVersion?: string;
}

export type UserRole = 'admin' | 'user' | 'viewer';

export interface User {
    id: string;
    username: string;
    role: UserRole;
    name: string;
}