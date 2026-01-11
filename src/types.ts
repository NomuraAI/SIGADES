export interface ProjectData {
    id: string;
    aksiPrioritas: string;
    perangkatDaerah: string;
    program: string;
    kegiatan: string;
    subKegiatan: string;
    pekerjaan: string;
    paguAnggaran: number;
    desa: string;
    kecamatan: string;
    luasWilayah: string;
    jumlahPenduduk: number;
    jumlahAngkaKemiskinan: number;
    jumlahBalitaStunting: number;
    potensiDesa: string;
    keterangan: string;
    lat?: number;
    lng?: number;
}