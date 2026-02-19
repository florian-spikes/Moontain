
export interface Client {
    id: string;
    created_at: string;
    updated_at: string;
    name: string;
    email: string | null;
    address: string | null;
    notes: string | null;
    emoji: string | null;
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
    billing_mode: 'unit' | 'subscription';
    billing_frequency: 'monthly' | 'yearly' | null;
    quantity: number | null;
    subscription_type: 'ongoing' | 'fixed' | null;
    start_date: string | null;
    end_date: string | null;
}

export type NewCatalogItem = Omit<CatalogItem, 'id' | 'created_at'>;

export type DocumentStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
export type DocumentType = 'quote' | 'invoice';

export interface DocumentLine {
    id: string;
    document_id: string;
    description: string;
    quantity: number;
    unit_price: number;
    total: number;
}

export interface Document {
    id: string;
    created_at: string;
    updated_at: string;
    client_id: string | null;
    type: DocumentType;
    status: DocumentStatus;
    number: string | null;
    date: string | null;
    due_date: string | null;
    total_amount: number;
    public_url: string | null; // PDF URL
    client?: Client;
    lines?: DocumentLine[];
}

// For creation, we might not have number or public_url
export interface NewDocument {
    client_id: string;
    type: DocumentType;
    date: string;
    due_date: string;
    lines: {
        description: string;
        quantity: number;
        unit_price: number;
    }[];
}


