
export interface Client {
    id: string;
    created_at: string;
    updated_at: string;
    name: string;
    email: string | null;
    address: string | null;
    notes: string | null;
    is_archived: boolean;
}

export type NewClient = Omit<Client, 'id' | 'created_at' | 'updated_at' | 'is_archived'>;

export interface Service {
    id: string;
    created_at: string;
    updated_at: string;
    client_id: string;
    name: string;
    type: 'hosting' | 'domain' | 'license' | 'maintenance' | 'other';
    start_date: string | null;
    end_date: string | null;
    renewal_date: string | null;
    price: number | null;
    provider: string | null;
    notes: string | null;
    client?: Client; // joined
}


export type NewService = Omit<Service, 'id' | 'created_at' | 'updated_at' | 'client'>;

export interface CatalogItem {
    id: string;
    created_at: string;
    name: string;
    description: string | null;
    unit_price: number;
    unit: string | null;
}

export type NewCatalogItem = Omit<CatalogItem, 'id' | 'created_at'>;

