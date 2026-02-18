
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { CatalogItem, NewCatalogItem } from '../types';

export function useCatalog() {
    const queryClient = useQueryClient();

    const catalogQuery = useQuery({
        queryKey: ['catalog'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('catalog_items')
                .select('*')
                .order('name');

            if (error) throw error;
            return data as CatalogItem[];
        },
    });

    const createCatalogItem = useMutation({
        mutationFn: async (newItem: NewCatalogItem) => {
            const { data, error } = await supabase
                .from('catalog_items')
                .insert(newItem)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['catalog'] });
        },
    });

    const updateCatalogItem = useMutation({
        mutationFn: async ({ id, ...updates }: Partial<CatalogItem> & { id: string }) => {
            const { data, error } = await supabase
                .from('catalog_items')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['catalog'] });
        },
    });

    const deleteCatalogItem = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from('catalog_items')
                .delete()
                .eq('id', id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['catalog'] });
        },
    });

    return {
        catalogItems: catalogQuery.data ?? [],
        isLoading: catalogQuery.isLoading,
        error: catalogQuery.error,
        createCatalogItem,
        updateCatalogItem,
        deleteCatalogItem
    };
}
