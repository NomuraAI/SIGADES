export interface Infrastructure {
    id: number;
    name: string;
    type: 'government' | 'health' | 'education' | 'tourism' | 'transport';
    lat: number;
    lng: number;
    description: string;
    image?: string;
    address: string;
}

export const infrastructureData: Infrastructure[] = [];
